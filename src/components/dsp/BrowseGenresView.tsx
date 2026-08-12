'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { genres, albums, artists, tracks } from '@/lib/data';
import { getCoverGradient } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Music, Users, Disc3 } from 'lucide-react';

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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {genres.map(genre => (
            <Card
              key={genre.id}
              className={`bg-gradient-to-br ${genreColors[genre.name] || 'from-gray-800 to-gray-900'} border-0 cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden`}
              onClick={() => playGenre(genre.name)}
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
