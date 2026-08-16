import { create } from 'zustand';
import type { DSPPlugin } from '@/lib/data';

// ═══════════════════════════════════════════════════════════
// DSP Plugin Registry — built-in and available extensions
// ═══════════════════════════════════════════════════════════

const BUILTIN_PLUGINS: DSPPlugin[] = [
  // ── DSP Modules (built-in, always installed) ──
  {
    id: 'dsp-parametric-eq',
    name: 'Parametric EQ',
    version: '2.1.0',
    type: 'dsp-module',
    author: 'DSP Project',
    description: 'Full 10-band parametric equalizer with configurable Q, gain, and filter types (peak, low-shelf, high-shelf, notch, low-pass, high-pass). Supports per-zone profiles.',
    installed: true,
    enabled: true,
    status: 'active',
    licenseType: 'open-source',
  },
  {
    id: 'dsp-room-correction',
    name: 'Room Correction',
    version: '1.3.0',
    type: 'dsp-module',
    author: 'DSP Project',
    description: 'Convolution-based room correction using FIR filters generated from measurement software (REW, SonarWorks). Supports up to 96 kHz sampling rates with automatic delay compensation.',
    installed: true,
    enabled: true,
    status: 'active',
    licenseType: 'open-source',
  },
  {
    id: 'dsp-upsampler',
    name: 'HQ Upsampler',
    version: '2.0.0',
    type: 'dsp-module',
    author: 'DSP Project',
    description: 'High-quality sample rate conversion with selectable filter types: minimum-phase, linear-phase, apodizing, and brick-wall. Targets up to 384 kHz / 32-bit.',
    installed: true,
    enabled: true,
    status: 'active',
    licenseType: 'open-source',
  },
  {
    id: 'dsp-crossfeed',
    name: 'Crossfeed',
    version: '1.2.0',
    type: 'dsp-module',
    author: 'DSP Project',
    description: 'Headphone crossfeed processing with presets (subtle, moderate, strong) inspired by the Bauer stereophonic-to-binaural DSP. Reduces listening fatigue for extended sessions.',
    installed: true,
    enabled: false,
    status: 'active',
    licenseType: 'open-source',
  },
  {
    id: 'dsp-loudness',
    name: 'Loudness Normalization',
    version: '1.1.0',
    type: 'dsp-module',
    author: 'DSP Project',
    description: 'Track-level and album-level loudness normalization using ReplayGain or EBU R128 standards. Target LUFS configurable per zone. Prevents jarring volume changes across albums.',
    installed: true,
    enabled: true,
    status: 'active',
    licenseType: 'open-source',
  },
  {
    id: 'dsp-dither',
    name: 'Output Dither',
    version: '1.0.0',
    type: 'dsp-module',
    author: 'DSP Project',
    description: 'TPDF and noise-shaped dithering for optimal bit-depth reduction when outputting to 16-bit or 24-bit DACs. Selectable noise shaping curves (flat, F-weighted, Shibata).',
    installed: true,
    enabled: false,
    status: 'active',
    licenseType: 'open-source',
  },
  {
    id: 'dsp-volume-limiter',
    name: 'Volume Limiter',
    version: '1.0.0',
    type: 'dsp-module',
    author: 'DSP Project',
    description: 'Safety volume limiter with configurable maximum dB and percentage. Supports startup volume and ramp-up time to protect equipment and hearing.',
    installed: true,
    enabled: true,
    status: 'active',
    licenseType: 'open-source',
  },
  {
    id: 'dsp-headphone-hpf',
    name: 'Headphone HPF',
    version: '1.1.0',
    type: 'dsp-module',
    author: 'DSP Project',
    description: 'High-pass filter for headphone use, removing sub-bass content below a configurable frequency (30–80 Hz) that headphones cannot reproduce, reducing distortion and saving amplifier headroom.',
    installed: true,
    enabled: false,
    status: 'active',
    licenseType: 'open-source',
  },

  // ── Codecs (built-in) ──
  {
    id: 'codec-flac',
    name: 'FLAC Decoder',
    version: '1.4.3',
    type: 'codec',
    author: 'Xiph.Org Foundation',
    description: 'Free Lossless Audio Codec decoder supporting up to 8 channels, sample rates up to 655350 Hz, and bit depths up to 32-bit. The reference lossless codec for hi-fi audio.',
    installed: true,
    enabled: true,
    status: 'active',
    licenseType: 'open-source',
  },
  {
    id: 'codec-wavpack',
    name: 'WavPack Decoder',
    version: '5.6.0',
    type: 'codec',
    author: 'David Bryant',
    description: 'WavPack hybrid lossless/lossy codec. Supports both pure lossless and hybrid modes with correction files. Handles 32-bit float and DSD audio.',
    installed: true,
    enabled: true,
    status: 'active',
    licenseType: 'open-source',
  },
  {
    id: 'codec-mp3',
    name: 'MP3 / MPEG Decoder',
    version: '3.4.2',
    type: 'codec',
    author: 'Robert Leslie / Underbit',
    description: 'MPEG-1/2 Layer III decoder (mpg123). Supports all MP3 bitrates up to 320 kbps including variable bitrate (VBR). Required for broad format compatibility.',
    installed: true,
    enabled: true,
    status: 'active',
    licenseType: 'open-source',
  },
  {
    id: 'codec-aac',
    name: 'AAC / M4A Decoder',
    version: '2.1.0',
    type: 'codec',
    author: 'DSP Project (FDK-AAC)',
    description: 'Advanced Audio Coding decoder supporting AAC-LC, HE-AAC v1/v2 (AAC+), and ALAC in MP4 containers. Apple Music and iTunes compatible.',
    installed: true,
    enabled: true,
    status: 'active',
    licenseType: 'commercial',
    licenseDetail: 'Uses Fraunhofer FDK AAC library. Patent licensing may apply for commercial redistribution in certain jurisdictions.',
  },
  {
    id: 'codec-ogg',
    name: 'Ogg Vorbis / Opus Decoder',
    version: '1.4.0',
    type: 'codec',
    author: 'Xiph.Org Foundation',
    description: 'Xiph codecs: Vorbis for lossy compression and Opus for low-latency streaming. Both are free, open, and unencumbered by patents.',
    installed: true,
    enabled: true,
    status: 'active',
    licenseType: 'open-source',
  },
  {
    id: 'codec-dsd',
    name: 'DSD Decoder (DSF/DFF/ISO)',
    version: '1.2.0',
    type: 'codec',
    author: 'DSP Project',
    description: 'Direct Stream Digital decoder supporting DSF, DFF (DSDIFF), and DSD-over-ISO images. Handles DSD64, DSD128, DSD256, and DSD512 with native or DoP output modes.',
    installed: true,
    enabled: true,
    status: 'active',
    licenseType: 'open-source',
  },
  {
    id: 'codec-pcm-wav',
    name: 'PCM WAV / AIFF Decoder',
    version: '1.0.0',
    type: 'codec',
    author: 'DSP Project',
    description: 'RIFF WAVE and AIFF/IFF container decoder for uncompressed PCM audio. Supports up to 32-bit integer and 32-bit float formats at any sample rate.',
    installed: true,
    enabled: true,
    status: 'active',
    licenseType: 'open-source',
  },

  // ── Metadata Providers (built-in) ──
  {
    id: 'meta-musicbrainz',
    name: 'MusicBrainz Provider',
    version: '1.3.0',
    type: 'metadata-provider',
    author: 'MetaBrainz Foundation',
    description: 'Fetches metadata, cover art, and identifiers from the MusicBrainz open music encyclopedia. Links tracks to releases, recordings, and works for rich library data.',
    installed: true,
    enabled: true,
    status: 'active',
    licenseType: 'open-source',
    configUrl: '#/settings/metadata',
  },
  {
    id: 'meta-acoustid',
    name: 'AcoustID Fingerprinter',
    version: '1.1.0',
    type: 'metadata-provider',
    author: 'Lukas Lalinsky',
    description: 'Generates Chromaprint acoustic fingerprints and matches them against the AcoustID database for automatic track identification of untagged files.',
    installed: true,
    enabled: true,
    status: 'active',
    licenseType: 'open-source',
  },
  {
    id: 'meta-discogs',
    name: 'Discogs Enrichment',
    version: '1.0.0',
    type: 'metadata-provider',
    author: 'DSP Project',
    description: 'Cross-references with Discogs database to enrich album data: catalog numbers, label information, release dates, barcode, and community ratings.',
    installed: true,
    enabled: false,
    status: 'active',
    licenseType: 'needs-agreement',
    licenseDetail: 'Discogs API access requires compliance with their Data Access Terms. Rate-limited to 60 requests/minute for authenticated access.',
  },
  {
    id: 'meta-coverart',
    name: 'Cover Art Archive',
    version: '1.0.0',
    type: 'metadata-provider',
    author: 'MetaBrainz Foundation',
    description: 'Fetches high-resolution cover art from the Cover Art Archive (hosted by Internet Archive). Provides front, back, and booklet images for MusicBrainz releases.',
    installed: true,
    enabled: true,
    status: 'active',
    licenseType: 'open-source',
  },
  {
    id: 'meta-audiodb',
    name: 'TheAudioDB Provider',
    version: '1.0.0',
    type: 'metadata-provider',
    author: 'DSP Project',
    description: 'Supplementary metadata source for artist bios, genres, thumbnails and mood tags. Useful as a fallback when MusicBrainz data is incomplete.',
    installed: true,
    enabled: false,
    status: 'active',
    licenseType: 'open-source',
  },

  // ── Streaming Services (available, not pre-installed) ──
  {
    id: 'svc-tidal',
    name: 'TIDAL Integration',
    version: '1.0.0',
    type: 'streaming-service',
    author: 'DSP Project',
    description: 'Full TIDAL integration with HiRes FLAC streaming up to 24-bit/192 kHz. Includes library sync, search, playlists, and MQA decoding support. Requires a TIDAL HiFi or HiFi Plus subscription.',
    installed: false,
    enabled: false,
    status: 'needs-license',
    licenseType: 'needs-agreement',
    licenseDetail: 'Requires TIDAL developer API access. Usage must comply with TIDAL Terms of Service. Not affiliated with or endorsed by TIDAL AS.',
    configUrl: '#/streaming',
  },
  {
    id: 'svc-qobuz',
    name: 'Qobuz Integration',
    version: '1.0.0',
    type: 'streaming-service',
    author: 'DSP Project',
    description: 'Qobuz streaming integration with true HiRes audio up to 24-bit/192 kHz. Supports album and track streaming, library import, and Sublime+ quality tier access.',
    installed: false,
    enabled: false,
    status: 'needs-license',
    licenseType: 'needs-agreement',
    licenseDetail: 'Requires Qobuz API credentials. Contact Qobuz for developer access. Must comply with Qobuz Terms and Conditions of Use.',
    configUrl: '#/streaming',
  },
  {
    id: 'svc-deezer',
    name: 'Deezer Integration',
    version: '0.9.0',
    type: 'streaming-service',
    author: 'DSP Project',
    description: 'Deezer streaming with CDN-based audio delivery. Supports up to FLAC 16-bit/44.1 kHz quality. Includes catalog search, playlists, and flow recommendations.',
    installed: false,
    enabled: false,
    status: 'needs-license',
    licenseType: 'needs-agreement',
    licenseDetail: 'Requires Deezer API credentials via their developer portal. Subject to Deezer API usage policies and rate limits.',
  },
  {
    id: 'svc-subsonic',
    name: 'Subsonic / Navidrome',
    version: '1.1.0',
    type: 'streaming-service',
    author: 'DSP Project',
    description: 'Self-hosted music server integration via the Subsonic Open API. Works with Subsonic, Airsonic, Navidrome, and Gonic servers. Browse, stream, and search your personal server library.',
    installed: false,
    enabled: false,
    status: 'active',
    licenseType: 'open-source',
  },
  {
    id: 'svc-jellyfin',
    name: 'Jellyfin Media Server',
    version: '0.8.0',
    type: 'streaming-service',
    author: 'DSP Project',
    description: 'Integration with Jellyfin open-source media server. Stream your personal music collection with metadata, cover art, and playlist sync from your Jellyfin instance.',
    installed: false,
    enabled: false,
    status: 'active',
    licenseType: 'open-source',
  },

  // ── Output Protocols (available) ──
  {
    id: 'out-raat',
    name: 'RAAT Bridge Protocol',
    version: '2.0.0',
    type: 'output-protocol',
    author: 'DSP Project',
    description: 'DSP Remote Audio Access Protocol for ultra-low-latency multi-zone playback. Supports bit-perfect streaming, DSD native, and phase-locked multi-zone sync with <2ms accuracy.',
    installed: true,
    enabled: true,
    status: 'active',
    licenseType: 'proprietary',
    licenseDetail: 'RAAT is a proprietary protocol developed for the DSP platform. Bridge firmware and specifications are available under the DSP Hardware Partner Program.',
  },
  {
    id: 'out-airplay',
    name: 'AirPlay 2 Sender',
    version: '1.0.0',
    type: 'output-protocol',
    author: 'DSP Project',
    description: 'AirPlay 2 output protocol for streaming to Apple devices, HomePods, AirPlay-enabled speakers, and receivers. Supports multi-room grouping and synchronized playback.',
    installed: false,
    enabled: false,
    status: 'needs-license',
    licenseType: 'needs-agreement',
    licenseDetail: 'AirPlay is a trademark of Apple Inc. Implementing AirPlay 2 requires an Apple MFi (Made for iPhone) license and adherence to Apple AirPlay specifications.',
  },
  {
    id: 'out-chromecast',
    name: 'Google Cast Output',
    version: '0.9.0',
    type: 'output-protocol',
    author: 'DSP Project',
    description: 'Google Cast (Chromecast) audio output for streaming to Chromecast Audio devices, Nest speakers, and Cast-enabled receivers. Supports remote control and volume management.',
    installed: false,
    enabled: false,
    status: 'needs-license',
    licenseType: 'needs-agreement',
    licenseDetail: 'Google Cast SDK usage requires acceptance of Google Cast SDK Terms of Service. Subject to Google API policies.',
  },
  {
    id: 'out-dlna',
    name: 'DLNA / UPnP Renderer',
    version: '1.0.0',
    type: 'output-protocol',
    author: 'DSP Project',
    description: 'Universal Plug and Play (UPnP) AV / DLNA renderer for streaming to networked speakers, receivers, and TVs. Auto-discovers devices on the LAN and supports push and pull modes.',
    installed: false,
    enabled: false,
    status: 'active',
    licenseType: 'open-source',
  },
  {
    id: 'out-roon-bridge',
    name: 'Roon Bridge',
    version: '0.7.0',
    type: 'output-protocol',
    author: 'DSP Project',
    description: 'Acts as a Roon Ready network endpoint, allowing the DSP system to appear as a zone in Roon. Enables DSP processing on Roon-sourced audio streams.',
    installed: false,
    enabled: false,
    status: 'needs-license',
    licenseType: 'needs-agreement',
    licenseDetail: 'Roon Ready certification requires partnership with Roon Labs. This plugin provides bridge functionality but does not imply Roon certification.',
  },
  {
    id: 'out-bluetooth',
    name: 'Bluetooth (A2DP) Output',
    version: '0.5.0',
    type: 'output-protocol',
    author: 'DSP Project',
    description: 'Bluetooth A2DP audio output for streaming to Bluetooth headphones, speakers, and car audio systems. Supports SBC, AAC, aptX, aptX HD, and LDAC codecs where available.',
    installed: false,
    enabled: false,
    status: 'active',
    licenseType: 'open-source',
  },
];

// ═══════════════════════════════════════════════════════════
// Plugin Store
// ═══════════════════════════════════════════════════════════

interface PluginState {
  plugins: DSPPlugin[];
  isCheckingUpdates: boolean;

  // Actions
  installPlugin: (pluginId: string) => void;
  uninstallPlugin: (pluginId: string) => void;
  togglePlugin: (pluginId: string) => void;
  checkForUpdates: () => void;
}

function loadPluginsFromStorage(): DSPPlugin[] {
  if (typeof window === 'undefined') return BUILTIN_PLUGINS;
  try {
    const saved = localStorage.getItem('dsp-plugin-states');
    if (saved) {
      const states: Record<string, { installed?: boolean; enabled?: boolean }> = JSON.parse(saved);
      return BUILTIN_PLUGINS.map(p => ({
        ...p,
        installed: states[p.id]?.installed ?? p.installed,
        enabled: states[p.id]?.enabled ?? p.enabled,
      }));
    }
  } catch { /* ignore */ }
  return BUILTIN_PLUGINS;
}

function savePluginStates(plugins: DSPPlugin[]) {
  if (typeof window === 'undefined') return;
  try {
    const states: Record<string, { installed: boolean; enabled: boolean }> = {};
    plugins.forEach(p => {
      states[p.id] = { installed: p.installed, enabled: p.enabled };
    });
    localStorage.setItem('dsp-plugin-states', JSON.stringify(states));
  } catch { /* ignore quota */ }
}

export const usePluginStore = create<PluginState>((set, get) => ({
  plugins: loadPluginsFromStorage(),
  isCheckingUpdates: false,

  installPlugin: (pluginId) => {
    set(s => {
      const plugins = s.plugins.map(p =>
        p.id === pluginId ? { ...p, installed: true, enabled: true, status: 'active' as const } : p
      );
      savePluginStates(plugins);
      return { plugins };
    });
  },

  uninstallPlugin: (pluginId) => {
    set(s => {
      const plugins = s.plugins.map(p =>
        p.id === pluginId ? { ...p, installed: false, enabled: false } : p
      );
      savePluginStates(plugins);
      return { plugins };
    });
  },

  togglePlugin: (pluginId) => {
    set(s => {
      const plugins = s.plugins.map(p =>
        p.id === pluginId ? { ...p, enabled: !p.enabled, status: p.enabled ? 'active' as const : 'active' as const } : p
      );
      savePluginStates(plugins);
      return { plugins };
    });
  },

  checkForUpdates: () => {
    set({ isCheckingUpdates: true });
    setTimeout(() => {
      set({ isCheckingUpdates: false });
    }, 3000);
  },
}));
