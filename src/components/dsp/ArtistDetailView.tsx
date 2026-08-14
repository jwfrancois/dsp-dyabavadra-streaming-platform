'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { useLocalLibraryStore, type LocalTrack } from '@/store/local-library';
import { formatDuration, formatSampleRate, formatFileSize, getCoverGradient, type Track } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useArtistBio, useDiscography, useArtistImage, useSimilarArtists } from '@/lib/use-music-metadata';
import {
  Play, ArrowLeft, Clock, Heart, Mic2, User,
  Music, Star, ChevronRight, Radio, HardDrive, BookOpen,
  ExternalLink, Globe, Disc3, Calendar, Award,
  Users, Waves,
} from 'lucide-react';

/** Convert a LocalTrack to the Track format for the player queue */
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
    blobUrl: (lt as any).blobUrl as string | undefined,
  };
}

export function ArtistDetailView() {
  const { viewParams, navigate } = useUIStore();
  const { play, setQueue, currentTrack, isPlaying } = usePlayerStore();
  const localTracks = useLocalLibraryStore(s => s.tracks);
  const artistId = viewParams.artistId;

  // Parse artistId: format is "local-artist-{artistName}"
  const artistName = React.useMemo(() => {
    if (!artistId || !artistId.startsWith('local-artist-')) return null;
    return artistId.replace(/^local-artist-/, '');
  }, [artistId]);

  // Web metadata
  const { data: artistBio, loading: bioLoading, error: bioError } = useArtistBio(artistName || '');
  const { data: artistImage, loading: artistImageLoading } = useArtistImage(artistName || '');
  const { data: discographyData, loading: discogLoading } = useDiscography(artistName || '');
  const { data: similarArtists, loading: similarLoading } = useSimilarArtists(artistName || '');

  // Get all tracks for this artist from the local library
  const artistLocalTracks = React.useMemo(() => {
    if (!artistName) return [];
    return localTracks
      .filter(t => t.artist === artistName || t.albumArtist === artistName)
      .sort((a, b) => {
        const albumOrder = a.album.localeCompare(b.album);
        if (albumOrder !== 0) return albumOrder;
        return (a.discNumber - b.discNumber) || (a.trackNumber - b.trackNumber);
      });
  }, [localTracks, artistName]);

  // Convert to Track format for player
  const artistTracks = React.useMemo(() => artistLocalTracks.map(localTrackToTrack), [artistLocalTracks]);

  // Derive albums for this artist
  const artistAlbums = React.useMemo(() => {
    const albumMap = new Map<string, {
      id: string;
      title: string;
      artistName: string;
      year: number;
      genre: string;
      format: string;
      sampleRate: number;
      bitDepth: number;
      channels: number;
      coverArt: string | null;
      trackCount: number;
      totalDuration: number;
    }>();
    for (const lt of artistLocalTracks) {
      const key = `${lt.albumArtist || lt.artist}|||${lt.album}`;
      const existing = albumMap.get(key);
      if (existing) {
        existing.trackCount++;
        existing.totalDuration += lt.duration;
        if (!existing.coverArt && lt.coverArt) existing.coverArt = lt.coverArt;
      } else {
        albumMap.set(key, {
          id: `local-album-${lt.albumArtist || lt.artist}|||${lt.album}`,
          title: lt.album,
          artistName: lt.albumArtist || lt.artist,
          year: lt.year,
          genre: lt.genre,
          format: lt.format,
          sampleRate: lt.sampleRate,
          bitDepth: lt.bitDepth,
          channels: lt.channels,
          coverArt: lt.coverArt,
          trackCount: 1,
          totalDuration: lt.duration,
        });
      }
    }
    return Array.from(albumMap.values()).sort((a, b) => b.year - a.year);
  }, [artistLocalTracks]);

  // Get genres for this artist
  const artistGenres = React.useMemo(() => {
    const genres = new Set<string>();
    for (const lt of artistLocalTracks) {
      if (lt.genre) genres.add(lt.genre);
    }
    return [...genres].sort();
  }, [artistLocalTracks]);

  // Aggregate formats
  const formatBreakdown = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const lt of artistLocalTracks) {
      const fmt = lt.format.toUpperCase();
      counts[fmt] = (counts[fmt] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [artistLocalTracks]);

  // Aggregate composers
  const allComposers = React.useMemo(() => {
    const compMap = new Map<string, number>();
    for (const lt of artistLocalTracks) {
      if (lt.composer) {
        compMap.set(lt.composer, (compMap.get(lt.composer) || 0) + 1);
      }
    }
    return Array.from(compMap.entries()).sort((a, b) => b[1] - a[1]);
  }, [artistLocalTracks]);

  // Total library stats for this artist
  const totalDuration = React.useMemo(() => artistLocalTracks.reduce((s, t) => s + t.duration, 0), [artistLocalTracks]);
  const totalSize = React.useMemo(() => artistLocalTracks.reduce((s, t) => s + t.fileSize, 0), [artistLocalTracks]);

  const playAll = () => {
    if (artistTracks.length > 0) setQueue(artistTracks, 0);
  };

  const playAlbum = (albumKey: string) => {
    const albumTrackList = artistTracks.filter(t => {
      const key = `${t.artistName}|||${t.albumName}`;
      return key === albumKey;
    });
    if (albumTrackList.length > 0) setQueue(albumTrackList, 0);
  };

  // Shuffle play
  const shuffleAll = () => {
    if (artistTracks.length > 0) {
      const shuffled = [...artistTracks].sort(() => Math.random() - 0.5);
      setQueue(shuffled, 0);
    }
  };

  // Not found state
  if (!artistName) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <User className="w-12 h-12" />
        <p>Artist not found</p>
        <Button variant="ghost" size="sm" onClick={() => navigate('browse-artists')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Artists
        </Button>
      </div>
    );
  }

  if (artistLocalTracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <User className="w-12 h-12" />
        <p>No tracks found for this artist</p>
        <p className="text-xs">&quot;{artistName}&quot;</p>
        <Button variant="ghost" size="sm" onClick={() => navigate('browse-artists')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Artists
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ScrollArea className="h-full">
        <div className="max-w-5xl mx-auto p-6">
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground hover:text-foreground" onClick={() => navigate('browse-artists')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Artists
          </Button>

          {/* ── HERO SECTION ── */}
          <div className="relative mb-8 rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-border/50">
            {/* Background gradient blur effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${getCoverGradient(artistId)} opacity-20 blur-3xl`} />

            <div className="relative flex flex-col md:flex-row gap-6 p-6 md:p-8">
              {/* Artist Photo */}
              <div className="flex-shrink-0 self-center">
                <div className="w-48 h-48 md:w-56 md:h-56 rounded-full shadow-2xl relative overflow-hidden ring-2 ring-primary/20 ring-offset-4 ring-offset-transparent">
                  {artistImageLoading ? (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${getCoverGradient(artistId)} flex items-center justify-center`}>
                      <User className="w-20 h-20 text-white/20" />
                    </div>
                  )}
                  {/* Shine overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
                </div>
              </div>

              {/* Artist Info */}
              <div className="flex-1 text-center md:text-left flex flex-col justify-center">
                <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start">
                  <Badge variant="outline" className="text-[10px]">
                    <HardDrive className="w-2.5 h-2.5 mr-0.5" /> Local Artist
                  </Badge>
                  {artistGenres.map(g => (
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

                <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">{artistName}</h1>

                <p className="text-sm text-muted-foreground mb-4">
                  {artistAlbums.length} album{artistAlbums.length !== 1 ? 's' : ''} · {artistTracks.length} track{artistTracks.length !== 1 ? 's' : ''} · {formatDuration(totalDuration)} total
                </p>

                <div className="flex gap-3 mb-4 justify-center md:justify-start">
                  <Button onClick={playAll} className="shadow-lg shadow-primary/20">
                    <Play className="w-4 h-4 mr-2" /> Play All
                  </Button>
                  <Button size="sm" variant="outline" onClick={shuffleAll}>
                    <Radio className="w-4 h-4 mr-2" /> Shuffle
                  </Button>
                  <Button size="sm" variant="outline">
                    <Heart className="w-4 h-4 mr-2" /> Follow
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate('radio')}>
                    <Radio className="w-4 h-4 mr-2" /> Artist Radio
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* ── STATS ROW ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Albums', value: artistAlbums.length.toString(), icon: Disc3, color: 'text-purple-400' },
              { label: 'Tracks', value: artistTracks.length.toString(), icon: Music, color: 'text-blue-400' },
              { label: 'Total Duration', value: formatDuration(totalDuration), icon: Clock, color: 'text-green-400' },
              { label: 'Genres', value: artistGenres.length.toString(), icon: Star, color: 'text-amber-400' },
            ].map(stat => (
              <Card key={stat.label} className="bg-card/80 backdrop-blur border-border hover:border-primary/20 transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <div>
                    <p className="text-lg font-bold tabular-nums">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── ARTIST BIOGRAPHY (from web) ── */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> About {artistName}
            </h2>
            {bioLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Fetching biography from web...
              </div>
            )}
            {bioError && (
              <p className="text-xs text-muted-foreground py-2">Unable to fetch biography: {bioError}</p>
            )}
            {artistBio && !bioLoading && (
              <div className="space-y-3">
                {artistBio.summaries.map((s, i) => (
                  <Card key={i} className="bg-card/80 backdrop-blur border-border hover:border-primary/20 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="w-3 h-3 text-muted-foreground" />
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.source}</p>
                          </div>
                          <h3 className="text-sm font-medium mb-2">{s.title}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">{s.snippet}</p>
                        </div>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex-shrink-0 inline-flex items-center gap-1 mt-1"
                        >
                          Full article <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {artistBio.readMoreUrl && (
                  <a
                    href={artistBio.readMoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Read full biography <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </section>

          {/* ── WEB DISCOGRAPHY ── */}
          {discographyData && !discogLoading && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" /> Discography (Web)
              </h2>
              <div className="space-y-2">
                {(discographyData as any).sources?.map((s: { title: string; snippet: string; url: string; source: string }, i: number) => (
                  <Card key={i} className="bg-card/80 backdrop-blur border-border">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">{s.source}</p>
                          <h3 className="text-sm font-medium mb-1">{s.title}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{s.snippet}</p>
                        </div>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex-shrink-0 inline-flex items-center gap-1">
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* ── SIMILAR ARTISTS ── */}
          {similarArtists && !similarLoading && similarArtists.results.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" /> Related Artists
              </h2>
              <div className="flex flex-wrap gap-2">
                {similarArtists.results.map((sa, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="px-3 py-1.5 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => navigate('search', { query: sa.name })}
                  >
                    {sa.name}
                    <ExternalLink className="w-2.5 h-2.5 ml-1 opacity-50" />
                  </Badge>
                ))}
              </div>
            </section>
          )}

          <Separator className="my-6" />

          {/* ── LOCAL DISCOGRAPHY ── */}
          {artistAlbums.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Disc3 className="w-5 h-5 text-primary" /> Discography
                <Badge variant="outline" className="text-[10px]">{artistAlbums.length} album{artistAlbums.length !== 1 ? 's' : ''}</Badge>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {artistAlbums.map(album => (
                  <div
                    key={album.id}
                    className="group cursor-pointer"
                    onClick={() => navigate('album-detail', { albumId: album.id })}
                  >
                    <div className="relative mb-2">
                      {album.coverArt ? (
                        <div className="w-full aspect-square rounded-lg overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow">
                          <img src={album.coverArt} alt={album.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${getCoverGradient(album.id)} shadow-lg group-hover:shadow-xl transition-shadow`} />
                      )}
                      {/* Shine overlay */}
                      <div className="absolute inset-0 rounded-lg bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />
                      {/* Format badge */}
                      <Badge variant="secondary" className="absolute top-2 left-2 text-[9px] font-mono bg-black/50 backdrop-blur border-0">
                        {album.format} {formatSampleRate(album.sampleRate)}
                      </Badge>
                      {/* Play button */}
                      <Button
                        variant="default"
                        size="icon"
                        className="absolute bottom-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0 shadow-lg"
                        onClick={(e) => { e.stopPropagation(); playAlbum(`${album.artistName}|||${album.title}`); }}
                      >
                        <Play className="w-3.5 h-3.5 ml-0.5" />
                      </Button>
                    </div>
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{album.title}</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-muted-foreground">
                        {album.year > 0 ? album.year : 'Unknown year'}
                      </p>
                      <span className="text-muted-foreground/30">·</span>
                      <p className="text-xs text-muted-foreground">
                        {album.trackCount} track{album.trackCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── FORMAT BREAKDOWN ── */}
          {formatBreakdown.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Waves className="w-5 h-5 text-muted-foreground" /> Audio Formats
              </h2>
              <div className="flex flex-wrap gap-2">
                {formatBreakdown.map(([fmt, count]) => (
                  <Badge key={fmt} variant="outline" className="px-3 py-1.5 font-mono text-xs">
                    {fmt} <span className="text-muted-foreground ml-1">({count})</span>
                  </Badge>
                ))}
                <Badge variant="outline" className="px-3 py-1.5 text-xs">
                  <HardDrive className="w-3 h-3 mr-1" /> Total: {formatFileSize(totalSize)}
                </Badge>
              </div>
            </section>
          )}

          <Separator className="my-6" />

          {/* ── ALL TRACKS ── */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" /> All Tracks
              </h2>
              <span className="text-xs text-muted-foreground">{artistTracks.length} tracks · {formatDuration(totalDuration)}</span>
            </div>
            <div className="space-y-0.5">
              {artistTracks.map((track, i) => {
                const lt = artistLocalTracks[i];
                return (
                  <div
                    key={track.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group ${
                      currentTrack?.id === track.id ? 'bg-accent/40' : ''
                    }`}
                    onClick={() => play(track)}
                  >
                    <span className="text-sm text-muted-foreground w-6 text-right tabular-nums">
                      {currentTrack?.id === track.id && isPlaying ? (
                        <Music className="w-3 h-3 text-primary" />
                      ) : (
                        <span className="group-hover:hidden">{i + 1}</span>
                      )}
                      <Play className="w-3 h-3 text-primary hidden group-hover:block ml-auto" />
                    </span>
                    {lt?.coverArt ? (
                      <img src={lt.coverArt} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className={`w-10 h-10 rounded bg-gradient-to-br ${getCoverGradient(track.id)} flex-shrink-0`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{track.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground truncate">{track.albumName}</span>
                        <span className="text-[11px] text-muted-foreground/50 hidden sm:inline">·</span>
                        <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">{track.format} {formatSampleRate(track.sampleRate)}/{track.bitDepth}-bit</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground hidden sm:block tabular-nums">{formatDuration(track.duration)}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── COMPOSERS ── */}
          {allComposers.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Mic2 className="w-5 h-5 text-muted-foreground" /> Composers
              </h2>
              <div className="flex flex-wrap gap-2">
                {allComposers.map(([name, count]) => (
                  <Badge
                    key={name}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent/50 transition-colors px-3 py-1.5"
                    onClick={() => navigate('search', { query: name })}
                  >
                    {name} <span className="text-muted-foreground ml-1">({count})</span>
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* ── ARTIST IMAGE SOURCE ── */}
          {artistImage && !artistImageLoading && (
            <section className="mb-8">
              <Card className="bg-card/80 backdrop-blur border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Artist information sourced from {artistImage.source}</p>
                  </div>
                  <a
                    href={artistImage.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View artist page <ExternalLink className="w-3 h-3" />
                  </a>
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
