'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, ListMusic } from 'lucide-react';

export function BrowsePlaylistsView() {
  const { navigate } = useUIStore();

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Playlists</h1>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" /> New Playlist
          </Button>
        </div>

        <div className="text-center py-12">
          <ListMusic className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-lg text-muted-foreground">No playlists yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create playlists from your imported music library</p>
        </div>
      </div>
    </ScrollArea>
  );
}
