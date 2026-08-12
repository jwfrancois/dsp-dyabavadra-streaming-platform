'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { playlists, tracks, formatDuration, getCoverGradient } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Clock, Plus, MoreHorizontal, ListMusic } from 'lucide-react';

export function BrowsePlaylistsView() {
  const { navigate } = useUIStore();
  const { setQueue } = usePlayerStore();

  const playPlaylist = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    const playlistTracks = playlist.trackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as typeof tracks;
    if (playlistTracks.length > 0) setQueue(playlistTracks, 0);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Playlists</h1>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" /> New Playlist
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {playlists.map(playlist => (
            <div
              key={playlist.id}
              className="group cursor-pointer"
              onClick={() => playPlaylist(playlist.id)}
            >
              <div className="relative mb-2">
                <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${getCoverGradient(playlist.id)} cover-art-hover shadow-lg`} />
                <Button
                  variant="default"
                  size="icon"
                  className="absolute bottom-2 right-2 h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 shadow-lg"
                  onClick={(e) => { e.stopPropagation(); playPlaylist(playlist.id); }}
                >
                  <Play className="w-4 h-4 ml-0.5" />
                </Button>
              </div>
              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{playlist.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {playlist.trackCount} tracks · {formatDuration(playlist.duration)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
