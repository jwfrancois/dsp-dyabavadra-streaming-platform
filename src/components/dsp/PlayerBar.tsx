'use client';

import React, { useCallback } from 'react';
import { usePlayerStore } from '@/store/player';
import { useUIStore } from '@/store/ui';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { zones } from '@/lib/data';
import { formatDuration, getCoverGradient, formatSampleRate } from '@/lib/data';
import {
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Volume1, ChevronUp, ListMusic, Heart,
  Maximize2, Gauge,
} from 'lucide-react';

export function PlayerBar() {
  const {
    isPlaying, currentTrack, queue, queueIndex, activeZoneId,
    progress, currentTime, volume, isShuffle, repeatMode, isMuted,
    togglePlay, next, previous, seek, setVolume, toggleMute,
    toggleShuffle, toggleRepeat, setActiveZone,
  } = usePlayerStore();
  const { navigate, toggleQueueDrawer, queueDrawerOpen } = useUIStore();
  const activeZone = zones.find(z => z.id === activeZoneId);

  const handleProgressChange = useCallback((value: number[]) => {
    seek(value[0]);
  }, [seek]);

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0]);
  }, [setVolume]);

  if (!currentTrack) return null;

  const trackProgress = (currentTime / currentTrack.duration) * 100;

  return (
    <div className="h-20 border-t border-border bg-card flex items-center px-4 gap-4">
      {/* Left: Track Info */}
      <div className="flex items-center gap-3 w-64 flex-shrink-0">
        <div
          className={`w-12 h-12 rounded-md bg-gradient-to-br ${getCoverGradient(currentTrack.id)} flex-shrink-0 cursor-pointer cover-art-hover`}
          onClick={() => navigate('album-detail', { albumId: currentTrack.albumId })}
        />
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-medium truncate cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate('now-playing')}
          >
            {currentTrack.title}
          </p>
          <p
            className="text-xs text-muted-foreground truncate cursor-pointer hover:text-foreground transition-colors"
            onClick={() => navigate('artist-detail', { artistId: currentTrack.artistId })}
          >
            {currentTrack.artistName} · {currentTrack.albumName}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Heart
            className={`w-4 h-4 ${currentTrack.loved ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
          />
        </Button>
      </div>

      {/* Center: Controls & Progress */}
      <div className="flex-1 flex flex-col items-center gap-1 max-w-2xl mx-auto">
        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${isShuffle ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={toggleShuffle}
          >
            <Shuffle className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={previous}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={next}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${repeatMode !== 'off' ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={toggleRepeat}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 w-full">
          <span className="text-[11px] text-muted-foreground w-10 text-right tabular-nums">
            {formatDuration(currentTime)}
          </span>
          <Slider
            value={[trackProgress]}
            min={0}
            max={100}
            step={0.1}
            onValueChange={handleProgressChange}
            className="flex-1 cursor-pointer [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
          />
          <span className="text-[11px] text-muted-foreground w-10 tabular-nums">
            {formatDuration(currentTrack.duration)}
          </span>
        </div>
      </div>

      {/* Right: Volume, Zone, Queue */}
      <div className="flex items-center gap-2 w-64 justify-end flex-shrink-0">
        {/* Format Badge */}
        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
          {currentTrack.format}
        </Badge>
        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
          {formatSampleRate(currentTrack.sampleRate)}
        </Badge>

        {/* Volume */}
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            ) : volume < 50 ? (
              <Volume1 className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            min={0}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="w-20"
          />
        </div>

        {/* Zone Indicator */}
        {activeZone && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground"
            onClick={() => navigate('zones')}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{activeZone.name}</span>
          </Button>
        )}

        {/* Queue Toggle */}
        <Button
          variant={queueDrawerOpen ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={toggleQueueDrawer}
        >
          <ListMusic className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
