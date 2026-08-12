'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { artists, albums, tracks, playlists, genres } from '@/lib/data';
import { formatDuration, getCoverGradient } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CoverArt } from '@/components/dsp/CoverArt';
import {
  Play, ArrowRight, Clock, TrendingUp, Star, Sparkles,
  Headphones, Calendar, Music2,
} from 'lucide-react';

export function HomeView() {
  const { navigate } = useUIStore();
  const { play, setQueue } = usePlayerStore();

  const recentlyPlayed = [...tracks]
    .filter(t => t.lastPlayed)
    .sort((a, b) => new Date(b.lastPlayed!).getTime() - new Date(a.lastPlayed!).getTime())
    .slice(0, 8);

  const topTracks = [...tracks].sort((a, b) => b.playCount - a.playCount).slice(0, 6);
  const lovedTracks = tracks.filter(t => t.loved);
  const newestAlbums = [...albums].sort((a, b) => b.year - a.year).slice(0, 6);
  const recentArtists = artists.slice(0, 6);

  const playAlbum = (albumId: string) => {
    const albumTracks = tracks.filter(t => t.albumId === albumId).sort((a, b) => a.trackNumber - b.trackNumber);
    if (albumTracks.length > 0) setQueue(albumTracks, 0);
  };

  const playTrack = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) play(track);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Hero / Welcome */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary/20 via-card to-accent/20 p-8">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold">Welcome Back</h1>
            </div>
            <p className="text-muted-foreground max-w-lg">
              Your library has {tracks.length} tracks across {albums.length} albums by {artists.length} artists.
              Pick up where you left off or discover something new.
            </p>
            <div className="flex gap-3 mt-4">
              <Button size="sm" onClick={() => playTrack(recentlyPlayed[0]?.id)}>
                <Play className="w-4 h-4 mr-2" /> Resume Playing
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate('browse-genres')}>
                <Sparkles className="w-4 h-4 mr-2" /> Discover
              </Button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-full opacity-10">
            <div className={`w-full h-full bg-gradient-to-br ${getCoverGradient('hero')}`} />
          </div>
        </div>

        {/* Recently Played */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Recently Played
            </h2>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('browse-tracks')}>
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {recentlyPlayed.map(track => (
              <Card
                key={track.id}
                className="bg-card border-border hover:bg-accent/30 cursor-pointer transition-colors group"
                onClick={() => playTrack(track.id)}
              >
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <div className={`w-12 h-12 rounded-md bg-gradient-to-br ${getCoverGradient(track.id)} flex-shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{track.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{formatDuration(track.duration)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); playTrack(track.id); }}
                    >
                      <Play className="w-3 h-3 text-primary" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Stats */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Tracks', value: tracks.length.toString(), icon: Music2, color: 'text-primary' },
              { label: 'Albums', value: albums.length.toString(), icon: Headphones, color: 'text-signal-green' },
              { label: 'Artists', value: artists.length.toString(), icon: Star, color: 'text-gold' },
              { label: 'Playlists', value: playlists.length.toString(), icon: Calendar, color: 'text-signal-amber' },
            ].map(stat => (
              <Card key={stat.label} className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-surface flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold tabular-nums">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* New Releases */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              New Releases
            </h2>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('browse-albums')}>
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {newestAlbums.map(album => (
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
                </div>
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{album.title}</p>
                <p className="text-xs text-muted-foreground truncate">{album.artistName} · {album.year}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Top Played */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-signal-green" />
              Most Played
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {topTracks.map((track, index) => (
              <Card
                key={track.id}
                className="bg-card border-border hover:bg-accent/30 cursor-pointer transition-colors"
                onClick={() => playTrack(track.id)}
              >
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-md bg-gradient-to-br ${getCoverGradient(track.id)}`} />
                      <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{track.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{track.playCount} plays</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Browse Artists */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Artists</h2>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('browse-artists')}>
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {recentArtists.map(artist => (
              <div
                key={artist.id}
                className="group text-center cursor-pointer"
                onClick={() => navigate('artist-detail', { artistId: artist.id })}
              >
                <div className={`w-full aspect-square rounded-full bg-gradient-to-br ${getCoverGradient(artist.id)} mx-auto mb-2 cover-art-hover shadow-lg`} />
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{artist.name}</p>
                <p className="text-[11px] text-muted-foreground">{artist.albumCount} albums</p>
              </div>
            ))}
          </div>
        </section>

        {/* Loved Tracks */}
        {lovedTracks.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-red-500" />
              Loved Tracks
            </h2>
            <div className="space-y-1">
              {lovedTracks.slice(0, 5).map(track => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors"
                  onClick={() => playTrack(track.id)}
                >
                  <div className={`w-10 h-10 rounded bg-gradient-to-br ${getCoverGradient(track.id)} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDuration(track.duration)}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </ScrollArea>
  );
}
