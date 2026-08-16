'use client';

import React, { useCallback, useMemo } from 'react';
import { usePlayerStore } from '@/store/player';
import { useUIStore } from '@/store/ui';
import { usePodcastStore } from '@/store/podcast';
import { useLocalLibraryStore } from '@/store/local-library';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDuration, getCoverGradient, formatSampleRate } from '@/lib/data';
import { formatEpisodeDuration } from '@/lib/podcast-data';
import {
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Volume1, ListMusic, Heart,
  Gauge, Podcast, FastForward, Scissors, Moon,
  Radio, Square, Loader2,
} from 'lucide-react';
import { audioSeekTo, audioSetPlaybackSpeed } from './AudioEngineProvider';
import { useProfilesStore } from '@/store/profiles';

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
  const toggleLoveTrack = useProfilesStore(s => s.toggleLoveTrack);
  const isTrackLoved = useProfilesStore(s => s.isTrackLoved);
  const localTracks = useLocalLibraryStore(s => s.tracks);
  const activeZone = activeZoneId ? {
    id: activeZoneId,
    name: activeZoneId === 'zone-1' ? 'Main Listening Room' : activeZoneId === 'zone-2' ? 'Study' : `Zone ${activeZoneId}`,
    endpoints: [{ dac: 'ESS Sabre ES9038Q2M' }],
    dspEnabled: false,
    dspChain: [],
  } : null;

  const playbackMode = usePlayerStore(s => s.playbackMode);
  const isBuffering = usePlayerStore(s => s.isBuffering);
  const currentRadioStationId = usePlayerStore(s => s.currentRadioStationId);
  const stopRadio = usePlayerStore(s => s.stopRadio);

  // Resolve cover art for the current track
  const currentTrackCover = useMemo(() => {
    if (!currentTrack) return null;
    const lt = localTracks.find(t => t.id === currentTrack.id);
    if (lt?.coverArt) return lt.coverArt;
    // Check sibling tracks in the same album
    const siblings = localTracks.filter(t => t.album === currentTrack.albumName && (t.artist === currentTrack.artistName || t.albumArtist === currentTrack.artistName));
    for (const s of siblings) {
      if (s.coverArt) return s.coverArt;
    }
    return null;
  }, [currentTrack, localTracks]);

  const handleProgressChange = useCallback((value: number[]) => {
    audioSeekTo(value[0]);
    seek(value[0]);
  }, [seek]);

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0]);
  }, [setVolume]);

  // Determine what we're showing — use playbackMode from player store as authoritative source
  const showingPodcast = playbackMode === 'podcast' && isPodcastMode && !!currentEpisode;
  const showingRadio = playbackMode === 'radio' && !!currentTrack;
  const showingMusic = playbackMode === 'music' && !!currentTrack && !showingPodcast && !showingRadio;
  if (!showingPodcast && !showingRadio && !showingMusic) return null;

  // ── RADIO MODE ──
  if (showingRadio && currentTrack) {
    return (
      <div className="h-20 border-t border-border bg-card flex items-center px-4 gap-4">
        <div className="flex items-center gap-3 w-64 flex-shrink-0">
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Radio className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{currentTrack.title}</p>
            <p className="text-xs text-muted-foreground truncate">{currentTrack.albumName}</p>
          </div>
          <Badge className="text-[9px] bg-red-500/20 text-red-400 border-red-500/30 h-5 px-1.5 gap-1 flex-shrink-0 animate-pulse">
            <Radio className="w-3 h-3" /> LIVE
          </Badge>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            {isBuffering && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={stopRadio}>
              <Square className="w-4 h-4" />
            </Button>
            <Button variant="default" size="icon" className="h-9 w-9 rounded-full" onClick={togglePlay}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </Button>
          </div>
          <div className="flex items-center gap-2 w-full">
            <span className="text-[11px] text-muted-foreground w-full text-center">{isBuffering ? 'Buffering...' : 'Live Stream'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 w-64 justify-end flex-shrink-0">
          <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">{currentTrack.bitrate}kbps</Badge>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : volume < 50 ? <Volume1 className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-muted-foreground" />}
            </Button>
            <Slider value={[isMuted ? 0 : volume]} min={0} max={100} step={1} onValueChange={handleVolumeChange} className="w-20" />
          </div>
          {activeZone && <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground" onClick={() => navigate('zones')}><Gauge className="w-3.5 h-3.5" /><span className="hidden sm:inline">{activeZone.name}</span></Button>}
          <Button variant={queueDrawerOpen ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={toggleQueueDrawer}><ListMusic className="w-4 h-4" /></Button>
        </div>
      </div>
    );
  }

  // Podcast mode
  if (showingPodcast) {
    const ep = currentEpisode;
    const show = ep.showId ? { title: ep.showId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) } : null;
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
            <Button
              variant={skipSilence ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => usePodcastStore.getState().toggleSkipSilence()}
              title="Skip Silence"
            >
              <Scissors className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={previous}>
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button variant="default" size="icon" className="h-9 w-9 rounded-full" onClick={togglePlay}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={next}>
              <SkipForward className="w-4 h-4" />
            </Button>
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => usePodcastStore.getState().stopPodcast()}
              title="Stop"
            >
              <Square className="w-4 h-4" />
            </Button>
          </div>
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
          {sleepTimerMinutes !== null && (
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-1 text-signal-amber border-signal-amber/30">
              <Moon className="w-3 h-3" /> {sleepTimerMinutes}m
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">{ep.format}</Badge>
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
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground" onClick={() => navigate('zones')}>
              <Gauge className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{activeZone.name}</span>
            </Button>
          )}
          <Button variant={queueDrawerOpen ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={toggleQueueDrawer}>
            <ListMusic className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ── MUSIC MODE ──
  const dur = usePlayerStore.getState().duration || currentTrack!.duration;
  const trackProgress = dur > 0 ? (currentTime / dur) * 100 : 0;

  return (
    <div className="h-20 border-t border-border bg-card flex items-center px-4 gap-4">
      {/* Left: Track Info with real cover art */}
      <div className="flex items-center gap-3 w-64 flex-shrink-0">
        <div
          className="w-12 h-12 rounded-md bg-gradient-to-br flex-shrink-0 cursor-pointer cover-art-hover relative overflow-hidden shadow-sm"
          onClick={() => navigate('album-detail', { albumId: currentTrack!.albumId })}
        >
          {/* Show real cover art if available */}
          {currentTrackCover ? (
            <img src={currentTrackCover} alt={currentTrack!.albumName} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${getCoverGradient(currentTrack!.id)}`} />
          )}
          {/* Subtle shine */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none" />
        </div>
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
            if (currentTrack) toggleLoveTrack(currentTrack.id);
          }}
        >
          <Heart
            className={`w-4 h-4 ${currentTrack && isTrackLoved(currentTrack.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
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
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={previous}>
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button variant="default" size="icon" className="h-9 w-9 rounded-full" onClick={togglePlay}>
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={next}>
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
            {formatDuration(dur > 0 ? dur : currentTrack!.duration)}
          </span>
        </div>
      </div>

      {/* Right: Volume, Zone, Queue */}
      <div className="flex items-center gap-2 w-64 justify-end flex-shrink-0">
        {/* Audio quality badge — Hi-Res / Lossless / DSD */}
        {(() => {
          const t = currentTrack!;
          const isDSD = ['DSF', 'DFF', 'DSD'].includes(t.format.toUpperCase());
          const isHiRes = t.sampleRate > 48000 || t.bitDepth > 16;
          const isLossless = ['FLAC', 'WAV', 'AIFF', 'ALAC', 'DSF', 'DFF', 'WavPack', 'APE', 'TAK'].includes(t.format.toUpperCase());
          if (isDSD) return <Badge className="text-[9px] bg-purple-500/20 text-purple-400 border-purple-500/30 h-5 px-1.5">DSD {t.sampleRate/1000 > 0 ? `${(t.sampleRate/1000).toFixed(1)}MHz` : ''}</Badge>;
          if (isHiRes && isLossless) return <Badge className="text-[9px] bg-primary/20 text-primary border-primary/30 h-5 px-1.5">Hi-Res</Badge>;
          if (isLossless) return <Badge className="text-[9px] bg-signal-green/20 text-signal-green border-signal-green/30 h-5 px-1.5">Lossless</Badge>;
          return <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">{t.format}</Badge>;
        })()}
        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
          {formatSampleRate(currentTrack!.sampleRate)}/{currentTrack!.bitDepth}bit
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
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground" onClick={() => navigate('zones')}>
            <Gauge className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{activeZone.name}</span>
          </Button>
        )}
        <Button variant={queueDrawerOpen ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={toggleQueueDrawer}>
          <ListMusic className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
