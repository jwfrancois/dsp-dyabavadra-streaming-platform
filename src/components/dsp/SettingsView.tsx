'use client';

import React from 'react';
import { zones, tracks, formatSampleRate } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Settings, Database, Server, HardDrive, Cloud, Wifi,
  Music, Headphones, Globe, Shield, RefreshCw,
} from 'lucide-react';

export function SettingsView() {
  const [localMode, setLocalMode] = React.useState(true);
  const [gapless, setGapless] = React.useState(true);
  const [bitPerfect, setBitPerfect] = React.useState(true);
  const [autoRescan, setAutoRescan] = React.useState(true);
  const [streamingLinked, setStreamingLinked] = React.useState(true);

  const storageLocations = [
    { name: 'Music Library (NAS)', path: '/nas/music', size: '2.4 TB', tracks: 12450, icon: HardDrive },
    { name: 'Local SSD Cache', path: '/local/music', size: '256 GB', tracks: 3200, icon: Database },
    { name: 'External Drive', path: '/Volumes/External', size: '1.2 TB', tracks: 8900, icon: HardDrive },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Settings className="w-6 h-6" /> Settings
        </h1>

        {/* Core Status */}
        <Card className="bg-card border-border mb-4">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" /> Core Status
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-2 rounded bg-surface/50">
                <span className="text-xs text-muted-foreground">Status</span>
                <Badge className="text-[10px] bg-signal-green text-white">Online</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface/50">
                <span className="text-xs text-muted-foreground">Uptime</span>
                <span className="text-xs font-mono">14d 7h 32m</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface/50">
                <span className="text-xs text-muted-foreground">Database</span>
                <span className="text-xs font-mono">24,550 tracks</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface/50">
                <span className="text-xs text-muted-foreground">Memory</span>
                <span className="text-xs font-mono">1.2 GB / 8 GB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audio Settings */}
        <Card className="bg-card border-border mb-4">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Headphones className="w-4 h-4 text-primary" /> Audio
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Bit-Perfect Playback', desc: 'Pass audio to DAC without resampling', value: bitPerfect, onChange: setBitPerfect },
                { label: 'Gapless Playback', desc: 'Seamless transitions between tracks', value: gapless, onChange: setGapless },
                { label: 'Local-Only Mode', desc: 'Disable streaming, play local files only', value: localMode, onChange: setLocalMode },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch checked={item.value} onCheckedChange={item.onChange} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card className="bg-card border-border mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" /> Storage Locations
              </h2>
              <Button variant="outline" size="sm" className="text-xs">
                <RefreshCw className="w-3 h-3 mr-1" /> Rescan All
              </Button>
            </div>
            <div className="space-y-2">
              {storageLocations.map(loc => (
                <div key={loc.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface/50">
                  <loc.icon className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{loc.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{loc.path}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium">{loc.tracks.toLocaleString()} tracks</p>
                    <p className="text-[11px] text-muted-foreground">{loc.size}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <div>
                <p className="text-sm font-medium">Auto-Rescan</p>
                <p className="text-xs text-muted-foreground">Watch folders for changes</p>
              </div>
              <Switch checked={autoRescan} onCheckedChange={setAutoRescan} />
            </div>
          </CardContent>
        </Card>

        {/* Streaming Services */}
        <Card className="bg-card border-border mb-4">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-primary" /> Streaming Services
            </h2>
            <div className="space-y-2">
              {[
                { name: 'TIDAL', status: 'Linked', quality: 'HiRes FLAC (24/96)', color: 'bg-blue-600' },
                { name: 'Qobuz', status: 'Not Linked', quality: '—', color: 'bg-orange-600' },
              ].map(service => (
                <div key={service.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface/50">
                  <div className={`w-8 h-8 rounded ${service.color} flex items-center justify-center`}>
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground">{service.quality}</p>
                  </div>
                  <Badge
                    variant={service.status === 'Linked' ? 'default' : 'outline'}
                    className={service.status === 'Linked' ? 'text-[10px] bg-signal-green text-white' : 'text-[10px]'}
                  >
                    {service.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Network */}
        <Card className="bg-card border-border mb-4">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-primary" /> Network
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded bg-surface/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Protocol</p>
                <p className="text-sm font-medium">DSP Audio Protocol</p>
              </div>
              <div className="p-2 rounded bg-surface/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Latency</p>
                <p className="text-sm font-medium font-mono">&lt; 2ms</p>
              </div>
              <div className="p-2 rounded bg-surface/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Zones</p>
                <p className="text-sm font-medium">{zones.filter(z => z.isPlaying).length} / {zones.length}</p>
              </div>
              <div className="p-2 rounded bg-surface/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sync Status</p>
                <p className="text-sm font-medium text-signal-green">Locked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
