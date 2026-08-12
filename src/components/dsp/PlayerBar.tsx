'use client';

import React, { useCallback } from 'react';
import { usePlayerStore } from '@/store/player';
import { useUIStore } from '@/store/ui';
import { usePodcastStore } from '@/store/podcast';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { zones } from '@/lib/data';
import { formatDuration, getCoverGradient, formatSampleRate } from '@/lib/data';
import { podcastShows, formatEpisodeDuration } from '@/lib/podcast-data';
import {
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Volume1, ChevronUp, ListMusic, Heart,
  Maximize2, Gauge, Podcast, FastForward, Scissors, Moon,
} from 'lucide-react';

export function PlayerBar() {
  const {
    isPlaying, currentTrack, queue, queueIndex, activeZoneId,
    progress, currentTime, volume, isShuffle, repeatMode, isMuted,
    togglePlay, next, previous, seek, setVolume, toggleMute,
    toggleShuffle, toggleRepeat, setActiveZone,
  } = usePlayerStore();
  const { navigate, toggleQueueDrawer, queueDrawerOpen } = useUIStore();
  const {
    isPodcastMode, currentEpisode, playbackSpeed,
    cyclePlaybackSpeed, skipSilence, sleepTimerMinutes,
  } = usePodcastStore();
  const activeZone = zones.find(z => z.id === activeZoneId);

  const handleProgressChange = useCallback((value: number[]) => {
    seek(value[0]);
  }, [seek]);

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0]);
  }, [setVolume]);

  // Determine what we're showing
  const showingPodcast = isPodcastMode && currentEpisode;
  const showingMusic = currentTrack && !showingPodcast;
  if (!showingPodcast && !showingMusic) return null;

  // Podcast mode: derive display values from episode
  if (showingPodcast) {
    const ep = currentEpisode;
    const show = podcastShows.find(s => s.id === ep.showId);
    const epProgress = ep.duration > 0 ? (currentTime / ep.duration) * 100 : 0;

    return (
      <div className="h-20 border-t border-border bg-card flex items-center px-4 gap-4">
        {/* Left: Episode Info */}
        <div className="flex items-center gap-3 w-64 flex-shrink-0">
          <div
            className={`w-12 h-12 rounded-md bg-gradient-to-br ${getCoverGradient(ep.showId)} flex-shrink-0 cursor-pointer cover-art-hover`}
            onClick={() => navigate('podcast-detail', { showId: ep.showId })}
          />
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-medium truncate cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate('now-playing')}
            >
              {ep.title}
            </p>
            <p
              className="text-xs text-muted-foreground truncate cursor-pointer hover:text-foreground transition-colors"
              onClick={() => navigate('podcast-detail', { showId: ep.showId })}
            >
              {show?.title}
            </p>
          </div>
          <Badge className="text-[9px] bg-primary/20 text-primary border-primary/30 h-5 px-1.5 gap-1 flex-shrink-0">
            <Podcast className="w-3 h-3" /> Podcast
          </Badge>
        </div>

        {/* Center: Controls & Progress */}
        <div className="flex-1 flex flex-col items-center gap-1 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            {/* Skip Silence toggle */}
            <Button
              variant={skipSilence ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => usePodcastStore.getState().toggleSkipSilence()}
              title="Skip Silence"
            >
              <Scissors className="w-3.5 h-3.5" />
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
            {/* Speed control */}
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-xs font-mono min-w-[44px] px-1.5 justify-center gap-0.5"
              onClick={cyclePlaybackSpeed}
              title={`Playback Speed: ${playbackSpeed}x`}
            >
              <FastForward className="w-3 h-3" />
              {playbackSpeed}x
            </Button>
          </div>
          {/* Progress */}
          <div className="flex items-center gap-2 w-full">
            <span className="text-[11px] text-muted-foreground w-10 text-right tabular-nums">
              {formatDuration(currentTime)}
            </span>
            <Slider
              value={[epProgress]}
              min={0}
              max={100}
              step={0.1}
              onValueChange={handleProgressChange}
              className="flex-1 cursor-pointer [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
            />
            <span className="text-[11px] text-muted-foreground w-16 tabular-nums">
              {formatEpisodeDuration(ep.duration)}
            </span>
          </div>
        </div>

        {/* Right: Sleep Timer, Volume, Zone, Queue */}
        <div className="flex items-center gap-2 w-64 justify-end flex-shrink-0">
          {/* Sleep Timer */}
          {sleepTimerMinutes !== null && (
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-1 text-signal-amber border-signal-amber/30">
              <Moon className="w-3 h-3" /> {sleepTimerMinutes}m
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
            {ep.format}
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

  // Music mode: existing behavior
  const trackProgress = (currentTime / currentTrack!.duration) * 100;

  return (
    <div className="h-20 border-t border-border bg-card flex items-center px-4 gap-4">
      {/* Left: Track Info */}
      <div className="flex items-center gap-3 w-64 flex-shrink-0">
        <div
          className={`w-12 h-12 rounded-md bg-gradient-to-br ${getCoverGradient(currentTrack!.id)} flex-shrink-0 cursor-pointer cover-art-hover`}
          onClick={() => navigate('album-detail', { albumId: currentTrack!.albumId })}
        />
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-medium truncate cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate('now-playing')}
          >
            {currentTrack!.title}
          </p>
          <p
            className="text-xs text-muted-foreground truncate cursor-pointer hover:text-foreground transition-colors"
            onClick={() => navigate('artist-detail', { artistId: currentTrack!.artistId })}
          >
            {currentTrack!.artistName} · {currentTrack!.albumName}
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
            className={`w-4 h-4 ${currentTrack!.loved ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
          />
        </Button>
      </div>

      {/* Center: Controls & Progress */}
      <div className="flex-1 flex flex-col items-center gap-1 max-w-2xl mx-auto">
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
            {formatDuration(currentTrack!.duration)}
          </span>
        </div>
      </div>

      {/* Right: Volume, Zone, Queue */}
      <div className="flex items-center gap-2 w-64 justify-end flex-shrink-0">
        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
          {currentTrack!.format}
        </Badge>
        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
          {formatSampleRate(currentTrack!.sampleRate)}
        </Badge>
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
