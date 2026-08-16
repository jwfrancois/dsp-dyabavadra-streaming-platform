'use client';

import React, { useState, useMemo } from 'react';
import { usePlayerStore } from '@/store/player';
import { useLocalLibraryStore } from '@/store/local-library';
import { formatDuration, formatSampleRate, getCoverGradient } from '@/lib/data';
import type { Track } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Play, Grip, Trash2, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useUIStore } from '@/store/ui';
import { useHistoryStore } from '@/store/history';

type Tab = 'queue' | 'history';

/** Convert LocalTrack → Track for player/playback */
function localToTrack(t: any): Track {
  return {
    id: t.id, title: t.title, albumId: t.album, albumName: t.album,
    artistId: t.artist, artistName: t.artist, trackNumber: t.trackNumber,
    discNumber: t.discNumber || 0, duration: t.duration, format: t.format,
    bitDepth: t.bitDepth, sampleRate: t.sampleRate, channels: t.channels,
    bitrate: t.bitrate, filePath: t.filePath, fileSize: t.fileSize,
    composers: t.composer ? [t.composer] : [], performers: [], genre: t.genre,
    loved: false, playCount: 0, source: 'local', isAvailable: true,
  };
}

export function QueueDrawer() {
  const {
    queue, queueIndex, currentTrack, isPlaying,
    play, removeFromQueue,
  } = usePlayerStore();
  const { queueDrawerOpen, setQueueDrawerOpen } = useUIStore();
  const { entries } = useHistoryStore();
  const localTracks = useLocalLibraryStore(s => s.tracks);
  const [activeTab, setActiveTab] = useState<Tab>('queue');

  // Build a lookup map for history track resolution
  const trackLookup = useMemo(() => {
    const map = new Map<string, any>();
    for (const lt of localTracks) {
      map.set(lt.id, lt);
    }
    return map;
  }, [localTracks]);

  if (!queueDrawerOpen) return null;

  const getZoneName = (zoneId: string) => {
    return zoneId;
  };

  const formatTimeAgo = (isoString: string) => {
    const now = new Date();
    const then = new Date(isoString);
    const diffMs = now.getTime() - then.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  };

  const sourceColor = (source: string) => {
    switch (source) {
      case 'tidal': return 'bg-blue-600';
      case 'qobuz': return 'bg-orange-500';
      case 'radio': return 'bg-purple-600';
      default: return 'bg-muted';
    }
  };

  const sourceLabel = (source: string) => {
    switch (source) {
      case 'tidal': return 'TIDAL';
      case 'qobuz': return 'Qobuz';
      case 'radio': return 'Radio';
      case 'local': return 'Local';
      default: return source;
    }
  };

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

        {/* Tab Bar */}
        <div className="flex border-b border-border">
          <button
            className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${
              activeTab === 'queue'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('queue')}
          >
            Queue
            {activeTab === 'queue' && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
            )}
          </button>
          <button
            className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${
              activeTab === 'history'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('history')}
          >
            History
            {activeTab === 'history' && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>

        <ScrollArea className="flex-1">
          {activeTab === 'queue' ? (
            <>
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
            </>
          ) : (
            /* History Tab */
            <div className="p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">
                Play History ({entries.length})
              </p>
              {entries.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No play history yet</p>
                </div>
              )}
              <div className="space-y-0.5">
                {entries.map((entry) => {
                  const localTrack = trackLookup.get(entry.trackId);

                  // Track unavailable — graceful fallback
                  if (!localTrack) {
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-2.5 p-2 rounded-lg opacity-50"
                      >
                        <div className="w-9 h-9 rounded bg-muted flex-shrink-0 flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground truncate">Track unavailable</p>
                          <p className="text-[11px] text-muted-foreground/60 truncate font-mono">{entry.trackId}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] text-muted-foreground">{formatTimeAgo(entry.playedAt)}</span>
                          <Badge
                            variant="secondary"
                            className={`text-[9px] h-4 px-1.5 ${sourceColor(entry.source)} text-white border-0`}
                          >
                            {sourceLabel(entry.source)}
                          </Badge>
                        </div>
                      </div>
                    );
                  }

                  // Track found — render with full info
                  const track = localToTrack(localTrack);
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors group"
                      onClick={() => play(track)}
                    >
                      {localTrack.coverArt ? (
                        <img src={localTrack.coverArt} alt="" className="w-9 h-9 rounded flex-shrink-0 object-cover" />
                      ) : (
                        <div
                          className={`w-9 h-9 rounded bg-gradient-to-br ${getCoverGradient(localTrack.id)} flex-shrink-0`}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium truncate">{localTrack.title}</p>
                          {!entry.completed && (
                            <span className="text-[9px] text-muted-foreground flex-shrink-0">(partial)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] text-muted-foreground truncate">{localTrack.artist}</p>
                          <Badge variant="outline" className="text-[8px] h-3 px-1 border-0 bg-muted/60 text-muted-foreground">
                            {localTrack.format} {formatSampleRate(localTrack.sampleRate)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">{formatTimeAgo(entry.playedAt)}</span>
                          <Badge
                            variant="secondary"
                            className={`text-[9px] h-4 px-1.5 ${sourceColor(entry.source)} text-white border-0`}
                          >
                            {sourceLabel(entry.source)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                            {getZoneName(entry.zoneId)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 flex-shrink-0"
                            onClick={(e) => { e.stopPropagation(); play(track); }}
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  );
}
