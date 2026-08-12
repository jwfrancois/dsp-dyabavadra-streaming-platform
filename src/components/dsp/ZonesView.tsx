'use client';

import React from 'react';
import { usePlayerStore } from '@/store/player';
import { zones, getTrackById, formatSampleRate, getCoverGradient } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Speaker, Volume2, VolumeX, Volume1, Play, Pause, SkipForward,
  Power, Settings, Link, Unlink, Wifi, WifiOff, Gauge, Zap,
} from 'lucide-react';

export function ZonesView() {
  const { activeZoneId, setActiveZone, isPlaying } = usePlayerStore();

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Zones</h1>
          <Badge variant="secondary" className="text-xs">
            {zones.filter(z => z.isPlaying).length} active
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {zones.map(zone => {
            const isActive = zone.id === activeZoneId;
            const currentTrack = zone.currentTrackId ? getTrackById(zone.currentTrackId) : null;

            return (
              <Card
                key={zone.id}
                className={`bg-card border-2 transition-all cursor-pointer ${
                  isActive ? 'border-primary shadow-lg shadow-primary/10' : 'border-border hover:border-muted-foreground/30'
                }`}
                onClick={() => setActiveZone(zone.id)}
              >
                <CardContent className="p-4">
                  {/* Zone Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        zone.isPlaying ? 'bg-primary/10' : 'bg-surface'
                      }`}>
                        <Speaker className={`w-5 h-5 ${zone.isPlaying ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{zone.name}</h3>
                          {zone.isGroup && (
                            <Badge variant="outline" className="text-[10px]">
                              <Link className="w-2.5 h-2.5 mr-0.5" /> Group
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {zone.isOnline ? (
                            <Wifi className="w-3 h-3 text-signal-green" />
                          ) : (
                            <WifiOff className="w-3 h-3 text-signal-red" />
                          )}
                          <span className="text-[11px] text-muted-foreground">
                            {zone.endpoints.length} endpoint{zone.endpoints.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {zone.isPlaying ? (
                        <Badge className="text-[10px] bg-signal-green text-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-white mr-1 signal-active" /> Playing
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Idle</Badge>
                      )}
                    </div>
                  </div>

                  {/* Now Playing in Zone */}
                  {currentTrack && (
                    <div className="mb-3 p-2.5 rounded-lg bg-surface/50 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded bg-gradient-to-br ${getCoverGradient(currentTrack.id)}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{currentTrack.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{currentTrack.artistName}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono flex-shrink-0">
                        {zone.outputFormat} {formatSampleRate(zone.sampleRate)}
                      </Badge>
                    </div>
                  )}

                  {/* Volume */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {zone.isMuted || zone.volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-muted-foreground" />
                      ) : zone.volume < 50 ? (
                        <Volume1 className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Slider
                      value={[zone.volume]}
                      min={0}
                      max={100}
                      step={1}
                      className="flex-1"
                      onValueChange={() => {}}
                    />
                    <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
                      {zone.volume}%
                    </span>
                  </div>

                  {/* Endpoints */}
                  <div className="mt-3 space-y-1.5">
                    {zone.endpoints.map(ep => (
                      <div key={ep.id} className="flex items-center justify-between p-2 rounded bg-surface/30">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            ep.status === 'online' ? 'bg-signal-green' : ep.status === 'standby' ? 'bg-signal-amber' : 'bg-signal-red'
                          }`} />
                          <span className="text-xs">{ep.name}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {ep.dac && <span>{ep.dac}</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DSP */}
                  {zone.dspEnabled && zone.dspChain && zone.dspChain.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <Zap className="w-3 h-3 text-primary" />
                      {zone.dspChain.map(dsp => (
                        <Badge key={dsp} variant="secondary" className="text-[10px]">{dsp}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
