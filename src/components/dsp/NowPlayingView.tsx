'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { usePodcastStore } from '@/store/podcast';
import { podcastShows, formatEpisodeDuration } from '@/lib/podcast-data';
import { tracks, zones, getSignalPath, formatDuration, formatSampleRate, getCoverGradient } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Volume1, Heart, ListMusic, Share2,
  ArrowLeft, ChevronRight, Gauge, Zap, CheckCircle2, AlertCircle,
  Radio, Disc3, Maximize2,
} from 'lucide-react';

export function NowPlayingView() {
  const {
    isPlaying, currentTrack, queue, queueIndex, activeZoneId,
    progress, currentTime, duration, volume, isShuffle, repeatMode, isMuted,
    togglePlay, next, previous, seek, setVolume, toggleMute,
    toggleShuffle, toggleRepeat, setActiveZone, playbackMode,
  } = usePlayerStore();
  const { navigate } = useUIStore();
  const { isPodcastMode, currentEpisode, playbackSpeed, cyclePlaybackSpeed } = usePodcastStore();
  const activeZone = zones.find(z => z.id === activeZoneId);
  const signalPath = currentTrack ? getSignalPath(currentTrack.id, activeZoneId) : [];
  const isBitPerfect = signalPath.length > 0 && signalPath.every(s => s.isBitPerfect);

  // Podcast mode rendering
  if (isPodcastMode && currentEpisode) {
    const show = podcastShows.find(s => s.id === currentEpisode.showId);
    const dur = duration > 0 ? duration : currentEpisode.duration;
    const prog = dur > 0 ? (currentTime / dur) * 100 : 0;

    return (
      <ScrollArea className="h-full">
        <div className="max-w-5xl mx-auto p-6">
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" onClick={() => navigate('home')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Cover Art */}
            <div className="flex-shrink-0">
              <div className={`w-56 h-56 rounded-xl bg-gradient-to-br ${getCoverGradient(currentEpisode.showId)} shadow-lg`} />
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Podcast Episode</p>
              <h1 className="text-2xl font-bold mb-1">{currentEpisode.title}</h1>
              <p className="text-sm text-muted-foreground mb-4">{show?.title}</p>

              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className="text-xs">{currentEpisode.format}</Badge>
                <Badge variant="outline" className="text-xs">{formatEpisodeDuration(currentEpisode.duration)}</Badge>
                <Button
                  variant="secondary" size="sm" className="h-7 text-xs font-mono"
                  onClick={cyclePlaybackSpeed}
                >
                  {playbackSpeed}x
                </Button>
              </div>

              <div className="flex items-center gap-2 w-full max-w-lg">
                <span className="text-xs text-muted-foreground w-12 text-right tabular-nums">{formatDuration(currentTime)}</span>
                <Slider value={[prog]} min={0} max={100} step={0.1} onValueChange={(v) => seek(v[0])} className="flex-1" />
                <span className="text-xs text-muted-foreground w-16 tabular-nums">{formatEpisodeDuration(currentEpisode.duration)}</span>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground" onClick={previous}>
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button variant="default" size="icon" className="h-12 w-12 rounded-full" onClick={togglePlay}>
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground" onClick={next}>
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>

          <Separator className="my-8" />

          {/* Volume & Zone */}
          <div className="flex items-center justify-center gap-4">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : volume < 50 ? <Volume1 className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-muted-foreground" />}
            </Button>
            <Slider value={[isMuted ? 0 : volume]} min={0} max={100} step={1} onValueChange={(v) => setVolume(v[0])} className="w-40" />
            {activeZone && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground" onClick={() => navigate('zones')}>
                <Gauge className="w-3.5 h-3.5" /> {activeZone.name}
              </Button>
            )}
          </div>
        </div>
      </ScrollArea>
    );
  }

  if (!currentTrack) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <ListMusic className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Nothing playing</p>
          <p className="text-sm">Select a track to start listening</p>
        </div>
      </div>
    );
  }

  const albumTracks = tracks.filter(t => t.albumId === currentTrack.albumId && t.id !== currentTrack.id).slice(0, 5);

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" onClick={() => navigate('home')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="grid md:grid-cols-[1fr_1fr] gap-8">
          {/* Left: Cover Art & Info */}
          <div className="flex flex-col items-center">
            <div className={`w-72 h-72 lg:w-80 lg:h-80 rounded-2xl bg-gradient-to-br ${getCoverGradient(currentTrack.id)} shadow-2xl cover-art-hover relative overflow-hidden`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_70%)]" />
            </div>

            <div className="text-center mt-6 w-full max-w-sm">
              <h1 className="text-2xl font-bold mb-1">{currentTrack.title}</h1>
              <p
                className="text-lg text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                onClick={() => navigate('artist-detail', { artistId: currentTrack.artistId })}
              >
                {currentTrack.artistName}
              </p>
              <p
                className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => navigate('album-detail', { albumId: currentTrack.albumId })}
              >
                {currentTrack.albumName}
              </p>

              {/* Credits */}
              {currentTrack.performers.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
                  {currentTrack.performers.map((p, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">
                      {p.name} — {p.instrument || p.role}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Full Controls */}
            <div className="w-full max-w-md mt-8 space-y-4">
              {/* Progress */}
              <div className="space-y-1">
                <Slider
                  value={[progress]}
                  min={0}
                  max={100}
                  step={0.1}
                  onValueChange={(v) => seek(v[0])}
                  className="w-full cursor-pointer [&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(currentTrack.duration)}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-center gap-4">
                <Button variant="ghost" size="icon" className={`h-10 w-10 ${isShuffle ? 'text-primary' : 'text-muted-foreground'}`} onClick={toggleShuffle}>
                  <Shuffle className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground" onClick={previous}>
                  <SkipBack className="w-5 h-5" />
                </Button>
                <Button variant="default" size="icon" className="h-14 w-14 rounded-full shadow-xl" onClick={togglePlay}>
                  {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground" onClick={next}>
                  <SkipForward className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className={`h-10 w-10 ${repeatMode !== 'off' ? 'text-primary' : 'text-muted-foreground'}`} onClick={toggleRepeat}>
                  {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                </Button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-3 justify-center">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : volume < 50 ? <Volume1 className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-muted-foreground" />}
                </Button>
                <Slider value={[isMuted ? 0 : volume]} min={0} max={100} step={1} onValueChange={(v) => setVolume(v[0])} className="w-40" />
                <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{volume}%</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground">
                  <Heart className={`w-4 h-4 ${currentTrack.loved ? 'fill-red-500 text-red-500' : ''}`} />
                  {currentTrack.loved ? 'Loved' : 'Love'}
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground">
                  <Radio className="w-4 h-4" /> Radio
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground">
                  <Share2 className="w-4 h-4" /> Share
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Signal Path & Info */}
          <div className="space-y-6">
            {/* Signal Path */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-primary" /> Signal Path
                  </h3>
                  {isBitPerfect ? (
                    <Badge className="text-[10px] bg-signal-green text-white"><CheckCircle2 className="w-3 h-3 mr-0.5" /> Bit-Perfect</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-signal-amber"><AlertCircle className="w-3 h-3 mr-0.5" /> Processing</Badge>
                  )}
                </div>

                {/* Signal path chain */}
                <div className="space-y-2">
                  {signalPath.map((step, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-surface/50">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.isBitPerfect ? 'bg-signal-green/10' : 'bg-signal-amber/10'}`}>
                          {step.isBitPerfect ? (
                            <CheckCircle2 className="w-4 h-4 text-signal-green" />
                          ) : (
                            <Zap className="w-4 h-4 text-signal-amber" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{step.label}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {step.format} · {formatSampleRate(step.sampleRate)} · {step.bitDepth}-bit
                          </p>
                        </div>
                      </div>
                      {i < signalPath.length - 1 && (
                        <div className="flex items-center justify-center py-0.5">
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Technical Info */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Disc3 className="w-4 h-4 text-muted-foreground" /> Technical Details
                </h3>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  {[
                    { label: 'Codec', value: currentTrack.format },
                    { label: 'Sample Rate', value: formatSampleRate(currentTrack.sampleRate) },
                    { label: 'Bit Depth', value: `${currentTrack.bitDepth}-bit` },
                    { label: 'Channels', value: `${currentTrack.channels}-ch` },
                    { label: 'Bitrate', value: `${(currentTrack.bitrate / 1000).toFixed(0)} kbps` },
                    { label: 'File Size', value: `${(currentTrack.fileSize / 1048576).toFixed(1)} MB` },
                    { label: 'Source', value: currentTrack.source === 'local' ? 'Local' : currentTrack.source === 'tidal' ? 'TIDAL' : 'Qobuz' },
                    { label: 'Duration', value: formatDuration(currentTrack.duration) },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-mono font-medium">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Zone Info */}
            {activeZone && (
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-primary" /> {activeZone.name}
                    </h3>
                    <Badge variant="outline" className="text-[10px]">
                      {activeZone.endpoints[0]?.dac || 'Unknown DAC'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {activeZone.dspEnabled && activeZone.dspChain && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">DSP Chain</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {activeZone.dspChain.map(dsp => (
                            <Badge key={dsp} variant="secondary" className="text-[10px]">{dsp}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Up Next */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <ListMusic className="w-4 h-4 text-muted-foreground" /> Up Next
                </h3>
                <div className="space-y-1">
                  {queue.slice(queueIndex + 1, queueIndex + 6).map(track => (
                    <div key={track.id} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-accent/30 cursor-pointer" onClick={() => usePlayerStore.getState().play(track)}>
                      <div className={`w-8 h-8 rounded bg-gradient-to-br ${getCoverGradient(track.id)}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{track.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{track.artistName}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{formatDuration(track.duration)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
