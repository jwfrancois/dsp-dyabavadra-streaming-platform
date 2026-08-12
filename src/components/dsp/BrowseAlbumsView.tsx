'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { albums, getTracksByAlbum } from '@/lib/data';
import { formatDuration, formatSampleRate, getCoverGradient } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Star, Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';

type SortKey = 'title' | 'artist' | 'year' | 'rating';

export function BrowseAlbumsView() {
  const { navigate } = useUIStore();
  const { setQueue } = usePlayerStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState<SortKey>('year');
  const [filterGenre, setFilterGenre] = React.useState('all');

  const allGenres = Array.from(new Set(albums.map(a => a.genre))).sort();

  let filtered = albums.filter(a =>
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

  const playAlbum = (albumId: string) => {
    const albumTracks = getTracksByAlbum(albumId);
    if (albumTracks.length > 0) setQueue(albumTracks, 0);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Albums</h1>
          <Badge variant="secondary" className="text-xs">{filtered.length} albums</Badge>
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
          {filtered.map(album => (
            <div
              key={album.id}
              className="group cursor-pointer"
              onClick={() => navigate('album-detail', { albumId: album.id })}
            >
              <div className="relative mb-2">
                <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${getCoverGradient(album.id)} cover-art-hover shadow-lg`} />
                <Button
                  variant="default"
                  size="icon"
                  className="absolute bottom-2 right-2 h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 shadow-lg"
                  onClick={(e) => { e.stopPropagation(); playAlbum(album.id); }}
                >
                  <Play className="w-4 h-4 ml-0.5" />
                </Button>
                {album.rating >= 9 && (
                  <Badge className="absolute top-2 left-2 text-[10px] bg-primary text-primary-foreground">
                    <Star className="w-2.5 h-2.5 mr-0.5" /> {album.rating}
                  </Badge>
                )}
                <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-black/60 text-white border-0">
                    {album.format} {formatSampleRate(album.sampleRate)}
                  </Badge>
                </div>
              </div>
              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{album.title}</p>
              <p className="text-xs text-muted-foreground truncate">{album.artistName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-muted-foreground">{album.year}</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1">{album.genre}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
