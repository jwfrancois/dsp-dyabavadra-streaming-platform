'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { genres, albums, artists, tracks } from '@/lib/data';
import { getCoverGradient } from '@/lib/data';
import { genreDetails } from '@/lib/metadata';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Music, Users, Disc3, ChevronRight, BookOpen } from 'lucide-react';

export function BrowseGenresView() {
  const { navigate } = useUIStore();
  const { setQueue } = usePlayerStore();

  const playGenre = (genreName: string) => {
    const genreTracks = tracks.filter(t => t.genre === genreName);
    if (genreTracks.length > 0) setQueue(genreTracks, 0);
  };

  const genreColors: Record<string, string> = {
    'Jazz': 'from-amber-800 to-orange-900',
    'Electronic': 'from-cyan-800 to-blue-900',
    'Classical': 'from-purple-800 to-indigo-900',
    'Ambient': 'from-teal-800 to-green-900',
    'Post-Rock': 'from-slate-700 to-zinc-900',
    'Neo-Soul': 'from-rose-800 to-pink-900',
    'Progressive Metal': 'from-red-900 to-stone-900',
    'Indie Pop': 'from-violet-800 to-fuchsia-900',
    'Afrobeat': 'from-yellow-800 to-amber-900',
    'Experimental': 'from-emerald-800 to-lime-900',
    'World': 'from-orange-800 to-red-900',
    'Fusion': 'from-sky-800 to-indigo-900',
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Genres</h1>
          <Badge variant="secondary" className="text-xs">{genres.length} genres</Badge>
        </div>

        {/* Genre cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {genres.map(genre => {
            const hasDetail = genreDetails.some(gd => gd.name === genre.name);
            return (
              <Card
                key={genre.id}
                className={`bg-gradient-to-br ${genreColors[genre.name] || 'from-gray-800 to-gray-900'} border-0 hover:scale-[1.02] transition-transform overflow-hidden cursor-pointer relative group`}
                onClick={() => {
                  if (hasDetail) {
                    navigate('genre-detail', { genreName: genre.name });
                  } else {
                    playGenre(genre.name);
                  }
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-black/30 flex items-center justify-center`}>
                      <Music className="w-6 h-6 text-white/80" />
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-white/10 text-white/80 border-white/10">
                      {genre.trackCount} tracks
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{genre.name}</h3>
                  <div className="flex gap-3 text-xs text-white/60">
                    <span className="flex items-center gap-1"><Disc3 className="w-3 h-3" />{genre.albumCount} albums</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{genre.artistCount} artists</span>
                  </div>
                  {hasDetail && (
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-5 h-5 text-white/60" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Genre Primer Links */}
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Genre Primers & Deep Dives</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Explore detailed genre guides with essential albums, artist spotlights, and editorial curations.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {genreDetails.map(gd => (
              <Card
                key={gd.id}
                className="bg-card border-border hover:bg-accent/30 cursor-pointer transition-colors group"
                onClick={() => navigate('genre-detail', { genreName: gd.name })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${genreColors[gd.name] || 'from-gray-800 to-gray-900'} flex items-center justify-center flex-shrink-0`}>
                      <Music className="w-5 h-5 text-white/80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{gd.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {gd.essentialAlbums.length} essential albums
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {gd.moods.slice(0, 4).map(mood => (
                      <Badge key={mood} variant="outline" className="text-[9px] px-1.5 py-0">{mood}</Badge>
                    ))}
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
