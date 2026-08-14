'use client';

import React from 'react';
import { useSystemStore } from '@/store/system';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  Shield,
  Gauge,
  Clock,
  Zap,
  Database,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Server,
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function barColor(pct: number): string {
  if (pct < 60) return 'bg-emerald-500';
  if (pct < 80) return 'bg-amber-500';
  return 'bg-red-500';
}

function barBgColor(pct: number): string {
  if (pct < 60) return 'bg-emerald-500/20';
  if (pct < 80) return 'bg-amber-500/20';
  return 'bg-red-500/20';
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1099511627776) return `${(bytes / 1099511627776).toFixed(1)} TB`;
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatShortBytes(bytes: number): string {
  const gb = bytes / 1073741824;
  return `${gb.toFixed(1)} GB`;
}

function pctBar(label: string, value: number, unit = '%') {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-mono font-medium ${value < 60 ? 'text-emerald-400' : value < 80 ? 'text-amber-400' : 'text-red-400'}`}>
          {value}{unit}
        </span>
      </div>
      <div className={`h-2 rounded-full ${barBgColor(value)}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor(value)}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ─── Section Card Wrapper ─────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  const IconComp = icon;
  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <IconComp className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <Separator />
        <div className="space-y-3">{children}</div>
      </CardContent>
    </Card>
  );
}

// ─── Metric Row ───────────────────────────────────────────────────────────────

function MetricRow({
  icon,
  label,
  value,
  badge,
  mono,
}: {
  icon?: React.ElementType;
  label: string;
  value: React.ReactNode;
  badge?: React.ReactNode;
  mono?: boolean;
}) {
  const IconComp = icon;
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {IconComp && <IconComp className="w-3.5 h-3.5" />}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs ${mono ? 'font-mono' : ''}`}>
          {value}
        </span>
        {badge}
      </div>
    </div>
  );
}

// ─── Static System Log Data ───────────────────────────────────────────────────

const systemLogs = [
  { time: '14:32:05', message: 'Library scan complete: 3 new tracks found', level: 'info' as const },
  { time: '14:28:17', message: 'Zone sync recalibrated', level: 'info' as const },
  { time: '14:15:00', message: 'TIDAL library synced', level: 'info' as const },
  { time: '13:45:22', message: 'Metadata fetch queue cleared', level: 'info' as const },
  { time: '12:00:00', message: 'Search index rebuilt (0.8s)', level: 'info' as const },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function SystemHealthView() {
  const core = useSystemStore(s => s.core);

  const cpuUsage = core.machineInfo?.cpuUsage ?? coreStatus.machineInfo.cpuUsage;
  const memUsed = core.machineInfo?.memoryUsed ?? coreStatus.machineInfo.memoryUsed;
  const memTotal = core.machineInfo?.memoryTotal ?? coreStatus.machineInfo.memoryTotal;
  const memPct = Math.round((memUsed / memTotal) * 100);
  const memHeadroom = ((memTotal - memUsed) / 1073741824).toFixed(1);

  const audioEngine = core.audioEngine ?? coreStatus.audioEngine;
  const storageLocations = core.storageLocations ?? coreStatus.storageLocations;
  const libraryStats = core.libraryStats ?? coreStatus.libraryStats;
  const uptime = core.uptime ?? coreStatus.uptime;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">System Health</h1>
            <p className="text-xs text-muted-foreground">NFR Monitoring Dashboard</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ─── 1. Performance Monitoring ────────────────────────────────────── */}
        <SectionCard icon={Gauge} title="Performance Monitoring">
          {/* CPU */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Cpu className="w-3.5 h-3.5" />
                <span>CPU Usage</span>
              </div>
              <span className={`font-mono font-medium ${cpuUsage < 60 ? 'text-emerald-400' : cpuUsage < 80 ? 'text-amber-400' : 'text-red-400'}`}>
                {cpuUsage}%
              </span>
            </div>
            <div className={`h-2.5 rounded-full ${barBgColor(cpuUsage)}`}>
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor(cpuUsage)}`}
                style={{ width: `${cpuUsage}%` }}
              />
            </div>
          </div>

          {/* Memory */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MemoryStick className="w-3.5 h-3.5" />
                <span>Memory Usage</span>
              </div>
              <span className={`font-mono font-medium ${memPct < 60 ? 'text-emerald-400' : memPct < 80 ? 'text-amber-400' : 'text-red-400'}`}>
                {formatShortBytes(memUsed)} / {formatShortBytes(memTotal)} GB
              </span>
            </div>
            <div className={`h-2.5 rounded-full ${barBgColor(memPct)}`}>
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor(memPct)}`}
                style={{ width: `${memPct}%` }}
              />
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Audio Engine Load */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Zap className="w-3.5 h-3.5" />
              <span className="font-medium text-foreground/80">Audio Engine Load</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {pctBar('Decoding', audioEngine.decodingLoad)}
              {pctBar('DSP', audioEngine.dspLoad)}
              {pctBar('Output', audioEngine.outputLoad)}
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* DB Query Performance */}
          <MetricRow
            icon={Database}
            label="DB Query Performance"
            value="Sub-100ms"
            badge={<Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] h-5">Optimal</Badge>}
          />

          {/* Search Index */}
          <MetricRow
            icon={Server}
            label="Search Index"
            value=""
            badge={
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] h-5">Indexed</Badge>
                <span className="text-[10px] text-muted-foreground font-mono">Rebuilt 2h ago</span>
              </div>
            }
          />

          {/* Library Scan */}
          <MetricRow
            icon={HardDrive}
            label="Library Scan"
            value=""
            badge={
              <Badge className="bg-muted text-muted-foreground border-border text-[10px] h-5">
                Idle
              </Badge>
            }
          />
        </SectionCard>

        {/* ─── 2. Reliability Monitoring ────────────────────────────────────── */}
        <SectionCard icon={Shield} title="Reliability Monitoring">
          {/* Uptime */}
          <MetricRow
            icon={Clock}
            label="Core Uptime"
            value={formatUptime(uptime)}
            badge={
              <Badge variant="outline" className="text-[10px] h-5 font-mono">
                0 restarts
              </Badge>
            }
          />

          <Separator className="opacity-50" />

          {/* Buffer Health per Zone */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Activity className="w-3.5 h-3.5" />
              <span className="font-medium text-foreground/80">Buffer Health</span>
            </div>
            <div className="space-y-1.5">
              {[
                { zone: 'Listening Room', depth: 2.4 },
                { zone: 'Kitchen', depth: 1.8 },
                { zone: 'Study', depth: 3.1 },
              ].map(z => (
                <div key={z.zone} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{z.zone}</span>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-mono">Healthy</span>
                    <span className="text-muted-foreground font-mono text-[10px]">{z.depth}s buffer</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Zone Sync Status */}
          <MetricRow
            icon={Wifi}
            label="Zone Sync"
            value=""
            badge={
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] h-5">Locked</Badge>
                <span className="text-[10px] text-muted-foreground font-mono">Phase &lt; 2ms</span>
              </div>
            }
          />

          {/* Auto-Recovery */}
          <MetricRow
            icon={RefreshCw}
            label="Auto-Recovery"
            value=""
            badge={
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] h-5">Enabled</Badge>
                <span className="text-[10px] text-muted-foreground font-mono">Last event: 14d ago</span>
              </div>
            }
          />

          {/* Crash Count */}
          <MetricRow
            icon={AlertTriangle}
            label="Crash Count"
            value=""
            badge={
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] h-5">
                0 crashes in 14d
              </Badge>
            }
          />

          <Separator className="opacity-50" />

          {/* Network Stability */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Wifi className="w-3.5 h-3.5" />
              <span className="font-medium text-foreground/80">Network Stability</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface/50 p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">Packet Loss</p>
                <p className="font-mono text-xs text-emerald-400">0.00%</p>
              </div>
              <div className="rounded-lg bg-surface/50 p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">Jitter</p>
                <p className="font-mono text-xs text-emerald-400">&lt; 0.5ms</p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ─── 3. Scalability Status ───────────────────────────────────────── */}
        <SectionCard icon={TrendingUp} title="Scalability Status">
          {/* Library Size vs Limit */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Database className="w-3.5 h-3.5" />
                <span>Library Size</span>
              </div>
              <span className="font-mono text-emerald-400 font-medium">
                {libraryStats.totalTracks.toLocaleString()} / 100,000 tracks
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-emerald-500/20">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${(libraryStats.totalTracks / 100000) * 100}%` }}
              />
            </div>
          </div>

          {/* Active Zones */}
          <MetricRow
            icon={Server}
            label="Active Zones"
            value=""
            mono
            badge={
              <span className="font-mono text-xs">
                {audioEngine.activeZones} / {audioEngine.totalZones} supported
              </span>
            }
          />

          {/* Concurrent Streams */}
          <MetricRow
            icon={Wifi}
            label="Concurrent Streams"
            value=""
            mono
            badge={
              <span className="font-mono text-xs">
                {audioEngine.activeZones} / 20
              </span>
            }
          />

          {/* Database Size */}
          <MetricRow
            icon={HardDrive}
            label="Database Size"
            value=""
            badge={
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">2.4 GB</span>
                <span className="text-[10px] text-muted-foreground">(+120 MB/week)</span>
              </div>
            }
          />

          <Separator className="opacity-50" />

          {/* Storage Capacity */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <HardDrive className="w-3.5 h-3.5" />
              <span className="font-medium text-foreground/80">Storage Capacity</span>
            </div>
            <div className="space-y-2">
              {storageLocations.map(loc => {
                const usedPct = Math.round((loc.usedSpace / loc.totalSpace) * 100);
                return (
                  <div key={loc.id} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground truncate">{loc.name}</span>
                      <span className={`font-mono ${usedPct < 60 ? 'text-emerald-400' : usedPct < 80 ? 'text-amber-400' : 'text-red-400'}`}>
                        {formatBytes(loc.usedSpace)} / {formatBytes(loc.totalSpace)} ({usedPct}%)
                      </span>
                    </div>
                    <div className={`h-1.5 rounded-full ${barBgColor(usedPct)}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${barColor(usedPct)}`}
                        style={{ width: `${usedPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Memory Headroom */}
          <MetricRow
            icon={MemoryStick}
            label="Memory Headroom"
            value=""
            badge={
              <span className="font-mono text-xs text-emerald-400">{memHeadroom} GB available</span>
            }
          />
        </SectionCard>

        {/* ─── 4. Background Tasks ────────────────────────────────────────── */}
        <SectionCard icon={Clock} title="Background Tasks">
          <MetricRow
            icon={Database}
            label="Metadata Fetch Queue"
            value=""
            badge={
              <span className="font-mono text-xs text-emerald-400">0 pending</span>
            }
          />

          <MetricRow
            icon={HardDrive}
            label="Library Scan"
            value=""
            badge={
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="font-mono text-xs">Complete (last: 6h ago)</span>
              </div>
            }
          />

          <MetricRow
            icon={Wifi}
            label="Streaming Sync"
            value=""
            badge={
              <span className="font-mono text-xs text-muted-foreground">Last sync: 2h ago</span>
            }
          />

          <Separator className="opacity-50" />

          {/* Backup */}
          <MetricRow
            icon={Shield}
            label="Backup Status"
            value=""
            badge={
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <div className="text-right">
                  <p className="font-mono text-xs">Last backup: 1d ago</p>
                  <p className="text-[10px] text-muted-foreground">Next: auto</p>
                </div>
              </div>
            }
          />
        </SectionCard>
      </div>

      {/* ─── 5. System Logs ────────────────────────────────────────────────── */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Server className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold">System Logs</h3>
            <Badge variant="outline" className="text-[10px] h-5 ml-auto">Last 5 entries</Badge>
          </div>
          <Separator />
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-0">
              {systemLogs.map((log, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 py-2.5 text-xs group"
                >
                  <span className="font-mono text-muted-foreground shrink-0 w-16 tabular-nums">
                    {log.time}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      {log.message}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
