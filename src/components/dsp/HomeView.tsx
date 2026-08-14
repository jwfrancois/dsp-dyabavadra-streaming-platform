'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { formatDuration, getCoverGradient } from '@/lib/data';
import { radioStations } from '@/lib/radio-stations';
import { useDiscoveryStore } from '@/store/discovery';
import { useLocalLibraryStore } from '@/store/local-library';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CoverArt } from '@/components/dsp/CoverArt';
import {
  Play, ArrowRight, Clock, Star, Sparkles,
  Headphones, Calendar, Music2, Radio,
} from 'lucide-react';

export function HomeView() {
  const { navigate } = useUIStore();
  const { play, setQueue } = usePlayerStore();

  const { tracks: localTracks, getAlbums, getArtists, getTotalSize } = useLocalLibraryStore();
  const localAlbums = getAlbums();
  const localArtists = getArtists();

  const recentTracks = localTracks.slice(0, 8);
  const newestAlbums = [...localAlbums].sort((a, b) => b.year - a.year).slice(0, 6);
  const recentArtists = localArtists.slice(0, 6);

  const playAlbum = (albumName: string, artistName: string) => {
    const albumTracks = localTracks.filter(t => t.album === albumName && t.artist === artistName).sort((a, b) => a.trackNumber - b.trackNumber);
    if (albumTracks.length > 0) {
      const trackObjs = albumTracks.map(t => ({
        id: t.id, title: t.title, albumId: t.album, albumName: t.album, artistId: t.artist, artistName: t.artist,
        trackNumber: t.trackNumber, discNumber: t.discNumber, duration: t.duration, format: t.format,
        bitDepth: t.bitDepth, sampleRate: t.sampleRate, channels: t.channels, bitrate: t.bitrate,
        filePath: t.filePath, fileSize: t.fileSize, composers: [t.composer], performers: [],
        genre: t.genre, loved: false, playCount: 0, source: 'local' as const, isAvailable: true,
      }));
      setQueue(trackObjs, 0);
    }
  };

  const playTrack = (trackId: string) => {
    const t = localTracks.find(tr => tr.id === trackId);
    if (t) {
      play({
        id: t.id, title: t.title, albumId: t.album, albumName: t.album, artistId: t.artist, artistName: t.artist,
        trackNumber: t.trackNumber, discNumber: t.discNumber, duration: t.duration, format: t.format,
        bitDepth: t.bitDepth, sampleRate: t.sampleRate, channels: t.channels, bitrate: t.bitrate,
        filePath: t.filePath, fileSize: t.fileSize, composers: [t.composer], performers: [],
        genre: t.genre, loved: false, playCount: 0, source: 'local' as const, isAvailable: true,
      });
    }
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
              Your library has {localTracks.length} tracks across {localAlbums.length} albums by {localArtists.length} artists.
              Pick up where you left off or discover something new.
            </p>
            <div className="flex gap-3 mt-4">
              <Button size="sm" onClick={() => playTrack(recentTracks[0]?.id)}>
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
            {recentTracks.length > 0 ? recentTracks.map(track => (
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
                      <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
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
            )) : (
              <p className="text-sm text-muted-foreground col-span-full">No tracks imported yet. Scan your music library to get started.</p>
            )}
          </div>
        </section>

        {/* Quick Stats */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Tracks', value: localTracks.length.toString(), icon: Music2, color: 'text-primary' },
              { label: 'Albums', value: localAlbums.length.toString(), icon: Headphones, color: 'text-signal-green' },
              { label: 'Artists', value: localArtists.length.toString(), icon: Star, color: 'text-gold' },
              { label: 'Radio', value: radioStations.length.toString(), icon: Calendar, color: 'text-signal-amber' },
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
                key={`${album.name}-${album.artist}`}
                className="group cursor-pointer"
                onClick={() => navigate('browse-albums')}
              >
                <div className="relative mb-2">
                  <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${getCoverGradient(album.name)} cover-art-hover shadow-lg`} />
                </div>
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{album.name}</p>
                <p className="text-xs text-muted-foreground truncate">{album.artist} · {album.year || ''}</p>
              </div>
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
                key={artist}
                className="group text-center cursor-pointer"
                onClick={() => navigate('browse-artists')}
              >
                <div className={`w-full aspect-square rounded-full bg-gradient-to-br ${getCoverGradient(artist)} mx-auto mb-2 cover-art-hover shadow-lg`} />
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{artist}</p>
                <p className="text-[11px] text-muted-foreground">Artist</p>
              </div>
            ))}
          </div>
        </section>





        {/* Radio Quick Access */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Radio className="w-5 h-5 text-signal-green" />
              Internet Radio
            </h2>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('radio')}>
              All Stations <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {radioStations.slice(0, 4).map(station => (
              <Card
                key={station.id}
                className="bg-card border-border hover:bg-accent/30 cursor-pointer transition-colors group"
                onClick={() => navigate('radio')}
              >
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getCoverGradient(station.id)} flex-shrink-0 flex items-center justify-center`}>
                      <Radio className="w-4 h-4 text-white/60" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{station.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Badge variant="outline" className="text-[9px] px-1 py-0">LIVE</Badge>
                        <span className="text-[10px] text-muted-foreground">{station.genre}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </ScrollArea>
  );
}
