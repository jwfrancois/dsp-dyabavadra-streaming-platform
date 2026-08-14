'use client';

import React, { useMemo } from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { usePodcastStore } from '@/store/podcast';
import { useLocalLibraryStore } from '@/store/local-library';
import { formatEpisodeDuration } from '@/lib/podcast-data';
import { formatDuration, formatSampleRate, formatFileSize, getCoverGradient } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { useLyrics, useArtistBio, useArtistImage, useAlbumInfo } from '@/lib/use-music-metadata';
import {
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Volume1, Heart, ListMusic, Share2,
  ArrowLeft, Gauge, AlertCircle, Music,
  Radio, Disc3, ExternalLink, Image as ImageIcon,
  User, Mic2, Clock, Waves,
} from 'lucide-react';
import { useProfilesStore } from '@/store/profiles';

export function NowPlayingView() {
  const {
    isPlaying, currentTrack, queue, queueIndex, activeZoneId,
    progress, currentTime, duration, volume, isShuffle, repeatMode, isMuted,
    togglePlay, next, previous, seek, setVolume, toggleMute,
    toggleShuffle, toggleRepeat, setActiveZone, playbackMode,
  } = usePlayerStore();
  const { navigate } = useUIStore();
  const { isPodcastMode, currentEpisode, playbackSpeed, cyclePlaybackSpeed } = usePodcastStore();
  const toggleLoveTrack = useProfilesStore(s => s.toggleLoveTrack);
  const isTrackLoved = useProfilesStore(s => s.isTrackLoved);
  const localTracks = useLocalLibraryStore(s => s.tracks);

  // Fetch rich metadata for the current track
  const { data: lyricsData, loading: lyricsLoading } = useLyrics(currentTrack?.artistName || '', currentTrack?.title || '');
  const { data: artistBio, loading: bioLoading } = useArtistBio(currentTrack?.artistName || '');
  const { data: artistImage, loading: artistImageLoading } = useArtistImage(currentTrack?.artistName || '');
  const { data: albumInfoData, loading: albumInfoLoading } = useAlbumInfo(currentTrack?.artistName || '', currentTrack?.albumName || '');

  // Look up cover art from local library for the current track
  const trackCoverArt = useMemo(() => {
    if (!currentTrack) return null;
    // Check if currentTrack has blobUrl or if we can find cover from local library
    const localTrack = localTracks.find(t => t.id === currentTrack.id);
    if (localTrack?.coverArt) return localTrack.coverArt;
    // Check other tracks in the same album for cover art
    const albumTracks = localTracks.filter(t => t.album === currentTrack.albumName && (t.artist === currentTrack.artistName || t.albumArtist === currentTrack.artistName));
    for (const at of albumTracks) {
      if (at.coverArt) return at.coverArt;
    }
    return null;
  }, [currentTrack, localTracks]);

  const activeZone = activeZoneId ? {
    id: activeZoneId,
    name: activeZoneId === 'zone-1' ? 'Main Listening Room' : activeZoneId === 'zone-2' ? 'Study' : `Zone ${activeZoneId}`,
    endpoints: [{ dac: 'ESS Sabre ES9038Q2M' }],
    dspEnabled: false,
    dspChain: [],
  } : null;

  // ── Dynamic background gradient derived from the cover art ──
  const bgGradient = useMemo(() => {
    if (!currentTrack) return 'from-zinc-950 via-zinc-900 to-zinc-950';
    return `from-zinc-950 via-zinc-900 to-zinc-950`;
  }, [currentTrack]);

  // Podcast mode rendering
  if (isPodcastMode && currentEpisode) {
    const show = currentEpisode ? { title: currentEpisode.showId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) } : null;
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

  return (
    <div className={`h-full bg-gradient-to-b ${bgGradient}`}>
      <ScrollArea className="h-full">
        <div className="max-w-6xl mx-auto p-6 pb-32">
          {/* Back button */}
          <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground hover:text-foreground" onClick={() => navigate('home')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          {/* ── HERO: Large Album Cover + Track Info ── */}
          <div className="flex flex-col md:flex-row gap-8 mb-10">
            {/* Album Cover — Large */}
            <div className="flex-shrink-0 self-center">
              <div className={`w-72 h-72 lg:w-80 lg:h-80 rounded-2xl bg-gradient-to-br ${getCoverGradient(currentTrack.id)} shadow-2xl relative overflow-hidden group`}>
                {/* Show real cover art if available */}
                {trackCoverArt ? (
                  <img
                    src={trackCoverArt}
                    alt={currentTrack.albumName}
                    className="w-full h-full object-cover"
                  />
                ) : null}
                {/* Shine overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),transparent_70%)] pointer-events-none" />
                {/* Vinyl peek effect */}
                <div className="absolute -bottom-2 -right-2 w-48 h-48 rounded-full bg-zinc-900 border border-zinc-800 shadow-xl transition-transform duration-700 group-hover:translate-x-4 opacity-0 group-hover:opacity-80">
                  <div className="absolute inset-[20%] rounded-full border border-zinc-700/40" />
                  <div className="absolute inset-[35%] rounded-full border border-zinc-700/30" />
                  <div className="absolute inset-[48%] rounded-full bg-zinc-800 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-zinc-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Track Info + Controls — stacked vertically */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="text-center md:text-left w-full max-w-md md:max-w-none">
                {/* Format badges */}
                <div className="flex items-center gap-2 mb-3 justify-center md:justify-start">
                  <Badge variant="outline" className="text-[10px] font-mono bg-primary/5 border-primary/20">
                    <Waves className="w-3 h-3 mr-1" /> {currentTrack.format}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {formatSampleRate(currentTrack.sampleRate)}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {currentTrack.bitDepth}-bit
                  </Badge>
                  {currentTrack.channels === 1 && <Badge variant="outline" className="text-[10px]">Mono</Badge>}
                </div>

                {/* Title */}
                <h1 className="text-3xl lg:text-4xl font-bold mb-2 leading-tight">{currentTrack.title}</h1>

                {/* Artist — clickable */}
                <p
                  className="text-lg text-muted-foreground hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  onClick={() => navigate('artist-detail', { artistId: currentTrack.artistId })}
                >
                  {currentTrack.artistName}
                </p>

                {/* Album — clickable */}
                <p
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer inline-flex items-center gap-1"
                  onClick={() => navigate('album-detail', { albumId: currentTrack.albumId })}
                >
                  <Disc3 className="w-3.5 h-3.5" /> {currentTrack.albumName}
                  {currentTrack.trackNumber > 0 && <span className="ml-1 text-muted-foreground/60">· Track {currentTrack.trackNumber}</span>}
                </p>

                {/* Performer credits */}
                {currentTrack.performers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 justify-center md:justify-start">
                    {currentTrack.performers.map((p, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">
                        <Mic2 className="w-2.5 h-2.5 mr-0.5" /> {p.name} — {p.instrument || p.role}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Composer */}
                {currentTrack.composers.length > 0 && (
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Composer: {currentTrack.composers.join(', ')}
                  </p>
                )}
              </div>

              {/* Full Controls */}
              <div className="w-full max-w-md md:max-w-lg mt-8 space-y-4 self-center md:self-start">
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

                {/* Transport Buttons */}
                <div className="flex items-center justify-center gap-4">
                  <Button variant="ghost" size="icon" className={`h-10 w-10 ${isShuffle ? 'text-primary' : 'text-muted-foreground'}`} onClick={toggleShuffle}>
                    <Shuffle className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground" onClick={previous}>
                    <SkipBack className="w-5 h-5" />
                  </Button>
                  <Button variant="default" size="icon" className="h-14 w-14 rounded-full shadow-xl shadow-primary/20" onClick={togglePlay}>
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
                <div className="flex items-center justify-center gap-2 mt-1">
                  <Button variant="ghost" size="sm" className={`h-8 gap-1.5 ${isTrackLoved(currentTrack.id) ? 'text-red-500' : 'text-muted-foreground'}`} onClick={() => toggleLoveTrack(currentTrack.id)}>
                    <Heart className={`w-4 h-4 ${isTrackLoved(currentTrack.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    {isTrackLoved(currentTrack.id) ? 'Loved' : 'Love'}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground" onClick={() => navigate('radio')}>
                    <Radio className="w-4 h-4" /> Radio
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground" onClick={() => {
                    const info = `${currentTrack.title} — ${currentTrack.artistName} (${currentTrack.albumName})`;
                    navigator.clipboard.writeText(info).catch(() => {});
                  }}>
                    <Share2 className="w-4 h-4" /> Share
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* ── BOTTOM PANELS ── */}
          <div className="grid md:grid-cols-[1fr_1fr] gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Artist Info Card */}
              <Card className="bg-card/80 backdrop-blur border-border overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/20 transition-colors" onClick={() => navigate('artist-detail', { artistId: currentTrack.artistId })}>
                    {/* Artist avatar */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20">
                      {artistImageLoading ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : artistImage?.imageUrl ? (
                        <div className="w-16 h-16 rounded-full bg-muted overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <User className="w-8 h-8 text-primary/40" />
                          </div>
                        </div>
                      ) : (
                        <User className="w-8 h-8 text-primary/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Now Playing Artist</p>
                      <h3 className="text-base font-semibold truncate">{currentTrack.artistName}</h3>
                      <p className="text-xs text-muted-foreground">View full artist profile</p>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
                  </div>
                  {/* Quick bio */}
                  {artistBio && !bioLoading && artistBio.summaries.length > 0 && (
                    <div className="px-4 pb-4">
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {artistBio.summaries[0].snippet}
                      </p>
                      <a href={artistBio.summaries[0].url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 mt-1">
                        Read full bio on {artistBio.summaries[0].source} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}
                  {bioLoading && (
                    <div className="px-4 pb-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading artist info...
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Album Info Card */}
              <Card className="bg-card/80 backdrop-blur border-border overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/20 transition-colors" onClick={() => navigate('album-detail', { albumId: currentTrack.albumId })}>
                    {/* Album thumbnail */}
                    <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${getCoverGradient(currentTrack.albumId)} shadow-md flex-shrink-0 overflow-hidden`}>
                      {trackCoverArt && <img src={trackCoverArt} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">From the Album</p>
                      <h3 className="text-base font-semibold truncate">{currentTrack.albumName}</h3>
                      <p className="text-xs text-muted-foreground">{currentTrack.artistName} · {currentTrack.format} {formatSampleRate(currentTrack.sampleRate)}/{currentTrack.bitDepth}-bit</p>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
                  </div>
                  {/* Quick album description */}
                  {albumInfoData && !albumInfoLoading && albumInfoData.summaries.length > 0 && (
                    <div className="px-4 pb-4">
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {albumInfoData.summaries[0].snippet}
                      </p>
                      <a href={albumInfoData.summaries[0].url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 mt-1">
                        Read more on {albumInfoData.summaries[0].source} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}
                  {albumInfoLoading && (
                    <div className="px-4 pb-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading album info...
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lyrics Card */}
              <Card className="bg-card/80 backdrop-blur border-border">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <Music className="w-4 h-4 text-primary" /> Lyrics
                  </h3>
                  {lyricsLoading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Fetching lyrics...
                    </div>
                  )}
                  {lyricsData && !lyricsLoading ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground leading-relaxed">{lyricsData.preview}</p>
                      <a href={lyricsData.fullLyricsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                        View full lyrics on {lyricsData.sourceName} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  ) : !lyricsLoading ? (
                    <p className="text-xs text-muted-foreground italic">Lyrics not available for this track</p>
                  ) : null}
                </CardContent>
              </Card>

              {/* Up Next */}
              <Card className="bg-card/80 backdrop-blur border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <ListMusic className="w-4 h-4 text-muted-foreground" /> Up Next
                    </h3>
                    <span className="text-[10px] text-muted-foreground">{queue.length - queueIndex - 1} tracks</span>
                  </div>
                  <div className="space-y-1">
                    {queue.slice(queueIndex + 1, queueIndex + 6).map(track => {
                      const nextCover = localTracks.find(lt => lt.id === track.id)?.coverArt;
                      return (
                        <div key={track.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group" onClick={() => usePlayerStore.getState().play(track)}>
                          {nextCover ? (
                            <img src={nextCover} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className={`w-9 h-9 rounded bg-gradient-to-br ${getCoverGradient(track.id)} flex-shrink-0`} />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">{track.title}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{track.artistName}</p>
                          </div>
                          <span className="text-[11px] text-muted-foreground tabular-nums">{formatDuration(track.duration)}</span>
                        </div>
                      );
                    })}
                    {queue.length <= queueIndex + 1 && (
                      <p className="text-xs text-muted-foreground text-center py-3">Queue is empty</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Signal Path */}
              <Card className="bg-card/80 backdrop-blur border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-primary" /> Signal Path
                    </h3>
                    <Badge variant="outline" className="text-[10px] text-signal-amber"><AlertCircle className="w-3 h-3 mr-0.5" /> Processing</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                    <Badge variant="secondary" className="text-[10px] font-mono">{currentTrack.format}</Badge>
                    <span className="text-muted-foreground/50">→</span>
                    <Badge variant="secondary" className="text-[10px] font-mono">{formatSampleRate(currentTrack.sampleRate)}</Badge>
                    <span className="text-muted-foreground/50">→</span>
                    <Badge variant="secondary" className="text-[10px] font-mono">{currentTrack.bitDepth}-bit</Badge>
                    <span className="text-muted-foreground/50">→</span>
                    <Badge variant="secondary" className="text-[10px] font-mono">{currentTrack.channels}-ch</Badge>
                    <span className="text-muted-foreground/50">→</span>
                    <Badge variant="secondary" className="text-[10px]">DAC Output</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Details */}
              <Card className="bg-card/80 backdrop-blur border-border">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <Disc3 className="w-4 h-4 text-muted-foreground" /> Technical Details
                  </h3>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    {[
                      { label: 'Codec', value: currentTrack.format },
                      { label: 'Sample Rate', value: formatSampleRate(currentTrack.sampleRate) },
                      { label: 'Bit Depth', value: `${currentTrack.bitDepth}-bit` },
                      { label: 'Channels', value: `${currentTrack.channels}-ch` },
                      { label: 'Bitrate', value: `${(currentTrack.bitrate / 1000).toFixed(0)} kbps` },
                      { label: 'File Size', value: formatFileSize(currentTrack.fileSize) },
                      { label: 'Source', value: currentTrack.source === 'local' ? 'Local Library' : currentTrack.source === 'tidal' ? 'TIDAL' : 'Qobuz' },
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
                <Card className="bg-card/80 backdrop-blur border-border">
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

              {/* File Info */}
              {currentTrack.filePath && (
                <Card className="bg-card/80 backdrop-blur border-border">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-muted-foreground" /> File Info
                    </h3>
                    <p className="text-xs font-mono text-muted-foreground break-all">{currentTrack.filePath}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
