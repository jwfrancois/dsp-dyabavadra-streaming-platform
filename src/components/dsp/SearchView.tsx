'use client';

import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { formatDuration, formatSampleRate, getCoverGradient } from '@/lib/data';
import type { Track } from '@/lib/data';
import type { LocalTrack } from '@/store/local-library';
import { useLocalLibraryStore } from '@/store/local-library';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Play,
  Music,
  X,
  Mic2,
  Disc3,
  Clock,
  ArrowRight,
  User,
  Sparkles,
} from 'lucide-react';

// ── Helpers ──

function localToTrack(t: LocalTrack): Track {
  return {
    id: t.id,
    title: t.title,
    albumId: t.album,
    albumName: t.album,
    artistId: t.artist,
    artistName: t.artist,
    trackNumber: t.trackNumber,
    discNumber: t.discNumber || 0,
    duration: t.duration,
    format: t.format,
    bitDepth: t.bitDepth,
    sampleRate: t.sampleRate,
    channels: t.channels,
    bitrate: t.bitrate,
    filePath: t.filePath,
    fileSize: t.fileSize,
    composers: t.composer ? [t.composer] : [],
    performers: [],
    genre: t.genre,
    loved: false,
    playCount: 0,
    source: 'local',
    isAvailable: true,
    blobUrl: t.blobUrl || undefined,
    storageUrl: t.storageUrl || undefined,
  };
}

function getQualityBadge(format: string, sampleRate: number, bitDepth: number) {
  const fmt = format.toUpperCase();
  const isDSD = ['DSF', 'DFF', 'DSD'].includes(fmt);
  const isHiRes = sampleRate > 48000 || bitDepth > 16;
  const isLossless = ['FLAC', 'WAV', 'AIFF', 'ALAC', 'DSF', 'DFF', 'WavPack', 'APE', 'TAK'].includes(fmt);

  if (isDSD) {
    return { label: 'DSD', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
  }
  if (isHiRes && isLossless) {
    return { label: 'Hi-Res', className: 'bg-violet-500/20 text-violet-400 border-violet-500/30' };
  }
  if (isLossless) {
    return { label: 'Lossless', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  }
  return null;
}

// ── Derived category types ──

interface DerivedArtist {
  name: string;
  trackCount: number;
  genres: string[];
  topTrackId: string;
}

interface DerivedAlbum {
  name: string;
  artist: string;
  year: number;
  trackCount: number;
  genres: string[];
  format: string;
  sampleRate: number;
  bitDepth: number;
  coverArt: string | null;
  topTrackId: string;
}

interface TopResult {
  id: string;
  type: 'track' | 'artist' | 'album';
  title: string;
  subtitle: string;
  track?: LocalTrack;
  artistName?: string;
  albumName?: string;
}

// ── Debounce hook ──

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── Search result row that supports keyboard focus ──

function TrackRow({
  track,
  onPlay,
  queueTracks,
  indexInQueue,
}: {
  track: LocalTrack;
  onPlay: (t: LocalTrack, queue: Track[], idx: number) => void;
  queueTracks: Track[];
  indexInQueue: number;
}) {
  const quality = getQualityBadge(track.format, track.sampleRate, track.bitDepth);
  const ref = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onPlay(track, queueTracks, indexInQueue);
    }
  };

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="button"
      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group focus:outline-none focus:ring-1 focus:ring-ring"
      onClick={() => onPlay(track, queueTracks, indexInQueue)}
      onKeyDown={handleKeyDown}
    >
      {/* Cover / Play icon */}
      <div className="relative w-10 h-10 rounded flex-shrink-0">
        <div className={`w-full h-full rounded bg-gradient-to-br ${getCoverGradient(track.id)} flex items-center justify-center`}>
          <Music className="w-4 h-4 text-white/60" />
        </div>
        <div className="absolute inset-0 rounded flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-4 h-4 text-white fill-white" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary truncate">{track.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {track.artist} · {track.album}
        </p>
      </div>

      {/* Right side: duration + quality */}
      <div className="text-right flex-shrink-0 flex items-center gap-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatDuration(track.duration)}
        </span>
        {quality && (
          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 font-mono ${quality.className}`}>
            {quality.label}
          </Badge>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function SearchView() {
  const { navigate, searchQuery, setSearchQuery } = useUIStore();
  const { setQueue, play } = usePlayerStore();
  const { tracks: localTracks, searchTracks } = useLocalLibraryStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const debouncedQuery = useDebounce(localQuery, 300);

  // Sync from store
  useEffect(() => {
    if (searchQuery !== localQuery) setLocalQuery(searchQuery);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Run search ──
  const trackResults = useMemo(() => {
    if (debouncedQuery.length < 2) return [];
    return searchTracks(debouncedQuery);
  }, [debouncedQuery, searchTracks]);

  // ── Derive artists from track results ──
  const artistResults = useMemo<DerivedArtist[]>(() => {
    const map = new Map<string, { trackCount: number; genres: Set<string>; topTrackId: string }>();
    for (const t of trackResults) {
      const artistName = t.albumArtist || t.artist;
      const existing = map.get(artistName);
      if (existing) {
        existing.trackCount++;
        if (t.genre) existing.genres.add(t.genre);
      } else {
        map.set(artistName, {
          trackCount: 1,
          genres: t.genre ? new Set([t.genre]) : new Set(),
          topTrackId: t.id,
        });
      }
    }
    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        trackCount: data.trackCount,
        genres: [...data.genres].slice(0, 3),
        topTrackId: data.topTrackId,
      }))
      .slice(0, 6);
  }, [trackResults]);

  // ── Derive albums from track results ──
  const albumResults = useMemo<DerivedAlbum[]>(() => {
    const map = new Map<string, {
      name: string; artist: string; year: number; trackCount: number;
      genres: Set<string>; formats: Set<string>; sampleRates: Set<number>;
      bitDepths: Set<number>; coverArt: string | null; topTrackId: string;
    }>();
    for (const t of trackResults) {
      const key = `${t.albumArtist || t.artist}|||${t.album}`;
      const existing = map.get(key);
      if (existing) {
        existing.trackCount++;
        if (t.genre) existing.genres.add(t.genre);
        if (t.format) existing.formats.add(t.format.toUpperCase());
        existing.sampleRates.add(t.sampleRate);
        existing.bitDepths.add(t.bitDepth);
        if (t.year && (!existing.year || t.year > existing.year)) existing.year = t.year;
        if (!existing.coverArt && t.coverArt) existing.coverArt = t.coverArt;
      } else {
        map.set(key, {
          name: t.album,
          artist: t.albumArtist || t.artist,
          year: t.year,
          trackCount: 1,
          genres: t.genre ? new Set([t.genre]) : new Set(),
          formats: t.format ? new Set([t.format.toUpperCase()]) : new Set(),
          sampleRates: new Set([t.sampleRate]),
          bitDepths: new Set([t.bitDepth]),
          coverArt: t.coverArt,
          topTrackId: t.id,
        });
      }
    }
    return Array.from(map.entries())
      .map(([, data]) => {
        const bestFormat = [...data.formats][0] || '';
        const bestRate = Math.max(...data.sampleRates);
        const bestDepth = Math.max(...data.bitDepths);
        return {
          name: data.name,
          artist: data.artist,
          year: data.year,
          trackCount: data.trackCount,
          genres: [...data.genres].slice(0, 3),
          format: bestFormat,
          sampleRate: bestRate,
          bitDepth: bestDepth,
          coverArt: data.coverArt,
          topTrackId: data.topTrackId,
        };
      })
      .slice(0, 6);
  }, [trackResults]);

  // ── Top 3 results across categories ──
  const topResults = useMemo<TopResult[]>(() => {
    const q = debouncedQuery.toLowerCase();
    type ScoredTopResult = TopResult & { score: number };
    const results: ScoredTopResult[] = [];

    // Score track title matches
    for (const t of trackResults.slice(0, 12)) {
      const titleMatch = t.title.toLowerCase().includes(q);
      const score = titleMatch ? 10 : 5;
      results.push({
        id: t.id,
        type: 'track',
        title: t.title,
        subtitle: `${t.artist} · ${t.album}`,
        track: t,
        score,
      });
    }

    // Score artist matches
    for (const a of artistResults) {
      const nameMatch = a.name.toLowerCase().includes(q);
      const score = nameMatch ? 12 : 6;
      results.push({
        id: `artist-${a.name}`,
        type: 'artist',
        title: a.name,
        subtitle: `${a.trackCount} tracks`,
        artistName: a.name,
        score,
      });
    }

    // Score album matches
    for (const a of albumResults) {
      const nameMatch = a.name.toLowerCase().includes(q);
      const score = nameMatch ? 11 : 5;
      results.push({
        id: `album-${a.artist}-${a.name}`,
        type: 'album',
        title: a.name,
        subtitle: `${a.artist}${a.year ? ` · ${a.year}` : ''}`,
        albumName: a.name,
        artistName: a.artist,
        score,
      });
    }

    // Sort by score desc, take top 3, strip score
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ score: _, ...rest }) => rest);
  }, [debouncedQuery, trackResults, artistResults, albumResults]);

  // Convert all track results to Track[] for queue
  const queueTracks = useMemo(() => trackResults.map(localToTrack), [trackResults]);

  const cappedTracks = trackResults.slice(0, 6);
  const hasResults = trackResults.length > 0;
  const hasQuery = debouncedQuery.length >= 2;

  // ── Handlers ──
  const handlePlayTrack = useCallback(
    (track: LocalTrack, queue: Track[], idx: number) => {
      setQueue(queue, idx);
    },
    [setQueue]
  );

  const handleArtistClick = useCallback(
    (artistName: string) => {
      navigate('artist-detail', { artistId: artistName });
    },
    [navigate]
  );

  const handleAlbumClick = useCallback(
    (albumName: string, artistName: string) => {
      navigate('album-detail', { albumId: `${artistName}|||${albumName}` });
    },
    [navigate]
  );

  const handleTopResultClick = useCallback(
    (result: TopResult) => {
      if (result.type === 'track' && result.track) {
        const idx = queueTracks.findIndex((t) => t.id === result.track!.id);
        setQueue(queueTracks, idx >= 0 ? idx : 0);
      } else if (result.type === 'artist' && result.artistName) {
        navigate('artist-detail', { artistId: result.artistName });
      } else if (result.type === 'album' && result.artistName && result.albumName) {
        navigate('album-detail', { albumId: `${result.artistName}|||${result.albumName}` });
      }
    },
    [queueTracks, setQueue, navigate]
  );

  // ── Type badge helper ──
  function typeBadge(type: 'track' | 'artist' | 'album') {
    const config = {
      track: { label: 'Track', icon: Music, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      artist: { label: 'Artist', icon: User, className: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
      album: { label: 'Album', icon: Disc3, className: 'bg-green-500/20 text-green-400 border-green-500/30' },
    }[type];
    return config;
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-4xl mx-auto">
        {/* ── Search Input ── */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search tracks, artists, albums…"
            value={localQuery}
            onChange={(e) => {
              setLocalQuery(e.target.value);
              setSearchQuery(e.target.value);
            }}
            className="pl-12 pr-10 h-12 text-lg bg-card border-border rounded-xl"
            autoFocus
          />
          {localQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => {
                setLocalQuery('');
                setSearchQuery('');
                inputRef.current?.focus();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* ── Empty / Idle State ── */}
        {!hasQuery && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-card flex items-center justify-center">
              <Search className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-semibold text-primary mb-2">Search your library</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Find tracks, artists, and albums from your local music collection.
              Start typing to see results across all categories.
            </p>
            {localTracks.length > 0 && (
              <p className="text-xs text-muted-foreground/60 mt-4">
                {localTracks.length.toLocaleString()} tracks indexed
              </p>
            )}
          </div>
        )}

        {/* ── No Results State ── */}
        {hasQuery && !hasResults && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-card flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-semibold text-primary mb-2">No results found</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              We couldn&rsquo;t find anything matching &ldquo;{debouncedQuery}&rdquo; in your library.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="text-xs text-muted-foreground/70">Try:</span>
              {['different keywords', 'a shorter query', 'composer names', 'genre names'].map(
                (suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="text-xs text-muted-foreground cursor-pointer hover:bg-accent/30 transition-colors"
                    onClick={() => {
                      setLocalQuery(suggestion);
                      setSearchQuery(suggestion);
                      inputRef.current?.focus();
                    }}
                  >
                    {suggestion}
                  </Badge>
                )
              )}
            </div>
          </div>
        )}

        {/* ── Search Results ── */}
        {hasQuery && hasResults && (
          <div className="space-y-8">
            {/* ── Top Results ── */}
            {topResults.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">
                    Top Results
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {topResults.map((result) => {
                    const badge = typeBadge(result.type);
                    const Icon = badge.icon;
                    return (
                      <div
                        key={result.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-card hover:bg-accent/30 cursor-pointer transition-colors group"
                        onClick={() => handleTopResultClick(result)}
                      >
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                          {result.type === 'track' && result.track && (
                            <div className={`w-full h-full rounded-lg bg-gradient-to-br ${getCoverGradient(result.track.id)} flex items-center justify-center`}>
                              <Music className="w-5 h-5 text-white/60" />
                            </div>
                          )}
                          {result.type === 'artist' && (
                            <User className="w-5 h-5 text-muted-foreground" />
                          )}
                          {result.type === 'album' && (
                            <Disc3 className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary truncate">{result.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                        </div>
                        {/* Type badge + Play */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${badge.className}`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {badge.label}
                          </Badge>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground">
                            <Play className="w-3.5 h-3.5 fill-primary-foreground" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <Separator className="opacity-30" />

            {/* ── Tracks Section ── */}
            {cappedTracks.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                    <Music className="w-4 h-4 text-muted-foreground" />
                    Tracks
                    <span className="text-muted-foreground font-normal normal-case">
                      ({trackResults.length})
                    </span>
                  </h2>
                  {trackResults.length > 6 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-primary h-7"
                      onClick={() => navigate('browse-tracks')}
                    >
                      See all
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
                <div className="space-y-0.5">
                  {cappedTracks.map((track) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      onPlay={handlePlayTrack}
                      queueTracks={queueTracks}
                      indexInQueue={trackResults.indexOf(track)}
                    />
                  ))}
                </div>
              </section>
            )}

            <Separator className="opacity-30" />

            {/* ── Artists Section ── */}
            {artistResults.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Artists
                    <span className="text-muted-foreground font-normal normal-case">
                      ({artistResults.length})
                    </span>
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {artistResults.map((artist) => {
                    const topTrack = trackResults.find((t) => t.id === artist.topTrackId);
                    const gradient = topTrack ? getCoverGradient(topTrack.id) : 'from-slate-800 to-zinc-900';
                    return (
                      <Card
                        key={artist.name}
                        className="bg-card border-border/50 hover:border-border cursor-pointer transition-colors group"
                        onClick={() => handleArtistClick(artist.name)}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-full flex-shrink-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}
                          >
                            <Mic2 className="w-5 h-5 text-white/70" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-primary truncate">{artist.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {artist.trackCount} track{artist.trackCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </CardContent>
                        {/* Genre tags */}
                        {artist.genres.length > 0 && (
                          <div className="px-4 pb-3 flex flex-wrap gap-1">
                            {artist.genres.map((g) => (
                              <Badge
                                key={g}
                                variant="outline"
                                className="text-[9px] px-1.5 py-0 text-muted-foreground border-border/50"
                              >
                                {g}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            <Separator className="opacity-30" />

            {/* ── Albums Section ── */}
            {albumResults.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                    <Disc3 className="w-4 h-4 text-muted-foreground" />
                    Albums
                    <span className="text-muted-foreground font-normal normal-case">
                      ({albumResults.length})
                    </span>
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {albumResults.map((album) => {
                    const quality = getQualityBadge(album.format, album.sampleRate, album.bitDepth);
                    const gradient = album.coverArt
                      ? ''
                      : getCoverGradient(album.topTrackId);
                    return (
                      <Card
                        key={`${album.artist}-${album.name}`}
                        className="bg-card border-border/50 hover:border-border cursor-pointer transition-colors group overflow-hidden"
                        onClick={() => handleAlbumClick(album.name, album.artist)}
                      >
                        {/* Cover art area */}
                        <div className="aspect-square relative">
                          {album.coverArt ? (
                            <img
                              src={album.coverArt}
                              alt={album.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
                            >
                              <Disc3 className="w-10 h-10 text-white/30" />
                            </div>
                          )}
                          {/* Play overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              <Play className="w-5 h-5 fill-primary-foreground" />
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <p className="text-sm font-medium text-primary truncate">{album.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {album.artist}
                            {album.year ? ` · ${album.year}` : ''}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10px] text-muted-foreground">
                              {album.trackCount} tracks
                            </span>
                            {quality && (
                              <Badge
                                variant="outline"
                                className={`text-[9px] px-1.5 py-0 font-mono ${quality.className}`}
                              >
                                {quality.label}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
