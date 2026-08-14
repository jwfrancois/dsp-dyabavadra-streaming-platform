'use client';

import React, { useState } from 'react';
import { useDSPEngineStore } from '@/store/dsp-engine';
import { formatSampleRate, type DSPConfig, type EQBand } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sliders,
  Waves,
  Headphones,
  Volume2,
  VolumeX,
  Gauge,
  Zap,
  RefreshCw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  MonitorSpeaker,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Cpu,
  MoveHorizontal,
  Crosshair,
} from 'lucide-react';

// ─── Local DSP state for the selected zone ───

const defaultDSPConfig: DSPConfig = {
  eq: [
    { id: 'eq-1', enabled: true, type: 'parametric', frequency: 80, gain: 2.5, q: 1.2, label: 'Bass Boost' },
    { id: 'eq-2', enabled: true, type: 'parametric', frequency: 2500, gain: -1.0, q: 2.0, label: 'Presence Cut' },
    { id: 'eq-3', enabled: false, type: 'high-shelf', frequency: 12000, gain: -2.0, q: 0.7, label: 'Air' },
  ],
  roomCorrection: { enabled: false, filterName: '—', samplerate: 48000, channels: 2 },
  upsampling: { enabled: false, targetRate: 176400, targetBitDepth: 32, filterType: 'minimum-phase', maxSrcRate: 96000 },
  headphoneCorrection: { enabled: false, profileName: '—', manufacturer: '—', model: '—' },
  crossfeed: { enabled: false, preset: 'moderate' },
  loudness: { enabled: false, targetLUFS: -16, method: 'ebu-r128', fallbackGain: 0 },
  dither: { enabled: false, type: 'tpdf' },
  volumeLimit: { maxPercent: 85, startupMax: 40, rampTimeMs: 500 },
};

export function DSPConfigView() {
  const engine = useDSPEngineStore();

  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [dspConfig, setDspConfig] = useState<DSPConfig>(
    defaultDSPConfig,
  );
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    eq: false,
    upsampling: false,
    volume: true,
    clock: true,
  });
  const [volumeMode, setVolumeMode] = useState<'hardware' | 'dsp' | 'fixed'>(
    'dsp' as const,
  );
  const [maxVolume, setMaxVolume] = useState(85);
  const [startupVolume, setStartupVolume] = useState(40);
  const [rampTime, setRampTime] = useState(500);
  const [clockMode, setClockMode] = useState<'auto' | 'master' | 'slave' | 'passthrough'>(
    'auto' as const,
  );

  // Replace zonesList with actual zone data from the DSP store
  const zonesList = React.useMemo(() => {
    const zoneIds = Object.keys(engine.zoneConfigs);
    return zoneIds.length > 0 ? zoneIds.map(id => ({
      id,
      name: id === 'zone-1' ? 'Main Listening Room' : id === 'zone-2' ? 'Study' : id === 'zone-3' ? 'Kitchen' : `Zone ${id.replace('zone-', '')}`,
      endpoints: [{ dac: id === 'zone-1' ? 'ESS Sabre ES9038Q2M' : 'Built-in DAC', name: id === 'zone-1' ? 'USB DAC (Main)' : 'Default Output', status: 'online' as const, clockSource: 'internal' as const, maxSampleRate: 384000, latencyMs: 1.2 }],
      outputFormat: 'PCM',
      sampleRate: 44100,
      bitDepth: 32,
      dspEnabled: false,
      dspChain: [] as string[],
      isGroup: false,
      volume: 75,
      volumeMode: 'hardware' as const,
      isPlaying: false,
      isMuted: false,
      isOnline: true,
      currentTrackId: undefined,
      syncOffsetMs: 0,
    })) : [];
  }, [engine.zoneConfigs]);

  const selectedZone = selectedZoneId ? zonesList.find(z => z.id === selectedZoneId) : zonesList[0] || null;

  // ─── Helpers ───

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const activeEQBands = (dspConfig.eq ?? []).filter(b => b.enabled).length;

  const updateEQBand = (bandId: string, updates: Partial<EQBand>) => {
    setDspConfig(prev => ({
      ...prev,
      eq: (prev.eq ?? []).map(b => (b.id === bandId ? { ...b, ...updates } : b)),
    }));
  };

  const addEQBand = () => {
    const newId = `eq-new-${Date.now()}`;
    const newBand: EQBand = {
      id: newId,
      enabled: true,
      type: 'parametric',
      frequency: 1000,
      gain: 0,
      q: 1.0,
      label: `Band ${(dspConfig.eq ?? []).length + 1}`,
    };
    setDspConfig(prev => ({ ...prev, eq: [...(prev.eq ?? []), newBand] }));
  };

  const removeEQBand = (bandId: string) => {
    setDspConfig(prev => ({
      ...prev,
      eq: (prev.eq ?? []).filter(b => b.id !== bandId),
    }));
  };

  const toggleModule = (key: keyof DSPConfig, nestedKey?: string) => {
    setDspConfig(prev => {
      const mod = prev[key];
      if (!mod || typeof mod !== 'object' || Array.isArray(mod)) return prev;
      return {
        ...prev,
        [key]: { ...(mod as Record<string, unknown>), enabled: !(mod as Record<string, unknown>).enabled },
      };
    });
    // Also persist to DSP engine store
    const zoneId = selectedZoneId || zonesList[0]?.id;
    if (zoneId) {
      engine.toggleDSPModule(zoneId, key);
    }
  };

  const bandTypeColor = (type: string) => {
    switch (type) {
      case 'parametric': return 'bg-blue-500/20 text-blue-400';
      case 'low-shelf': return 'bg-emerald-500/20 text-emerald-400';
      case 'high-shelf': return 'bg-amber-500/20 text-amber-400';
      case 'low-pass': return 'bg-purple-500/20 text-purple-400';
      case 'high-pass': return 'bg-pink-500/20 text-pink-400';
      case 'notch': return 'bg-red-500/20 text-red-400';
      case 'band-pass': return 'bg-cyan-500/20 text-cyan-400';
      default: return 'bg-surface/50 text-muted-foreground';
    }
  };

  // ─── Decorative EQ curve SVG ───

  const EQCurveSVG = () => {
    const bands = dspConfig.eq ?? [];
    const points = 48;
    const w = 480;
    const h = 100;
    const mid = h / 2;

    const computeGain = (freq: number) => {
      let total = 0;
      for (const band of bands) {
        if (!band.enabled) continue;
        const diff = Math.log2(freq / band.frequency);
        const bw = band.q * diff;
        const response = 1 / (1 + bw * bw);
        if (band.type === 'high-shelf' && freq > band.frequency) {
          total += band.gain * response;
        } else if (band.type === 'low-shelf' && freq < band.frequency) {
          total += band.gain * response;
        } else if (band.type === 'parametric' || band.type === 'notch' || band.type === 'band-pass') {
          total += band.gain * response;
        }
      }
      return total;
    };

    const pathParts: string[] = [];
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const freq = 20 * Math.pow(1000, t);
      const gain = computeGain(freq);
      const x = (i / points) * w;
      const y = mid - (gain / 24) * (mid - 8);
      pathParts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24 opacity-40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        <line x1={0} y1={mid} x2={w} y2={mid} stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.5" />
        <line x1={0} y1={mid - (mid - 8)} x2={w} y2={mid - (mid - 8)} stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.5" />
        <line x1={0} y1={mid + (mid - 8)} x2={w} y2={mid + (mid - 8)} stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.5" />
        {/* Filled area */}
        <path d={`${pathParts.join(' ')} L ${w} ${mid} L 0 ${mid} Z`} fill="url(#eqGrad)" className="text-primary" />
        {/* Curve line */}
        <path d={pathParts.join(' ')} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
        {/* Frequency labels */}
        <text x={0} y={h - 2} fill="currentColor" className="text-muted-foreground" fontSize="8" fontFamily="monospace">20</text>
        <text x={w * 0.21} y={h - 2} fill="currentColor" className="text-muted-foreground" fontSize="8" fontFamily="monospace">100</text>
        <text x={w * 0.43} y={h - 2} fill="currentColor" className="text-muted-foreground" fontSize="8" fontFamily="monospace">1k</text>
        <text x={w * 0.64} y={h - 2} fill="currentColor" className="text-muted-foreground" fontSize="8" fontFamily="monospace">10k</text>
        <text x={w * 0.88} y={h - 2} fill="currentColor" className="text-muted-foreground" fontSize="8" fontFamily="monospace">20k</text>
      </svg>
    );
  };

  // ─── Module Card renderer ───

  type ModuleInfo = {
    key: keyof DSPConfig;
    icon: React.ReactNode;
    label: string;
    detail: string;
    enabled: boolean;
  };

  const modules: ModuleInfo[] = [
    {
      key: 'eq',
      icon: <Waves className="w-4 h-4" />,
      label: 'Parametric EQ',
      detail: `${activeEQBands} active band${activeEQBands !== 1 ? 's' : ''}`,
      enabled: (dspConfig.eq ?? []).length > 0,
    },
    {
      key: 'roomCorrection',
      icon: <Crosshair className="w-4 h-4" />,
      label: 'Room Correction',
      detail: `${dspConfig.roomCorrection?.filterName ?? '—'} · ${formatSampleRate(dspConfig.roomCorrection?.samplerate ?? 48000)}`,
      enabled: dspConfig.roomCorrection?.enabled ?? false,
    },
    {
      key: 'upsampling',
      icon: <RefreshCw className="w-4 h-4" />,
      label: 'Upsampling',
      detail: `${formatSampleRate(dspConfig.upsampling?.targetRate ?? 176400)} · ${dspConfig.upsampling?.filterType ?? 'minimum-phase'}`,
      enabled: dspConfig.upsampling?.enabled ?? false,
    },
    {
      key: 'headphoneCorrection',
      icon: <Headphones className="w-4 h-4" />,
      label: 'Headphone Correction',
      detail: `${dspConfig.headphoneCorrection?.profileName ?? '—'} · ${dspConfig.headphoneCorrection?.manufacturer ?? '—'} ${dspConfig.headphoneCorrection?.model ?? ''}`,
      enabled: dspConfig.headphoneCorrection?.enabled ?? false,
    },
    {
      key: 'crossfeed',
      icon: <MoveHorizontal className="w-4 h-4" />,
      label: 'Crossfeed',
      detail: `Preset: ${dspConfig.crossfeed?.preset ?? 'none'}`,
      enabled: dspConfig.crossfeed?.enabled ?? false,
    },
    {
      key: 'loudness',
      icon: <Gauge className="w-4 h-4" />,
      label: 'Loudness / ReplayGain',
      detail: `${dspConfig.loudness?.targetLUFS ?? -16} LUFS · ${dspConfig.loudness?.method ?? 'ebu-r128'}`,
      enabled: dspConfig.loudness?.enabled ?? false,
    },
    {
      key: 'dither',
      icon: <Cpu className="w-4 h-4" />,
      label: 'Dither',
      detail: dspConfig.dither?.type === 'none' ? 'Disabled' : `${dspConfig.dither?.type === 'tpdf' ? 'TPDF' : dspConfig.dither?.type === 'triangular' ? 'Triangular' : 'Noise-Shaped'}`,
      enabled: dspConfig.dither?.enabled ?? false,
    },
  ];

  // ─── Render ───

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-2">
          <Sliders className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">DSP Engine</h1>
          <Badge variant="secondary" className="text-xs ml-2">Configuration</Badge>
        </div>
        <p className="text-muted-foreground text-sm -mt-3 mb-4">
          Configure the digital signal processing chain for each zone.
        </p>

        {/* ─── 1. Zone Selector ─── */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MonitorSpeaker className="w-4 h-4 text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Zone</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {zonesList.length === 0 ? (
                <span className="text-xs text-muted-foreground">No zones configured</span>
              ) : (
              zonesList.map((zone: any) => (
                <Button
                  key={zone.id}
                  variant="ghost"
                  size="sm"
                  className={
                    zone.id === selectedZoneId
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-surface hover:bg-surface/80 text-foreground'
                  }
                  onClick={() => {
                    setSelectedZoneId(zone.id);
                    engine.selectZone(zone.id);
                    setDspConfig(zone.dspConfig ?? defaultDSPConfig);
                    setVolumeMode(zone.volumeMode ?? 'dsp');
                    setMaxVolume(zone.maxVolume ?? 85);
                    setStartupVolume(zone.startupVolume ?? 40);
                    setClockMode(zone.clockMode ?? 'auto');
                  }}
                >
                  {zone.name}
                </Button>
              ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* ─── 2. DSP Module Toggles ─── */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Processing Modules</span>
            </div>
            <div className="grid gap-3">
              {modules.map(mod => (
                <div
                  key={mod.key}
                  className={`flex items-center justify-between p-3 rounded-lg bg-surface/50 border-l-2 transition-colors ${
                    mod.enabled ? 'border-l-primary' : 'border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`${mod.enabled ? 'text-primary' : 'text-muted-foreground'}`}>
                      {mod.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{mod.label}</span>
                        {mod.enabled && <CheckCircle2 className="w-3 h-3 text-signal-green" />}
                      </div>
                      <span className="text-xs text-muted-foreground truncate block">
                        {mod.detail}
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={mod.enabled}
                    onCheckedChange={() => toggleModule(mod.key)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ─── 3. Parametric EQ Editor ─── */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <button
              className="flex items-center justify-between w-full text-left"
              onClick={() => toggleSection('eq')}
            >
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Parametric EQ Editor</span>
                <Badge variant="secondary" className="text-[10px]">{(dspConfig.eq ?? []).length} bands</Badge>
              </div>
              {expandedSections.eq ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {expandedSections.eq && (
              <div className="mt-4 space-y-4">
                {/* EQ Curve Visualization */}
                <div className="rounded-lg bg-surface/50 p-3">
                  <EQCurveSVG />
                </div>

                <Separator className="bg-border" />

                {/* EQ Bands */}
                <div className="space-y-3">
                  {(dspConfig.eq ?? []).map((band, idx) => (
                    <div
                      key={band.id}
                      className={`p-3 rounded-lg border border-border bg-surface/30 ${
                        !band.enabled ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">{band.label ?? `Band ${idx + 1}`}</span>
                          <Badge className={`text-[10px] ${bandTypeColor(band.type)}`} variant="secondary">
                            {band.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={band.enabled}
                            onCheckedChange={checked => updateEQBand(band.id, { enabled: checked })}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-signal-red"
                            onClick={() => removeEQBand(band.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {/* Frequency */}
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Frequency</span>
                          <span className="font-mono text-sm text-foreground">
                            {band.frequency >= 1000
                              ? `${(band.frequency / 1000).toFixed(1)} kHz`
                              : `${band.frequency} Hz`}
                          </span>
                        </div>

                        {/* Gain with +/- */}
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Gain</span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateEQBand(band.id, { gain: Math.max(-24, band.gain - 0.5) })}
                            >
                              <span className="text-xs">−</span>
                            </Button>
                            <span className={`font-mono text-sm min-w-[3rem] text-center ${
                              band.gain > 0 ? 'text-signal-green' : band.gain < 0 ? 'text-signal-amber' : 'text-foreground'
                            }`}>
                              {band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)} dB
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateEQBand(band.id, { gain: Math.min(24, band.gain + 0.5) })}
                            >
                              <span className="text-xs">+</span>
                            </Button>
                          </div>
                        </div>

                        {/* Q Value */}
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Q</span>
                          <span className="font-mono text-sm text-foreground">{band.q.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={addEQBand}
                >
                  <Plus className="w-3.5 h-3.5 mr-2" />
                  Add Band
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── 4. Upsampling Config ─── */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <button
              className="flex items-center justify-between w-full text-left"
              onClick={() => toggleSection('upsampling')}
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Upsampling Configuration</span>
              </div>
              {expandedSections.upsampling ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {expandedSections.upsampling && (
              <div className="mt-4 space-y-4">
                {/* Target Rate */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Target Rate</span>
                  <Select
                    value={String(dspConfig.upsampling?.targetRate ?? 176400)}
                    onValueChange={val =>
                      setDspConfig(prev => ({
                        ...prev,
                        upsampling: { ...(prev.upsampling ?? { enabled: false, targetRate: 176400, targetBitDepth: 32, filterType: 'minimum-phase', maxSrcRate: 96000 }), targetRate: Number(val) },
                      }))
                    }
                  >
                    <SelectTrigger className="w-48 bg-surface/50 border-border font-mono text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="88200">88.2 kHz (2×)</SelectItem>
                      <SelectItem value="176400">176.4 kHz (4×)</SelectItem>
                      <SelectItem value="352800">352.8 kHz (8×)</SelectItem>
                      <SelectItem value="96000">96 kHz (2×)</SelectItem>
                      <SelectItem value="192000">192 kHz (4×)</SelectItem>
                      <SelectItem value="384000">384 kHz (4×)</SelectItem>
                      <SelectItem value="768000">768 kHz (8×)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Target Bit Depth */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Target Bit Depth</span>
                  <Select
                    value={String(dspConfig.upsampling?.targetBitDepth ?? 32)}
                    onValueChange={val =>
                      setDspConfig(prev => ({
                        ...prev,
                        upsampling: { ...(prev.upsampling ?? { enabled: false, targetRate: 176400, targetBitDepth: 32, filterType: 'minimum-phase', maxSrcRate: 96000 }), targetBitDepth: Number(val) },
                      }))
                    }
                  >
                    <SelectTrigger className="w-32 bg-surface/50 border-border font-mono text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="16">16-bit</SelectItem>
                      <SelectItem value="24">24-bit</SelectItem>
                      <SelectItem value="32">32-bit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter Type */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Filter Type</span>
                  <Select
                    value={dspConfig.upsampling?.filterType ?? 'minimum-phase'}
                    onValueChange={val =>
                      setDspConfig(prev => ({
                        ...prev,
                        upsampling: { ...(prev.upsampling ?? { enabled: false, targetRate: 176400, targetBitDepth: 32, filterType: 'minimum-phase', maxSrcRate: 96000 }), filterType: val as DSPConfig['upsampling'] extends { filterType: infer F } ? F : never },
                      }))
                    }
                  >
                    <SelectTrigger className="w-48 bg-surface/50 border-border font-mono text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="minimum-phase">Minimum Phase</SelectItem>
                      <SelectItem value="linear-phase">Linear Phase</SelectItem>
                      <SelectItem value="apodizing">Apodizing</SelectItem>
                      <SelectItem value="brick-wall">Brick Wall</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Max Source Rate */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Max Source Rate</span>
                  <Select
                    value={String(dspConfig.upsampling?.maxSrcRate ?? 96000)}
                    onValueChange={val =>
                      setDspConfig(prev => ({
                        ...prev,
                        upsampling: { ...(prev.upsampling ?? { enabled: false, targetRate: 176400, targetBitDepth: 32, filterType: 'minimum-phase', maxSrcRate: 96000 }), maxSrcRate: Number(val) },
                      }))
                    }
                  >
                    <SelectTrigger className="w-48 bg-surface/50 border-border font-mono text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="44100">44.1 kHz</SelectItem>
                      <SelectItem value="48000">48 kHz</SelectItem>
                      <SelectItem value="88200">88.2 kHz</SelectItem>
                      <SelectItem value="96000">96 kHz</SelectItem>
                      <SelectItem value="176400">176.4 kHz</SelectItem>
                      <SelectItem value="192000">192 kHz</SelectItem>
                      <SelectItem value="352800">352.8 kHz</SelectItem>
                      <SelectItem value="384000">384 kHz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── 5. Volume Control ─── */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <button
              className="flex items-center justify-between w-full text-left"
              onClick={() => toggleSection('volume')}
            >
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Volume Control</span>
              </div>
              {expandedSections.volume ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {expandedSections.volume && (
              <div className="mt-4 space-y-5">
                {/* Volume Mode */}
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">Volume Mode</span>
                  <div className="flex gap-2">
                    {(['hardware', 'dsp', 'fixed'] as const).map(mode => (
                      <Button
                        key={mode}
                        variant={volumeMode === mode ? 'default' : 'outline'}
                        size="sm"
                        className={volumeMode === mode ? 'bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}
                        onClick={() => setVolumeMode(mode)}
                      >
                        {mode === 'hardware' && <MonitorSpeaker className="w-3.5 h-3.5 mr-1.5" />}
                        {mode === 'dsp' && <Cpu className="w-3.5 h-3.5 mr-1.5" />}
                        {mode === 'fixed' && <VolumeX className="w-3.5 h-3.5 mr-1.5" />}
                        <span className="capitalize">{mode === 'dsp' ? 'DSP' : mode}</span>
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {volumeMode === 'hardware' && 'Volume is controlled by the DAC or amplifier hardware. Bit-perfect output preserved.'}
                    {volumeMode === 'dsp' && 'Volume is applied in the DSP pipeline before output. Allows limiting and ramping.'}
                    {volumeMode === 'fixed' && 'Fixed output level — no volume control. Use when connecting to an external preamp.'}
                  </p>
                </div>

                <Separator className="bg-border" />

                {/* Max Volume */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Max Volume</span>
                    <span className={`font-mono text-sm ${maxVolume > 80 ? 'text-signal-red' : 'text-foreground'}`}>
                      {maxVolume}%
                    </span>
                  </div>
                  <Slider
                    value={[maxVolume]}
                    onValueChange={val => setMaxVolume(val[0])}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  {maxVolume > 80 && (
                    <div className="flex items-center gap-1.5 mt-2 text-signal-red">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span className="text-xs">Warning: High maximum volume may cause speaker damage</span>
                    </div>
                  )}
                </div>

                <Separator className="bg-border" />

                {/* Startup Volume */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Startup Volume</span>
                    <span className="font-mono text-sm text-foreground">{startupVolume}%</span>
                  </div>
                  <Slider
                    value={[startupVolume]}
                    onValueChange={val => setStartupVolume(val[0])}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <Separator className="bg-border" />

                {/* Volume Ramp Time */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Volume Ramp Time</span>
                    <span className="font-mono text-sm text-foreground">{rampTime} ms</span>
                  </div>
                  <Slider
                    value={[rampTime]}
                    onValueChange={val => setRampTime(val[0])}
                    min={0}
                    max={2000}
                    step={50}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Time for volume transitions between tracks or seeking. 0 = instant.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── 6. Clock & Timing ─── */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <button
              className="flex items-center justify-between w-full text-left"
              onClick={() => toggleSection('clock')}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Clock &amp; Timing</span>
              </div>
              {expandedSections.clock ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {expandedSections.clock && selectedZone && (
              <div className="mt-4 space-y-4">
                {/* Clock Mode */}
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">Clock Mode</span>
                  <div className="flex gap-2 flex-wrap">
                    {(['auto', 'master', 'slave', 'passthrough'] as const).map(mode => (
                      <Button
                        key={mode}
                        variant={clockMode === mode ? 'default' : 'outline'}
                        size="sm"
                        className={clockMode === mode ? 'bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}
                        onClick={() => setClockMode(mode)}
                      >
                        <Activity className="w-3.5 h-3.5 mr-1.5" />
                        <span className="capitalize">{mode}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator className="bg-border" />

                {/* Current Clock Source */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Source</span>
                  <span className="font-mono text-sm text-foreground">
                    {selectedZone?.endpoints[0]?.clockSource ? String(selectedZone.endpoints[0].clockSource).toUpperCase() : 'INTERNAL'}
                  </span>
                </div>

                {/* Jitter Indicator */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Jitter</span>
                  <Badge className="bg-signal-green/15 text-signal-green border-signal-green/30 text-[10px]">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    &lt; 1ns
                  </Badge>
                </div>

                {/* Sync Status for Grouped Zones */}
                {selectedZone.isGroup && (
                  <>
                    <Separator className="bg-border" />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Sync Offset</span>
                      <span className="font-mono text-sm text-foreground">
                        {selectedZone.syncOffsetMs != null ? `${selectedZone.syncOffsetMs.toFixed(1)} ms` : '0.0 ms'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Group Sync</span>
                      <Badge variant="secondary" className="text-[10px] text-signal-green">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Synchronized
                      </Badge>
                    </div>
                  </>
                )}

                {/* Endpoint Clock Info */}
                {selectedZone.endpoints.map(ep => (
                  <div key={ep.id} className="p-3 rounded-lg bg-surface/50 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-foreground">{ep.name}</span>
                      <span className={`w-2 h-2 rounded-full ${ep.status === 'online' ? 'bg-signal-green' : ep.status === 'standby' ? 'bg-signal-amber' : 'bg-signal-red'}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">DAC</span>
                        <span className="font-mono text-foreground">{ep.dac ?? '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Rate</span>
                        <span className="font-mono text-foreground">{formatSampleRate(ep.maxSampleRate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Latency</span>
                        <span className="font-mono text-foreground">{ep.latencyMs?.toFixed(1) ?? '—'} ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Clock</span>
                        <span className="font-mono text-foreground">{ep.clockSource ? String(ep.clockSource) : 'internal'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom spacer */}
        <div className="h-8" />
      </div>
    </ScrollArea>
  );
}
