'use client';

import React, { useMemo } from 'react';
import { usePlayerStore } from '@/store/player';
import { useDSPEngineStore } from '@/store/dsp-engine';
import { getSignalPathSteps } from '@/lib/dsp/audio-engine';
import {
  formatDuration,
  formatSampleRate,
  getCoverGradient,
} from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Zap,
  ChevronRight,
  Gauge,
  Activity,
  Clock,
  Wifi,
  Disc3,
  AudioWaveform,
  MonitorSpeaker,
  Info,
  ArrowDown,
} from 'lucide-react';
import type { SignalPathStep } from '@/lib/data';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function stepChangesFormat(step: SignalPathStep, prevStep?: SignalPathStep): boolean {
  if (!prevStep) return false;
  return (
    step.format !== prevStep.format ||
    step.sampleRate !== prevStep.sampleRate ||
    step.bitDepth !== prevStep.bitDepth
  );
}

function getBreakdownItems(steps: SignalPathStep[]): { label: string; reason: string; suggestion: string }[] {
  const items: { label: string; reason: string; suggestion: string }[] = [];
  const nonBitPerfect = steps.filter(s => !s.isBitPerfect);

  for (const step of nonBitPerfect) {
    if (step.label === 'Volume Control') {
      items.push({
        label: step.label,
        reason: 'Digital volume attenuation is active, modifying sample values before output.',
        suggestion: 'Switch to hardware volume control or set DSP volume to 0 dB to restore bit-perfect output.',
      });
    } else if (step.label === 'Sample Rate Conversion') {
      items.push({
        label: step.label,
        reason: 'Audio is being resampled to match the endpoint\u2019s native rate.',
        suggestion: 'Disable SRC in DSP settings or use an endpoint that supports the source sample rate natively.',
      });
    } else if (step.label === 'Room Correction') {
      items.push({
        label: step.label,
        reason: 'Convolution filter is applied to compensate for room acoustics.',
        suggestion: 'Disable room correction to pass the bitstream unmodified.',
      });
    } else if (step.label.includes('EQ') || step.label.includes('Equalizer')) {
      items.push({
        label: step.label,
        reason: 'Frequency response is being altered by the equalizer.',
        suggestion: 'Set the EQ to flat/bypass to preserve the original signal.',
      });
    } else if (step.label.includes('Loudness')) {
      items.push({
        label: step.label,
        reason: 'Loudness compensation is applying dynamic gain curves.',
        suggestion: 'Disable loudness processing in zone DSP settings.',
      });
    } else if (step.label.includes('Upsampling') || step.label.includes('SRC')) {
      items.push({
        label: step.label,
        reason: step.processingDetail ?? 'Sample rate conversion is in progress.',
        suggestion: 'Disable upsampling/SRC in DSP configuration.',
      });
    } else if (step.label.includes('DSD')) {
      items.push({
        label: step.label,
        reason: step.processingDetail ?? 'DSD-to-PCM or PCM-to-DSD conversion is active.',
        suggestion: 'Use a DAC that supports native DSD to avoid conversion.',
      });
    } else {
      items.push({
        label: step.label,
        reason: step.processingDetail ?? 'This stage is modifying the audio signal.',
        suggestion: 'Disable or bypass this processing stage.',
      });
    }
  }
  return items;
}

// ─── Connector ────────────────────────────────────────────────────────────────

function StepConnector() {
  return (
    <div className="flex flex-col items-center py-1">
      <div className="w-px h-4 bg-border" />
      <ArrowDown className="w-3 h-3 text-muted-foreground -mt-0.5 -mb-0.5" />
      <div className="w-px h-4 bg-border" />
    </div>
  );
}

// ─── Signal Path Step Card ───────────────────────────────────────────────────

function PathStepCard({
  step,
  prevStep,
  isLast,
}: {
  step: SignalPathStep;
  prevStep?: SignalPathStep;
  isLast: boolean;
}) {
  const changesFmt = stepChangesFormat(step, prevStep);
  const isProcessing = !step.isBitPerfect;

  return (
    <>
      <div
        className={`
          relative rounded-xl p-4 transition-colors
          ${changesFmt ? 'border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'}
          ${isProcessing
            ? 'bg-signal-amber/[0.04] ring-1 ring-signal-amber/20'
            : 'bg-signal-green/[0.03] ring-1 ring-signal-green/15'}
        `}
      >
        {/* Top row: status icon + label + latency */}
        <div className="flex items-start gap-3">
          {/* Status icon */}
          <div
            className={`
              w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5
              ${isProcessing ? 'bg-signal-amber/10' : 'bg-signal-green/10'}
            `}
          >
            {isProcessing ? (
              <Zap className="w-4 h-4 text-signal-amber" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-signal-green" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{step.label}</span>
              {/* DSD mode */}
              {step.dsdMode && (
                <Badge variant="outline" className="text-[10px] font-mono border-purple-500/40 text-purple-400">
                  DSD {step.dsdMode}
                </Badge>
              )}
              {/* Dither type */}
              {step.ditherType && step.ditherType !== 'none' && (
                <Badge variant="outline" className="text-[10px] font-mono border-sky-500/40 text-sky-400">
                  Dither: {step.ditherType}
                </Badge>
              )}
              {/* Filter type */}
              {step.filterType && (
                <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40 text-emerald-400">
                  Filter: {step.filterType}
                </Badge>
              )}
              {changesFmt && (
                <Badge className="text-[10px] bg-primary/80 text-primary-foreground">
                  <AudioWaveform className="w-2.5 h-2.5 mr-0.5" /> Format Change
                </Badge>
              )}
            </div>

            {/* Technical values */}
            <div className="flex items-center gap-2 mt-1 font-mono text-xs text-muted-foreground">
              <span className={isProcessing ? 'text-signal-amber' : 'text-signal-green'}>
                {step.format}
              </span>
              <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/50" />
              <span className={isProcessing ? 'text-signal-amber' : 'text-signal-green'}>
                {formatSampleRate(step.sampleRate)}
              </span>
              <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/50" />
              <span className={isProcessing ? 'text-signal-amber' : 'text-signal-green'}>
                {step.bitDepth}-bit
              </span>
            </div>

            {/* Processing detail */}
            {step.processingDetail && (
              <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                {step.processingDetail}
              </p>
            )}

            {/* Latency */}
            {step.latencyMs != null && step.latencyMs > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Clock className="w-3 h-3 text-muted-foreground/60" />
                <span className="text-[10px] font-mono text-muted-foreground">
                  {step.latencyMs.toFixed(1)} ms latency
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connector to next step */}
      {!isLast && <StepConnector />}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SignalPathView() {
  const { currentTrack, activeZoneId } = usePlayerStore();
  const dspStore = useDSPEngineStore(s => s);
  const activeZoneId_actual = activeZoneId || dspStore.selectedZoneId;

  // Get real signal path from DSP engine
  const steps = useMemo(() => {
    if (!currentTrack) return [];
    const zoneConfig = dspStore.getZoneConfig(activeZoneId_actual);
    return getSignalPathSteps(currentTrack.format, currentTrack.sampleRate, currentTrack.bitDepth);
  }, [currentTrack, dspStore, activeZoneId_actual]);

  const isBitPerfect = steps.length > 0 && steps.every(s => s.isBitPerfect);
  const breakdownItems = steps.length > 0 ? getBreakdownItems(steps as SignalPathStep[]) : [];

  // Summary info
  const sourceStep = steps[0];
  const outputStep = steps[steps.length - 1];
  const totalLatency = steps.reduce((sum, s) => sum + (s.latencyMs || 0), 0);

  if (!currentTrack || steps.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <MonitorSpeaker className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No signal path available</p>
          <p className="text-sm">Start playing a track to see the signal path.</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Signal Path</h1>
            <div className="flex items-center gap-2 flex-wrap">
              {isBitPerfect ? (
                <Badge className="text-xs bg-signal-green text-white gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Bit-Perfect
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-signal-amber border-signal-amber/40 gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Processing Active
                </Badge>
              )}
              <Badge variant="secondary" className="text-[11px] font-mono">
                {currentTrack.format} {formatSampleRate(currentTrack.sampleRate)} {currentTrack.bitDepth}-bit
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getCoverGradient(currentTrack.id)}`} />
            <div className="text-right">
              <p className="text-sm font-medium text-foreground leading-tight">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground">{currentTrack.artistName}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* ── Summary Bar ── */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 flex-wrap text-sm">
              {/* Source format */}
              <div className="flex items-center gap-2">
                <Disc3 className="w-4 h-4 text-signal-green" />
                <span className="font-mono text-signal-green font-medium">{sourceStep?.format || 'PCM'} {formatSampleRate(sourceStep?.sampleRate || 44100)} {sourceStep?.bitDepth || 16}-bit</span>
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground" />

              {/* DSP chain count */}
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-signal-amber" />
                <span className="text-xs text-muted-foreground">
                  {steps.length <= 2
                    ? 'No DSP'
                    : `${steps.length - 2} DSP stage${steps.length - 2 > 1 ? 's' : ''}`}
                </span>
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground" />

              {/* Output format */}
              <div className="flex items-center gap-2">
                <MonitorSpeaker className="w-4 h-4 text-primary" />
                <span className="font-mono text-primary font-medium">{outputStep?.format || 'PCM'} {formatSampleRate(outputStep?.sampleRate || 44100)} {outputStep?.bitDepth || 32}-bit</span>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Total latency */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-mono">{totalLatency.toFixed(1)} ms total latency</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Signal Path Chain ── */}
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-primary" /> Processing Chain
          </h2>
          <div className="space-y-0">
            {steps.map((step, i) => (
              <PathStepCard
                key={i}
                step={step}
                prevStep={i > 0 ? steps[i - 1] : undefined}
                isLast={i === steps.length - 1}
              />
            ))}
          </div>
        </div>

        {/* ── Bit-Perfect Analysis ── */}
        {!isBitPerfect && breakdownItems.length > 0 && (
          <Card className="bg-card border-signal-amber/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-signal-amber" />
                <h2 className="text-sm font-semibold text-signal-amber">Bit-Perfect Analysis</h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The signal is being modified at the following stages. To achieve a bit-perfect path,
                address each item below:
              </p>
              <div className="space-y-3">
                {breakdownItems.map((item, i) => (
                  <div key={i} className="rounded-lg bg-surface/50 p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-signal-amber shrink-0" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed pl-5.5 ml-[22px]">
                      {item.reason}
                    </p>
                    <div className="flex items-start gap-1.5 pl-5.5 ml-[22px]">
                      <Info className="w-3 h-3 text-sky-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-sky-400 leading-relaxed">{item.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Zone & Endpoint Info ── */}
        {activeZone && (
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Zone &amp; Endpoint</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Zone info */}
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Zone</p>
                  <div className="rounded-lg bg-surface/50 p-3 space-y-2">
                    <p className="text-sm font-medium">{activeZone.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">
                        {activeZone.outputFormat} · {formatSampleRate(activeZone.sampleRate)} · {activeZone.bitDepth}-bit
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${activeZone.dspEnabled ? 'text-signal-amber border-signal-amber/30' : 'text-signal-green border-signal-green/30'}`}
                      >
                        DSP {activeZone.dspEnabled ? 'On' : 'Off'}
                      </Badge>
                    </div>
                    {activeZone.dspChain && activeZone.dspChain.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {activeZone.dspChain.map((dsp, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            {dsp}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Gauge className="w-3 h-3" /> Volume: {activeZone.volume}%
                      </span>
                      <span className="font-mono">{activeZone.volumeMode}</span>
                      {activeZone.syncOffsetMs != null && (
                        <span className="font-mono">sync +{activeZone.syncOffsetMs}ms</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Endpoint info */}
                {endpoint && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Endpoint</p>
                    <div className="rounded-lg bg-surface/50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{endpoint.name}</p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${endpoint.status === 'online' ? 'text-signal-green border-signal-green/30' : 'text-signal-red border-signal-red/30'}`}
                        >
                          {endpoint.status}
                        </Badge>
                      </div>
                      {endpoint.dac && (
                        <p className="text-xs text-muted-foreground">
                          DAC: <span className="font-mono text-foreground">{endpoint.dac}</span>
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        {endpoint.clockSource && (
                          <span className="font-mono">Clock: {endpoint.clockSource}</span>
                        )}
                        {endpoint.protocol && (
                          <span className="font-mono">{endpoint.protocol}</span>
                        )}
                        {endpoint.latencyMs != null && (
                          <span className="font-mono">{endpoint.latencyMs.toFixed(1)} ms</span>
                        )}
                      </div>
                      {endpoint.ipAddress && (
                        <p className="text-[10px] text-muted-foreground font-mono">{endpoint.ipAddress}</p>
                      )}
                      {endpoint.firmware && (
                        <p className="text-[10px] text-muted-foreground">Firmware: {endpoint.firmware}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Format Capabilities ── */}
        {endpoint && (
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <MonitorSpeaker className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">DAC Capabilities</h2>
                <Badge variant="outline" className="text-[10px] font-mono ml-auto">
                  {endpoint.dac ?? 'Unknown'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Max Sample Rate */}
                <div className="rounded-lg bg-surface/50 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Max Sample Rate</p>
                  <p className="text-lg font-mono font-bold text-foreground">
                    {formatSampleRate(endpoint.maxSampleRate)}
                  </p>
                </div>

                {/* Max Bit Depth */}
                <div className="rounded-lg bg-surface/50 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Max Bit Depth</p>
                  <p className="text-lg font-mono font-bold text-foreground">
                    {endpoint.maxBitDepth}-bit
                  </p>
                </div>

                {/* DSD Support */}
                <div className="rounded-lg bg-surface/50 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">DSD</p>
                  {endpoint.supportsDSD ? (
                    <p className="text-sm font-medium text-signal-green">
                      Supported{endpoint.supportsDSD256 ? ' (DSD256)' : ''}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-muted-foreground">Not Supported</p>
                  )}
                </div>

                {/* MQA */}
                <div className="rounded-lg bg-surface/50 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">MQA</p>
                  {endpoint.supportsMQA ? (
                    <p className="text-sm font-medium text-signal-green">Supported</p>
                  ) : (
                    <p className="text-sm font-medium text-muted-foreground">Not Supported</p>
                  )}
                </div>

                {/* DoP */}
                <div className="rounded-lg bg-surface/50 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">DoP</p>
                  {endpoint.supportsDoP ? (
                    <p className="text-sm font-medium text-signal-green">Supported</p>
                  ) : (
                    <p className="text-sm font-medium text-muted-foreground">Not Supported</p>
                  )}
                </div>

                {/* Clock Source */}
                <div className="rounded-lg bg-surface/50 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Clock Source</p>
                  <p className="text-sm font-medium font-mono text-foreground">
                    {endpoint.clockSource ?? '—'}
                    {endpoint.hasMasterClock && (
                      <span className="ml-1 text-[10px] text-signal-green font-sans">(Master)</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom spacing */}
        <div className="h-4" />
      </div>
    </ScrollArea>
  );
}
