'use client';

import React, { useMemo } from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { formatDuration, getCoverGradient, formatSampleRate } from '@/lib/data';
import type { Track } from '@/lib/data';
import { radioStations } from '@/lib/radio-stations';
import { useLocalLibraryStore } from '@/store/local-library';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CoverArt } from '@/components/dsp/CoverArt';
import {
  Play,
  ArrowRight,
  Clock,
  Music2,
  Radio,
  Disc3,
  HardDrive,
  Headphones,
  Sparkles,
  Upload,
  TrendingUp,
  Award,
  Users,
  Gauge,
  Library,
  AudioLines,
} from 'lucide-react';

// ── Helper: convert LocalTrack → Track for the player store ──
function localTrackToTrack(lt: LocalTrack): Track {
  return {
    id: lt.id,
    title: lt.title,
    albumId: lt.album,
    albumName: lt.album,
    artistId: lt.artist,
    artistName: lt.artist,
    trackNumber: lt.trackNumber,
    discNumber: lt.discNumber,
    duration: lt.duration,
    format: lt.format,
    bitDepth: lt.bitDepth,
    sampleRate: lt.sampleRate,
    channels: lt.channels,
    bitrate: lt.bitrate,
    filePath: lt.filePath,
    fileSize: lt.fileSize,
    composers: lt.composer ? [lt.composer] : [],
    performers: [],
    genre: lt.genre,
    loved: false,
    playCount: 0,
    source: 'local' as const,
    isAvailable: true,
    blobUrl: lt.blobUrl,
    storageUrl: lt.storageUrl,
  };
}

// ── Helper: time-of-day greeting ──
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

// ── Helper: format seconds into human-readable duration string ──
function formatTotalDuration(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

// ── Helper: format bytes into GB ──
function formatGB(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function HomeView() {
  const { navigate } = useUIStore();
  const { play, setQueue } = usePlayerStore();

  const { tracks: localTracks, getAlbums, getArtists, getTotalDuration, getTotalSize, getFormatCounts } = useLocalLibraryStore();

  // ── Derived data via useMemo ──

  const isEmpty = localTracks.length === 0;

  const localAlbums = useMemo(() => getAlbums(), [localTracks, getAlbums]);
  const localArtists = useMemo(() => getArtists(), [localTracks, getArtists]);
  const totalDuration = useMemo(() => getTotalDuration(), [localTracks, getTotalDuration]);
  const totalSize = useMemo(() => getTotalSize(), [localTracks, getTotalSize]);
  const formatCounts = useMemo(() => getFormatCounts(), [localTracks, getFormatCounts]);

  // Resume listening: first 3 tracks
  const resumeTracks = useMemo(() => localTracks.slice(0, 3), [localTracks]);

  // Recently added albums: use array order as proxy (first 6 albums in the list)
  const recentAlbums = useMemo(() => localAlbums.slice(0, 6), [localAlbums]);

  // Top 6 artists by track count
  const topArtists = useMemo(() => {
    const artistCountMap = new Map<string, number>();
    for (const t of localTracks) {
      const key = t.albumArtist || t.artist;
      artistCountMap.set(key, (artistCountMap.get(key) || 0) + 1);
    }
    return [...artistCountMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));
  }, [localTracks]);

  // Genre distribution: sorted by track count
  const genreData = useMemo(() => {
    const genreMap = new Map<string, { count: number; artists: Set<string> }>();
    for (const t of localTracks) {
      const genre = t.genre || 'Unknown';
      const existing = genreMap.get(genre);
      if (existing) {
        existing.count++;
        existing.artists.add(t.artist);
      } else {
        genreMap.set(genre, { count: 1, artists: new Set([t.artist]) });
      }
    }
    return [...genreMap.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([genre, data]) => ({
        genre,
        count: data.count,
        topArtist: [...data.artists][0] || 'Various',
      }));
  }, [localTracks]);

  // Audio quality profile
  const qualityProfile = useMemo(() => {
    // Sample rate distribution
    const sampleRates = new Map<string, number>();
    const bitDepths = new Map<string, number>();
    let totalBitrate = 0;
    let hiResCount = 0;

    for (const t of localTracks) {
      // Sample rate bucket
      const sr = t.sampleRate || 44100;
      const srLabel = formatSampleRate(sr);
      sampleRates.set(srLabel, (sampleRates.get(srLabel) || 0) + 1);

      // Bit depth bucket
      const bd = t.bitDepth || 16;
      const bdLabel = `${bd}-bit`;
      bitDepths.set(bdLabel, (bitDepths.get(bdLabel) || 0) + 1);

      // Total bitrate
      totalBitrate += t.bitrate || 0;

      // Hi-res check: sampleRate >= 88200 OR bitDepth > 16
      if (sr >= 88200 || bd > 16) {
        hiResCount++;
      }
    }

    const avgBitrate = localTracks.length > 0 ? Math.round(totalBitrate / localTracks.length) : 0;

    // Convert to sorted arrays
    const formatDistribution = Object.entries(formatCounts)
      .sort((a, b) => b[1] - a[1]);
    const sampleRateDistribution = [...sampleRates.entries()]
      .sort((a, b) => b[1] - a[1]);
    const bitDepthDistribution = [...bitDepths.entries()]
      .sort((a, b) => b[1] - a[1]);

    // Determine if hi-res certified (>20% of library is hi-res)
    const hiResRatio = localTracks.length > 0 ? hiResCount / localTracks.length : 0;
    const isHiResCertified = hiResRatio >= 0.2;

    return {
      formatDistribution,
      sampleRateDistribution,
      bitDepthDistribution,
      avgBitrate,
      hiResCount,
      hiResRatio,
      isHiResCertified,
    };
  }, [localTracks, formatCounts]);

  // Format breakdown string for stat card
  const formatBreakdown = useMemo(() => {
    return Object.entries(formatCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([fmt, count]) => `${count} ${fmt}`)
      .join(' · ');
  }, [formatCounts]);

  // Featured radio stations (first 4)
  const featuredStations = radioStations.slice(0, 4);

  // ── Playback handlers ──

  const playAlbum = (albumName: string, artistName: string) => {
    const albumTracks = localTracks
      .filter(t => t.album === albumName && (t.artist === artistName || t.albumArtist === artistName))
      .sort((a, b) => a.trackNumber - b.trackNumber);
    if (albumTracks.length > 0) {
      const trackObjs = albumTracks.map(localTrackToTrack);
      setQueue(trackObjs, 0);
    }
  };

  const playTrack = (trackId: string) => {
    const t = localTracks.find(tr => tr.id === trackId);
    if (t) {
      play(localTrackToTrack(t));
    }
  };

  const playAllTracks = () => {
    if (localTracks.length > 0) {
      const trackObjs = localTracks.slice(0, 50).map(localTrackToTrack);
      setQueue(trackObjs, 0);
    }
  };

  // ── Render ──

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-10 max-w-7xl mx-auto pb-12">

        {/* ════════════════════════════════════════════
            1. HERO SECTION
        ════════════════════════════════════════════ */}
        <section className="relative rounded-2xl overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 hero-gradient-animate bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-slate-950/80 animate-gradient-x" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(16,185,129,0.08),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(244,114,182,0.05),transparent_50%)]" />

          <div className="relative z-10 p-8 md:p-10">
            {isEmpty ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-emerald-400" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{getGreeting()}</h1>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Your music library is empty. Import your first tracks to unlock the full DSP experience.
                </p>
                <Button size="lg" onClick={() => navigate('settings')}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Music
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-emerald-400 font-medium">{getGreeting()}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-3">
                  Your Music, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Perfectly Curated</span>
                </h1>
                <p className="text-muted-foreground max-w-xl text-sm md:text-base">
                  {localTracks.length.toLocaleString()} tracks · {formatTotalDuration(totalDuration)} · {formatGB(totalSize)} of music
                </p>
                <div className="flex gap-3 mt-5">
                  <Button onClick={playAllTracks}>
                    <Play className="w-4 h-4 mr-2" /> Play All
                  </Button>
                  <Button variant="outline" onClick={() => navigate('browse-tracks')}>
                    <Library className="w-4 h-4 mr-2" /> Browse Library
                  </Button>
                  <Button variant="outline" onClick={() => navigate('browse-genres')}>
                    <Sparkles className="w-4 h-4 mr-2" /> Discover
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Don't render remaining sections if library is empty */}
        {!isEmpty && (
          <>

            {/* ════════════════════════════════════════════
                2. RESUME LISTENING
            ════════════════════════════════════════════ */}
            {resumeTracks.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    Resume Listening
                  </h2>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('browse-tracks')}>
                    View All <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {resumeTracks.map(track => (
                    <Card
                      key={track.id}
                      className="bg-card/80 border-border hover:bg-accent/20 cursor-pointer transition-all duration-200 group overflow-hidden"
                      onClick={() => playTrack(track.id)}
                    >
                      <CardContent className="p-0">
                        <div className="flex gap-3 p-3">
                          <div className="relative flex-shrink-0">
                            <CoverArt
                              id={track.id}
                              coverArtUrl={track.coverArt}
                              size="md"
                              className="!w-12 !h-12"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                              <Play className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{track.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                            <p className="text-[11px] text-muted-foreground/70 mt-0.5">{formatDuration(track.duration)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* ════════════════════════════════════════════
                3. RECENTLY ADDED ALBUMS
            ════════════════════════════════════════════ */}
            {recentAlbums.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    Recently Added
                  </h2>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('browse-albums')}>
                    View All <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  {recentAlbums.map(album => {
                    // Get format info from the first track of this album
                    const albumTrack = localTracks.find(t => t.album === album.name && (t.artist === album.artist || t.albumArtist === album.artist));
                    const fmtLabel = albumTrack
                      ? `${albumTrack.format || 'N/A'}${albumTrack.bitDepth ? ` ${albumTrack.bitDepth}-bit` : ''}${albumTrack.sampleRate ? ` ${formatSampleRate(albumTrack.sampleRate)}` : ''}`
                      : '';

                    return (
                      <div
                        key={`${album.name}-${album.artist}`}
                        className="group cursor-pointer"
                        onClick={() => playAlbum(album.name, album.artist)}
                      >
                        <div className="relative mb-2">
                          <CoverArtGridAlbum
                            id={album.name}
                            coverArtUrl={album.coverArt}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
                              <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                            </div>
                          </div>
                          {fmtLabel && (
                            <Badge
                              variant="secondary"
                              className="absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0 bg-black/60 text-white/90 hover:bg-black/70 border-0"
                            >
                              {fmtLabel}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{album.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{album.artist}{album.year ? ` · ${album.year}` : ''}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ════════════════════════════════════════════
                4. YOUR COLLECTION AT A GLANCE — STATS GRID
            ════════════════════════════════════════════ */}
            <section>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
                Your Collection at a Glance
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard
                  icon={<Music2 className="w-5 h-5" />}
                  iconColor="text-emerald-400"
                  label="Total Tracks"
                  value={localTracks.length.toLocaleString()}
                  sublabel={formatBreakdown || 'No tracks'}
                />
                <StatCard
                  icon={<Disc3 className="w-5 h-5" />}
                  iconColor="text-amber-400"
                  label="Total Albums"
                  value={localAlbums.length.toLocaleString()}
                  onClick={() => navigate('browse-albums')}
                />
                <StatCard
                  icon={<Users className="w-5 h-5" />}
                  iconColor="text-rose-400"
                  label="Total Artists"
                  value={localArtists.length.toLocaleString()}
                  onClick={() => navigate('browse-artists')}
                />
                <StatCard
                  icon={<Clock className="w-5 h-5" />}
                  iconColor="text-sky-400"
                  label="Total Listening Time"
                  value={formatTotalDuration(totalDuration)}
                />
                <StatCard
                  icon={<HardDrive className="w-5 h-5" />}
                  iconColor="text-violet-400"
                  label="Library Size"
                  value={formatGB(totalSize)}
                />
                <StatCard
                  icon={<Award className="w-5 h-5" />}
                  iconColor={qualityProfile.isHiResCertified ? 'text-emerald-400' : 'text-zinc-500'}
                  label="Hi-Res Audio"
                  value={qualityProfile.hiResCount.toLocaleString()}
                  sublabel={qualityProfile.isHiResCertified ? 'Hi-Res Certified' : `${Math.round(qualityProfile.hiResRatio * 100)}% of library`}
                  highlight={qualityProfile.isHiResCertified}
                />
              </div>
            </section>

            {/* ════════════════════════════════════════════
                5. AUDIO QUALITY PROFILE
            ════════════════════════════════════════════ */}
            <section>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Gauge className="w-5 h-5 text-muted-foreground" />
                Audio Quality Profile
                {qualityProfile.isHiResCertified && (
                  <Badge className="ml-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">
                    <Award className="w-3 h-3 mr-1" />
                    Hi-Res Certified
                  </Badge>
                )}
              </h2>
              <Card className="bg-card/80 border-border">
                <CardContent className="p-6 space-y-6">
                  {/* Format Distribution */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Format Distribution</span>
                      <span className="text-xs text-muted-foreground">{localTracks.length} tracks</span>
                    </div>
                    {qualityProfile.formatDistribution.length > 0 ? (
                      <div className="space-y-2">
                        <DistributionBar
                          data={qualityProfile.formatDistribution}
                          total={localTracks.length}
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No format data available</p>
                    )}
                  </div>

                  <Separator className="bg-border/50" />

                  {/* Two-column: Sample Rate + Bit Depth */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sample Rate Distribution */}
                    <div>
                      <span className="text-sm font-medium text-muted-foreground block mb-2">Sample Rates</span>
                      <div className="space-y-1.5">
                        {qualityProfile.sampleRateDistribution.map(([label, count]) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-xs text-zinc-300">{label}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-sky-500/70 rounded-full"
                                  style={{ width: `${(count / localTracks.length) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bit Depth Distribution */}
                    <div>
                      <span className="text-sm font-medium text-muted-foreground block mb-2">Bit Depths</span>
                      <div className="space-y-1.5">
                        {qualityProfile.bitDepthDistribution.map(([label, count]) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-xs text-zinc-300">{label}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-500/70 rounded-full"
                                  style={{ width: `${(count / localTracks.length) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-border/50" />

                  {/* Average Bitrate */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Bitrate</span>
                    <span className="text-sm font-semibold tabular-nums">
                      {qualityProfile.avgBitrate > 0 ? `${qualityProfile.avgBitrate.toLocaleString()} kbps` : 'N/A'}
                    </span>
                  </div>

                  {/* Hi-Res Summary */}
                  {qualityProfile.hiResCount > 0 && (
                    <div className={
                      `rounded-lg p-3 text-sm ${
                        qualityProfile.isHiResCertified
                          ? 'bg-emerald-500/5 border border-emerald-500/20 text-emerald-300'
                          : 'bg-zinc-800/50 text-zinc-400'
                      }`
                    }>
                      <div className="flex items-center gap-2">
                        {qualityProfile.isHiResCertified ? (
                          <Award className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <AudioLines className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span>
                          {qualityProfile.hiResCount} hi-res tracks ({Math.round(qualityProfile.hiResRatio * 100)}% of library)
                          {qualityProfile.isHiResCertified && ' — Your library meets Hi-Res Audio standards'}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* ════════════════════════════════════════════
                6. TOP GENRES IN YOUR LIBRARY
            ════════════════════════════════════════════ */}
            {genreData.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-muted-foreground" />
                    Top Genres in Your Library
                  </h2>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('browse-genres')}>
                    View All <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {genreData.map(g => (
                    <Card
                      key={g.genre}
                      className="bg-card/80 border-border hover:bg-accent/20 cursor-pointer transition-colors group"
                      onClick={() => navigate('genre-detail', { genre: g.genre })}
                    >
                      <CardContent className="px-4 py-3 flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium group-hover:text-primary transition-colors">{g.genre}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {g.count} track{g.count !== 1 ? 's' : ''} · {g.topArtist}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* ════════════════════════════════════════════
                7. FAVORITE ARTISTS
            ════════════════════════════════════════════ */}
            {topArtists.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    Favorite Artists
                  </h2>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('browse-artists')}>
                    View All <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {topArtists.map(a => (
                    <div
                      key={a.name}
                      className="group text-center cursor-pointer"
                      onClick={() => navigate('artist-detail', { artist: a.name })}
                    >
                      <div className={`w-full aspect-square rounded-full bg-gradient-to-br ${getCoverGradient(a.name)} mx-auto mb-2 cover-art-hover shadow-lg ring-2 ring-transparent group-hover:ring-primary/40 transition-all`} />
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{a.name}</p>
                      <p className="text-[11px] text-muted-foreground">{a.count} track{a.count !== 1 ? 's' : ''}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ════════════════════════════════════════════
                8. INTERNET RADIO — QUICK ACCESS
            ════════════════════════════════════════════ */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Radio className="w-5 h-5 text-emerald-400" />
                  Internet Radio
                </h2>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('radio')}>
                  All Stations <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {featuredStations.map(station => (
                  <Card
                    key={station.id}
                    className="bg-card/80 border-border hover:bg-accent/20 cursor-pointer transition-all duration-200 group overflow-hidden"
                    onClick={() => {
                      usePlayerStore.getState().playRadioStation(station.id, station.name, station.streamUrl, station.genre);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${getCoverGradient(station.id)} flex-shrink-0 flex items-center justify-center shadow-md`}>
                          <Radio className="w-4 h-4 text-white/70" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{station.name}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge variant="outline" className="text-[9px] px-1 py-0 text-emerald-400 border-emerald-500/30 bg-emerald-500/5">LIVE</Badge>
                            <span className="text-[11px] text-muted-foreground truncate">{station.genre}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">{station.codec} · {station.bitrate}kbps</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ════════════════════════════════════════════
            9. FOOTER
        ════════════════════════════════════════════ */}
        <footer className="pt-6 pb-2">
          <Separator className="bg-border/30 mb-6" />
          <div className="text-center space-y-1">
            <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
              DSP — Dyabavadra Streaming Platform
            </p>
            <p className="text-[11px] text-zinc-600">
              Designed for audiophiles
            </p>
          </div>
        </footer>
      </div>
    </ScrollArea>
  );
}

// ═══════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════

function StatCard({
  icon,
  iconColor,
  label,
  value,
  sublabel,
  onClick,
  highlight,
}: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: string;
  sublabel?: string;
  onClick?: () => void;
  highlight?: boolean;
}) {
  return (
    <Card
      className={`bg-card/80 border-border ${onClick ? 'hover:bg-accent/20 cursor-pointer' : ''} transition-colors ${highlight ? 'ring-1 ring-emerald-500/20' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 ${iconColor}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold tabular-nums leading-tight">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          {sublabel && (
            <p className={`text-[10px] mt-1 truncate ${highlight ? 'text-emerald-400' : 'text-muted-foreground/60'}`}>
              {sublabel}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CoverArtGridAlbum({ id, coverArtUrl }: { id: string; coverArtUrl: string | null }) {
  const gradient = getCoverGradient(id);
  return (
    <div className={`relative w-full aspect-square rounded-lg bg-gradient-to-br overflow-hidden cover-art-hover shadow-lg ${gradient}`}>
      {coverArtUrl && (
        <img src={coverArtUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_70%)]" />
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_40%,rgba(255,255,255,0.05)_50%,transparent_60%)]" />
    </div>
  );
}

// Format distribution bar: a single segmented bar showing all format proportions
function DistributionBar({ data, total }: { data: [string, number][]; total: number }) {
  if (total === 0) return null;

  const formatColors: Record<string, string> = {
    FLAC: 'bg-emerald-500',
    WAV: 'bg-sky-500',
    MP3: 'bg-amber-500',
    AAC: 'bg-rose-500',
    OGG: 'bg-violet-500',
    AIFF: 'bg-teal-500',
    M4A: 'bg-orange-500',
    WMA: 'bg-zinc-500',
    APE: 'bg-pink-500',
    DSF: 'bg-indigo-500',
    DFF: 'bg-cyan-500',
  };

  return (
    <div className="space-y-2">
      {/* Segmented bar */}
      <div className="flex h-2.5 rounded-full overflow-hidden bg-zinc-800">
        {data.map(([fmt, count]) => {
          const pct = (count / total) * 100;
          const color = formatColors[fmt.toUpperCase()] || 'bg-zinc-500';
          return (
            <div
              key={fmt}
              className={`${color} transition-all duration-500`}
              style={{ width: `${pct}%` }}
              title={`${fmt}: ${count} tracks (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {data.map(([fmt, count]) => {
          const color = formatColors[fmt.toUpperCase()] || 'bg-zinc-500';
          const pct = Math.round((count / total) * 100);
          return (
            <div key={fmt} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-sm ${color}`} />
              <span className="text-[11px] text-muted-foreground">
                {fmt} <span className="text-zinc-500">{count}</span>{' '}<span className="text-zinc-600">({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
