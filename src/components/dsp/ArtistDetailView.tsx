'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { useLocalLibraryStore, type LocalTrack } from '@/store/local-library';
import { formatDuration, formatSampleRate, getCoverGradient, type Track } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play, ArrowLeft, Clock, Heart, Mic, User,
  Music, Star, ChevronRight, Radio, HardDrive,
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
      coverArt: string | null;
      trackCount: number;
    }>();
    for (const lt of artistLocalTracks) {
      const key = `${lt.albumArtist || lt.artist}|||${lt.album}`;
      const existing = albumMap.get(key);
      if (existing) {
        existing.trackCount++;
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
          coverArt: lt.coverArt,
          trackCount: 1,
        });
      }
    }
    return Array.from(albumMap.values());
  }, [artistLocalTracks]);

  // Get genres for this artist
  const artistGenres = React.useMemo(() => {
    const genres = new Set<string>();
    for (const lt of artistLocalTracks) {
      if (lt.genre) genres.add(lt.genre);
    }
    return [...genres].sort();
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
        <p className="text-xs">"{artistName}"</p>
        <Button variant="ghost" size="sm" onClick={() => navigate('browse-artists')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Artists
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6">
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" onClick={() => navigate('browse-artists')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Artists
        </Button>

        {/* Hero */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className={`w-48 h-48 rounded-full bg-gradient-to-br ${getCoverGradient(artistId)} shadow-2xl flex-shrink-0 ring-2 ring-primary/20 flex items-center justify-center`}>
            <User className="w-20 h-20 text-white/20" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{artistName}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
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
              <Badge variant="outline" className="text-[10px]">
                <HardDrive className="w-2.5 h-2.5 mr-0.5" /> Local Artist
              </Badge>
            </div>
            <div className="flex gap-3 mb-4">
              <Button size="sm" onClick={playAll}>
                <Play className="w-4 h-4 mr-2" /> Play All
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Albums', value: artistAlbums.length.toString(), icon: Clock },
            { label: 'Tracks', value: artistTracks.length.toString(), icon: Music },
            { label: 'Genres', value: artistGenres.length.toString(), icon: Star },
          ].map(stat => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-3 flex items-center gap-3">
                <stat.icon className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-lg font-bold tabular-nums">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Discography */}
        {artistAlbums.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Discography</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {artistAlbums.map(album => (
                <div
                  key={album.id}
                  className="group cursor-pointer"
                  onClick={() => navigate('album-detail', { albumId: album.id })}
                >
                  <div className="relative mb-2">
                    {album.coverArt ? (
                      <div className="w-full aspect-square rounded-lg overflow-hidden shadow-lg">
                        <img src={album.coverArt} alt={album.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${getCoverGradient(album.id)} cover-art-hover shadow-lg`} />
                    )}
                    <Button
                      variant="default"
                      size="icon"
                      className="absolute bottom-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0"
                      onClick={(e) => { e.stopPropagation(); playAlbum(`${album.artistName}|||${album.title}`); }}
                    >
                      <Play className="w-3.5 h-3.5 ml-0.5" />
                    </Button>
                  </div>
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{album.title}</p>
                  <p className="text-xs text-muted-foreground">{album.year > 0 ? album.year : ''} · {album.format} {formatSampleRate(album.sampleRate)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Tracks */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">All Tracks</h2>
          <div className="space-y-1">
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
                    <p className="text-xs text-muted-foreground truncate">
                      {track.albumName}
                      {track.composers.length > 0 && ` · ${track.composers[0]}`}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground hidden sm:block">{formatDuration(track.duration)}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Composers */}
        {allComposers.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Composers</h2>
            <div className="flex flex-wrap gap-2">
              {allComposers.map(([name, count]) => (
                <Badge
                  key={name}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent/50 transition-colors px-3 py-1"
                >
                  {name} <span className="text-muted-foreground ml-1">({count})</span>
                </Badge>
              ))}
            </div>
          </section>
        )}
      </div>
    </ScrollArea>
  );
}
