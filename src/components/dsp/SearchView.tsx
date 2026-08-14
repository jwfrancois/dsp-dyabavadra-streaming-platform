'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { usePlayerStore } from '@/store/player';
import { formatDuration, getCoverGradient } from '@/lib/data';
import type { Track } from '@/lib/data';
import { useLocalLibraryStore } from '@/store/local-library';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Play, Music, X } from 'lucide-react';

export function SearchView() {
  const { navigate, searchQuery, setSearchQuery } = useUIStore();
  const { play, setQueue } = usePlayerStore();
  const { tracks: localTracks, searchTracks } = useLocalLibraryStore();
  const [localQuery, setLocalQuery] = React.useState(searchQuery);

  const results = localQuery.length > 1 ? searchTracks(localQuery) : [];

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Search Library</h1>

        {/* Search Input */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search tracks, artists, albums..."
            value={localQuery}
            onChange={(e) => { setLocalQuery(e.target.value); setSearchQuery(e.target.value); }}
            className="pl-12 h-12 text-lg bg-card border-border rounded-xl"
            autoFocus
          />
          {localQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => { setLocalQuery(''); setSearchQuery(''); }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {!localQuery && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg text-muted-foreground">Start typing to search</p>
            <p className="text-sm text-muted-foreground mt-1">Search across your local music library</p>
          </div>
        )}

        {localQuery && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg text-muted-foreground">No results found</p>
            <p className="text-sm text-muted-foreground mt-1">Try different keywords or import more music</p>
          </div>
        )}

        {results.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Music className="w-4 h-4" /> Tracks ({results.length})
            </h2>
            <div className="space-y-0.5">
              {results.slice(0, 30).map(track => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                  onClick={() => {
                    const t: Track = {
                      id: track.id, title: track.title, albumId: track.album, albumName: track.album,
                      artistId: track.artist, artistName: track.artist, trackNumber: track.trackNumber,
                      discNumber: track.discNumber, duration: track.duration, format: track.format,
                      bitDepth: track.bitDepth, sampleRate: track.sampleRate, channels: track.channels,
                      bitrate: track.bitrate, filePath: track.filePath, fileSize: track.fileSize,
                      composers: [track.composer], performers: [], genre: track.genre,
                      loved: false, playCount: 0, source: 'local', isAvailable: true,
                    };
                    setQueue(results.map(r => ({
                      id: r.id, title: r.title, albumId: r.album, albumName: r.album,
                      artistId: r.artist, artistName: r.artist, trackNumber: r.trackNumber,
                      discNumber: r.discNumber, duration: r.duration, format: r.format,
                      bitDepth: r.bitDepth, sampleRate: r.sampleRate, channels: r.channels,
                      bitrate: r.bitrate, filePath: r.filePath, fileSize: r.fileSize,
                      composers: [r.composer], performers: [], genre: r.genre,
                      loved: false, playCount: 0, source: 'local', isAvailable: true,
                    })), results.indexOf(track));
                  }}
                >
                  <div className={`w-10 h-10 rounded bg-gradient-to-br ${getCoverGradient(track.id)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artist} · {track.album}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs text-muted-foreground">{formatDuration(track.duration)}</span>
                    <div className="flex gap-1 mt-0.5 justify-end">
                      <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">{track.format}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </ScrollArea>
  );
}
