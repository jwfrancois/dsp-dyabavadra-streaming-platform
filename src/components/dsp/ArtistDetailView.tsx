'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { artists, getAlbumsByArtist, tracks, getCoverGradient, formatDuration } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Play, ArrowLeft, Clock, Heart, ExternalLink } from 'lucide-react';

export function ArtistDetailView() {
  const { viewParams, navigate } = useUIStore();
  const { play, setQueue } = usePlayerStore();
  const artistId = viewParams.artistId;
  const artist = artists.find(a => a.id === artistId);

  if (!artist) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Artist not found</div>;
  }

  const artistAlbums = getAlbumsByArtist(artist.id);
  const artistTracks = tracks.filter(t => t.artistId === artist.id).sort((a, b) => b.playCount - a.playCount);
  const totalPlays = artistTracks.reduce((sum, t) => sum + t.playCount, 0);
  const similarArtists = artist.similarArtists.map(id => artists.find(a => a.id === id)).filter(Boolean);

  const playAll = () => {
    const allTracks = artistTracks.sort((a, b) => {
      const albumOrder = a.albumId.localeCompare(b.albumId);
      if (albumOrder !== 0) return albumOrder;
      return a.trackNumber - b.trackNumber;
    });
    setQueue(allTracks, 0);
  };

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6">
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" onClick={() => navigate('browse-artists')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Artists
        </Button>

        {/* Hero */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className={`w-48 h-48 rounded-full bg-gradient-to-br ${getCoverGradient(artist.id)} shadow-2xl flex-shrink-0 ring-2 ring-primary/20`} />
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{artist.name}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {artist.genres.map(g => (
                <Badge key={g} variant="secondary" className="text-xs">{g}</Badge>
              ))}
              <Badge variant="outline" className="text-xs">{artist.type === 'group' ? 'Group' : 'Solo Artist'}</Badge>
            </div>
            {artist.origin && <p className="text-sm text-muted-foreground mb-1">{artist.origin}</p>}
            {artist.yearsActive && <p className="text-sm text-muted-foreground mb-3">Active: {artist.yearsActive}</p>}
            {artist.members && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Members</p>
                <p className="text-sm">{artist.members.join(', ')}</p>
              </div>
            )}
            <div className="flex gap-3 mb-4">
              <Button size="sm" onClick={playAll}>
                <Play className="w-4 h-4 mr-2" /> Play All
              </Button>
              <Button size="sm" variant="outline">
                <Heart className="w-4 h-4 mr-2" /> Follow
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total Plays', value: totalPlays.toLocaleString(), icon: Play },
            { label: 'Albums', value: artistAlbums.length.toString(), icon: Clock },
            { label: 'Tracks', value: artistTracks.length.toString(), icon: Heart },
            { label: 'Loved', value: artistTracks.filter(t => t.loved).length.toString(), icon: ExternalLink },
          ].map(stat => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-3 flex items-center gap-3">
                <stat.icon className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-lg font-bold tabular-nums">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bio */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Biography</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{artist.bio}</p>
        </section>

        {/* Discography */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Discography</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {artistAlbums.map(album => (
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
                <p className="text-xs text-muted-foreground">{album.year} · {album.type.charAt(0).toUpperCase() + album.type.slice(1)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Popular Tracks */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Popular Tracks</h2>
          <div className="space-y-1">
            {artistTracks.slice(0, 10).map((track, i) => (
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
                  <p className="text-xs text-muted-foreground truncate">{track.albumName}</p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDuration(track.duration)}</span>
                <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">{track.playCount}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Similar Artists */}
        {similarArtists.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4">Similar Artists</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {similarArtists.map(a => a && (
                <div
                  key={a.id}
                  className="group text-center cursor-pointer"
                  onClick={() => navigate('artist-detail', { artistId: a.id })}
                >
                  <div className={`w-full aspect-square rounded-full bg-gradient-to-br ${getCoverGradient(a.id)} mx-auto mb-2 cover-art-hover`} />
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{a.name}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </ScrollArea>
  );
}
