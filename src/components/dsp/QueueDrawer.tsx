'use client';

import React from 'react';
import { usePlayerStore } from '@/store/player';
import { formatDuration, getCoverGradient } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Play, Grip, Heart, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useUIStore } from '@/store/ui';

export function QueueDrawer() {
  const {
    queue, queueIndex, currentTrack, isPlaying,
    play, removeFromQueue,
  } = usePlayerStore();
  const { queueDrawerOpen, setQueueDrawerOpen } = useUIStore();

  if (!queueDrawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={() => setQueueDrawerOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-20 w-96 max-w-[80vw] bg-card border-l border-border z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold">Queue</h2>
            <p className="text-[11px] text-muted-foreground">{queue.length} tracks · {formatDuration(queue.reduce((s, t) => s + t.duration, 0))}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQueueDrawerOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {/* Now Playing */}
          {currentTrack && (
            <>
              <div className="p-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">Now Playing</p>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <div className={`w-10 h-10 rounded bg-gradient-to-br ${getCoverGradient(currentTrack.id)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-primary">{currentTrack.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{currentTrack.artistName}</p>
                  </div>
                  <Badge className="text-[10px] bg-primary text-primary-foreground">Playing</Badge>
                </div>
              </div>
              <Separator className="mx-4" />
            </>
          )}

          {/* Up Next */}
          <div className="p-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">
              Up Next ({queue.length - queueIndex - 1})
            </p>
            <div className="space-y-0.5">
              {queue.map((track, index) => {
                if (index === queueIndex) return null;
                const isPast = index < queueIndex;
                return (
                  <div
                    key={`${track.id}-${index}`}
                    className={`flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group ${
                      isPast ? 'opacity-40' : ''
                    }`}
                    onClick={() => play(track)}
                  >
                    <Grip className="w-3 h-3 text-muted-foreground/50 flex-shrink-0 opacity-0 group-hover:opacity-100" />
                    <div className={`w-9 h-9 rounded bg-gradient-to-br ${getCoverGradient(track.id)} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{track.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{track.artistName}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">{formatDuration(track.duration)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); removeFromQueue(index); }}
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}


