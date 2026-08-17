'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { usePodcastStore } from '@/store/podcast';
import { useLocalLibraryStore } from '@/store/local-library';
import { useDSPEngineStore } from '@/store/dsp-engine';
import { usePlaylistStore } from '@/store/playlists';
import { useProfilesStore } from '@/store/profiles';
import { formatEpisodeDuration, formatDate } from '@/lib/podcast-data';
import { internetRadioStations } from '@/lib/radio-stations';
import type { RadioStation } from '@/lib/radio-stations';
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
  Podcast, FastForward, Scissors, Moon, Square, Loader2,
  Globe, Wifi, Signal, Calendar, MapPin, Flag, Tag, FileText,
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
  // PODCAST MODE — Rich Now Playing with artwork, show notes, metadata
  // ═══════════════════════════════════════════════════════════════
  if (isPodcastMode && currentEpisode) {
    const show = currentEpisode ? { title: currentEpisode.showId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) } : null;
    const dur = duration > 0 ? duration : currentEpisode.duration;
    const prog = dur > 0 ? (currentTime / dur) * 100 : 0;
    const skipSilence = usePodcastStore.getState().skipSilence;
    const sleepTimerMinutes = usePodcastStore.getState().sleepTimerMinutes;

    // Strip HTML from description
    const cleanDescription = useMemo(() => {
      if (!currentEpisode.description) return '';
      return currentEpisode.description
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
    }, [currentEpisode.description]);

    const [showNotesExpanded, setShowNotesExpanded] = useState(false);
    const [descExpanded, setDescExpanded] = useState(false);

    return (
      <div className="h-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
        <ScrollArea className="h-full">
          <div className="max-w-5xl mx-auto p-6 pb-32">
            {/* Back button */}
            <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground hover:text-foreground" onClick={() => navigate('home')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            {/* ── HERO: Large Cover Art + Episode Info ── */}
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              {/* Podcast Artwork — Large */}
              <div className="flex-shrink-0 self-center">
                <div className={`w-72 h-72 lg:w-80 lg:h-80 rounded-2xl bg-gradient-to-br ${getCoverGradient(currentEpisode.showId)} shadow-2xl relative overflow-hidden group cursor-pointer`}
                  onClick={() => navigate('podcast-detail', { showId: currentEpisode.showId })}
                >
                  {currentEpisode.artworkUrl ? (
                    <img src={currentEpisode.artworkUrl} alt={show?.title || 'Podcast'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Podcast className="w-20 h-20 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),transparent_70%)] pointer-events-none" />
                </div>
              </div>

              {/* Episode Info + Controls */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="text-center md:text-left w-full">
                  {/* Type label */}
                  <div className="flex items-center gap-2 mb-3 justify-center md:justify-start">
                    <Badge variant="outline" className="text-[10px] gap-1 bg-purple-500/10 text-purple-400 border-purple-500/20">
                      <Podcast className="w-2.5 h-2.5" /> Podcast Episode
                    </Badge>
                    {currentEpisode.season && (
                      <Badge variant="outline" className="text-[10px]">
                        S{currentEpisode.season}{currentEpisode.episodeNumber ? `E${currentEpisode.episodeNumber}` : ''}
                      </Badge>
                    )}
                  </div>

                  {/* Episode Title */}
                  <h1 className="text-2xl lg:text-3xl font-bold mb-2 leading-tight">{currentEpisode.title}</h1>

                  {/* Show Name — clickable */}
                  <p
                    className="text-lg text-muted-foreground hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1.5 mb-3"
                    onClick={() => navigate('podcast-detail', { showId: currentEpisode.showId })}
                  >
                    <Podcast className="w-4 h-4" /> {show?.title}
                  </p>

                  {/* Metadata badges row */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap justify-center md:justify-start">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {currentEpisode.format.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {currentEpisode.bitrate > 0 ? `${currentEpisode.bitrate} kbps` : '—'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      <Clock className="w-2.5 h-2.5 mr-0.5" /> {formatEpisodeDuration(currentEpisode.duration)}
                    </Badge>
                    {currentEpisode.publishDate && (
                      <Badge variant="outline" className="text-[10px]">
                        <Calendar className="w-2.5 h-2.5 mr-0.5" /> {formatDate(currentEpisode.publishDate)}
                      </Badge>
                    )}
                    {currentEpisode.fileSize > 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        {formatFileSize(currentEpisode.fileSize)}
                      </Badge>
                    )}
                  </div>

                  {/* Playback Speed + Skip Silence + Sleep Timer */}
                  <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start mb-4">
                    <Button
                      variant={skipSilence ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => usePodcastStore.getState().toggleSkipSilence()}
                      title="Skip Silence"
                    >
                      <Scissors className="w-3.5 h-3.5" /> Skip Silence
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 text-xs font-mono gap-1.5"
                      onClick={cyclePlaybackSpeed}
                    >
                      <FastForward className="w-3 h-3" /> {playbackSpeed}x
                    </Button>
                    {sleepTimerMinutes !== null && (
                      <Badge variant="outline" className="text-[10px] gap-1 text-signal-amber border-signal-amber/30">
                        <Moon className="w-3 h-3" /> Sleep: {sleepTimerMinutes}m
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Progress + Controls */}
                <div className="w-full max-w-lg self-center md:self-start">
                  {/* Seek bar */}
                  <div className="space-y-1 mb-4">
                    <Slider
                      value={[prog]}
                      min={0}
                      max={100}
                      step={0.1}
                      onValueChange={(v) => seek(v[0])}
                      className="w-full cursor-pointer [&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                      <span>{formatDuration(currentTime)}</span>
                      <span>{formatEpisodeDuration(currentEpisode.duration)}</span>
                    </div>
                  </div>

                  {/* Transport */}
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground" onClick={previous}>
                      <SkipBack className="w-5 h-5" />
                    </Button>
                    <Button variant="default" size="icon" className="h-14 w-14 rounded-full shadow-xl shadow-primary/20" onClick={togglePlay}>
                      {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground" onClick={next}>
                      <SkipForward className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-muted-foreground"
                      onClick={() => usePodcastStore.getState().stopPodcast()}
                      title="Stop"
                    >
                      <Square className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Volume */}
                  <div className="flex items-center gap-3 justify-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
                      {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : volume < 50 ? <Volume1 className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                    <Slider value={[isMuted ? 0 : volume]} min={0} max={100} step={1} onValueChange={(v) => setVolume(v[0])} className="w-40" />
                    <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{volume}%</span>
                    {activeZone && (
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground ml-2" onClick={() => navigate('zones')}>
                        <Gauge className="w-3.5 h-3.5" /> {activeZone.name}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── AUDIO VISUALIZER ── */}
            <div className="mb-8 relative">
              <div className="absolute inset-0 -m-4 rounded-2xl bg-primary/5 blur-2xl pointer-events-none" />
              <AudioVisualizer
                mode="bars"
                width={900}
                height={180}
                barCount={96}
                colorScheme="purple"
                className="rounded-xl overflow-hidden relative z-10"
              />
            </div>

            {/* ── BOTTOM INFO CARDS ── */}
            <div className="grid md:grid-cols-[1fr_1fr] gap-6">
              {/* Left Column: Episode Description + Show Notes */}
              <div className="space-y-6">
                {/* Episode Description */}
                <Card className="bg-card/80 backdrop-blur border-border overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-accent/20 transition-colors" onClick={() => navigate('podcast-detail', { showId: currentEpisode.showId })}>
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getCoverGradient(currentEpisode.showId)} flex-shrink-0 overflow-hidden shadow-md`}>
                        {currentEpisode.artworkUrl ? (
                          <img src={currentEpisode.artworkUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Podcast className="w-5 h-5 text-white/30 m-auto mt-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">From the Show</p>
                        <h3 className="text-sm font-semibold truncate">{show?.title}</h3>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
                    </div>
                    {cleanDescription && (
                      <div className="px-4 pb-4">
                        <p className={`text-xs text-muted-foreground leading-relaxed ${!descExpanded ? 'line-clamp-4' : ''}`}>
                          {cleanDescription}
                        </p>
                        {cleanDescription.length > 200 && (
                          <button
                            className="text-[10px] text-primary hover:underline mt-1"
                            onClick={() => setDescExpanded(!descExpanded)}
                          >
                            {descExpanded ? 'Show less' : 'Read full description'}
                          </button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Show Notes (extended notes) */}
                {currentEpisode.showNotes && (
                  <Card className="bg-card/80 backdrop-blur border-border overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-400" /> Show Notes
                        </h3>
                        <Badge variant="outline" className="text-[10px]">{currentEpisode.showNotes.length > 500 ? 'Detailed' : 'Brief'}</Badge>
                      </div>
                      <div
                        className="text-xs text-muted-foreground leading-relaxed prose prose-invert prose-xs max-w-none [&_a]:text-primary [&_a]:hover:underline [&_a]:underline-offset-2"
                        dangerouslySetInnerHTML={{ __html: showNotesExpanded ? currentEpisode.showNotes : currentEpisode.showNotes.slice(0, 500) + (currentEpisode.showNotes.length > 500 ? '…' : '') }}
                      />
                      {currentEpisode.showNotes.length > 500 && (
                        <button
                          className="text-[10px] text-primary hover:underline mt-2"
                          onClick={() => setShowNotesExpanded(!showNotesExpanded)}
                        >
                          {showNotesExpanded ? 'Collapse notes' : 'Expand full show notes'}
                        </button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column: Technical Details + Actions */}
              <div className="space-y-6">
                {/* Technical Details */}
                <Card className="bg-card/80 backdrop-blur border-border">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <Disc3 className="w-4 h-4 text-muted-foreground" /> Episode Details
                    </h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                      {[
                        { label: 'Format', value: currentEpisode.format.toUpperCase() },
                        { label: 'Duration', value: formatEpisodeDuration(currentEpisode.duration) },
                        ...(currentEpisode.bitrate > 0 ? [{ label: 'Bitrate', value: `${currentEpisode.bitrate} kbps` }] : []),
                        ...(currentEpisode.fileSize > 0 ? [{ label: 'File Size', value: formatFileSize(currentEpisode.fileSize) }] : []),
                        ...(currentEpisode.publishDate ? [{ label: 'Published', value: formatDate(currentEpisode.publishDate) }] : []),
                        ...(currentEpisode.season ? [{ label: 'Season', value: `Season ${currentEpisode.season}` }] : []),
                        ...(currentEpisode.episodeNumber ? [{ label: 'Episode', value: `#${currentEpisode.episodeNumber}` }] : []),
                        { label: 'Status', value: currentEpisode.completed ? 'Completed' : currentEpisode.isPlayed ? 'Played' : 'New' },
                      ].map(item => (
                        <div key={item.label}>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                          <p className="text-sm font-medium">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Playback Settings Card */}
                <Card className="bg-card/80 backdrop-blur border-border">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-primary" /> Playback Settings
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FastForward className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs">Playback Speed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-medium">{playbackSpeed}x</span>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={cyclePlaybackSpeed}>
                            Cycle
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs">Skip Silence</span>
                        </div>
                        <Button
                          variant={skipSilence ? 'secondary' : 'ghost'}
                          size="sm"
                          className="h-6 text-[10px]"
                          onClick={() => usePodcastStore.getState().toggleSkipSilence()}
                        >
                          {skipSilence ? 'On' : 'Off'}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Moon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs">Sleep Timer</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {sleepTimerMinutes !== null ? `${sleepTimerMinutes}m remaining` : 'Off'}
                        </span>
                      </div>
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

  // ═══════════════════════════════════════════════════════════════
  // RADIO MODE — Rich Now Playing with station info, codec, genre
  // ═══════════════════════════════════════════════════════════════
  if (playbackMode === 'radio' && currentTrack) {
    const stationId = usePlayerStore.getState().currentRadioStationId;
    const station = stationId ? internetRadioStations.find(s => s.id === stationId) : null;

    // Elapsed time since playback started (for live streams)
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
      const timer = setInterval(() => {
        if (usePlayerStore.getState().isPlaying) setElapsed(e => e + 1);
      }, 1000);
      return () => clearInterval(timer);
    }, []);

    const formatElapsed = (s: number) => {
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
      return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const genreGradient = useMemo(() => {
      const genre = station?.genre || currentTrack.albumName;
      const genreColors: Record<string, string> = {
        'Jazz': 'from-amber-600 to-orange-800',
        'Classical': 'from-violet-600 to-purple-800',
        'Electronic': 'from-cyan-600 to-blue-800',
        'Rock': 'from-red-600 to-rose-800',
        'Pop': 'from-pink-600 to-fuchsia-800',
        'Ambient': 'from-teal-600 to-emerald-800',
        'Lo-Fi': 'from-indigo-600 to-violet-800',
        'World': 'from-yellow-600 to-amber-800',
        'Metal': 'from-zinc-600 to-gray-800',
        'Blues': 'from-blue-600 to-indigo-800',
        'Folk': 'from-lime-600 to-green-800',
        'Country': 'from-orange-600 to-red-800',
        'Reggae': 'from-green-600 to-teal-800',
        'Latin': 'from-rose-600 to-orange-800',
        'Hip Hop': 'from-purple-600 to-indigo-800',
        'Soul / R&B': 'from-red-600 to-pink-800',
      };
      return genreColors[genre] || getCoverGradient(currentTrack.id);
    }, [station, currentTrack]);

    return (
      <div className="h-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
        <ScrollArea className="h-full">
          <div className="max-w-6xl mx-auto p-6 pb-32">
            <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground hover:text-foreground" onClick={() => navigate('home')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            {/* ── HERO: Station Cover + Info ── */}
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              {/* Station Art — Large with genre gradient */}
              <div className="flex-shrink-0 self-center">
                <div className={`w-72 h-72 lg:w-80 lg:h-80 rounded-2xl bg-gradient-to-br ${genreGradient} shadow-2xl relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),transparent_70%)] pointer-events-none" />
                  {/* Signal pattern overlay */}
                  <div className="absolute inset-0 opacity-10">
                    <svg width="100%" height="100%" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="10" fill="none" stroke="white" strokeWidth="0.5" />
                      <circle cx="50" cy="50" r="20" fill="none" stroke="white" strokeWidth="0.3" />
                      <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="0.2" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="0.1" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Radio className="w-24 h-24 text-white/25" />
                  </div>
                  {/* LIVE badge */}
                  <div className="absolute top-4 right-4">
                    <Badge className="text-[10px] bg-red-500/90 text-white border-red-500/50 h-5 px-1.5 gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Station Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="text-center md:text-left w-full">
                  {/* Type label + ON AIR */}
                  <div className="flex items-center gap-2 mb-3 justify-center md:justify-start">
                    <Badge variant="outline" className="text-[10px] gap-1 bg-red-500/10 text-red-400 border-red-500/20">
                      <Radio className="w-2.5 h-2.5" /> Live Radio
                    </Badge>
                    <Badge variant="outline" className="text-[10px] gap-1 animate-pulse">
                      <Wifi className="w-2.5 h-2.5" /> ON AIR
                    </Badge>
                  </div>

                  {/* Station Name */}
                  <h1 className="text-3xl lg:text-4xl font-bold mb-2 leading-tight">{currentTrack.title}</h1>

                  {/* Genre */}
                  <p
                    className="text-lg text-muted-foreground hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1.5 mb-3"
                    onClick={() => navigate('radio')}
                  >
                    <Tag className="w-4 h-4" /> {station?.genre || currentTrack.albumName}
                  </p>

                  {/* Description */}
                  {station?.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{station.description}</p>
                  )}

                  {/* Metadata badges */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap justify-center md:justify-start">
                    {station?.codec && (
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {station.codec.toUpperCase()}
                      </Badge>
                    )}
                    {(station?.bitrate || currentTrack.bitrate) && (
                      <Badge variant="outline" className="text-[10px] font-mono">
                        <Signal className="w-2.5 h-2.5 mr-0.5" /> {(station?.bitrate || currentTrack.bitrate)} kbps
                      </Badge>
                    )}
                    {station?.sampleRate > 0 && (
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {(station.sampleRate / 1000).toFixed(1)} kHz
                      </Badge>
                    )}
                    {station?.country && (
                      <Badge variant="outline" className="text-[10px]">
                        <MapPin className="w-2.5 h-2.5 mr-0.5" /> {station.country}
                      </Badge>
                    )}
                    {station?.language && (
                      <Badge variant="outline" className="text-[10px]">
                        <Globe className="w-2.5 h-2.5 mr-0.5" /> {station.language}
                      </Badge>
                    )}
                    {station?.source && (
                      <Badge variant="outline" className="text-[10px]">
                        {station.source}
                      </Badge>
                    )}
                  </div>

                  {/* Elapsed time */}
                  <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                    <Badge variant="outline" className="text-[10px] gap-1 text-emerald-400 border-emerald-500/20">
                      <Clock className="w-2.5 h-2.5" /> Listening for {formatElapsed(elapsed)}
                    </Badge>
                  </div>
                </div>

                {/* Controls */}
                <div className="w-full max-w-lg self-center md:self-start">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-muted-foreground"
                      onClick={() => usePlayerStore.getState().stopRadio()}
                      title="Stop"
                    >
                      <Square className="w-5 h-5" />
                    </Button>
                    <Button variant="default" size="icon" className="h-14 w-14 rounded-full shadow-xl shadow-primary/20" onClick={togglePlay}>
                      {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground" onClick={() => navigate('radio')}>
                      <ListMusic className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Volume */}
                  <div className="flex items-center gap-3 justify-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
                      {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : volume < 50 ? <Volume1 className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                    <Slider value={[isMuted ? 0 : volume]} min={0} max={100} step={1} onValueChange={(v) => setVolume(v[0])} className="w-40" />
                    <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{volume}%</span>
                    {activeZone && (
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground ml-2" onClick={() => navigate('zones')}>
                        <Gauge className="w-3.5 h-3.5" /> {activeZone.name}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── AUDIO VISUALIZER ── */}
            <div className="mb-8 relative">
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

            {/* ── BOTTOM INFO CARDS ── */}
            <div className="grid md:grid-cols-[1fr_1fr] gap-6">
              {/* Left Column: Station Details */}
              <div className="space-y-6">
                {/* Station Info Card */}
                <Card className="bg-card/80 backdrop-blur border-border overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/20 transition-colors" onClick={() => navigate('radio')}>
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${genreGradient} shadow-md flex-shrink-0 flex items-center justify-center`}>
                        <Radio className="w-6 h-6 text-white/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Now Playing Station</p>
                        <h3 className="text-base font-semibold truncate">{currentTrack.title}</h3>
                        <p className="text-xs text-muted-foreground">Browse all radio stations</p>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
                    </div>
                    {station?.description && (
                      <div className="px-4 pb-4">
                        <p className="text-xs text-muted-foreground leading-relaxed">{station.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tags */}
                {station?.tags && station.tags.length > 0 && (
                  <Card className="bg-card/80 backdrop-blur border-border">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                        <Tag className="w-4 h-4 text-muted-foreground" /> Tags
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {station.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column: Technical + Signal Path */}
              <div className="space-y-6">
                {/* Technical Details */}
                <Card className="bg-card/80 backdrop-blur border-border">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <Disc3 className="w-4 h-4 text-muted-foreground" /> Stream Details
                    </h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                      {[
                        { label: 'Codec', value: station?.codec?.toUpperCase() || currentTrack.format },
                        { label: 'Bitrate', value: `${(station?.bitrate || currentTrack.bitrate)} kbps` },
                        ...(station?.sampleRate > 0 ? [{ label: 'Sample Rate', value: `${(station.sampleRate / 1000).toFixed(1)} kHz` }] : []),
                        { label: 'Source', value: station?.source || 'Internet Radio' },
                        ...(station?.country ? [{ label: 'Country', value: station.country }] : []),
                        ...(station?.language ? [{ label: 'Language', value: station.language }] : []),
                        { label: 'Listened', value: formatElapsed(elapsed) },
                        { label: 'Status', value: isPlaying ? 'Streaming' : 'Paused' },
                      ].map(item => (
                        <div key={item.label}>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                          <p className="text-sm font-mono font-medium">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Signal Path */}
                <Card className="bg-card/80 backdrop-blur border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-primary" /> Signal Path
                      </h3>
                      <Badge variant="outline" className="text-[10px] text-red-400 border-red-500/30">
                        <Wifi className="w-3 h-3 mr-0.5" /> Live Stream
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] font-mono">{station?.codec?.toUpperCase() || 'MP3'}</Badge>
                      <span className="text-muted-foreground/50">→</span>
                      <Badge variant="secondary" className="text-[10px] font-mono">{(station?.bitrate || currentTrack.bitrate)}kbps</Badge>
                      <span className="text-muted-foreground/50">→</span>
                      <Badge variant="secondary" className="text-[10px]">HTTP Proxy</Badge>
                      <span className="text-muted-foreground/50">→</span>
                      <Badge variant="secondary" className="text-[10px]">Web Audio API</Badge>
                      <span className="text-muted-foreground/50">→</span>
                      <Badge variant="secondary" className="text-[10px]">DAC Output</Badge>
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
