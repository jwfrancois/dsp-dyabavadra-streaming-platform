'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePlayerStore } from '@/store/player';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, RefreshCw, ExternalLink, ChevronDown } from 'lucide-react';

interface SyncedLine {
  timeMs: number;
  text: string;
}

function parseLRC(lrc: string): SyncedLine[] {
  const lines = lrc.split('\n');
  const parsed: SyncedLine[] = [];

  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const ms = parseInt(match[3].padEnd(3, '0'), 10);
      const timeMs = minutes * 60000 + seconds * 1000 + ms;
      const text = match[4].trim();
      if (text) {
        parsed.push({ timeMs, text });
      }
    }
  }

  return parsed.sort((a, b) => a.timeMs - b.timeMs);
}

// Client-side cache
const lyricsMemCache = new Map<string, { data: LyricsData; timestamp: number }>();
const MEM_CACHE_TTL = 30 * 60 * 1000;

interface LyricsData {
  source: string;
  plainLyrics: string;
  syncedLyrics: string;
  isInstrumental: boolean;
  trackName: string;
  artistName: string;
  albumName: string;
}

async function fetchLyrics(artist: string, title: string): Promise<LyricsData | null> {
  const key = `${artist}:${title}`.toLowerCase();
  const cached = lyricsMemCache.get(key);
  if (cached && Date.now() - cached.timestamp < MEM_CACHE_TTL) return cached.data;

  try {
    const res = await fetch(`/api/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.plainLyrics || data.syncedLyrics) {
      lyricsMemCache.set(key, { data, timestamp: Date.now() });
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export function LyricsPanel() {
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const currentTime = usePlayerStore(s => s.currentTime);
  const isPlaying = usePlayerStore(s => s.isPlaying);

  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSynced, setShowSynced] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef<string | null>(null);

  // Fetch lyrics when track changes
  useEffect(() => {
    if (!currentTrack) return;
    const key = `${currentTrack.artistName}:${currentTrack.title}`;
    if (key === fetchedRef.current) return;

    fetchedRef.current = key;
    setLyricsData(null);
    setError(null);
    setLoading(true);

    fetchLyrics(currentTrack.artistName, currentTrack.title)
      .then(data => {
        if (data) setLyricsData(data);
        else setError('Lyrics not found');
      })
      .catch(() => setError('Failed to fetch lyrics'))
      .finally(() => setLoading(false));
  }, [currentTrack]);

  // Parse synced lyrics
  const syncedLines = useMemo(() => {
    if (!lyricsData?.syncedLyrics) return [];
    return parseLRC(lyricsData.syncedLyrics);
  }, [lyricsData]);

  // Find current line index for auto-scroll
  const currentLineIndex = useMemo(() => {
    if (syncedLines.length === 0) return -1;
    const timeMs = currentTime * 1000;
    let idx = -1;
    for (let i = 0; i < syncedLines.length; i++) {
      if (syncedLines[i].timeMs <= timeMs) idx = i;
      else break;
    }
    return idx;
  }, [syncedLines, currentTime]);

  // Auto-scroll to current line
  useEffect(() => {
    if (currentLineIndex < 0 || !containerRef.current) return;
    const container = containerRef.current;
    const activeEl = container.querySelector(`[data-line="${currentLineIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentLineIndex]);

  if (!currentTrack) return null;

  const handleRetry = () => {
    fetchedRef.current = null;
    if (currentTrack) {
      fetchLyrics(currentTrack.artistName, currentTrack.title)
        .then(data => {
          if (data) setLyricsData(data);
          else setError('Lyrics not found');
        })
        .catch(() => setError('Failed to fetch lyrics'))
        .finally(() => setLoading(false));
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-border">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Music className="w-4 h-4 text-primary" /> Lyrics
          </h3>
          <div className="flex items-center gap-1.5">
            {lyricsData?.syncedLyrics && lyricsData?.plainLyrics && (
              <div className="flex items-center bg-surface rounded-md p-0.5">
                <button
                  onClick={() => setShowSynced(true)}
                  className={`text-[10px] px-2 py-0.5 rounded transition-all ${showSynced ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Synced
                </button>
                <button
                  onClick={() => setShowSynced(false)}
                  className={`text-[10px] px-2 py-0.5 rounded transition-all ${!showSynced ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Plain
                </button>
              </div>
            )}
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRetry}>
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-6 justify-center">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Fetching lyrics...
          </div>
        )}

        {/* Instrumental */}
        {lyricsData?.isInstrumental && !loading && (
          <div className="text-center py-6">
            <Music className="w-8 h-8 mx-auto mb-2 text-primary/40" />
            <p className="text-xs text-muted-foreground italic">Instrumental track — no lyrics</p>
          </div>
        )}

        {/* Synced Lyrics */}
        {!loading && lyricsData && showSynced && syncedLines.length > 0 && (
          <div
            ref={containerRef}
            className="h-64 overflow-y-auto scroll-smooth space-y-1 pr-1 scrollbar-thin"
          >
            {syncedLines.map((line, i) => {
              const isActive = i === currentLineIndex;
              const isPast = i < currentLineIndex;
              const isNear = Math.abs(i - currentLineIndex) <= 2;

              return (
                <p
                  key={i}
                  data-line={i}
                  className={`text-sm transition-all duration-500 leading-relaxed cursor-pointer hover:text-foreground ${
                    isActive
                      ? 'text-primary font-semibold text-base scale-[1.02] origin-left'
                      : isNear && isPast
                        ? 'text-foreground/70'
                        : isPast
                          ? 'text-muted-foreground/50'
                          : 'text-muted-foreground/40'
                  }`}
                  onClick={() => {
                    const playerState = usePlayerStore.getState();
                    if (playerState.currentTrack?.duration) {
                      const pct = (line.timeMs / 1000 / playerState.currentTrack.duration) * 100;
                      playerState.seek(pct);
                    }
                  }}
                  style={{
                    transition: 'color 0.5s ease, font-size 0.3s ease, transform 0.3s ease',
                  }}
                >
                  {line.text}
                </p>
              );
            })}
          </div>
        )}

        {/* Plain Lyrics */}
        {!loading && lyricsData && !showSynced && lyricsData.plainLyrics && (
          <div className="max-h-64 overflow-y-auto pr-1 scrollbar-thin">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {lyricsData.plainLyrics}
            </p>
          </div>
        )}

        {/* Error / No lyrics */}
        {!loading && error && !lyricsData && (
          <div className="text-center py-6">
            <Music className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground italic">{error}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Try searching manually on Genius or AZLyrics
            </p>
          </div>
        )}

        {/* Source attribution */}
        {lyricsData && !loading && (
          <div className="mt-3 pt-2 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground/60">
              Source: {lyricsData.source}
              {lyricsData.albumName && ` · ${lyricsData.albumName}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
