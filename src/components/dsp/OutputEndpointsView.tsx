'use client';

import React from 'react';
import { useSystemStore } from '@/store/system';
import { usePlayerStore } from '@/store/player';
import { zones, formatSampleRate, type Endpoint, type Zone } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Monitor,
  Speaker,
  Radio,
  Cpu,
  Wifi,
  WifiOff,
  HardDrive,
  Settings,
  RefreshCw,
  Power,
  PowerOff,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Usb,
  Network,
  ArrowRight,
  Zap,
  Eye,
  Volume2,
  Maximize,
} from 'lucide-react';

// ─── Helpers ───

const typeLabels: Record<Endpoint['type'], string> = {
  bridge: 'Bridge',
  'raspberry-pi': 'Raspberry Pi',
  mac: 'Mac',
  pc: 'PC',
  mobile: 'Mobile',
  'embedded-soc': 'Embedded SoC',
  'dedicated-hardware': 'Dedicated Hardware',
};

const typeIcons: Record<Endpoint['type'], React.ReactNode> = {
  bridge: <Radio className="w-3.5 h-3.5" />,
  'raspberry-pi': <Cpu className="w-3.5 h-3.5" />,
  mac: <Monitor className="w-3.5 h-3.5" />,
  pc: <Monitor className="w-3.5 h-3.5" />,
  mobile: <Wifi className="w-3.5 h-3.5" />,
  'embedded-soc': <Cpu className="w-3.5 h-3.5" />,
  'dedicated-hardware': <HardDrive className="w-3.5 h-3.5" />,
};

const protocolLabels: Record<string, string> = {
  'dsp-native': 'DSP Native',
  raat: 'RAAT',
  airplay: 'AirPlay',
  chromecast: 'Chromecast',
};

const clockLabels: Record<string, string> = {
  internal: 'Internal',
  usb: 'USB',
  spdif: 'S/PDIF',
  wordclock: 'Word Clock',
  network: 'Network',
};

const discoveryModes: Array<{ value: 'lan' | 'lan+remote' | 'vpn'; label: string }> = [
  { value: 'lan', label: 'LAN' },
  { value: 'lan+remote', label: 'LAN + Remote' },
  { value: 'vpn', label: 'VPN' },
];

function statusDot(status: Endpoint['status']) {
  const color =
    status === 'online'
      ? 'bg-signal-green'
      : status === 'standby'
        ? 'bg-signal-amber'
        : 'bg-signal-red';
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />;
}

function statusText(status: Endpoint['status']) {
  const cls =
    status === 'online'
      ? 'text-signal-green'
      : status === 'standby'
        ? 'text-signal-amber'
        : 'text-signal-red';
  return (
    <span className={`text-xs font-medium ${cls}`}>
      {status === 'online' ? 'Online' : status === 'standby' ? 'Standby' : 'Offline'}
    </span>
  );
}

function CpuBar({ usage }: { usage: number | undefined }) {
  const pct = usage ?? 0;
  const barColor =
    pct < 40 ? 'bg-signal-green' : pct < 70 ? 'bg-signal-amber' : 'bg-signal-red';
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-20 flex-shrink-0">CPU</span>
      <div className="flex-1 h-1.5 rounded-full bg-surface/80 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

function formatTime(iso: string | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function CapItem({ label, supported }: { label: string; supported: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {supported ? (
        <CheckCircle2 className="w-3 h-3 text-signal-green" />
      ) : (
        <span className="w-3 h-3 flex items-center justify-center text-muted-foreground/50">
          <span className="w-2 h-2 rounded-full border border-muted-foreground/50" />
        </span>
      )}
      <span
        className={`text-xs ${supported ? 'text-foreground' : 'text-muted-foreground/60'}`}
      >
        {label}
      </span>
    </div>
  );
}

function findZoneForEndpoint(endpointId: string): Zone | undefined {
  return zones.find((z) => z.endpoints.some((ep) => ep.id === endpointId));
}

// ─── Component ───

export function OutputEndpointsView() {
  const { isScanning, autoDiscovery, discoveryMode, scanEndpoints, toggleAutoDiscovery, setDiscoveryMode, core } =
    useSystemStore();
  const { activeZoneId, setActiveZone } = usePlayerStore();

  const allEndpoints = zones.flatMap((z) => z.endpoints);
  const groupedZones = zones.filter((z) => z.isGroup);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-6xl mx-auto">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Output Endpoints</h1>
            <Badge variant="secondary" className="text-xs">
              {allEndpoints.length} endpoint{allEndpoints.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={scanEndpoints}
            disabled={isScanning}
            className="gap-2"
          >
            {isScanning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {isScanning ? 'Scanning…' : 'Scan for Endpoints'}
          </Button>
        </div>

        {/* ─── Auto-Discovery Section ─── */}
        <Card className="mb-6 bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface/50 flex items-center justify-center">
                  <Network className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Auto-Discovery</h3>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                    Automatically detect endpoints on your network
                  </p>
                </div>
              </div>
              <Switch checked={autoDiscovery} onCheckedChange={toggleAutoDiscovery} />
            </div>

            {autoDiscovery && (
              <div className="mt-3 ml-11">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Discovery Mode</span>
                  <div className="flex gap-1">
                    {discoveryModes.map((mode) => (
                      <button
                        key={mode.value}
                        onClick={() => setDiscoveryMode(mode.value)}
                        className={`px-2.5 py-1 rounded text-[10px] uppercase tracking-wider transition-colors ${
                          discoveryMode === mode.value
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'bg-surface/50 text-muted-foreground border border-border hover:text-foreground'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Protocol</span>
                  <span className="text-[10px] font-mono text-foreground">
                    DSP Audio Protocol (Port {core.networkInfo.port})
                  </span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Discovery Port {core.networkInfo.discoveryPort}
                  </span>
                  {core.networkInfo.encryption && (
                    <>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] font-mono text-signal-green">Encrypted</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Endpoint Cards Grid ─── */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {allEndpoints.map((endpoint) => {
            const zone = findZoneForEndpoint(endpoint.id);
            return (
              <EndpointCard
                key={endpoint.id}
                endpoint={endpoint}
                zone={zone}
                isActiveZone={zone?.id === activeZoneId}
                onSelectZone={() => zone && setActiveZone(zone.id)}
              />
            );
          })}
        </div>

        {/* ─── Endpoint Group Management ─── */}
        {groupedZones.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Maximize className="w-4 h-4 text-muted-foreground" />
              Multi-Zone Groups
            </h2>
            <div className="space-y-3">
              {groupedZones.map((zone) => (
                <Card key={zone.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Speaker className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold">{zone.name}</h3>
                        <Badge variant="outline" className="text-[10px]">
                          {zone.endpoints.length} synced endpoints
                        </Badge>
                      </div>
                      {zone.syncOffsetMs !== undefined && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] font-mono text-muted-foreground">
                            Sync offset: {zone.syncOffsetMs.toFixed(1)}ms
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Sync alignment visual */}
                    <div className="flex items-center gap-1.5 mb-3">
                      {zone.endpoints.map((ep, i) => (
                        <React.Fragment key={ep.id}>
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${
                              ep.status === 'online' ? 'bg-signal-green' : ep.status === 'standby' ? 'bg-signal-amber' : 'bg-signal-red'
                            }`} />\n                            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[80px]">
                              {ep.name}
                            </span>
                          </div>
                          {i < zone.endpoints.length - 1 && (
                            <div className="flex items-center gap-0.5 mx-1">
                              <div className="w-6 h-px bg-signal-green/40" />
                              <Zap className="w-2.5 h-2.5 text-signal-green" />
                              <div className="w-6 h-px bg-signal-green/40" />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {zone.endpoints.map((ep) => (
                        <div
                          key={ep.id}
                          className="p-2 rounded bg-surface/50 border border-border"
                        >
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                            {ep.name}
                          </span>
                          <span className="text-xs font-mono text-foreground">
                            {ep.latencyMs ? `${ep.latencyMs.toFixed(1)}ms` : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Separator className="my-6 bg-border" />

        {/* ─── Network Map ─── */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Network className="w-4 h-4 text-muted-foreground" />
            Network Topology
          </h2>
          <Card className="bg-card border-border">
            <CardContent className="p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                <span className="text-foreground font-semibold text-xs">
                  {core.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ({core.networkInfo.ipAddress}:{core.networkInfo.port})
                </span>
              </div>
              <div className="ml-1.5 border-l border-border pl-3 space-y-1">
                {allEndpoints.map((ep) => {
                  const zone = findZoneForEndpoint(ep.id);
                  const isOnline = ep.status === 'online';
                  return (
                    <div key={ep.id} className="flex items-center gap-2">
                      <span className="text-muted-foreground/50">├─</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isOnline ? 'bg-signal-green' : ep.status === 'standby' ? 'bg-signal-amber' : 'bg-signal-red'
                      }`} />\n                      <span className={isOnline ? 'text-foreground' : 'text-muted-foreground/60'}>
                        {ep.name}
                      </span>
                      {ep.ipAddress && (
                        <span className="text-muted-foreground/50">
                          ({ep.ipAddress})
                        </span>
                      )}
                      {ep.latencyMs !== undefined && isOnline && (
                        <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/40" />
                      )}
                      {ep.latencyMs !== undefined && isOnline && (
                        <span className={
                          ep.latencyMs < 3
                            ? 'text-signal-green'
                            : ep.latencyMs < 5
                              ? 'text-signal-amber'
                              : 'text-signal-red'
                        }>
                          {ep.latencyMs.toFixed(1)}ms
                        </span>
                      )}
                      {zone && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          {zone.name}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}

// ─── Endpoint Card Sub-Component ───

function EndpointCard({
  endpoint,
  zone,
  isActiveZone,
  onSelectZone,
}: {
  endpoint: Endpoint;
  zone: Zone | undefined;
  isActiveZone: boolean;
  onSelectZone: () => void;
}) {
  const isOnline = endpoint.status === 'online';

  return (
    <Card
      className={`bg-card border-border transition-colors ${
        isActiveZone ? 'ring-1 ring-primary/40' : ''
      }`}
    >
      <CardContent className="p-4 space-y-3">
        {/* Row 1: Status, Name, Type, Protocol, Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {statusDot(endpoint.status)}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold truncate">{endpoint.name}</span>
                <Badge variant="secondary" className="text-[10px] gap-1">
                  {typeIcons[endpoint.type]}
                  {typeLabels[endpoint.type]}
                </Badge>
                {endpoint.protocol && (
                  <Badge variant="outline" className="text-[10px]">
                    {protocolLabels[endpoint.protocol] ?? endpoint.protocol}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {statusText(endpoint.status)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isOnline ? (
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Power className="w-3.5 h-3.5 text-signal-green" />
              </Button>
            ) : endpoint.status === 'standby' ? (
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <PowerOff className="w-3.5 h-3.5 text-signal-amber" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
                <AlertTriangle className="w-3.5 h-3.5 text-signal-red" />
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={onSelectZone}>
              <Eye className="w-3 h-3" />
              Select
            </Button>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Row 2: Status Details */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {endpoint.ipAddress && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">IP Address</span>
              <p className="text-xs font-mono text-foreground">{endpoint.ipAddress}</p>
            </div>
          )}
          {endpoint.macAddress && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">MAC Address</span>
              <p className="text-xs font-mono text-foreground">{endpoint.macAddress}</p>
            </div>
          )}
          {endpoint.firmware && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Firmware</span>
              <p className="text-xs font-mono text-foreground">{endpoint.firmware}</p>
            </div>
          )}
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Last Seen</span>
            <p className="text-xs font-mono text-foreground flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              {formatTime(endpoint.lastSeen)}
            </p>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Row 3: Performance */}
        <div className="space-y-1.5">
          <CpuBar usage={endpoint.cpuUsage} />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Buffer</span>
              <span className="text-xs font-mono text-foreground">
                {endpoint.bufferDepth ?? '—'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Latency</span>
              <span className="text-xs font-mono text-foreground">
                {endpoint.latencyMs !== undefined ? `${endpoint.latencyMs.toFixed(1)}ms` : '—'}
              </span>
            </div>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Row 4: DAC Capabilities */}
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">
            DAC Capabilities
          </span>
          {endpoint.dac && (
            <p className="text-sm font-bold text-foreground mb-2">{endpoint.dac}</p>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Max Sample Rate</span>
              <p className="text-xs font-mono text-foreground">
                {formatSampleRate(endpoint.maxSampleRate)}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Max Bit Depth</span>
              <p className="text-xs font-mono text-foreground">
                {endpoint.maxBitDepth}-bit
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <CapItem label="DSD" supported={endpoint.supportsDSD} />
            <CapItem label="DSD256" supported={endpoint.supportsDSD256} />
            <CapItem label="MQA" supported={endpoint.supportsMQA} />
            <CapItem label="DoP" supported={endpoint.supportsDoP} />
          </div>
          <div className="flex items-center gap-3 mt-2">
            {endpoint.clockSource && (
              <div className="flex items-center gap-1.5">
                {endpoint.clockSource === 'usb' ? (
                  <Usb className="w-3 h-3 text-muted-foreground" />
                ) : endpoint.clockSource === 'network' ? (
                  <Network className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <Settings className="w-3 h-3 text-muted-foreground" />
                )}
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Clock
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {clockLabels[endpoint.clockSource] ?? endpoint.clockSource}
                </Badge>
              </div>
            )}
            {endpoint.hasMasterClock && (
              <Badge className="text-[10px] bg-primary/20 text-primary border border-primary/30">
                <Zap className="w-2.5 h-2.5 mr-1" />
                Master Clock
              </Badge>
            )}
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Row 5: Zone Assignment */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Zone</span>
            {zone ? (
              <Badge
                variant={isActiveZone ? 'default' : 'outline'}
                className="text-[10px]"
              >
                {zone.name}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">Unassigned</span>
            )}
          </div>
          {zone?.isGroup && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Maximize className="w-2.5 h-2.5" />
              Grouped
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
