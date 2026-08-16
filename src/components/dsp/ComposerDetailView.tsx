'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { useLocalLibraryStore, type LocalTrack } from '@/store/local-library';
import { useDiscoveryStore } from '@/store/discovery';
import { formatDuration, formatSampleRate, formatFileSize, getCoverGradient, type Track } from '@/lib/data';
import { useComposerBio, useSimilarArtists } from '@/lib/use-music-metadata';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, BookOpen, Music, Play, Clock, Disc3, Calendar,
  ExternalLink, Globe, User, Waves, ChevronRight, Star,
} from 'lucide-react';

/** Convert a LocalTrack to the Track format for the player queue */
function localTrackToTrack(lt: LocalTrack): Track {
  return {
    id: lt.id, title: lt.title, albumId: lt.album, albumName: lt.album,
    artistId: lt.artist, artistName: lt.artist, trackNumber: lt.trackNumber,
    discNumber: lt.discNumber, duration: lt.duration, format: lt.format,
    bitDepth: lt.bitDepth, sampleRate: lt.sampleRate, channels: lt.channels,
    bitrate: lt.bitrate, filePath: lt.filePath, fileSize: lt.fileSize,
    composers: lt.composer ? [lt.composer] : [], performers: [],
    genre: lt.genre, loved: false, playCount: 0, source: 'local' as const, isAvailable: true,
    blobUrl: lt.blobUrl, storageUrl: lt.storageUrl,
  };
}

export function ComposerDetailView() {
  const { viewParams, navigate } = useUIStore();
  const { play, setQueue, currentTrack, isPlaying } = usePlayerStore();
  const { browseBy, setBrowseBy } = useDiscoveryStore();
  const localTracks = useLocalLibraryStore(s => s.tracks);
  const composerId = viewParams.composerId;

  // Parse composer name from ID: "comp-1" is the default sidebar link
  // Real composer navigation: "composer-detail" with composerName param
  const composerName = React.useMemo(() => {
    if (viewParams.composerName) return viewParams.composerName;
    if (!composerId) return null;
    // Try to find by ID in local library
    return composerId; // fallback
  }, [composerId, viewParams]);

  // Get all tracks where composer matches
  const composerTracks = React.useMemo(() => {
    if (!composerName) return [];
    return localTracks
      .filter(t => t.composer && t.composer.toLowerCase().includes(composerName.toLowerCase()))
      .sort((a, b) => {
        const albumOrder = a.album.localeCompare(b.album);
        if (albumOrder !== 0) return albumOrder;
        return (a.discNumber - b.discNumber) || (a.trackNumber - b.trackNumber);
      });
  }, [localTracks, composerName]);

  // Derive "works" from tracks grouped by album (simulating work groupings)
  const composerWorks = React.useMemo(() => {
    const workMap = new Map<string, {
      id: string;
      title: string;
      genre: string;
      albumName: string;
      albumArtist: string;
      trackCount: number;
      totalDuration: number;
      year: number;
      format: string;
      sampleRate: number;
      bitDepth: number;
      coverArt: string | null;
    }>();

    for (const lt of composerTracks) {
      const key = `${lt.albumArtist || lt.artist}|||${lt.album}`;
      const existing = workMap.get(key);
      if (existing) {
        existing.trackCount++;
        existing.totalDuration += lt.duration;
        if (!existing.coverArt && lt.coverArt) existing.coverArt = lt.coverArt;
      } else {
        workMap.set(key, {
          id: `work-${lt.album}`,
          title: lt.album,
          genre: lt.genre || 'Classical',
          albumName: lt.album,
          albumArtist: lt.albumArtist || lt.artist,
          trackCount: 1,
          totalDuration: lt.duration,
          year: lt.year,
          format: lt.format,
          sampleRate: lt.sampleRate,
          bitDepth: lt.bitDepth,
          coverArt: lt.coverArt,
        });
      }
    }
    return Array.from(workMap.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [composerTracks]);

  // Unique performers/artists for this composer
  const performers = React.useMemo(() => {
    const names = new Map<string, number>();
    for (const lt of composerTracks) {
      const name = lt.albumArtist || lt.artist;
      if (name && !name.toLowerCase().includes(composerName?.toLowerCase() || '')) {
        names.set(name, (names.get(name) || 0) + 1);
      }
    }
    return Array.from(names.entries()).sort((a, b) => b[1] - a[1]);
  }, [composerTracks, composerName]);

  // Genres for this composer
  const genres = React.useMemo(() => {
    const g = new Set<string>();
    for (const lt of composerTracks) {
      if (lt.genre) g.add(lt.genre);
    }
    return [...g].sort();
  }, [composerTracks]);

  // Stats
  const totalDuration = React.useMemo(() => composerTracks.reduce((s, t) => s + t.duration, 0), [composerTracks]);
  const totalSize = React.useMemo(() => composerTracks.reduce((s, t) => s + t.fileSize, 0), [composerTracks]);

  // Format breakdown
  const formatBreakdown = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const lt of composerTracks) {
      const fmt = lt.format.toUpperCase();
      counts[fmt] = (counts[fmt] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [composerTracks]);

  // Web metadata
  const { data: composerBio, loading: bioLoading, error: bioError } = useComposerBio(composerName || '');
  const { data: similarData } = useSimilarArtists(composerName || '');

  // Play all tracks by this composer
  const playAll = () => {
    if (composerTracks.length > 0) {
      const trackObjs = composerTracks.map(localTrackToTrack);
      setQueue(trackObjs, 0);
    }
  };

  const playWork = (albumKey: string) => {
    const albumTrackList = composerTracks
      .filter(t => `${t.albumArtist || t.artist}|||${t.album}` === albumKey)
      .map(localTrackToTrack);
    if (albumTrackList.length > 0) setQueue(albumTrackList, 0);
  };

  const playTrack = (track: LocalTrack) => {
    play(localTrackToTrack(track));
  };

  // Not found
  if (!composerName || composerTracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <Music className="w-12 h-12" />
        <p>Composer not found</p>
        <p className="text-xs">No tracks by this composer in your library</p>
        <Button variant="ghost" size="sm" onClick={() => navigate('home')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6">
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground hover:text-foreground" onClick={() => navigate('home')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        {/* Browse Mode Toggle */}
        <div className="flex items-center gap-2 mb-6">
          <Tabs value={browseBy} onValueChange={(v) => setBrowseBy(v as typeof browseBy)}>
            <TabsList>
              <TabsTrigger value="composer-work" className="text-xs">
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                By Work / Album
              </TabsTrigger>
              <TabsTrigger value="artist-album" className="text-xs">
                <Disc3 className="w-3.5 h-3.5 mr-1.5" />
                By Performer
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Hero Section */}
        <div className="relative mb-8 rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-border/50">
          <div className={`absolute inset-0 bg-gradient-to-br ${getCoverGradient(composerName)} opacity-15 blur-3xl`} />

          <div className="relative flex flex-col md:flex-row gap-6 p-6 md:p-8">
            {/* Composer Portrait */}
            <div className="flex-shrink-0 self-center">
              <div className={`w-48 h-60 rounded-xl bg-gradient-to-br ${getCoverGradient(composerName)} shadow-2xl flex-shrink-0 flex items-center justify-center`}>
                <Music className="w-16 h-16 text-white/30" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left flex flex-col justify-center">
              <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start">
                <Badge variant="outline" className="text-[10px]">
                  <BookOpen className="w-2.5 h-2.5 mr-0.5" /> Composer
                </Badge>
                {genres.map(g => (
                  <Badge
                    key={g}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-primary/30 transition-colors"
                    onClick={() => navigate('genre-detail', { genreName: g })}
                  >
                    {g}
                  </Badge>
                ))}
              </div>

              <h1 className="text-3xl font-bold mb-1">{composerName}</h1>
              <p className="text-sm text-muted-foreground mb-4">
                {composerWorks.length} works · {composerTracks.length} recordings · {performers.length} performers
              </p>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/20">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-bold leading-none">{composerWorks.length}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Works</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/20">
                  <Disc3 className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-bold leading-none">{composerTracks.length}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Recordings</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/20">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-bold leading-none">{formatDuration(totalDuration)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Total Time</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={playAll}>
                  <Play className="w-4 h-4 mr-2" /> Play All
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate('browse-tracks')}>
                  <Disc3 className="w-4 h-4 mr-2" /> View Tracks
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Biography (from web search) */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Globe className="w-5 h-5 text-muted-foreground" />
            Biography
          </h2>
          {bioLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Fetching biography...
            </div>
          )}
          {bioError && (
            <p className="text-xs text-muted-foreground">Unable to fetch biography</p>
          )}
          {composerBio && !bioLoading && (
            <div className="space-y-3">
              {composerBio.summaries.map((s, i) => (
                <Card key={i} className="bg-surface/50 border-border">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.snippet}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <ExternalLink className="w-3 h-3 text-primary" />
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                        {s.source} — Read more
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {!composerBio && !bioLoading && !bioError && (
            <Card className="bg-surface/30 border-border">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  Biography will be fetched from the internet when you navigate to this composer.
                  Information sources include Wikipedia, AllMusic, Britannica, and Discogs.
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        <Separator className="mb-8" />

        {/* Audio Quality Stats */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Waves className="w-5 h-5 text-muted-foreground" />
            Audio Quality
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {formatBreakdown.map(([fmt, count]) => (
              <Card key={fmt} className="bg-surface/50 border-border">
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold font-mono">{count}</p>
                  <p className="text-[10px] text-muted-foreground">{fmt}</p>
                </CardContent>
              </Card>
            ))}
            <Card className="bg-surface/50 border-border">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold font-mono">{formatFileSize(totalSize)}</p>
                <p className="text-[10px] text-muted-foreground">Total Size</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="mb-8" />

        {/* Works / Albums Section */}
        {browseBy === 'composer-work' ? (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Works & Albums
              <Badge variant="secondary" className="text-xs">{composerWorks.length}</Badge>
            </h2>
            <div className="space-y-2">
              {composerWorks.map(work => (
                <Card key={work.id} className="bg-card border-border hover:bg-accent/20 transition-colors cursor-pointer group"
                  onClick={() => playWork(`${work.albumArtist}|||${work.albumName}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${getCoverGradient(work.id)} flex-shrink-0 flex items-center justify-center shadow-md`}>
                        <Music className="w-5 h-5 text-white/30" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{work.title}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{work.albumArtist}</span>
                          <span>·</span>
                          <span>{work.trackCount} tracks</span>
                          <span>·</span>
                          <span>{formatDuration(work.totalDuration)}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {work.format} {formatSampleRate(work.sampleRate)}/{work.bitDepth}bit
                          </Badge>
                          {work.year > 0 && <span>{work.year}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); playWork(`${work.albumArtist}|||${work.albumName}`); }}
                        >
                          <Play className="w-4 h-4 text-primary" />
                        </Button>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : (
          /* By Performer mode */
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Performers
              <Badge variant="secondary" className="text-xs">{performers.length}</Badge>
            </h2>
            {performers.length > 0 ? (
              <div className="space-y-2">
                {performers.map(([name, trackCount]) => (
                  <Card key={name} className="bg-card border-border hover:bg-accent/20 transition-colors cursor-pointer group"
                    onClick={() => navigate('artist-detail', { artistId: `local-artist-${name}` })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getCoverGradient(name)} flex-shrink-0 flex items-center justify-center`}>
                          <User className="w-5 h-5 text-white/30" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{name}</p>
                          <p className="text-xs text-muted-foreground">{trackCount} recordings</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No performer information available.</p>
            )}
          </section>
        )}

        {/* All Tracks (expandable) */}
        <Separator className="mb-8" />
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Disc3 className="w-5 h-5" />
            All Recordings
            <Badge variant="secondary" className="text-xs">{composerTracks.length}</Badge>
          </h2>
          <div className="space-y-0.5">
            {composerTracks.map(track => (
              <div
                key={track.id}
                className={`flex items-center gap-3 p-3 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group ${
                  currentTrack?.id === track.id ? 'bg-accent/40' : ''
                }`}
                onClick={() => playTrack(track)}
              >
                <span className="text-sm text-muted-foreground w-8 text-right tabular-nums">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <Music className="w-3 h-3 text-primary" />
                  ) : (
                    <span className="group-hover:hidden">{track.trackNumber}</span>
                  )}
                  <Play className="w-3 h-3 text-primary hidden group-hover:block ml-auto" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{track.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[11px] text-muted-foreground">{track.album}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-[11px] text-muted-foreground">{track.albumArtist || track.artist}</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">
                      {track.format} {formatSampleRate(track.sampleRate)}/{track.bitDepth}bit
                    </Badge>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{formatDuration(track.duration)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Similar Composers / Artists (from web search) */}
        {similarData && similarData.results.length > 0 && (
          <>
            <Separator className="mb-8" />
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-muted-foreground" />
                Related Artists & Composers
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {similarData.results.map((result, i) => (
                  <Card key={i} className="bg-card border-border hover:bg-accent/20 transition-colors">
                    <CardContent className="p-3">
                      <div className={`aspect-square rounded-lg bg-gradient-to-br ${getCoverGradient(result.name)} mb-2 flex items-center justify-center`}>
                        <Music className="w-8 h-8 text-white/25" />
                      </div>
                      <p className="text-sm font-medium truncate">{result.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{result.source}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
