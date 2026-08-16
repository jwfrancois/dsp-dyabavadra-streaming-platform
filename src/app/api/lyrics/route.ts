// ═══════════════════════════════════════════════════════════
// Lyrics API — Fetches lyrics from LRCLIB.net (free, no API key)
// Supports synced (LRC) and plain lyrics
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

interface LRCLIBTrack {
  id: number;
  name: string;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string;
  syncedLyrics: string;
}

// Server-side cache (24h TTL)
const lyricsCache = new Map<string, { data: LRCLIBTrack; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

function getCached(key: string): LRCLIBTrack | null {
  const entry = lyricsCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  lyricsCache.delete(key);
  return null;
}

function setCache(key: string, data: LRCLIBTrack) {
  lyricsCache.set(key, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get('artist') || '';
  const title = searchParams.get('title') || '';

  if (!artist || !title) {
    return NextResponse.json({ error: 'artist and title are required' }, { status: 400 });
  }

  const cacheKey = `${artist}:${title}`.toLowerCase();
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json({
      source: 'LRCLIB.net',
      plainLyrics: cached.plainLyrics,
      syncedLyrics: cached.syncedLyrics,
      isInstrumental: cached.instrumental,
      trackName: cached.trackName,
      artistName: cached.artistName,
      albumName: cached.albumName,
      duration: cached.duration,
    });
  }

  try {
    // Search LRCLIB.net for matching lyrics
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${artist} ${title}`)}`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'DSP-Streaming-Platform/1.0' },
      signal: AbortSignal.timeout(8000),
    });

    if (!searchRes.ok) {
      return NextResponse.json({ error: 'LRCLIB search failed', plainLyrics: '', syncedLyrics: '' });
    }

    const results: LRCLIBTrack[] = await searchRes.json();

    if (!results || results.length === 0) {
      return NextResponse.json({ error: 'No lyrics found', plainLyrics: '', syncedLyrics: '' });
    }

    // Find best match (exact match preferred)
    const best = results.find(r =>
      r.artistName.toLowerCase() === artist.toLowerCase() &&
      r.trackName.toLowerCase() === title.toLowerCase()
    ) || results[0];

    setCache(cacheKey, best);

    return NextResponse.json({
      source: 'LRCLIB.net',
      plainLyrics: best.plainLyrics || '',
      syncedLyrics: best.syncedLyrics || '',
      isInstrumental: best.instrumental || false,
      trackName: best.trackName,
      artistName: best.artistName,
      albumName: best.albumName,
      duration: best.duration,
    });
  } catch (err) {
    console.error('[Lyrics API] Error:', err);
    return NextResponse.json({ error: 'Lyrics fetch failed', plainLyrics: '', syncedLyrics: '' });
  }
}
