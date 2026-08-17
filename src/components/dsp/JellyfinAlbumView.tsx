'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { useJellyfinStore, type JellyfinTrack } from '@/store/jellyfin';
import { formatDuration, formatSampleRate } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Play, ArrowLeft, Heart, Disc3, Music, Clock, User, Volume2,
  Loader2, Star, Shuffle, Gauge,
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

// ═══════════════════════════════════════════════════════════
// MAIN VIEW
// ═══════════════════════════════════════════════════════════

export function JellyfinAlbumView() {
  const { viewParams, navigate } = useUIStore();
  const { play, setQueue, currentTrack, isPlaying } = usePlayerStore();
  const store = useJellyfinStore();

  const albumId = viewParams.albumId;

  // Find album info from browse cache or derive from tracks
  const album = store.albums.find(a => a.id === albumId)
    ?? store.recentAlbums.find(a => a.id === albumId)
    ?? store.currentArtistAlbums.find(a => a.id === albumId);

  const currentAlbumTracks = store.currentAlbumTracks;
  const isLoading = store.isLoadingTracks;

  // ── Fetch album tracks on mount ──
  useEffect(() => {
    if (albumId) {
      store.fetchAlbumTracks(albumId);
    }
  }, [albumId]);

  // ── Derived album info from first track if not found in cache ──
  const derivedAlbum = album ?? (currentAlbumTracks.length > 0 ? {
    id: albumId ?? '',
    name: currentAlbumTracks[0].albumName || 'Unknown Album',
    artistName: currentAlbumTracks[0].artistName,
    artistId: currentAlbumTracks[0].artistId,
    year: 0,
    genre: '',
    imageUrl: currentAlbumTracks[0].imageUrl,
    duration: 0,
    trackCount: 0,
    communityRating: 0,
    isFavorite: false,
  } : null);

  // ── Player actions ──
  const playAll = useCallback(() => {
    if (currentAlbumTracks.length === 0) return;
    const dspTracks = currentAlbumTracks.map(t => store.convertToTrack(t));
    setQueue(dspTracks, 0);
  }, [store, currentAlbumTracks, setQueue]);

  const shuffleAll = useCallback(() => {
    if (currentAlbumTracks.length === 0) return;
    const shuffled = [...currentAlbumTracks].sort(() => Math.random() - 0.5);
    const dspTracks = shuffled.map(t => store.convertToTrack(t));
    setQueue(dspTracks, 0);
  }, [store, currentAlbumTracks, setQueue]);

  const handlePlayTrack = useCallback((track: JellyfinTrack) => {
    const dspTrack = store.convertToTrack(track);
    play(dspTrack);
  }, [store, play]);

  const isTrackCurrent = useCallback((track: JellyfinTrack) => {
    return currentTrack?.id === `jf-${track.id}`;
  }, [currentTrack]);

  // ── Derived ──
  const totalDuration = currentAlbumTracks.reduce((sum, t) => sum + t.duration, 0);

  if (!derivedAlbum) {
    return (
      <ScrollArea className="h-full">
        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
          <Disc3 className="w-12 h-12" />
          <p>Album not found</p>
          <Button variant="ghost" size="sm" onClick={() => navigate('jellyfin' as any)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jellyfin
          </Button>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" onClick={() => navigate('jellyfin' as any)}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </Button>

        {/* Album Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-56 h-56 md:w-64 md:h-64 rounded-2xl shadow-2xl flex-shrink-0 relative overflow-hidden">
            <CoverArt url={derivedAlbum.imageUrl} name={derivedAlbum.name} size="hero" rounded="hero" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none" />
            {derivedAlbum.communityRating > 0 && (
              <Badge className="absolute top-3 left-3 bg-black/60 text-white text-xs backdrop-blur-sm border-0">
                <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" /> {derivedAlbum.communityRating.toFixed(1)}
              </Badge>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="text-[10px]">
                <Disc3 className="w-3 h-3 mr-1" /> Album
              </Badge>
              {derivedAlbum.genre && (
                <Badge variant="outline" className="text-[10px]">{derivedAlbum.genre}</Badge>
              )}
              {derivedAlbum.year > 0 && (
                <Badge variant="outline" className="text-[10px]">{derivedAlbum.year}</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-1">{derivedAlbum.name}</h1>
            {derivedAlbum.artistName && (
              <p
                className="text-lg text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                onClick={() => navigate('jellyfin-artist' as any, { artistId: derivedAlbum.artistId })}
              >
                {derivedAlbum.artistName}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <span>{currentAlbumTracks.length} tracks</span>
              <span>·</span>
              <span>{formatDuration(totalDuration)}</span>
            </div>

            <div className="flex gap-3 mt-5">
              <Button onClick={playAll}>
                <Play className="w-4 h-4 mr-2" /> Play All
              </Button>
              <Button size="sm" variant="outline" onClick={shuffleAll}>
                <Shuffle className="w-4 h-4 mr-2" /> Shuffle
              </Button>
            </div>
          </div>
        </div>

        {/* Audio Format Info */}
        {currentAlbumTracks.length > 0 && currentAlbumTracks[0].format && (
          <Card className="bg-card border-border mb-6">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Gauge className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium">Source:</span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Jellyfin · {currentAlbumTracks[0].format}
                  {currentAlbumTracks[0].sampleRate > 0 && ` ${formatSampleRate(currentAlbumTracks[0].sampleRate)}`}
                  {currentAlbumTracks[0].bitDepth > 0 && `/${currentAlbumTracks[0].bitDepth}bit`}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && currentAlbumTracks.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Track Listing */}
        {!isLoading && currentAlbumTracks.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Track List</h2>
            <div className="space-y-0.5">
              {currentAlbumTracks.map(track => {
                const isCurrent = isTrackCurrent(track);
                const showArtist = track.artistName && derivedAlbum.artistName && track.artistName !== derivedAlbum.artistName;
                return (
                  <div
                    key={track.id}
                    className={`flex items-center gap-3 p-3 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group ${
                      isCurrent ? 'bg-accent/40' : ''
                    }`}
                    onClick={() => handlePlayTrack(track)}
                  >
                    <span className="text-sm text-muted-foreground w-8 text-right tabular-nums">
                      {isCurrent && isPlaying ? (
                        <Music className="w-3 h-3 text-primary" />
                      ) : (
                        <span className="group-hover:hidden">{track.trackNumber}</span>
                      )}
                      <Play className="w-3 h-3 text-primary hidden group-hover:block ml-auto" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isCurrent ? 'text-primary' : ''}`}>{track.name}</p>
                      {showArtist && (
                        <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {track.format && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-mono uppercase">{track.format}</Badge>
                        )}
                        {track.sampleRate > 0 && (
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {(track.sampleRate / 1000).toFixed(0)}kHz
                          </span>
                        )}
                        {track.bitDepth > 0 && (
                          <span className="text-[11px] text-muted-foreground font-mono">{track.bitDepth}bit</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums w-10 text-right flex-shrink-0">
                      {track.duration > 0 ? formatDuration(track.duration) : '--:--'}
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => { e.stopPropagation(); handlePlayTrack(track); }}>
                      <Play className="w-4 h-4 text-primary" fill="currentColor" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!isLoading && currentAlbumTracks.length === 0 && (
          <div className="text-center py-16">
            <Disc3 className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-muted-foreground mb-1">No tracks found</h3>
            <p className="text-xs text-muted-foreground/70">This album has no playable tracks.</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}