'use client';

import React, { useMemo, useState } from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { usePodcastStore } from '@/store/podcast';
import { useLocalLibraryStore } from '@/store/local-library';
import { useDSPEngineStore } from '@/store/dsp-engine';
import { usePlaylistStore } from '@/store/playlists';
import { useProfilesStore } from '@/store/profiles';
import { formatEpisodeDuration } from '@/lib/podcast-data';
import { formatDuration, formatSampleRate, formatFileSize, getCoverGradient } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useLyrics, useArtistBio, useArtistImage, useAlbumInfo } from '@/lib/use-music-metadata';
import { AudioVisualizer } from '@/components/dsp/AudioVisualizer';
import { LyricsPanel } from '@/components/dsp/LyricsPanel';
import {
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Volume1, Heart, ListMusic, Share2,
  ArrowLeft, Gauge, AlertCircle, Music,
  Radio, Disc3, ExternalLink,
  User, Mic2, Clock, Waves, ChevronDown, ChevronUp,
  ListPlus, LayoutList, Sparkles, Zap,
} from 'lucide-react';

// ── Audio quality badge color logic ──
function getQualityColor(format: string, bitDepth: number, sampleRate: number): { label: string; className: string } {
  const fmt = format.toUpperCase();
  const rateKHz = sampleRate / 1000;
  if (fmt === 'DSD') return { label: 'DSD', className: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
  if (fmt === 'FLAC' && bitDepth >= 24 && rateKHz >= 88.2) return { label: 'Hi-Res', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
  if (fmt === 'FLAC' && bitDepth >= 24) return { label: 'Hi-Res', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
  if (fmt === 'FLAC' && rateKHz >= 44.1) return { label: 'CD Quality', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
  if (['ALAC', 'WAV', 'AIFF', 'APE'].includes(fmt)) return { label: 'Lossless', className: 'bg-sky-500/15 text-sky-400 border-sky-500/30' };
  return { label: 'Lossy', className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' };
}

export function NowPlayingView() {
  const {
    isPlaying, currentTrack, queue, queueIndex, activeZoneId,
    progress, currentTime, duration, volume, isShuffle, repeatMode, isMuted,
    togglePlay, next, previous, seek, setVolume, toggleMute,
    toggleShuffle, toggleRepeat, setActiveZone, playbackMode,
  } = usePlayerStore();
  const { navigate, toggleQueueDrawer } = useUIStore();
  const { isPodcastMode, currentEpisode, playbackSpeed, cyclePlaybackSpeed } = usePodcastStore();
  const toggleLoveTrack = useProfilesStore(s => s.toggleLoveTrack);
  const isTrackLoved = useProfilesStore(s => s.isTrackLoved);
  const localTracks = useLocalLibraryStore(s => s.tracks);
  const bitPerfectDefault = useDSPEngineStore(s => s.bitPerfectDefault);
  const gaplessPlayback = useDSPEngineStore(s => s.gaplessPlayback);
  const playlists = usePlaylistStore(s => s.playlists);
  const addToPlaylist = usePlaylistStore(s => s.addToPlaylist);
  const hasTrackInPlaylist = usePlaylistStore(s => s.hasTrack);

  // UI state
  const [queueOpen, setQueueOpen] = useState(true);
  const [showVisualizer, setShowVisualizer] = useState(true);

  // Fetch rich metadata for the current track
  const { data: lyricsData, loading: lyricsLoading } = useLyrics(currentTrack?.artistName || '', currentTrack?.title || '');
  const { data: artistBio, loading: bioLoading } = useArtistBio(currentTrack?.artistName || '');
  const { data: artistImage, loading: artistImageLoading } = useArtistImage(currentTrack?.artistName || '');
  const { data: albumInfoData, loading: albumInfoLoading } = useAlbumInfo(currentTrack?.artistName || '', currentTrack?.albumName || '');

  // Look up cover art from local library for the current track
  const trackCoverArt = useMemo(() => {
    if (!currentTrack) return null;
    const localTrack = localTracks.find(t => t.id === currentTrack.id);
    if (localTrack?.coverArt) return localTrack.coverArt;
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

  // ── Queue peek: next 3-5 tracks ──
  const queuePeekTracks = useMemo(() => {
    return queue.slice(queueIndex + 1, queueIndex + 6);
  }, [queue, queueIndex]);

  // ── Dynamic background gradient ──
  const bgGradient = useMemo(() => {
    if (!currentTrack) return 'from-zinc-950 via-zinc-900 to-zinc-950';
    return 'from-zinc-950 via-zinc-900 to-zinc-950';
  }, [currentTrack]);

  // ── Quality badge ──
  const qualityBadge = useMemo(() => {
    if (!currentTrack) return { label: '—', className: '' };
    return getQualityColor(currentTrack.format, currentTrack.bitDepth, currentTrack.sampleRate);
  }, [currentTrack]);

  // ── Detailed format string ──
  const formatDetailString = useMemo(() => {
    if (!currentTrack) return '';
    const channels = currentTrack.channels === 1 ? 'Mono' : currentTrack.channels === 2 ? 'Stereo' : `${currentTrack.channels}-ch`;
    return `${currentTrack.format.toUpperCase()} · ${currentTrack.bitDepth}bit/${formatSampleRate(currentTrack.sampleRate)} · ${channels}`;
  }, [currentTrack]);

  // ═══════════════════════════════════════════════════════════════
  // PODCAST MODE
  // ═══════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════
  // RADIO MODE
  // ═══════════════════════════════════════════════════════════════
  if (playbackMode === 'radio' && currentTrack) {
    return (
      <div className={`h-full bg-gradient-to-b ${bgGradient}`}>
        <ScrollArea className="h-full">
          <div className="max-w-6xl mx-auto p-6 pb-32">
            <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground hover:text-foreground" onClick={() => navigate('home')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            <div className="flex flex-col items-center text-center mb-10">
              <div className={`w-72 h-72 lg:w-80 lg:h-80 rounded-2xl bg-gradient-to-br ${getCoverGradient(currentTrack.id)} shadow-2xl relative overflow-hidden mb-8`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),transparent_70%)] pointer-events-none" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Radio className="w-20 h-20 text-white/20" />
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono mb-3">
                <Radio className="w-3 h-3 mr-1" /> Live Radio
              </Badge>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">{currentTrack.title}</h1>
              <p className="text-lg text-muted-foreground">{currentTrack.albumName}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
              <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground" onClick={() => usePlayerStore.getState().stopRadio()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Button variant="default" size="icon" className="h-14 w-14 rounded-full shadow-xl shadow-primary/20" onClick={togglePlay}>
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground" onClick={() => navigate('radio')}>
                <ListMusic className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center gap-3 justify-center mt-6">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : volume < 50 ? <Volume1 className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-muted-foreground" />}
              </Button>
              <Slider value={[isMuted ? 0 : volume]} min={0} max={100} step={1} onValueChange={(v) => setVolume(v[0])} className="w-40" />
              <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{volume}%</span>
            </div>

            {/* Visualizer */}
            <div className="mt-10">
              <AudioVisualizer
                mode="bars"
                width={900}
                height={180}
                barCount={96}
                colorScheme="gold"
                className="rounded-xl overflow-hidden"
              />
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // EMPTY STATE
  // ═══════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════
  // MAIN NOW PLAYING VIEW
  // ═══════════════════════════════════════════════════════════════
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
                {trackCoverArt ? (
                  <img src={trackCoverArt} alt={currentTrack.albumName} className="w-full h-full object-cover" />
                ) : null}
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
                {/* ── Smart Controls: Crossfade + Bit-Perfect indicators ── */}
                <div className="flex items-center gap-2 mb-3 justify-center md:justify-start flex-wrap">
                  {gaplessPlayback && (
                    <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-500/5 border-emerald-500/20 text-emerald-400">
                      <Zap className="w-2.5 h-2.5" /> Gapless
                    </Badge>
                  )}
                  {bitPerfectDefault && (
                    <Badge variant="outline" className="text-[10px] gap-1 bg-sky-500/5 border-sky-500/20 text-sky-400">
                      <Sparkles className="w-2.5 h-2.5" /> Bit-Perfect
                    </Badge>
                  )}
                </div>

                {/* ── Audio format detail row with quality badge ── */}
                <div className="flex items-center gap-2 mb-3 justify-center md:justify-start flex-wrap">
                  <Badge variant="outline" className={`text-[10px] font-mono ${qualityBadge.className}`}>
                    {qualityBadge.label}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {formatDetailString}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl lg:text-4xl font-bold mb-2 leading-tight">{currentTrack.title}</h1>

                {/* Artist — clickable → artist-detail */}
                <p
                  className="text-lg text-muted-foreground hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  onClick={() => navigate('artist-detail', { artistId: currentTrack.artistId })}
                >
                  {currentTrack.artistName}
                </p>

                {/* Album — clickable → album-detail */}
                <p
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer inline-flex items-center gap-1"
                  onClick={() => navigate('album-detail', { albumId: currentTrack.albumId })}
                >
                  <Disc3 className="w-3.5 h-3.5" /> {currentTrack.albumName}
                </p>

                {/* ── Genre badge + Track/Disc info ── */}
                <div className="flex items-center gap-2 mt-2 flex-wrap justify-center md:justify-start">
                  {currentTrack.genre && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] cursor-pointer hover:bg-primary/20"
                      onClick={() => navigate('genre-detail', { genreId: currentTrack.genre.toLowerCase().replace(/\s+/g, '-') })}
                    >
                      {currentTrack.genre}
                    </Badge>
                  )}
                  {currentTrack.trackNumber > 0 && (
                    <span className="text-[11px] text-muted-foreground/70">
                      Track {currentTrack.trackNumber}{currentTrack.discNumber > 1 ? ` · Disc ${currentTrack.discNumber}` : ''}
                    </span>
                  )}
                </div>

                {/* ── File format details ── */}
                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground/60 font-mono flex-wrap justify-center md:justify-start">
                  <span>{(currentTrack.bitrate / 1000).toFixed(0)} kbps</span>
                  {currentTrack.fileSize > 0 && <span>{formatFileSize(currentTrack.fileSize)}</span>}
                  <span className="text-muted-foreground/40">{currentTrack.source === 'local' ? 'Local' : currentTrack.source === 'tidal' ? 'TIDAL' : 'Qobuz'}</span>
                </div>

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

                {/* Action Buttons — including Add to Playlist */}
                <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
                  <Button variant="ghost" size="sm" className={`h-8 gap-1.5 ${isTrackLoved(currentTrack.id) ? 'text-red-500' : 'text-muted-foreground'}`} onClick={() => toggleLoveTrack(currentTrack.id)}>
                    <Heart className={`w-4 h-4 ${isTrackLoved(currentTrack.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    {isTrackLoved(currentTrack.id) ? 'Loved' : 'Love'}
                  </Button>

                  {/* ── Add to Playlist Button ── */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground">
                        <ListPlus className="w-4 h-4" /> Add to Playlist
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-56">
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        Add &ldquo;{currentTrack.title}&rdquo; to…
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {playlists.length === 0 && (
                        <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                          No playlists yet.
                          <br />
                          <button
                            className="text-primary hover:underline mt-1"
                            onClick={() => navigate('browse-playlists')}
                          >
                            Create one first
                          </button>
                        </div>
                      )}
                      {playlists.map(pl => {
                        const alreadyIn = hasTrackInPlaylist(pl.id, currentTrack.id);
                        return (
                          <DropdownMenuItem
                            key={pl.id}
                            className="text-xs gap-2 cursor-pointer"
                            disabled={alreadyIn}
                            onClick={() => addToPlaylist(pl.id, currentTrack.id)}
                          >
                            <ListMusic className="w-3.5 h-3.5" />
                            <span className="flex-1 truncate">{pl.name}</span>
                            <span className="text-muted-foreground">{pl.trackCount}</span>
                            {alreadyIn && <Badge variant="secondary" className="text-[9px] h-4 px-1.5">Added</Badge>}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

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

          {/* ── AUDIO VISUALIZER — Prominent with glow effect ── */}
          <div className="mb-8 relative">
            {/* Glow backdrop */}
            <div className="absolute inset-0 -m-4 rounded-2xl bg-primary/5 blur-2xl pointer-events-none" />
            <AudioVisualizer
              mode="bars"
              width={900}
              height={180}
              barCount={96}
              colorScheme="gold"
              className="rounded-xl overflow-hidden relative z-10"
            />
          </div>

          {/* ── VISUALIZER / LYRICS TOGGLE ── */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Button
              variant={showVisualizer ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => setShowVisualizer(true)}
            >
              <Waves className="w-3.5 h-3.5" /> Visualizer
            </Button>
            <Button
              variant={!showVisualizer ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => setShowVisualizer(false)}
            >
              <Music className="w-3.5 h-3.5" /> Lyrics
            </Button>
          </div>

          {/* ── BOTTOM PANELS ── */}
          <div className="grid md:grid-cols-[1fr_1fr] gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Lyrics Panel — visible when toggled */}
              {!showVisualizer && <LyricsPanel />}

              {/* Artist Info Card */}
              <Card className="bg-card/80 backdrop-blur border-border overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/20 transition-colors" onClick={() => navigate('artist-detail', { artistId: currentTrack.artistId })}>
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
                    <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${getCoverGradient(currentTrack.albumId)} shadow-md flex-shrink-0 overflow-hidden`}>
                      {trackCoverArt && <img src={trackCoverArt} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">From the Album</p>
                      <h3 className="text-base font-semibold truncate">{currentTrack.albumName}</h3>
                      <p className="text-xs text-muted-foreground">{currentTrack.artistName} · {formatDetailString}</p>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
                  </div>
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
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        bitPerfectDefault
                          ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
                          : 'text-signal-amber'
                      }`}
                    >
                      {bitPerfectDefault ? (
                        <><Sparkles className="w-3 h-3 mr-0.5" /> Bit-Perfect</>
                      ) : (
                        <><AlertCircle className="w-3 h-3 mr-0.5" /> Processing</>
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 flex-wrap">
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
                  {gaplessPlayback && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400">
                      <Zap className="w-3 h-3" /> Gapless crossfade active
                    </div>
                  )}
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

          {/* ── QUEUE PEEK PANEL — Collapsible ── */}
          <div className="mt-8">
            <Collapsible open={queueOpen} onOpenChange={setQueueOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full h-auto py-3 px-4 flex items-center justify-between hover:bg-accent/10 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ListMusic className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Up Next</span>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {queue.length - queueIndex - 1}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleQueueDrawer();
                      }}
                    >
                      <LayoutList className="w-3.5 h-3.5" /> Show Full Queue
                    </Button>
                    {queueOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="bg-card/60 backdrop-blur border-border mt-2">
                  <CardContent className="p-2">
                    {queuePeekTracks.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Queue is empty — add more tracks to keep the music going</p>
                    ) : (
                      <div className="space-y-0.5">
                        {queuePeekTracks.map((track, idx) => {
                          const nextCover = localTracks.find(lt => lt.id === track.id)?.coverArt;
                          const globalIdx = queueIndex + 1 + idx;
                          return (
                            <div
                              key={track.id}
                              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                              onClick={() => usePlayerStore.getState().play(track)}
                            >
                              {/* Queue index number */}
                              <span className="text-[10px] text-muted-foreground/50 w-4 text-right tabular-nums font-mono">
                                {globalIdx + 1}
                              </span>
                              {/* Cover art */}
                              {nextCover ? (
                                <img src={nextCover} alt="" className="w-10 h-10 rounded-md object-cover flex-shrink-0 shadow-sm" />
                              ) : (
                                <div className={`w-10 h-10 rounded-md bg-gradient-to-br ${getCoverGradient(track.id)} flex-shrink-0 shadow-sm`} />
                              )}
                              {/* Track info */}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">{track.title}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{track.artistName}</p>
                              </div>
                              {/* Format + Duration */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge variant="outline" className="text-[9px] font-mono px-1.5 h-4 hidden sm:inline-flex">
                                  {track.format}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground tabular-nums w-10 text-right">
                                  {formatDuration(track.duration)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
