// ═══════════════════════════════════════════════════════════
// DSP Audio Engine — Real Web Audio API Processing Pipeline
//
// Connects the Zustand DSP config store to actual Web Audio nodes.
// Chain: MediaElementSource → EQ → Crossfeed → Loudness →
//        VolumeLimit → MasterGain → destination
//
// Each module can be individually enabled/disabled.
// When disabled, the module is bypassed (input connected directly to output).
// ═══════════════════════════════════════════════════════════

import type { DSPConfig, EQBand } from '@/lib/data';

let _ctx: AudioContext | null = null;
let _source: MediaElementAudioSourceNode | null = null;
let _mediaConnected = false;

// ── Analyser for visualization ──
let _analyser: AnalyserNode | null = null;
const FFT_SIZE = 2048;

// ── DSP Node Chain ──
interface DSPChain {
  eqNodes: BiquadFilterNode[];
  crossfeedSplitter: ChannelSplitterNode | null;
  crossfeedMerger: ChannelMergerNode | null;
  crossfeedFilters: [BiquadFilterNode, BiquadFilterNode] | null; // [bleed LP L, bleed LP R]
  crossfeedGains: [GainNode, GainNode, GainNode, GainNode] | null; // [dry L, dry R, bleed L→R, bleed R→L]
  crossfeedDelay: number; // seconds
  loudnessGain: GainNode | null;
  volumeLimiter: DynamicsCompressorNode | null;
  volumeLimitGain: GainNode | null;
  masterGain: GainNode;
  destination: AudioDestinationNode;
}

// ── Get the AnalyserNode for visualization ──
export function getAnalyser(): AnalyserNode | null {
  return _analyser;
}

// ── Get frequency data from the analyser ──
export function getFrequencyData(): Uint8Array {
  if (!_analyser) return new Uint8Array(0);
  const data = new Uint8Array(_analyser.frequencyBinCount);
  _analyser.getByteFrequencyData(data);
  return data;
}

// ── Get time domain data (waveform) from the analyser ──
export function getWaveformData(): Uint8Array {
  if (!_analyser) return new Uint8Array(0);
  const data = new Uint8Array(_analyser.frequencyBinCount);
  _analyser.getByteTimeDomainData(data);
  return data;
}

let _chain: DSPChain | null = null;
let _currentConfig: DSPConfig | null = null;

// ── Get or create AudioContext (lazy, on user gesture) ──
export function getAudioContext(): AudioContext {
  if (!_ctx) {
    _ctx = new AudioContext({ sampleRate: 44100 });
  }
  if (_ctx.state === 'suspended') {
    _ctx.resume();
  }
  return _ctx;
}

// ── Ensure analyser node exists ──
function ensureAnalyser(): AnalyserNode {
  if (!_analyser) {
    const ctx = getAudioContext();
    _analyser = ctx.createAnalyser();
    _analyser.fftSize = FFT_SIZE;
    _analyser.smoothingTimeConstant = 0.8;
    _analyser.minDecibels = -90;
    _analyser.maxDecibels = -10;
  }
  return _analyser;
}

// ── Connect a media element to the DSP chain ──
export function connectMediaElement(audio: HTMLAudioElement): void {
  if (_mediaConnected) return; // createMediaElementSource can only be called once per element

  const ctx = getAudioContext();
  _source = ctx.createMediaElementSource(audio);

  // Build initial chain (flat passthrough)
  rebuildChain(null);

  // Connect source to chain input
  const first = getChainInput();
  _source.connect(first);

  _mediaConnected = true;
  console.log('[DSP Engine] Media element connected to Web Audio pipeline');
}

// ── Get the input node of the current chain ──
function getChainInput(): AudioNode {
  if (!_chain) return getAudioContext().destination;
  const cfg = _currentConfig;

  // EQ is first if enabled and has bands
  if (cfg?.eq && cfg.eq.length > 0 && cfg.eq.some(b => b.enabled)) {
    return _chain.eqNodes[0];
  }

  // Crossfeed
  if (cfg?.crossfeed?.enabled && _chain.crossfeedSplitter) {
    return _chain.crossfeedSplitter;
  }

  // Loudness
  if (cfg?.loudness?.enabled && _chain.loudnessGain) {
    return _chain.loudnessGain;
  }

  // Volume limit
  if (cfg?.volumeLimit && _chain.volumeLimiter) {
    return _chain.volumeLimiter;
  }

  // Master gain (always present)
  return _chain.masterGain;
}

// ── Rebuild the entire DSP chain from config ──
export function rebuildChain(config: DSPConfig | null): void {
  const ctx = getAudioContext();
  _currentConfig = config;

  // Disconnect everything from the old chain
  if (_chain) {
    try {
      _chain.eqNodes.forEach(n => { try { n.disconnect(); } catch {} });
      if (_chain.crossfeedSplitter) try { _chain.crossfeedSplitter.disconnect(); } catch {}
      if (_chain.crossfeedMerger) try { _chain.crossfeedMerger.disconnect(); } catch {}
      if (_chain.crossfeedFilters) {
        _chain.crossfeedFilters.forEach(n => { try { n.disconnect(); } catch {} });
      }
      if (_chain.crossfeedGains) {
        _chain.crossfeedGains.forEach(n => { try { n.disconnect(); } catch {} });
      }
      if (_chain.loudnessGain) try { _chain.loudnessGain.disconnect(); } catch {}
      if (_chain.volumeLimiter) try { _chain.volumeLimiter.disconnect(); } catch {}
      if (_chain.volumeLimitGain) try { _chain.volumeLimitGain.disconnect(); } catch {}
      _chain.masterGain.disconnect();
    } catch (e) {
      console.warn('[DSP Engine] Error disconnecting old chain:', e);
    }
  }

  // ── Create new nodes ──

  // Master gain (always present, replaces HTML volume for DSP gain staging)
  const masterGain = ctx.createGain();
  masterGain.gain.value = 1.0;

  // ── EQ: BiquadFilterNode chain ──
  const eqNodes: BiquadFilterNode[] = [];
  const activeEQ = config?.eq?.filter(b => b.enabled) || [];
  for (const band of activeEQ) {
    const filter = ctx.createBiquadFilter();
    applyEQBand(filter, band);
    eqNodes.push(filter);
  }

  // ── Volume Limiter: DynamicsCompressorNode ──
  let volumeLimiter: DynamicsCompressorNode | null = null;
  let volumeLimitGain: GainNode | null = null;
  const vlConfig = config?.volumeLimit;
  if (vlConfig) {
    volumeLimiter = ctx.createDynamicsCompressor();
    volumeLimiter.threshold.value = vlConfig.maxDb ?? -1;
    volumeLimiter.knee.value = 0;
    volumeLimiter.ratio.value = 20; // brick-wall limiter
    volumeLimiter.attack.value = 0.003;
    volumeLimiter.release.value = 0.01;

    volumeLimitGain = ctx.createGain();
    const maxPct = (vlConfig.maxPercent ?? 100) / 100;
    volumeLimitGain.gain.value = Math.min(maxPct, 1.0);
  }

  // ── Loudness: GainNode with compensation ──
  let loudnessGain: GainNode | null = null;
  if (config?.loudness?.enabled) {
    loudnessGain = ctx.createGain();
    // Use fallbackGain as a simple loudness normalization factor
    // In a full implementation, this would use LUFS measurement
    const fbGain = config.loudness.fallbackGain ?? 1.0;
    loudnessGain.gain.value = fbGain;
  }

  // ── Crossfeed (bs2b-style) ──
  let crossfeedSplitter: ChannelSplitterNode | null = null;
  let crossfeedMerger: ChannelMergerNode | null = null;
  let crossfeedFilters: [BiquadFilterNode, BiquadFilterNode] | null = null;
  let crossfeedGains: [GainNode, GainNode, GainNode, GainNode] | null = null;
  let crossfeedDelay = 0;

  if (config?.crossfeed?.enabled) {
    crossfeedSplitter = ctx.createChannelSplitter(2);
    crossfeedMerger = ctx.createChannelMerger(2);

    // Low-pass filters for the bleed channel
    const lpL = ctx.createBiquadFilter();
    lpL.type = 'lowpass';
    const lpR = ctx.createBiquadFilter();
    lpR.type = 'lowpass';
    crossfeedFilters = [lpL, lpR];

    // Gain nodes: dry L, dry R, bleed L→R, bleed R→L
    const dryL = ctx.createGain();
    const dryR = ctx.createGain();
    const bleedLR = ctx.createGain();
    const bleedRL = ctx.createGain();
    crossfeedGains = [dryL, dryR, bleedLR, bleedRL];

    // Apply preset values
    applyCrossfeedPreset(config.crossfeed, lpL, lpR, dryL, dryR, bleedLR, bleedRL);
    crossfeedDelay = 0.0003; // ~0.3ms natural ITD
  }

  // ── Connect the chain ──
  const chain: DSPChain = {
    eqNodes,
    crossfeedSplitter,
    crossfeedMerger,
    crossfeedFilters,
    crossfeedGains,
    crossfeedDelay,
    loudnessGain,
    volumeLimiter,
    volumeLimitGain,
    masterGain,
    destination: ctx.destination,
  };
  _chain = chain;

  // Chain connections: Source → EQ → Crossfeed → Loudness → Limiter → Master → Analyser → Destination
  const analyser = ensureAnalyser();
  let currentNode: AudioNode = ctx.destination;

  // Analyser → Destination (always, for visualization — does not modify audio)
  analyser.connect(currentNode);
  currentNode = analyser;

  // Master → Destination (always)
  masterGain.connect(currentNode);
  currentNode = masterGain;

  // Volume Limiter → Master
  if (volumeLimiter && volumeLimitGain) {
    volumeLimitGain.connect(currentNode);
    volumeLimiter.connect(volumeLimitGain);
    currentNode = volumeLimiter;
  }

  // Loudness → next
  if (loudnessGain) {
    loudnessGain.connect(currentNode);
    currentNode = loudnessGain;
  }

  // Crossfeed → next
  if (crossfeedSplitter && crossfeedMerger && crossfeedFilters && crossfeedGains) {
    const [lpL, lpR] = crossfeedFilters;
    const [dryL, dryR, bleedLR, bleedRL] = crossfeedGains;

    // Splitter: ch0=L, ch1=R
    // Dry path: L splitter → dryL → merger ch0, R splitter → dryR → merger ch1
    // Bleed path: L splitter → lpL → bleedRL → merger ch1, R splitter → lpR → bleedLR → merger ch0
    crossfeedSplitter.connect(dryL, 0, 0);    // L → dry L gain
    crossfeedSplitter.connect(dryR, 1, 0);    // R → dry R gain
    crossfeedSplitter.connect(lpL, 0, 0);     // L → LP filter
    crossfeedSplitter.connect(lpR, 1, 0);     // R → LP filter

    lpL.connect(bleedRL);                      // filtered L → bleed R→L gain
    lpR.connect(bleedLR);                      // filtered R → bleed L→R gain

    dryL.connect(crossfeedMerger, 0, 0);       // dry L → merger ch0
    dryR.connect(crossfeedMerger, 0, 1);       // dry R → merger ch1
    bleedRL.connect(crossfeedMerger, 0, 1);    // bleed L→R → merger ch1
    bleedLR.connect(crossfeedMerger, 0, 0);    // bleed R→L → merger ch0

    crossfeedMerger.connect(currentNode);
    currentNode = crossfeedSplitter;
  }

  // EQ → next
  if (eqNodes.length > 0) {
    for (let i = eqNodes.length - 1; i >= 1; i--) {
      eqNodes[i].connect(eqNodes[i - 1]);
    }
    eqNodes[0].connect(currentNode);
    currentNode = eqNodes[eqNodes.length - 1];
  }

  // Reconnect source to new chain input
  if (_source) {
    try { _source.disconnect(); } catch {}
    _source.connect(currentNode);
  }

  // Log active modules
  const modules: string[] = [];
  if (eqNodes.length > 0) modules.push(`EQ(${eqNodes.length} bands)`);
  if (crossfeedSplitter) modules.push('Crossfeed');
  if (loudnessGain) modules.push('Loudness');
  if (volumeLimiter) modules.push('Limiter');
  modules.push('Analyser');
  if (modules.length > 1) {
    console.log(`[DSP Engine] Active: ${modules.join(' → ')} → Master → Output`);
  } else {
    console.log('[DSP Engine] All DSP modules bypassed — passthrough + Analyser');
  }
}

// ── Apply EQ band parameters to a BiquadFilterNode ──
function applyEQBand(filter: BiquadFilterNode, band: EQBand): void {
  const typeMap: Record<string, BiquadFilterType> = {
    'parametric': 'peaking',
    'low-shelf': 'lowshelf',
    'high-shelf': 'highshelf',
    'low-pass': 'lowpass',
    'high-pass': 'highpass',
    'band-pass': 'bandpass',
    'notch': 'notch',
  };
  filter.type = typeMap[band.type] || 'peaking';
  filter.frequency.value = band.frequency;
  filter.gain.value = band.gain;
  filter.Q.value = band.q;
}

// ── Apply crossfeed preset parameters ──
function applyCrossfeedPreset(
  crossfeed: NonNullable<DSPConfig['crossfeed']>,
  lpL: BiquadFilterNode,
  lpR: BiquadFilterNode,
  dryL: GainNode,
  dryR: GainNode,
  bleedLR: GainNode,
  bleedRL: GainNode,
): void {
  // Preset cutoff frequencies and feed amounts
  const presets: Record<string, { cutoff: number; feed: number; dry: number }> = {
    'none':     { cutoff: 0,     feed: 0,    dry: 1.0 },
    'subtle':   { cutoff: 2100,  feed: 0.08, dry: 1.0 },
    'moderate': { cutoff: 1600,  feed: 0.15, dry: 0.95 },
    'strong':   { cutoff: 1100,  feed: 0.25, dry: 0.9 },
    'custom':   { cutoff: crossfeed.customCutoff || 1600, feed: crossfeed.customFeed || 0.15, dry: 0.95 },
  };

  const preset = presets[crossfeed.preset] || presets['subtle'];
  const nyquist = getAudioContext().sampleRate / 2;

  if (preset.cutoff > 0 && preset.cutoff < nyquist) {
    lpL.frequency.value = preset.cutoff;
    lpR.frequency.value = preset.cutoff;
    bleedLR.gain.value = preset.feed;
    bleedRL.gain.value = preset.feed;
    dryL.gain.value = preset.dry;
    dryR.gain.value = preset.dry;
  } else {
    // Bypass crossfeed
    bleedLR.gain.value = 0;
    bleedRL.gain.value = 0;
    dryL.gain.value = 1.0;
    dryR.gain.value = 1.0;
  }
}

// ── Update master volume via DSP gain (replaces HTML volume) ──
export function setDSPVolume(volume: number, muted: boolean): void {
  if (_chain?.masterGain) {
    _chain.masterGain.gain.value = muted ? 0 : volume / 100;
  }
}

// ── Check if DSP chain is active ──
export function isDSPActive(): boolean {
  if (!_chain || !_currentConfig) return false;
  return (
    (_chain.eqNodes.length > 0) ||
    (_chain.crossfeedSplitter !== null) ||
    (_chain.loudnessGain !== null) ||
    (_chain.volumeLimiter !== null)
  );
}

// ── Get current signal path info for UI display ──
export function getSignalPathSteps(trackFormat?: string, trackSampleRate?: number, trackBitDepth?: number): Array<{
  label: string;
  format: string;
  sampleRate: number;
  bitDepth: number;
  isBitPerfect: boolean;
  latencyMs?: number;
}> {
  const ctx = getAudioContext();
  const steps: Array<{ label: string; format: string; sampleRate: number; bitDepth: number; isBitPerfect: boolean; latencyMs?: number }> = [];
  const cfg = _currentConfig;
  const srcRate = trackSampleRate || ctx.sampleRate;
  const srcDepth = trackBitDepth || 16;
  const srcFormat = trackFormat || 'PCM';
  let currentRate = srcRate;
  let currentDepth = srcDepth;
  let bitPerfect = true;

  // Source
  steps.push({
    label: 'Source',
    format: srcFormat,
    sampleRate: srcRate,
    bitDepth: srcDepth,
    isBitPerfect: true,
  });

  // EQ
  if (cfg?.eq?.some(b => b.enabled)) {
    const activeBands = cfg.eq.filter(b => b.enabled).length;
    steps.push({
      label: `Parametric EQ (${activeBands} bands)`,
      format: 'PCM',
      sampleRate: currentRate,
      bitDepth: currentDepth,
      isBitPerfect: false,
      latencyMs: 2.5,
    });
    bitPerfect = false;
  }

  // Crossfeed
  if (cfg?.crossfeed?.enabled) {
    steps.push({
      label: `Crossfeed (${cfg.crossfeed.preset})`,
      format: 'PCM',
      sampleRate: currentRate,
      bitDepth: currentDepth,
      isBitPerfect: false,
      latencyMs: 0.3,
    });
    bitPerfect = false;
  }

  // Loudness
  if (cfg?.loudness?.enabled) {
    steps.push({
      label: 'Loudness Normalization',
      format: 'PCM',
      sampleRate: currentRate,
      bitDepth: currentDepth,
      isBitPerfect: false,
      latencyMs: 0.1,
    });
    bitPerfect = false;
  }

  // Volume Limiter
  if (cfg?.volumeLimit) {
    steps.push({
      label: 'Volume Limiter',
      format: 'PCM',
      sampleRate: currentRate,
      bitDepth: currentDepth,
      isBitPerfect: false,
      latencyMs: 5,
    });
    bitPerfect = false;
  }

  // Output
  steps.push({
    label: 'Output',
    format: 'PCM',
    sampleRate: ctx.sampleRate,
    bitDepth: 32, // Web Audio internal
    isBitPerfect: bitPerfect && srcRate === ctx.sampleRate,
    latencyMs: undefined,
  });

  return steps;
}

// ── Reset the entire engine (for cleanup) ──
export function resetDSP(): void {
  if (_chain) {
    try {
      _chain.masterGain.disconnect();
      if (_chain.volumeLimiter) _chain.volumeLimiter.disconnect();
      if (_chain.volumeLimitGain) _chain.volumeLimitGain.disconnect();
      if (_chain.loudnessGain) _chain.loudnessGain.disconnect();
      _chain.eqNodes.forEach(n => n.disconnect());
      if (_chain.crossfeedSplitter) _chain.crossfeedSplitter.disconnect();
      if (_chain.crossfeedMerger) _chain.crossfeedMerger.disconnect();
    } catch {}
    _chain = null;
  }
  if (_analyser) { try { _analyser.disconnect(); } catch {} _analyser = null; }
  _currentConfig = null;
}
