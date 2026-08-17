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
import {
  Play, ArrowLeft, ListMusic, Music, Clock, Volume2,
  Loader2, Disc3,
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

export function JellyfinPlaylistView() {
  const { viewParams, navigate } = useUIStore();
  const { play, setQueue, currentTrack, isPlaying } = usePlayerStore();
  const store = useJellyfinStore();

  const playlistId = viewParams.playlistId;
  const playlist = store.playlists.find(p => p.id === playlistId);

  const currentPlaylistTracks = store.currentPlaylistTracks;
  const isLoading = store.isLoadingTracks;

  // ── Fetch playlist tracks on mount ──
  useEffect(() => {
    if (playlistId) {
      store.fetchPlaylistTracks(playlistId);
    }
  }, [playlistId]);

  // ── Player actions ──
  const playAll = useCallback(() => {
    if (currentPlaylistTracks.length === 0) return;
    const dspTracks = currentPlaylistTracks.map(t => store.convertToTrack(t));
    setQueue(dspTracks, 0);
  }, [store, currentPlaylistTracks, setQueue]);

  const handlePlayTrack = useCallback((track: JellyfinTrack) => {
    const dspTrack = store.convertToTrack(track);
    play(dspTrack);
  }, [store, play]);

  const isTrackCurrent = useCallback((track: JellyfinTrack) => {
    return currentTrack?.id === `jf-${track.id}`;
  }, [currentTrack]);

  // ── Derived ──
  const totalDuration = currentPlaylistTracks.reduce((sum, t) => sum + t.duration, 0);
  const playlistName = playlist?.name ?? 'Unknown Playlist';
  const playlistImageUrl = playlist?.imageUrl ?? '';

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" onClick={() => navigate('jellyfin' as any)}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </Button>

        {/* Playlist Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-56 h-56 md:w-64 md:h-64 rounded-2xl shadow-2xl flex-shrink-0 relative overflow-hidden">
            <CoverArt url={playlistImageUrl} name={playlistName} size="hero" rounded="hero" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none" />
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-[10px]">
                <ListMusic className="w-3 h-3 mr-1" /> Playlist
              </Badge>
            </div>
            <h1 className="text-3xl font-bold mb-2">{playlistName}</h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Music className="w-4 h-4" /> {currentPlaylistTracks.length} tracks
              </span>
              {totalDuration > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {formatDuration(totalDuration)}
                </span>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <Button onClick={playAll}>
                <Play className="w-4 h-4 mr-2" /> Play All
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && currentPlaylistTracks.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Track Listing */}
        {!isLoading && currentPlaylistTracks.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Tracks</h2>
            <div className="space-y-0.5">
              {currentPlaylistTracks.map(track => {
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
                        track.trackNumber
                      )}
                    </span>
                    <CoverArt url={track.imageUrl} name={track.name} size="sm" rounded="sm" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${isCurrent ? 'font-medium text-primary' : ''}`}>{track.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {track.artistName}{track.albumName ? ` · ${track.albumName}` : ''}
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
        {!isLoading && currentPlaylistTracks.length === 0 && (
          <div className="text-center py-16">
            <ListMusic className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-muted-foreground mb-1">No tracks found</h3>
            <p className="text-xs text-muted-foreground/70">This playlist is empty or has no playable tracks.</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}