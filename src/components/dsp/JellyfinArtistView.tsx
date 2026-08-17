'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { useJellyfinStore, type JellyfinAlbum, type JellyfinTrack } from '@/store/jellyfin';
import { formatDuration, formatSampleRate, type Track } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Play, ArrowLeft, Heart, Disc3, Music, Clock, User, Volume2,
  Loader2, Star,
} from 'lucide-react';

// ─── Cover Art Fallback ────────────────────────────────────

function CoverArt({ url, name, size = 'md', rounded = 'lg' }: { url: string; name: string; size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero' | 'full'; rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'hero' }) {
  const sizeClasses = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14', xl: 'w-full aspect-square', hero: 'w-56 h-56', full: 'w-full aspect-square' };
  const roundedClasses = { sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', xl: 'rounded-xl', hero: 'rounded-2xl', full: 'rounded-xl' };
  const [error, setError] = useState(false);
  return (
    <div className={`${sizeClasses[size]} ${roundedClasses[rounded]} overflow-hidden bg-surface flex-shrink-0 relative`}>
      {url && !error ? (
        <img src={url} alt={name} className="w-full h-full object-cover" onError={() => setError(true)} draggable={false} loading="lazy" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-900/60 to-blue-900/60 flex items-center justify-center">
          <Music className="w-1/3 h-1/3 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}

// ─── Album Grid Card ───────────────────────────────────────

function AlbumCard({ album, onPlay, onAlbumClick }: { album: JellyfinAlbum; onPlay: () => void; onAlbumClick: () => void }) {
  return (
    <Card className="bg-card border-border group hover:border-primary/30 transition-all cursor-pointer">
      <CardContent className="p-0">
        <div className="relative" onClick={onAlbumClick}>
          <CoverArt url={album.imageUrl} name={album.name} size="full" rounded="xl" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button size="sm" className="rounded-full w-12 h-12 shadow-lg" onClick={(e) => { e.stopPropagation(); onPlay(); }}>
              <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
            </Button>
          </div>
          {album.isFavorite && (
            <div className="absolute top-2 right-2">
              <Heart className="w-4 h-4 text-red-400 fill-red-400 drop-shadow" />
            </div>
          )}
        </div>
        <div className="p-3 pt-2.5">
          <h3 className="text-sm font-medium truncate" title={album.name}>{album.name}</h3>
          <p className="text-xs text-muted-foreground truncate">{album.artistName}</p>
          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground/70">
            {album.year > 0 && <span>{album.year}</span>}
            {album.genre && <span className="truncate max-w-[80px]">{album.genre}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN VIEW
// ═══════════════════════════════════════════════════════════

export function JellyfinArtistView() {
  const { viewParams, navigate } = useUIStore();
  const { play, setQueue, currentTrack, isPlaying } = usePlayerStore();
  const store = useJellyfinStore();

  const artistId = viewParams.artistId;
  const artist = store.artists.find(a => a.id === artistId);
  const artistName = artist?.name ?? 'Unknown Artist';
  const artistImageUrl = artist?.imageUrl ?? '';
  const albumCount = artist?.albumCount ?? 0;

  const currentArtistAlbums = store.currentArtistAlbums;
  const currentArtistTracks = store.currentArtistTracks;
  const isLoading = store.isLoadingAlbums || store.isLoadingTracks;

  // ── Fetch artist detail on mount ──
  useEffect(() => {
    if (artistId) {
      store.fetchArtistDetail(artistId);
    }
  }, [artistId]);

  // ── Player actions ──
  const handlePlayAlbum = useCallback(async (album: JellyfinAlbum) => {
    await store.fetchAlbumTracks(album.id);
    const tracks = useJellyfinStore.getState().currentAlbumTracks;
    if (tracks.length === 0) return;
    const dspTracks = tracks.map(t => store.convertToTrack(t));
    setQueue(dspTracks, 0);
  }, [store, setQueue]);

  const handlePlayTrack = useCallback((track: JellyfinTrack) => {
    const dspTrack = store.convertToTrack(track);
    play(dspTrack);
  }, [store, play]);

  const handleAlbumClick = useCallback((album: JellyfinAlbum) => {
    navigate('jellyfin-album' as any, { albumId: album.id });
  }, [navigate]);

  const isTrackCurrent = useCallback((track: JellyfinTrack) => {
    return currentTrack?.id === `jf-${track.id}`;
  }, [currentTrack]);

  // ── Derived ──
  const totalDuration = currentArtistTracks.reduce((sum, t) => sum + t.duration, 0);

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" onClick={() => navigate('jellyfin' as any)}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </Button>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <CoverArt url={artistImageUrl} name={artistName} size="hero" rounded="hero" />
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-[10px]">
                <User className="w-3 h-3 mr-1" /> Artist
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                <Disc3 className="w-3 h-3 mr-1" /> {albumCount} album{albumCount !== 1 ? 's' : ''}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold mb-2">{artistName}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Music className="w-4 h-4" /> {currentArtistTracks.length} tracks
              </span>
              {totalDuration > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {formatDuration(totalDuration)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && currentArtistAlbums.length === 0 && currentArtistTracks.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Albums Grid */}
        {!isLoading && currentArtistAlbums.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Disc3 className="w-5 h-5 text-muted-foreground" />
              Albums
              <Badge variant="secondary" className="text-[10px] ml-1">{currentArtistAlbums.length}</Badge>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {currentArtistAlbums.map(album => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  onPlay={() => handlePlayAlbum(album)}
                  onAlbumClick={() => handleAlbumClick(album)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Tracks List */}
        {!isLoading && currentArtistTracks.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Music className="w-5 h-5 text-muted-foreground" />
              All Tracks
              <Badge variant="secondary" className="text-[10px] ml-1">{currentArtistTracks.length}</Badge>
            </h2>
            <div className="space-y-0.5">
              {currentArtistTracks.map((track, index) => {
                const isCurrent = isTrackCurrent(track);
                return (
                  <div
                    key={track.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group cursor-pointer ${
                      isCurrent ? 'bg-primary/10 text-primary' : 'hover:bg-accent/20'
                    }`}
                    onClick={() => handlePlayTrack(track)}
                  >
                    <span className={`w-8 text-xs text-right tabular-nums flex-shrink-0 ${isCurrent ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                      {isCurrent && isPlaying ? (
                        <Volume2 className="w-3.5 h-3.5 ml-auto text-primary animate-pulse" />
                      ) : isCurrent ? (
                        <Play className="w-3.5 h-3.5 ml-auto text-primary" fill="currentColor" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <CoverArt url={track.imageUrl} name={track.name} size="sm" rounded="sm" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${isCurrent ? 'font-medium text-primary' : ''}`}>{track.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {track.albumName || 'Unknown Album'}
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground/70 flex-shrink-0">
                      {track.format && <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-mono uppercase">{track.format}</Badge>}
                      {track.sampleRate > 0 && <span>{(track.sampleRate / 1000).toFixed(0)}kHz</span>}
                    </div>
                    <span className="text-xs text-muted-foreground/70 tabular-nums w-10 text-right flex-shrink-0">
                      {track.duration > 0 ? formatDuration(track.duration) : '--:--'}
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => { e.stopPropagation(); handlePlayTrack(track); }}>
                      {isCurrent && isPlaying ? (
                        <Volume2 className="w-4 h-4 text-primary" />
                      ) : (
                        <Play className="w-4 h-4 text-primary" fill="currentColor" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!isLoading && currentArtistAlbums.length === 0 && currentArtistTracks.length === 0 && (
          <div className="text-center py-16">
            <User className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-muted-foreground mb-1">No content found</h3>
            <p className="text-xs text-muted-foreground/70">This artist has no albums or tracks available.</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
