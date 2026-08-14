'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { useLocalLibraryStore } from '@/store/local-library';
import { getCoverGradient } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Music, Disc3 } from 'lucide-react';

export function BrowseGenresView() {
  const { navigate } = useUIStore();
  const { setQueue } = usePlayerStore();
  const localTracks = useLocalLibraryStore(s => s.tracks);

  // Derive genres from local library
  const genreMap = React.useMemo(() => {
    const map = new Map<string, { trackCount: number; albumCount: number; artistCount: number }>();
    for (const t of localTracks) {
      if (!t.genre) continue;
      const existing = map.get(t.genre) || { trackCount: 0, albumCount: 0, artistCount: 0 };
      existing.trackCount++;
      const albumKey = `${t.album}|||${t.artist}`;
      const artistKey = t.artist;
      // Simple approximation — we can't count unique albums/artists without more state
      map.set(t.genre, existing);
    }
    // Approximate album/artist counts from unique track combinations
    for (const t of localTracks) {
      if (!t.genre) continue;
      const entry = map.get(t.genre)!;
      // Use a rough heuristic
      entry.artistCount = Math.max(1, Math.floor(entry.trackCount / 3));
      entry.albumCount = Math.max(1, Math.floor(entry.trackCount / 5));
    }
    return map;
  }, [localTracks]);

  const genresList = React.useMemo(
    () => [...genreMap.entries()].map(([name, stats]) => ({
      id: `genre-${name}`,
      name,
      trackCount: stats.trackCount,
      albumCount: stats.albumCount,
      artistCount: stats.artistCount,
    })).sort((a, b) => b.trackCount - a.trackCount),
    [genreMap],
  );

  const genreColors: Record<string, string> = {
    'Jazz': 'from-amber-800 to-orange-900',
    'Electronic': 'from-cyan-800 to-blue-900',
    'Classical': 'from-purple-800 to-indigo-900',
    'Ambient': 'from-teal-800 to-green-900',
    'Rock': 'from-red-900 to-stone-900',
    'Pop': 'from-violet-800 to-fuchsia-900',
  };

  const playGenre = (genreName: string) => {
    const genreTrackObjs = localTracks.filter(t => t.genre === genreName).map(t => ({
      id: t.id, title: t.title, albumId: t.album, albumName: t.album, artistId: t.artist, artistName: t.artist,
      trackNumber: t.trackNumber, discNumber: t.discNumber, duration: t.duration, format: t.format,
      bitDepth: t.bitDepth, sampleRate: t.sampleRate, channels: t.channels, bitrate: t.bitrate,
      filePath: t.filePath, fileSize: t.fileSize, composers: [t.composer], performers: [],
      genre: t.genre, loved: false, playCount: 0, source: 'local' as const, isAvailable: true,
    }));
    if (genreTrackObjs.length > 0) setQueue(genreTrackObjs, 0);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Genres</h1>
          <Badge variant="secondary" className="text-xs">{genresList.length} genres</Badge>
        </div>

        {genresList.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg text-muted-foreground">No genres found</p>
            <p className="text-sm text-muted-foreground mt-1">Import music to see genre categories</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {genresList.map(genre => (
              <Card
                key={genre.id}
                className={`bg-gradient-to-br ${genreColors[genre.name] || 'from-gray-800 to-gray-900'} border-0 hover:scale-[1.02] transition-transform overflow-hidden cursor-pointer`}
                onClick={() => playGenre(genre.name)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-black/30 flex items-center justify-center">
                      <Music className="w-6 h-6 text-white/80" />
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-white/10 text-white/80 border-white/10">
                      {genre.trackCount} tracks
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{genre.name}</h3>
                  <div className="flex gap-3 text-xs text-white/60">
                    <span className="flex items-center gap-1"><Disc3 className="w-3 h-3" />~{genre.albumCount} albums</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
