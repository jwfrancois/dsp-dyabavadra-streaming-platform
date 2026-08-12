'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { artists, albums, getAlbumsByArtist, tracks, getCoverGradient, formatDuration, formatSampleRate } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Play, ArrowLeft, Clock, Heart, ExternalLink, Mic, Users,
  Music, Star, ChevronRight, Radio,
} from 'lucide-react';

export function ArtistDetailView() {
  const { viewParams, navigate } = useUIStore();
  const { play, setQueue, currentTrack, isPlaying } = usePlayerStore();
  const artistId = viewParams.artistId;
  const artist = artists.find(a => a.id === artistId);

  if (!artist) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Artist not found</div>;
  }

  const artistAlbums = getAlbumsByArtist(artist.id);
  const artistTracks = tracks.filter(t => t.artistId === artist.id).sort((a, b) => b.playCount - a.playCount);
  const totalPlays = artistTracks.reduce((sum, t) => sum + t.playCount, 0);
  const totalDuration = artistTracks.reduce((sum, t) => sum + t.duration, 0);
  const similarArtists = artist.similarArtists.map(id => artists.find(a => a.id === id)).filter(Boolean);

  // Aggregate all credits across this artist's tracks
  const allCredits = React.useMemo(() => {
    const creditMap = new Map<string, { name: string; roles: string[]; instruments: string[]; trackCount: number }>();
    for (const track of artistTracks) {
      for (const perf of track.performers) {
        if (perf.name !== artist.name) {
          const existing = creditMap.get(perf.name);
          if (existing) {
            if (!existing.roles.includes(perf.role)) existing.roles.push(perf.role);
            if (perf.instrument && !existing.instruments.includes(perf.instrument)) existing.instruments.push(perf.instrument);
            existing.trackCount++;
          } else {
            creditMap.set(perf.name, { name: perf.name, roles: [perf.role], instruments: perf.instrument ? [perf.instrument] : [], trackCount: 1 });
          }
        }
      }
    }
    return Array.from(creditMap.values()).sort((a, b) => b.trackCount - a.trackCount);
  }, [artistTracks]);

  // Aggregate all composers credited on this artist's tracks
  const allComposers = React.useMemo(() => {
    const compMap = new Map<string, number>();
    for (const track of artistTracks) {
      for (const comp of track.composers) {
        compMap.set(comp, (compMap.get(comp) || 0) + 1);
      }
    }
    return Array.from(compMap.entries()).sort((a, b) => b[1] - a[1]);
  }, [artistTracks]);

  // "Appears on" — find compilation/other albums where this artist appears as performer (not primary artist)
  const appearsOn = React.useMemo(() => {
    const albumIds = new Set<string>();
    for (const track of tracks) {
      if (track.artistId !== artist.id) {
        for (const perf of track.performers) {
          if (perf.name === artist.name) {
            albumIds.add(track.albumId);
          }
        }
      }
    }
    return Array.from(albumIds).map(id => {
      const found = albums.find(a => a.id === id);
      return found ? { ...found } : null;
    }).filter((a): a is NonNullable<typeof a> => a !== null);
  }, [artist.name]);

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
                <Badge
                  key={g}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-primary/30 transition-colors"
                  onClick={() => navigate('genre-detail', { genreName: g })}
                >
                  {g}
                </Badge>
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
              <Button size="sm" variant="outline" onClick={() => navigate('radio')}>
                <Radio className="w-4 h-4 mr-2" /> Artist Radio
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total Plays', value: totalPlays.toLocaleString(), icon: Play },
            { label: 'Albums', value: artistAlbums.length.toString(), icon: Clock },
            { label: 'Tracks', value: artistTracks.length.toString(), icon: Music },
            { label: 'Loved', value: artistTracks.filter(t => t.loved).length.toString(), icon: Heart },
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
                    onClick={(e) => { e.stopPropagation(); const albumTracks = tracks.filter(t => t.albumId === album.id).sort((a, b) => a.trackNumber - b.trackNumber); if (albumTracks.length > 0) setQueue(albumTracks, 0); }}
                  >
                    <Play className="w-3.5 h-3.5 ml-0.5" />
                  </Button>
                  {album.rating >= 9 && (
                    <Badge className="absolute top-2 left-2 text-[10px] bg-primary text-primary-foreground">
                      <Star className="w-2.5 h-2.5 mr-0.5" /> {album.rating}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{album.title}</p>
                <p className="text-xs text-muted-foreground">{album.year} · {album.format} {formatSampleRate(album.sampleRate)}</p>
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
                className={`flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group ${
                  currentTrack?.id === track.id ? 'bg-accent/40' : ''
                }`}
                onClick={() => play(track)}
              >
                <span className="text-sm text-muted-foreground w-6 text-right tabular-nums">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <Music className="w-3 h-3 text-primary" />
                  ) : (
                    <span className="group-hover:hidden">{i + 1}</span>
                  )}
                  <Play className="w-3 h-3 text-primary hidden group-hover:block ml-auto" />
                </span>
                <div className={`w-10 h-10 rounded bg-gradient-to-br ${getCoverGradient(track.id)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{track.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {track.albumName}
                    {track.composers.length > 0 && ` · ${track.composers[0]}`}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground hidden sm:block">{formatDuration(track.duration)}</span>
                <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">{track.playCount}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Credits / Collaborators */}
        {allCredits.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Mic className="w-5 h-5 text-muted-foreground" />
              Credits & Collaborators
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allCredits.slice(0, 12).map(credit => (
                <div
                  key={credit.name}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                  onClick={() => navigate('performer-detail', { performerName: credit.name })}
                >
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getCoverGradient(credit.name)} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{credit.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {credit.roles.join(', ')}{credit.instruments.length > 0 ? ` (${credit.instruments.join(', ')})` : ''} · {credit.trackCount} tracks
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Composers */}
        {allComposers.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Composers</h2>
            <div className="flex flex-wrap gap-2">
              {allComposers.map(([name, count]) => (
                <Badge
                  key={name}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent/50 transition-colors px-3 py-1"
                >
                  {name} <span className="text-muted-foreground ml-1">({count})</span>
                </Badge>
              ))}
            </div>
          </section>
        )}

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
                  <p className="text-[11px] text-muted-foreground">{a.genres.slice(0, 2).join(', ')}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </ScrollArea>
  );
}
