'use client';

import React from 'react';
import { useSystemStore } from '@/store/system';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Server, Database, HardDrive, Cpu, MemoryStick, Wifi, WifiOff,
  Shield, ShieldCheck, Globe, Monitor, Smartphone, Tablet, Computer,
  RefreshCw, Power, Activity, Network, Radio, Clock, AlertTriangle,
  CheckCircle2, Download, Upload, Eye, Settings, Music,
} from 'lucide-react';
import type {
  CoreStatus, StorageLocationInfo, RemoteAppInfo, StreamingServiceInfo,
} from '@/lib/data';

// ─── Helpers ───

function formatBytes(bytes: number): string {
  if (bytes >= 1099511627776) return (bytes / 1099511627776).toFixed(1) + ' TB';
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  return bytes.toLocaleString() + ' B';
}

function formatUptime(s: number): string {
  return Math.floor(s / 86400) + 'd ' + Math.floor((s % 86400) / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm';
}

function usageColor(pct: number): string {
  if (pct < 60) return 'bg-signal-green';
  if (pct < 80) return 'bg-signal-amber';
  return 'bg-signal-red';
}

function UsageBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${usageColor(pct)}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-xs text-muted-foreground w-12 text-right">
        {label ?? `${Math.round(pct)}%`}
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {children}
      </span>
      <Separator className="flex-1" />
    </div>
  );
}

function StorageIcon({ type }: { type: StorageLocationInfo['type'] }) {
  switch (type) {
    case 'nas': return <Network className="h-4 w-4 text-blue-400" />;
    case 'usb': return <HardDrive className="h-4 w-4 text-purple-400" />;
    default: return <Database className="h-4 w-4 text-muted-foreground" />;
  }
}

function RemoteAppIcon({ type }: { type: RemoteAppInfo['type'] }) {
  switch (type) {
    case 'ios': return <Smartphone className="h-4 w-4" />;
    case 'android': return <Smartphone className="h-4 w-4" />;
    case 'desktop': return <Computer className="h-4 w-4" />;
    case 'web': return <Monitor className="h-4 w-4" />;
    default: return <Monitor className="h-4 w-4" />;
  }
}

function formatTimeAgo(iso?: string): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Main Component ───

export function SystemArchitectureView() {
  const coreStatus = useSystemStore((s) => s.coreStatus);

  if (!coreStatus) {
    return (
      <div className="max-w-6xl mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="text-sm">Loading system architecture…</span>
        </div>
      </div>
    );
  }

  const { machineInfo, audioEngine, storageLocations, networkInfo, apiInfo, streamingServices, libraryStats } = coreStatus;
  const memPct = (machineInfo.memoryUsed / machineInfo.memoryTotal) * 100;

  const statusConfig: Record<string, { label: string; color: string; bgClass: string }> = {
    running: { label: 'Online', color: 'text-signal-green', bgClass: 'bg-signal-green/15 text-signal-green border-signal-green/30' },
    starting: { label: 'Starting', color: 'text-signal-amber', bgClass: 'bg-signal-amber/15 text-signal-amber border-signal-amber/30' },
    stopping: { label: 'Stopping', color: 'text-signal-amber', bgClass: 'bg-signal-amber/15 text-signal-amber border-signal-amber/30' },
    error: { label: 'Error', color: 'text-signal-red', bgClass: 'bg-signal-red/15 text-signal-red border-signal-red/30' },
  };

  const st = statusConfig[coreStatus.status] ?? statusConfig.error;

  return (
    <ScrollArea className="h-full">
      <div className="max-w-6xl mx-auto p-6 space-y-6">

        {/* ── 1. Core Server Status ── */}
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <SectionLabel>Core Server Status</SectionLabel>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-surface/50 p-3">
                  <Server className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{coreStatus.name}</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <Badge variant="outline" className={`text-[10px] px-2 py-0 border ${st.bgClass}`}>
                      {coreStatus.status === 'running' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {coreStatus.status === 'starting' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                      {coreStatus.status === 'error' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {st.label}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">v{coreStatus.version}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono text-xs text-muted-foreground">
                      Uptime: {formatUptime(coreStatus.uptime)}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                <Power className="h-3.5 w-3.5" />
                Reboot
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── 2. Machine Info ── */}
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <SectionLabel>Machine Info</SectionLabel>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{machineInfo.cpuModel}</span>
                </div>
                <div className="text-xs text-muted-foreground ml-6">{machineInfo.cores} cores · {machineInfo.architecture}</div>
                <div className="ml-6">
                  <UsageBar value={machineInfo.cpuUsage} />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    Memory{' '}
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatBytes(machineInfo.memoryUsed)} / {formatBytes(machineInfo.memoryTotal)}
                    </span>
                  </span>
                </div>
                <div className="ml-6">
                  <UsageBar value={memPct} />
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span className="font-mono">{machineInfo.os}</span>
            </div>
          </CardContent>
        </Card>

        {/* ── 3. Audio Engine ── */}
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <SectionLabel>Audio Engine</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left: status + zones + sample rate */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground capitalize">{audioEngine.status}</span>
                  <span className="text-xs text-muted-foreground">
                    {audioEngine.activeZones}/{audioEngine.totalZones} zones active
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Radio className="h-3.5 w-3.5" />
                  Current sample rate:{' '}
                  <span className="font-mono text-foreground">
                    {audioEngine.currentSampleRate >= 1000
                      ? `${(audioEngine.currentSampleRate / 1000).toFixed(1)} kHz`
                      : `${audioEngine.currentSampleRate} Hz`}
                  </span>
                </div>
                {/* Capabilities */}
                <div className="flex flex-wrap gap-2 mt-1">
                  {audioEngine.bitPerfectCapable && (
                    <Badge variant="outline" className="gap-1 bg-signal-green/10 border-signal-green/20 text-signal-green text-[10px] px-2 py-0">
                      <CheckCircle2 className="h-3 w-3" /> Bit-Perfect
                    </Badge>
                  )}
                  {audioEngine.dsdNativeCapable && (
                    <Badge variant="outline" className="gap-1 bg-signal-green/10 border-signal-green/20 text-signal-green text-[10px] px-2 py-0">
                      <CheckCircle2 className="h-3 w-3" /> DSD Native
                    </Badge>
                  )}
                  {audioEngine.mqaPassthrough && (
                    <Badge variant="outline" className="gap-1 bg-signal-green/10 border-signal-green/20 text-signal-green text-[10px] px-2 py-0">
                      <CheckCircle2 className="h-3 w-3" /> MQA Passthrough
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] px-2 py-0 text-muted-foreground">
                    Max {audioEngine.maxChannels}ch
                  </Badge>
                </div>
              </div>
              {/* Right: load bars + formats */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Decoding</span>
                  <UsageBar value={audioEngine.decodingLoad} />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">DSP</span>
                  <UsageBar value={audioEngine.dspLoad} />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Output</span>
                  <UsageBar value={audioEngine.outputLoad} />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {audioEngine.supportedFormats.map((f) => (
                    <span key={f} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface/50 text-muted-foreground border border-border">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 4. Storage Locations ── */}
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <SectionLabel>Storage Locations</SectionLabel>
            <div className="space-y-3">
              {storageLocations.map((loc) => {
                const usedPct = (loc.usedSpace / loc.totalSpace) * 100;
                return (
                  <div key={loc.id} className="rounded-lg bg-surface/50 border border-border p-4 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <StorageIcon type={loc.type} />
                        <div>
                          <div className="text-sm font-medium text-foreground">{loc.name}</div>
                          <div className="font-mono text-[11px] text-muted-foreground mt-0.5">{loc.path}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {loc.isWatching ? (
                          <Badge variant="outline" className="gap-1 bg-signal-green/10 border-signal-green/20 text-signal-green text-[10px] px-2 py-0">
                            <Eye className="h-3 w-3" /> Watching
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-2 py-0 text-muted-foreground border-border">
                            Paused
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] px-2 py-0 text-muted-foreground border-border uppercase">
                          {loc.type}
                        </Badge>
                      </div>
                    </div>
                    <UsageBar value={usedPct} label={`${formatBytes(loc.usedSpace)} / ${formatBytes(loc.totalSpace)}`} />
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                      <span>{loc.trackCount.toLocaleString()} tracks</span>
                      <span>{loc.albumCount.toLocaleString()} albums</span>
                      <span className="flex items-center gap-1 ml-auto">
                        <Clock className="h-3 w-3" />
                        Last scan: {formatTimeAgo(loc.lastScan)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── 5. Network Protocol ── */}
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <SectionLabel>Network Protocol</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm text-foreground capitalize">{networkInfo.protocol}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">Port</span>
                    <div className="font-mono text-foreground">{networkInfo.port}</div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">Discovery Port</span>
                    <div className="font-mono text-foreground">{networkInfo.discoveryPort}</div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">IP Address</span>
                    <div className="font-mono text-foreground">{networkInfo.ipAddress}</div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground">MAC</span>
                    <div className="font-mono text-foreground">{networkInfo.macAddress}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    {networkInfo.encryption ? <ShieldCheck className="h-4 w-4 text-signal-green" /> : <Shield className="h-4 w-4 text-muted-foreground" />}
                    Encryption
                  </div>
                  <Switch checked={networkInfo.encryption} disabled />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    {networkInfo.remoteAccess ? <Wifi className="h-4 w-4 text-signal-green" /> : <WifiOff className="h-4 w-4 text-muted-foreground" />}
                    Remote Access
                  </div>
                  <Switch checked={networkInfo.remoteAccess} disabled />
                </div>
                <Separator />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Connected Endpoints</span>
                  <span className="font-mono text-foreground">{networkInfo.connectedEndpoints}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Discovery Mode</span>
                  <span className="font-mono text-foreground uppercase">{coreStatus.discoveryMode}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 6. Remote Control Apps ── */}
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <SectionLabel>Remote Control Apps</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {apiInfo.remoteApps.map((app) => (
                <div key={app.id} className="rounded-lg bg-surface/50 border border-border p-3.5 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-md bg-white/5 p-2">
                      <RemoteAppIcon type={app.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground truncate">{app.name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{app.ipAddress}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${app.connected ? 'bg-signal-green' : 'bg-muted-foreground/40'}`} />
                    {app.connected ? (
                      <span className="text-[11px] text-signal-green">Connected</span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        Last seen: {formatTimeAgo(app.lastSeen)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── 7. Streaming Services ── */}
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <SectionLabel>Streaming Services</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {streamingServices.map((svc) => (
                <div
                  key={svc.id}
                  className={`rounded-lg border p-4 space-y-2.5 ${
                    svc.status === 'connected'
                      ? 'bg-surface/50 border-signal-green/20'
                      : 'bg-surface/50 border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${svc.status === 'connected' ? 'bg-signal-green' : 'bg-muted-foreground/40'}`} />
                      <span className="text-sm font-medium text-foreground">{svc.name}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-0 border ${
                        svc.status === 'connected'
                          ? 'bg-signal-green/10 text-signal-green border-signal-green/30'
                          : 'text-muted-foreground border-border'
                      }`}
                    >
                      {svc.status === 'connected' ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  {svc.status === 'connected' && (
                    <div className="space-y-1 text-[11px] text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Quality Tier</span>
                        <span className="font-mono text-foreground">{svc.qualityTier}</span>
                      </div>
                      {svc.maxQuality && (
                        <div className="flex justify-between">
                          <span>Max Quality</span>
                          <span className="font-mono text-foreground">{svc.maxQuality}</span>
                        </div>
                      )}
                      {svc.librarySize != null && (
                        <div className="flex justify-between">
                          <span>Library Size</span>
                          <span className="font-mono text-foreground">{svc.librarySize.toLocaleString()} tracks</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Last Sync</span>
                        <span className="font-mono text-foreground">{formatTimeAgo(svc.lastSync)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── 8. Library Stats ── */}
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <SectionLabel>Library Stats</SectionLabel>
            {/* Summary row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
              {[
                { label: 'Total Tracks', value: libraryStats.totalTracks.toLocaleString(), icon: <Music className="h-4 w-4" /> },
                { label: 'Albums', value: libraryStats.totalAlbums.toLocaleString(), icon: <Database className="h-4 w-4" /> },
                { label: 'Artists', value: libraryStats.totalArtists.toLocaleString(), icon: <Eye className="h-4 w-4" /> },
                { label: 'Total Duration', value: formatUptime(libraryStats.totalDuration), icon: <Clock className="h-4 w-4" /> },
                { label: 'Total Size', value: formatBytes(libraryStats.totalSize), icon: <HardDrive className="h-4 w-4" /> },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-surface/50 border border-border p-3 text-center space-y-1">
                  <div className="flex justify-center text-muted-foreground">{item.icon}</div>
                  <div className="font-mono text-lg font-semibold text-foreground">{item.value}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Format breakdown */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Format Breakdown</span>
              <div className="space-y-2">
                {Object.entries(libraryStats.formatBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([format, count]) => {
                    const pct = (count / libraryStats.totalTracks) * 100;
                    return (
                      <div key={format} className="flex items-center gap-3">
                        <span className="font-mono text-xs text-muted-foreground w-10 text-right">{format}</span>
                        <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground w-16 text-right">
                          {count.toLocaleString()}{' '}
                          <span className="text-muted-foreground/60">({pct.toFixed(1)}%)</span>
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Sample rate breakdown */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Sample Rate Breakdown</span>
              <div className="space-y-2">
                {Object.entries(libraryStats.sampleRateBreakdown)
                  .sort(([,a], [,b]) => b - a)
                  .map(([rate, count]) => {
                    const pct = (count / libraryStats.totalTracks) * 100;
                    return (
                      <div key={rate} className="flex items-center gap-3">
                        <span className="font-mono text-xs text-muted-foreground w-16 text-right">{rate}</span>
                        <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-primary/40 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground w-16 text-right">
                          {count.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

          </CardContent>
        </Card>

      </div>
    </ScrollArea>
  );
}
