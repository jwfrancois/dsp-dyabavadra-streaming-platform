'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { useLocalLibraryStore, type LocalTrack } from '@/store/local-library';
import { type Track, type Album } from '@/lib/data';
import { formatDuration, formatSampleRate, getCoverGradient } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Star, Search, SlidersHorizontal, HardDrive } from 'lucide-react';
import { Input } from '@/components/ui/input';

type SortKey = 'title' | 'artist' | 'year' | 'rating';

/** Convert a LocalTrack to the Album format for display */
function localTrackToDisplayAlbum(lt: LocalTrack): Album {
  return {
    id: `local-album-${lt.album}-${lt.artist}`,
    title: lt.album,
    artistId: lt.artist,
    artistName: lt.artist,
    imageUrl: '',
    year: lt.year,
    genre: lt.genre,
    tracks: [],
    duration: lt.duration,
    format: lt.format,
    bitDepth: lt.bitDepth,
    sampleRate: lt.sampleRate,
    channels: lt.channels,
    label: '',
    type: 'album',
    rating: 0,
  };
}

export function BrowseAlbumsView() {
  const { navigate } = useUIStore();
  const { setQueue } = usePlayerStore();
  const localTracks = useLocalLibraryStore(s => s.tracks);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState<SortKey>('year');
  const [filterGenre, setFilterGenre] = React.useState('all');
  const [showLocal, setShowLocal] = React.useState(true);

  // Build album list from local tracks only (mock data removed)
  const localAlbums = React.useMemo(() => {
    const albumMap = new Map<string, { lt: LocalTrack; key: string }>();
    for (const lt of localTracks) {
      const key = `${lt.albumArtist || lt.artist}|||${lt.album}`;
      if (!albumMap.has(key)) {
        albumMap.set(key, { lt, key });
      }
    }
    return Array.from(albumMap.values()).map(({ lt }) => localTrackToDisplayAlbum(lt));
  }, [localTracks]);

  const allAlbums = React.useMemo(() => {
    return localAlbums;
  }, [localAlbums]);

  const allGenres = Array.from(new Set(allAlbums.map(a => a.genre))).sort();

  let filtered = allAlbums.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.artistName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filterGenre !== 'all') {
    filtered = filtered.filter(a => a.genre === filterGenre);
  }

  filtered = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'title': return a.title.localeCompare(b.title);
      case 'artist': return a.artistName.localeCompare(b.artistName);
      case 'year': return b.year - a.year;
      case 'rating': return b.rating - a.rating;
      default: return 0;
    }
  });

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Albums</h1>
          <div className="flex items-center gap-2">
            {localTracks.length > 0 && (
              <Button
                variant={showLocal ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => setShowLocal(!showLocal)}
              >
                <HardDrive className="w-3.5 h-3.5" />
                Local Library
              </Button>
            )}
            <Badge variant="secondary" className="text-xs">{filtered.length} albums</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <Select value={filterGenre} onValueChange={setFilterGenre}>
            <SelectTrigger className="w-40 bg-card border-border">
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {allGenres.map(g => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="w-40 bg-card border-border">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="year">Year (Newest)</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="artist">Artist</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map(album => {
            // Find cover art from local tracks if available
            const localCover = localTracks.find(lt => lt.album === album.title && lt.artist === album.artistName)?.coverArt;

            return (
              <div
                key={album.id}
                className="group cursor-pointer"
                onClick={() => {
                  navigate('album-detail', { albumId: album.id });
                }}
              >
                <div className="relative mb-2">
                  {localCover ? (
                    <div className="w-full aspect-square rounded-lg overflow-hidden shadow-lg">
                      <img src={localCover} alt={album.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${getCoverGradient(album.id)} cover-art-hover shadow-lg`} />
                  )}
                  <Button
                    variant="default"
                    size="icon"
                    className="absolute bottom-2 right-2 h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Play local album tracks
                      const albumLtTracks = localTracks
                        .filter(lt => lt.album === album.title && lt.artist === album.artistName)
                        .sort((a, b) => a.trackNumber - b.trackNumber);
                      if (albumLtTracks.length > 0) {
                        const queue = albumLtTracks.map(lt => ({
                          id: lt.id, title: lt.title, albumId: lt.album, albumName: lt.album,
                          artistId: lt.artist, artistName: lt.artist, trackNumber: lt.trackNumber,
                          discNumber: lt.discNumber, duration: lt.duration, format: lt.format,
                          bitDepth: lt.bitDepth, sampleRate: lt.sampleRate, channels: lt.channels,
                          bitrate: lt.bitrate, filePath: lt.filePath, fileSize: lt.fileSize,
                          composers: lt.composer ? [lt.composer] : [], performers: [],
                          genre: lt.genre, loved: false, playCount: 0, source: 'local' as const, isAvailable: true,
                        }));
                        setQueue(queue, 0);
                      }
                    }}
                  >
                    <Play className="w-4 h-4 ml-0.5" />
                  </Button>
                  {album.rating >= 9 && (
                    <Badge className="absolute top-2 left-2 text-[10px] bg-primary text-primary-foreground">
                      <Star className="w-2.5 h-2.5 mr-0.5" /> {album.rating}
                    </Badge>
                  )}
                  <Badge variant="outline" className="absolute top-2 right-2 text-[9px] h-4 px-1 bg-black/60 text-white border-0">
                    <HardDrive className="w-2.5 h-2.5 mr-0.5" /> Local
                  </Badge>
                  <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-black/60 text-white border-0">
                      {album.format} {formatSampleRate(album.sampleRate)}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{album.title}</p>
                <p className="text-xs text-muted-foreground truncate">{album.artistName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {album.year > 0 && <span className="text-[11px] text-muted-foreground">{album.year}</span>}
                  <Badge variant="outline" className="text-[10px] h-4 px-1">{album.genre}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
