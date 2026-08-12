'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { artists, getAlbumsByArtist } from '@/lib/data';
import { getCoverGradient } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';

export function BrowseArtistsView() {
  const { navigate } = useUIStore();
  const { setQueue } = usePlayerStore();
  const [searchQuery, setSearchQuery] = React.useState('');

  const filtered = artists.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Artists</h1>
          <Badge variant="secondary" className="text-xs">{artists.length} artists</Badge>
        </div>

        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filtered.map(artist => {
            const albumCount = getAlbumsByArtist(artist.id).length;
            return (
              <div
                key={artist.id}
                className="group text-center cursor-pointer"
                onClick={() => navigate('artist-detail', { artistId: artist.id })}
              >
                <div className={`w-full aspect-square rounded-full bg-gradient-to-br ${getCoverGradient(artist.id)} mx-auto mb-3 cover-art-hover shadow-xl ring-2 ring-transparent group-hover:ring-primary/30 transition-all`} />
                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{artist.name}</p>
                <p className="text-xs text-muted-foreground">{albumCount} album{albumCount !== 1 ? 's' : ''}</p>
                <div className="flex flex-wrap gap-1 justify-center mt-1.5">
                  {artist.genres.slice(0, 2).map(g => (
                    <Badge key={g} variant="secondary" className="text-[10px] px-1.5 py-0">{g}</Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
