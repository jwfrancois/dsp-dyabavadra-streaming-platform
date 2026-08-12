'use client';

import React, { useState } from 'react';
import { usePlayerStore } from '@/store/player';
import { useUIStore } from '@/store/ui';
import { zones, getTrackById, formatDuration, getCoverGradient } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Speaker,
  Volume2,
  VolumeX,
  Volume1,
  Play,
  Pause,
  Plus,
  Minus,
  Link,
  Unlink,
  Wifi,
  WifiOff,
  X,
  ChevronUp,
  Zap,
} from 'lucide-react';
import { useSystemStore } from '@/store/system';

export function ZonePicker() {
  const { zonePickerOpen, setZonePickerOpen } = useUIStore();
  const { activeZoneId, setActiveZone, play, pause, isPlaying } = usePlayerStore();
  const { discoveryMode, remoteAccessEnabled } = useSystemStore();

  const [zoneVolumes, setZoneVolumes] = useState<Record<string, number>>(() => {
    const vols: Record<string, number> = {};
    zones.forEach(z => { vols[z.id] = z.volume; });
    return vols;
  });
  const [zoneMuted, setZoneMuted] = useState<Record<string, boolean>>(() => {
    const mutes: Record<string, boolean> = {};
    zones.forEach(z => { mutes[z.id] = z.isMuted; });
    return mutes;
  });
  const [zonePlaying, setZonePlaying] = useState<Record<string, boolean>>(() => {
    const playing: Record<string, boolean> = {};
    zones.forEach(z => { playing[z.id] = z.isPlaying; });
    return playing;
  });
  const [isLinked, setIsLinked] = useState(false);

  if (!zonePickerOpen) return null;

  const isOffline = discoveryMode === 'lan' && !remoteAccessEnabled;

  const getVolumeIcon = (zoneId: string) => {
    if (zoneMuted[zoneId]) return <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />;
    const vol = zoneVolumes[zoneId] ?? 0;
    if (vol === 0) return <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />;
    if (vol < 50) return <Volume1 className="w-3.5 h-3.5" />;
    return <Volume2 className="w-3.5 h-3.5" />;
  };

  const handleVolumeChange = (zoneId: string, value: number[]) => {
    const vol = value[0] ?? 0;
    setZoneVolumes(prev => ({ ...prev, [zoneId]: vol }));
    if (vol === 0) {
      setZoneMuted(prev => ({ ...prev, [zoneId]: true }));
    } else {
      setZoneMuted(prev => ({ ...prev, [zoneId]: false }));
    }
  };

  const handleToggleMute = (zoneId: string) => {
    setZoneMuted(prev => ({ ...prev, [zoneId]: !prev[zoneId] }));
  };

  const handleTogglePlay = (zoneId: string) => {
    setZonePlaying(prev => ({ ...prev, [zoneId]: !prev[zoneId] }));
  };

  const handleSelectZone = (zoneId: string) => {
    setActiveZone(zoneId);
  };

  const handleVolumeAdjust = (zoneId: string, delta: number) => {
    setZoneVolumes(prev => {
      const current = prev[zoneId] ?? 0;
      const next = Math.max(0, Math.min(100, current + delta));
      if (next === 0) setZoneMuted(m => ({ ...m, [zoneId]: true }));
      else setZoneMuted(m => ({ ...m, [zoneId]: false }));
      return { ...prev, [zoneId]: next };
    });
  };

  return (
    <div
      className="fixed bottom-24 right-4 z-50 w-80 rounded-xl shadow-2xl bg-card border border-border animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Speaker className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Zones</h3>
          {isOffline && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 gap-1">
              <WifiOff className="w-2.5 h-2.5" />
              LAN Only
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setZonePickerOpen(false)}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Zone List */}
      <div className="max-h-80 overflow-y-auto">
        {zones.map((zone, idx) => {
          const isActive = zone.id === activeZoneId;
          const track = zone.currentTrackId ? getTrackById(zone.currentTrackId) : null;
          const isZoning = zonePlaying[zone.id];
          const vol = zoneVolumes[zone.id] ?? 0;
          const muted = zoneMuted[zone.id];

          return (
            <React.Fragment key={zone.id}>
              {idx > 0 && <Separator className="opacity-50" />}
              <div
                className={`p-3 cursor-pointer transition-colors hover:bg-accent/30 ${
                  isActive ? 'border-l-2 border-l-primary bg-primary/5' : ''
                }`}
                onClick={() => handleSelectZone(zone.id)}
              >
                {/* Zone name + status */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isZoning ? 'bg-green-500' : 'bg-muted-foreground/40'
                      }`}
                    />
                    <span className="text-sm font-medium truncate">{zone.name}</span>
                    {zone.isGroup && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1">
                        <Link className="w-2.5 h-2.5 mr-0.5" />
                        Group
                      </Badge>
                    )}
                    {isLinked && !zone.isGroup && (
                      <Link className="w-3 h-3 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {zone.isOnline ? (
                      <Wifi className="w-3 h-3 text-green-500" />
                    ) : (
                      <WifiOff className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span className="text-[10px] text-muted-foreground w-7 text-right">
                      {muted ? 'Mute' : `${vol}%`}
                    </span>
                  </div>
                </div>

                {/* Currently playing track */}
                {track && isZoning && (
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-7 h-7 rounded bg-gradient-to-br ${getCoverGradient(track.id)} flex-shrink-0`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium truncate">{track.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{track.artistName}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                )}

                {/* Volume slider + controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); handleTogglePlay(zone.id); }}
                  >
                    {isZoning ? (
                      <Pause className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); handleToggleMute(zone.id); }}
                  >
                    {getVolumeIcon(zone.id)}
                  </Button>

                  <Slider
                    value={[muted ? 0 : vol]}
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1 h-6"
                    onClick={(e) => e.stopPropagation()}
                    onValueChange={(v) => handleVolumeChange(zone.id, v)}
                  />

                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={(e) => { e.stopPropagation(); handleVolumeAdjust(zone.id, -5); }}
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={(e) => { e.stopPropagation(); handleVolumeAdjust(zone.id, 5); }}
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Group Controls */}
      <Separator />
      <div className="p-3 flex items-center gap-2">
        <Button
          variant={isLinked ? 'default' : 'outline'}
          size="sm"
          className="flex-1 h-8 text-xs gap-1.5"
          onClick={() => setIsLinked(true)}
        >
          <Link className="w-3 h-3" />
          Link Zones
        </Button>
        <Button
          variant={!isLinked ? 'default' : 'outline'}
          size="sm"
          className="flex-1 h-8 text-xs gap-1.5"
          onClick={() => setIsLinked(false)}
        >
          <Unlink className="w-3 h-3" />
          Unlink
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => {
            // Expand to full zones view
            setZonePickerOpen(false);
          }}
        >
          <ChevronUp className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
