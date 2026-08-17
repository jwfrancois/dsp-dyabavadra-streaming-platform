'use client';

import React, { useMemo, useState } from 'react';
import { useUIStore } from '@/store/ui';
import { useLocalLibraryStore } from '@/store/local-library';
import { formatDuration, getCoverGradient } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search, Music, BookOpen, Disc3, Clock, ArrowRight,
  Workflow, User, Sparkles,
} from 'lucide-react';

export function ComposersBrowseView() {
  const { navigate } = useUIStore();
  const localTracks = useLocalLibraryStore(s => s.tracks);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique composers from local tracks
  const composers = useMemo(() => {
    const map = new Map<string, {
      name: string;
      trackCount: number;
      albums: Set<string>;
      totalDuration: number;
      genres: Set<string>;
      performers: Set<string>;
      formats: Set<string>;
      hasCoverArt: boolean;
      coverArtUrl: string | null;
    }>();

    for (const t of localTracks) {
      if (!t.composer) continue;
      const name = t.composer.trim();
      if (!name) continue;

      const existing = map.get(name);
      if (existing) {
        existing.trackCount++;
        existing.totalDuration += t.duration;
        existing.albums.add(t.album);
        if (t.genre) existing.genres.add(t.genre);
        const performer = t.albumArtist || t.artist;
        if (performer && !performer.toLowerCase().includes(name.toLowerCase())) {
          existing.performers.add(performer);
        }
        existing.formats.add(t.format.toUpperCase());
        if (!existing.hasCoverArt && t.coverArt) {
          existing.hasCoverArt = true;
          existing.coverArtUrl = t.coverArt;
        }
      } else {
        map.set(name, {
          name,
          trackCount: 1,
          albums: new Set([t.album]),
          totalDuration: t.duration,
          genres: new Set(t.genre ? [t.genre] : []),
          performers: new Set(),
          formats: new Set([t.format.toUpperCase()]),
          hasCoverArt: !!t.coverArt,
          coverArtUrl: t.coverArt || null,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.trackCount - a.trackCount);
  }, [localTracks]);

  // Filter by search query
  const filteredComposers = useMemo(() => {
    if (!searchQuery.trim()) return composers;
    const q = searchQuery.toLowerCase();
    return composers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      [...c.genres].some(g => g.toLowerCase().includes(q))
    );
  }, [composers, searchQuery]);

  // Stats
  const totalComposers = composers.length;
  const totalRecordings = composers.reduce((s, c) => s + c.trackCount, 0);
  const totalWorks = composers.reduce((s, c) => s + c.albums.size, 0);

  // Top genres across all composers
  const topGenres = useMemo(() => {
    const genreMap = new Map<string, number>();
    for (const c of composers) {
      for (const g of c.genres) {
        genreMap.set(g, (genreMap.get(g) || 0) + c.trackCount);
      }
    }
    return Array.from(genreMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [composers]);

  if (composers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-2">
          <Workflow className="w-10 h-10 opacity-40" />
        </div>
        <p className="text-lg font-medium">No Composers Found</p>
        <p className="text-sm text-center max-w-md">
          Your library does not contain any tracks with composer metadata.
          Ensure your music files have the composer tag filled (e.g., in FLAC or MP3 ID3 tags).
        </p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('home')}>
          <ArrowRight className="w-4 h-4 mr-2" /> Back to Home
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Workflow className="w-6 h-6 text-primary" />
              Composers
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Browse your library by composer — classical, soundtrack, and more
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search composers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-card/80 border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Workflow className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{totalComposers}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Composers</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Disc3 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{totalRecordings}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Recordings</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{totalWorks}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Works / Albums</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{formatDuration(composers.reduce((s, c) => s + c.totalDuration, 0))}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Total Duration</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Genre Quick Filter */}
        {topGenres.length > 1 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Top Genres
            </h2>
            <div className="flex flex-wrap gap-2">
              {topGenres.map(([genre, count]) => (
                <Badge
                  key={genre}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => setSearchQuery(genre)}
                >
                  {genre}
                  <span className="ml-1 text-muted-foreground/60">{count}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Composer Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {filteredComposers.length} Composer{filteredComposers.length !== 1 ? 's' : ''}
            </h2>
            {searchQuery && (
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredComposers.map(composer => (
              <Card
                key={composer.name}
                className="bg-card/80 border-border hover:bg-accent/20 transition-all cursor-pointer group overflow-hidden"
                onClick={() => navigate('composer-detail', { composerName: composer.name })}
              >
                <CardContent className="p-0">
                  <div className="flex items-start gap-4 p-4">
                    {/* Avatar */}
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getCoverGradient(composer.name)} shadow-md flex items-center justify-center flex-shrink-0 overflow-hidden`}
                    >
                      {composer.hasCoverArt && composer.coverArtUrl ? (
                        <img src={composer.coverArtUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-6 h-6 text-white/30" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {composer.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {composer.trackCount} recording{composer.trackCount !== 1 ? 's' : ''} · {composer.albums.size} work{composer.albums.size !== 1 ? 's' : ''}
                      </p>

                      {/* Genre pills */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {[...composer.genres].slice(0, 3).map(g => (
                          <Badge key={g} variant="outline" className="text-[9px] px-1.5 py-0">
                            {g}
                          </Badge>
                        ))}
                        {composer.genres.size > 3 && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                            +{composer.genres.size - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Format pills */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {[...composer.formats].map(f => (
                          <Badge key={f} variant="secondary" className="text-[9px] px-1.5 py-0 font-mono">
                            {f}
                          </Badge>
                        ))}
                      </div>

                      {/* Performers */}
                      {composer.performers.size > 0 && (
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground/60">
                          <User className="w-3 h-3" />
                          <span className="truncate">{[...composer.performers].slice(0, 2).join(', ')}{composer.performers.size > 2 ? ` +${composer.performers.size - 2}` : ''}</span>
                        </div>
                      )}
                    </div>

                    <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                  </div>

                  {/* Duration bar */}
                  <div className="px-4 pb-3">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/50">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDuration(composer.totalDuration)}
                      </span>
                      <span>{composer.performers.size} performer{composer.performers.size !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
