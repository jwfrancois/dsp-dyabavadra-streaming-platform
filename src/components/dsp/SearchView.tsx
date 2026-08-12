'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { searchLibrary, formatDuration, getCoverGradient } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, Play, Users, Disc3, Music, X, TrendingUp } from 'lucide-react';

export function SearchView() {
  const { navigate, searchQuery, setSearchQuery } = useUIStore();
  const { play } = usePlayerStore();
  const [localQuery, setLocalQuery] = React.useState(searchQuery);

  const results = localQuery.length > 1 ? searchLibrary(localQuery) : { artists: [], albums: [], tracks: [] };
  const hasResults = results.artists.length > 0 || results.albums.length > 0 || results.tracks.length > 0;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Search</h1>

        {/* Search Input */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search artists, albums, tracks..."
            value={localQuery}
            onChange={(e) => { setLocalQuery(e.target.value); setSearchQuery(e.target.value); }}
            className="pl-12 h-12 text-lg bg-card border-border rounded-xl"
            autoFocus
          />
          {localQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => { setLocalQuery(''); setSearchQuery(''); }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {!localQuery && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg text-muted-foreground">Start typing to search</p>
            <p className="text-sm text-muted-foreground mt-1">Search across your entire library</p>
          </div>
        )}

        {localQuery && !hasResults && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg text-muted-foreground">No results found</p>
            <p className="text-sm text-muted-foreground mt-1">Try different keywords</p>
          </div>
        )}

        {/* Artists */}
        {results.artists.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> Artists ({results.artists.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {results.artists.map(artist => (
                <div
                  key={artist.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                  onClick={() => navigate('artist-detail', { artistId: artist.id })}
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getCoverGradient(artist.id)} flex-shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{artist.name}</p>
                    <p className="text-xs text-muted-foreground">{artist.albumCount} albums</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Albums */}
        {results.albums.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Disc3 className="w-4 h-4" /> Albums ({results.albums.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {results.albums.map(album => (
                <div
                  key={album.id}
                  className="group cursor-pointer"
                  onClick={() => navigate('album-detail', { albumId: album.id })}
                >
                  <div className="relative mb-2">
                    <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${getCoverGradient(album.id)} cover-art-hover`} />
                  </div>
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{album.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{album.artistName} · {album.year}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tracks */}
        {results.tracks.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Music className="w-4 h-4" /> Tracks ({results.tracks.length})
            </h2>
            <div className="space-y-0.5">
              {results.tracks.slice(0, 20).map(track => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                  onClick={() => play(track)}
                >
                  <div className={`w-10 h-10 rounded bg-gradient-to-br ${getCoverGradient(track.id)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artistName} · {track.albumName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs text-muted-foreground">{formatDuration(track.duration)}</span>
                    <div className="flex gap-1 mt-0.5 justify-end">
                      <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">{track.format}</Badge>
                    </div>
                  </div>
                </div>
              ))}
              {results.tracks.length > 20 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  and {results.tracks.length - 20} more tracks...
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </ScrollArea>
  );
}
