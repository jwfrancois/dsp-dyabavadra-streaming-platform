'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { useLocalLibraryStore } from '@/store/local-library';
import { usePlayerStore } from '@/store/player';
import {
  getCoverGradient, formatDuration,
} from '@/lib/data';
import type { Track } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Play, Music, Users, Disc3, Sparkles,
  Globe, Hash, ChevronRight,
} from 'lucide-react';

const genreColorMap: Record<string, string> = {
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
  'Contemporary Classical': 'from-purple-800 to-violet-900',
};

const moodColorMap: Record<string, string> = {
  relaxed: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/40',
  sophisticated: 'bg-purple-900/60 text-purple-300 border-purple-700/40',
  improvisational: 'bg-amber-900/60 text-amber-300 border-amber-700/40',
  soulful: 'bg-rose-900/60 text-rose-300 border-rose-700/40',
  energetic: 'bg-red-900/60 text-red-300 border-red-700/40',
  futuristic: 'bg-cyan-900/60 text-cyan-300 border-cyan-700/40',
  atmospheric: 'bg-sky-900/60 text-sky-300 border-sky-700/40',
  hypnotic: 'bg-indigo-900/60 text-indigo-300 border-indigo-700/40',
  introspective: 'bg-violet-900/60 text-violet-300 border-violet-700/40',
  contemplative: 'bg-blue-900/60 text-blue-300 border-blue-700/40',
  ethereal: 'bg-teal-900/60 text-teal-300 border-teal-700/40',
  dramatic: 'bg-orange-900/60 text-orange-300 border-orange-700/40',
  meditative: 'bg-green-900/60 text-green-300 border-green-700/40',
  complex: 'bg-fuchsia-900/60 text-fuchsia-300 border-fuchsia-700/40',
  peaceful: 'bg-emerald-900/60 text-emerald-200 border-emerald-700/40',
  floating: 'bg-cyan-900/60 text-cyan-200 border-cyan-700/40',
  immersive: 'bg-sky-900/60 text-sky-200 border-sky-700/40',
  cinematic: 'bg-amber-900/60 text-amber-200 border-amber-700/40',
  powerful: 'bg-red-900/60 text-red-300 border-red-700/40',
  epic: 'bg-orange-900/60 text-orange-300 border-orange-700/40',
  intense: 'bg-rose-900/60 text-rose-300 border-rose-700/40',
  warm: 'bg-orange-900/60 text-orange-200 border-orange-700/40',
  groovy: 'bg-yellow-900/60 text-yellow-300 border-yellow-700/40',
  intimate: 'bg-pink-900/60 text-pink-300 border-pink-700/40',
  uplifting: 'bg-lime-900/60 text-lime-300 border-lime-700/40',
};

export function GenreDetailView() {
  const { viewParams, navigate } = useUIStore();
  const { play, setQueue } = usePlayerStore();
  const genreName = viewParams.genreName;

  // Derive genre data from local library
  const { tracks: localTracks } = useLocalLibraryStore();
  const gradientClass = genreColorMap[genreName || ''] || 'from-gray-800 to-gray-900';

  // Filter tracks matching the genre name
  const genreTracks = React.useMemo((): Track[] => {
    if (!genreName) return [];
    return localTracks.filter(t => t.genre.toLowerCase() === genreName.toLowerCase()).map(t => ({
      id: t.id, title: t.title, artistName: t.artist, albumName: t.album, duration: t.duration,
    } as Track));
  }, [localTracks, genreName]);

  const trackCount = genreTracks.length;
  const albumCount = new Set(localTracks.filter(t => t.genre.toLowerCase() === (genreName || '').toLowerCase()).map(t => `${t.albumArtist || t.artist}|||${t.album}`)).size;
  const artistCount = new Set(localTracks.filter(t => t.genre.toLowerCase() === (genreName || '').toLowerCase()).flatMap(t => [t.artist, t.albumArtist].filter(Boolean))).size;
  const totalDuration = genreTracks.reduce((s, t) => s + t.duration, 0);

  const playAll = () => {
    if (genreTracks.length === 0) return;
    setQueue(genreTracks);
    play(genreTracks[0]);
  };

  // Derive top artists from filtered tracks
  const topArtists = React.useMemo(() => {
    const artistMap = new Map<string, { id: string; name: string; count: number }>();
    const filtered = localTracks.filter(t => t.genre.toLowerCase() === (genreName || '').toLowerCase());
    for (const t of filtered) {
      const name = t.artist;
      if (!artistMap.has(name)) artistMap.set(name, { id: name, name, count: 0 });
      artistMap.get(name)!.count++;
    }
    return [...artistMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map(a => ({ id: a.id, name: a.name, imageUrl: '' }));
  }, [localTracks, genreName]);

  // Derive essential albums from filtered tracks
  const essentialAlbums = React.useMemo(() => {
    const albumMap = new Map<string, { id: string; title: string; artistName: string; year: number; count: number }>();
    const filtered = localTracks.filter(t => t.genre.toLowerCase() === (genreName || '').toLowerCase());
    for (const t of filtered) {
      const key = `${t.albumArtist || t.artist}|||${t.album}`;
      if (!albumMap.has(key)) {
        albumMap.set(key, { id: key, title: t.album, artistName: t.albumArtist || t.artist, year: t.year, count: 0 });
      }
      albumMap.get(key)!.count++;
    }
    return [...albumMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [localTracks, genreName]);

  const relatedEditorials: { id: string; title: string; type: string; subtitle?: string; curator?: string }[] = [];

  // Static mood mapping based on genre name
  const genreMoods: string[] = (() => {
    const m: Record<string, string[]> = {
      'Jazz': ['relaxed', 'sophisticated', 'improvisational'],
      'Electronic': ['energetic', 'futuristic', 'hypnotic'],
      'Classical': ['contemplative', 'dramatic', 'peaceful'],
      'Ambient': ['atmospheric', 'floating', 'meditative'],
      'Post-Rock': ['atmospheric', 'introspective', 'cinematic'],
      'Neo-Soul': ['soulful', 'warm', 'groovy'],
      'Progressive Metal': ['intense', 'powerful', 'complex'],
      'Indie Pop': ['uplifting', 'intimate', 'groovy'],
      'Afrobeat': ['energetic', 'groovy', 'uplifting'],
      'Experimental': ['complex', 'introspective', 'atmospheric'],
      'World': ['warm', 'soulful', 'groovy'],
      'Fusion': ['complex', 'energetic', 'improvisational'],
      'Contemporary Classical': ['contemplative', 'dramatic', 'cinematic'],
    };
    return m[genreName || ''] || ['atmospheric', 'contemplative', 'sophisticated'];
  })();

  // Derive related genres (genres that share artists with the current genre)
  const relatedGenres = React.useMemo(() => {
    if (!genreName) return [];
    const filtered = localTracks.filter(t => t.genre.toLowerCase() === genreName!.toLowerCase());
    if (filtered.length === 0) return [];
    const genreArtists = new Set(filtered.map(t => t.artist));
    const genreCounts = new Map<string, number>();
    for (const t of localTracks) {
      if (t.genre.toLowerCase() === genreName!.toLowerCase()) continue;
      if (genreArtists.has(t.artist)) {
        genreCounts.set(t.genre, (genreCounts.get(t.genre) || 0) + 1);
      }
    }
    return [...genreCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);
  }, [localTracks, genreName]);

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6">
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" onClick={() => navigate('browse-genres')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Genres
        </Button>

        {/* Hero Banner */}
        <div className={`relative rounded-2xl bg-gradient-to-br ${gradientClass} p-8 md:p-10 mb-8 overflow-hidden`}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1">
                <Badge variant="secondary" className="bg-white/10 text-white/90 border-white/20 mb-3 text-xs">
                  Genre
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{genreName}</h1>
                <div className="flex items-center gap-2 text-white/70 mb-2">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">Your Library</span>
                </div>
                <p className="text-sm text-white/60 max-w-2xl">
                  {trackCount > 0
                    ? `${trackCount} tracks from ${artistCount} artists across ${albumCount} albums`
                    : 'No tracks found in this genre'}
                </p>
                <div className="flex gap-3 mt-5">
                  <Button size="sm" onClick={playAll} className="bg-white text-black hover:bg-white/90">
                    <Play className="w-4 h-4 mr-2" /> Play All
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Tracks', value: trackCount.toLocaleString(), icon: Music },
            { label: 'Albums', value: albumCount.toLocaleString(), icon: Disc3 },
            { label: 'Artists', value: artistCount.toLocaleString(), icon: Users },
            { label: 'Total Duration', value: formatDuration(totalDuration), icon: Hash },
          ].map(stat => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold tabular-nums">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Description */}
        {trackCount > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              About
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
              Explore the {genreName} collection in your library. Browse {trackCount} tracks across {albumCount} albums from {artistCount} artists.
            </p>
          </section>
        )}

        {/* Moods */}
        {genreMoods.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Moods</h2>
            <div className="flex flex-wrap gap-2">
              {genreMoods.map(mood => (
                <Badge
                  key={mood}
                  variant="outline"
                  className={`text-xs capitalize px-3 py-1 ${moodColorMap[mood] || 'bg-muted text-muted-foreground border-border'}`}
                >
                  {mood}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {relatedGenres.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Related Genres</h2>
            <div className="flex flex-wrap gap-2">
              {relatedGenres.map(related => (
                <Badge
                  key={related}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent/50 transition-colors text-xs px-3 py-1 border-primary/40 text-primary"
                  onClick={() => navigate('genre-detail', { genreName: related })}
                >
                  {related}
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </section>
        )}

        <Separator className="my-8" />

        {/* Top Artists */}
        {topArtists.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Top Artists</h2>
              <Badge variant="secondary" className="text-xs">{topArtists.length}</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {topArtists.map(artist => artist && (
                <div
                  key={artist.id}
                  className="group text-center cursor-pointer"
                  onClick={() => navigate('artist-detail', { artistId: artist.id })}
                >
                  <div className={`w-full aspect-square rounded-full bg-gradient-to-br ${getCoverGradient(artist.id)} mx-auto mb-2 cover-art-hover`} />
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{artist.name}</p>
                  <p className="text-xs text-muted-foreground">Artist</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Essential Albums */}
        {essentialAlbums.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Essential Albums</h2>
              <Badge variant="secondary" className="text-xs">{essentialAlbums.length}</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {essentialAlbums.map(album => album && (
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
                      className="absolute bottom-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0"
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      <Play className="w-3.5 h-3.5 ml-0.5" />
                    </Button>
                  </div>
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{album.title}</p>
                  <p className="text-xs text-muted-foreground">{album.artistName} · {album.year}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Editorial Collections */}
        {relatedEditorials.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Editorial Collections</h2>
              <Badge variant="secondary" className="text-xs">{relatedEditorials.length}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedEditorials.map(ed => ed && (
                <Card
                  key={ed.id}
                  className="bg-card border-border cursor-pointer hover:bg-accent/30 transition-colors group"
                  onClick={() => navigate('editorial', { collectionId: ed.id })}
                >
                  <CardContent className="p-4 flex gap-4">
                    <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${getCoverGradient(ed.id)} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{ed.title}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{ed.subtitle}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="secondary" className="text-[10px] capitalize">{ed.type.replace('-', ' ')}</Badge>
                        {ed.curator && <span className="text-[10px] text-muted-foreground">by {ed.curator}</span>}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors self-center flex-shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Top tracks */}
        {genreTracks.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Top Tracks</h2>
            <div className="space-y-1">
              {genreTracks.slice(0, 10).map((track, i) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                  onClick={() => play(track)}
                >
                  <span className="text-sm text-muted-foreground w-6 text-right tabular-nums">
                    <span className="group-hover:hidden">{i + 1}</span>
                    <Play className="w-3 h-3 text-primary hidden group-hover:block ml-auto" />
                  </span>
                  <div className={`w-10 h-10 rounded bg-gradient-to-br ${getCoverGradient(track.id)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artistName} · {track.albumName}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDuration(track.duration)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {trackCount === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Music className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">No tracks in this genre</p>
            <p className="text-xs mt-1">Add music tagged as &quot;{genreName}&quot; to your library</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
