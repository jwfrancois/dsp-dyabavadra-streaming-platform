'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, Music, User, Disc3, Clock, ArrowUp, ArrowDown, X, CornerDownLeft, Command } from 'lucide-react';
import { useUIStore } from '@/store/ui';
import { useLocalLibraryStore } from '@/store/local-library';
import { usePlayerStore } from '@/store/player';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDuration } from '@/lib/data';
import type { Track } from '@/lib/data';
import type { LocalTrack } from '@/store/local-library';

// ── Helpers ──────────────────────────────────────────────────────────

const RECENT_SEARCHES_KEY = 'dsp-recent-searches';
const MAX_RECENT = 5;

function loadRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(queries: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(queries));
  } catch {
    // ignore quota errors
  }
}

function addRecentSearch(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const existing = loadRecentSearches().filter(q => q !== trimmed);
  existing.unshift(trimmed);
  saveRecentSearches(existing.slice(0, MAX_RECENT));
}

/** Convert a LocalTrack to a full Track for the player queue. */
function localToTrack(t: LocalTrack): Track {
  return {
    id: t.id,
    title: t.title,
    albumId: t.album,
    albumName: t.album,
    artistId: t.artist,
    artistName: t.artist,
    trackNumber: t.trackNumber,
    discNumber: t.discNumber || 0,
    duration: t.duration,
    format: t.format,
    bitDepth: t.bitDepth,
    sampleRate: t.sampleRate,
    channels: t.channels,
    bitrate: t.bitrate,
    filePath: t.filePath,
    fileSize: t.fileSize,
    composers: t.composer ? [t.composer] : [],
    performers: [],
    genre: t.genre,
    loved: false,
    playCount: 0,
    source: 'local',
    isAvailable: true,
    blobUrl: t.blobUrl,
    storagePath: t.storagePath,
    storageUrl: t.storageUrl,
  };
}

/** Simple relevance score for a search result. */
function relevanceScore(track: LocalTrack, query: string): number {
  const q = query.toLowerCase();
  let score = 0;
  if (track.title.toLowerCase().startsWith(q)) score += 10;
  else if (track.title.toLowerCase().includes(q)) score += 5;
  if (track.artist.toLowerCase().startsWith(q)) score += 8;
  else if (track.artist.toLowerCase().includes(q)) score += 4;
  if (track.album.toLowerCase().startsWith(q)) score += 7;
  else if (track.album.toLowerCase().includes(q)) score += 3;
  if (track.composer && track.composer.toLowerCase().includes(q)) score += 4;
  if (track.genre && track.genre.toLowerCase().includes(q)) score += 2;
  return score;
}

// ── Result types ─────────────────────────────────────────────────────

interface SearchResultItem {
  type: 'track' | 'artist' | 'album';
  id: string;
  label: string;       // primary text
  detail: string;      // secondary text
  subDetail?: string;   // tertiary text (e.g. duration, year)
  track?: LocalTrack;   // for tracks
  artistName?: string;  // for artists/albums
  albumArtist?: string; // for albums
  year?: number;
  trackCount?: number;
}

// ── Component ───────────────────────────────────────────────────────

export function GlobalSearchDialog() {
  const searchOpen = useUIStore(s => s.searchOpen);
  const setSearchOpen = useUIStore(s => s.setSearchOpen);
  const navigate = useUIStore(s => s.navigate);

  const tracks = useLocalLibraryStore(s => s.tracks);
  const getTracksByArtist = useLocalLibraryStore(s => s.getTracksByArtist);
  const getTracksByAlbum = useLocalLibraryStore(s => s.getTracksByAlbum);

  const setQueue = usePlayerStore(s => s.setQueue);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Open/close logic ──

  useEffect(() => {
    if (searchOpen) {
      setQuery('');
      setDebouncedQuery('');
      setSelectedIndex(0);
      setRecentSearches(loadRecentSearches());
      // Small delay so the DOM is painted before focusing
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery('');
      setDebouncedQuery('');
    }
  }, [searchOpen]);

  // ── Debounced search (300ms) ──

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // ── Compute results ──

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return { top: [], trackResults: [], artistResults: [], albumResults: [] };

    const q = debouncedQuery.toLowerCase().trim();

    // Search tracks
    const matchedTracks = tracks
      .filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        (t.genre && t.genre.toLowerCase().includes(q)) ||
        (t.composer && t.composer.toLowerCase().includes(q)) ||
        (t.albumArtist && t.albumArtist.toLowerCase().includes(q))
      )
      .sort((a, b) => relevanceScore(b, q) - relevanceScore(a, q));

    // Extract unique artists
    const artistMap = new Map<string, { name: string; trackCount: number }>();
    for (const t of matchedTracks) {
      const name = t.artist;
      if (!artistMap.has(name)) {
        artistMap.set(name, { name, trackCount: getTracksByArtist(name).length });
      }
    }
    const artistResults = Array.from(artistMap.values())
      .filter(a => a.name.toLowerCase().includes(q) || matchedTracks.some(t => t.artist === a.name))
      .sort((a, b) => {
        const aScore = a.name.toLowerCase().startsWith(q) ? 10 : a.name.toLowerCase().includes(q) ? 5 : 0;
        const bScore = b.name.toLowerCase().startsWith(q) ? 10 : b.name.toLowerCase().includes(q) ? 5 : 0;
        return bScore - aScore;
      });

    // Extract unique albums
    const albumMap = new Map<string, { name: string; artist: string; albumArtist: string; year: number; trackCount: number; coverArt: string | null }>();
    for (const t of matchedTracks) {
      const key = `${t.albumArtist || t.artist}|||${t.album}`;
      if (!albumMap.has(key)) {
        const albumTracks = getTracksByAlbum(t.album, t.albumArtist || t.artist);
        albumMap.set(key, {
          name: t.album,
          artist: t.artist,
          albumArtist: t.albumArtist || t.artist,
          year: t.year || 0,
          trackCount: albumTracks.length,
          coverArt: t.coverArt,
        });
      }
    }
    const albumResults = Array.from(albumMap.values())
      .sort((a, b) => {
        const aScore = a.name.toLowerCase().startsWith(q) ? 10 : a.name.toLowerCase().includes(q) ? 5 : 0;
        const bScore = b.name.toLowerCase().startsWith(q) ? 10 : b.name.toLowerCase().includes(q) ? 5 : 0;
        return bScore - aScore;
      });

    // Top results — best matches across all categories
    const top: SearchResultItem[] = [];

    // Best track
    if (matchedTracks.length > 0) {
      const t = matchedTracks[0];
      top.push({
        type: 'track',
        id: `track-${t.id}`,
        label: t.title,
        detail: t.artist,
        subDetail: formatDuration(t.duration),
        track: t,
      });
    }

    // Best artist
    if (artistResults.length > 0) {
      const a = artistResults[0];
      top.push({
        type: 'artist',
        id: `artist-${a.name}`,
        label: a.name,
        detail: `${a.trackCount} tracks`,
        artistName: a.name,
      });
    }

    // Best album
    if (albumResults.length > 0) {
      const a = albumResults[0];
      top.push({
        type: 'album',
        id: `album-${a.albumArtist}|||${a.name}`,
        label: a.name,
        detail: a.artist,
        subDetail: a.year ? String(a.year) : undefined,
        artistName: a.artist,
        albumArtist: a.albumArtist,
        trackCount: a.trackCount,
        year: a.year,
      });
    }

    // Track results (up to 5)
    const trackResults: SearchResultItem[] = matchedTracks.slice(0, 5).map(t => ({
      type: 'track' as const,
      id: `track-${t.id}`,
      label: t.title,
      detail: t.artist,
      subDetail: formatDuration(t.duration),
      track: t,
    }));

    // Artist results (up to 4)
    const artistItems: SearchResultItem[] = artistResults.slice(0, 4).map(a => ({
      type: 'artist' as const,
      id: `artist-${a.name}`,
      label: a.name,
      detail: `${a.trackCount} tracks`,
      artistName: a.name,
    }));

    // Album results (up to 4)
    const albumItems: SearchResultItem[] = albumResults.slice(0, 4).map(a => ({
      type: 'album' as const,
      id: `album-${a.albumArtist}|||${a.name}`,
      label: a.name,
      detail: a.artist,
      subDetail: a.year ? String(a.year) : undefined,
      artistName: a.artist,
      albumArtist: a.albumArtist,
      trackCount: a.trackCount,
      year: a.year,
    }));

    return { top, trackResults, artistResults: artistItems, albumResults: albumItems };
  }, [debouncedQuery, tracks, getTracksByArtist, getTracksByAlbum]);

  // Build a flat list of all result IDs for keyboard navigation
  const allResultIds = useMemo(() => {
    const ids: string[] = [];
    for (const r of results.top) ids.push(r.id);
    for (const r of results.trackResults) ids.push(r.id);
    for (const r of results.artistResults) ids.push(r.id);
    for (const r of results.albumResults) ids.push(r.id);
    return ids;
  }, [results]);

  // ── Find a result item by ID ──

  const findResult = useCallback((id: string): SearchResultItem | undefined => {
    for (const section of [results.top, results.trackResults, results.artistResults, results.albumResults]) {
      const found = section.find(r => r.id === id);
      if (found) return found;
    }
    return undefined;
  }, [results]);

  // ── Activate a result ──

  const activateResult = useCallback((item: SearchResultItem) => {
    if (debouncedQuery.trim()) {
      addRecentSearch(debouncedQuery);
    }

    if (item.type === 'track' && item.track) {
      // Set queue with all matched tracks, play the selected one
      const matched = useLocalLibraryStore.getState().searchTracks(debouncedQuery);
      const queueTracks = matched.map(localToTrack);
      const idx = queueTracks.findIndex(t => t.id === item.track!.id);
      setQueue(queueTracks, idx >= 0 ? idx : 0);
      setSearchOpen(false);
    } else if (item.type === 'artist' && item.artistName) {
      setSearchOpen(false);
      navigate('artist-detail', { id: item.artistName });
    } else if (item.type === 'album' && item.albumArtist && item.label) {
      setSearchOpen(false);
      navigate('album-detail', { artist: item.albumArtist, album: item.label });
    }
  }, [debouncedQuery, setQueue, setSearchOpen, navigate]);

  // ── Keyboard navigation ──

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setSearchOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => {
        if (allResultIds.length === 0) return 0;
        return (prev + 1) % allResultIds.length;
      });
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => {
        if (allResultIds.length === 0) return 0;
        return (prev - 1 + allResultIds.length) % allResultIds.length;
      });
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (allResultIds.length > 0 && selectedIndex < allResultIds.length) {
        const item = findResult(allResultIds[selectedIndex]);
        if (item) activateResult(item);
      }
      return;
    }
  }, [allResultIds, selectedIndex, findResult, activateResult, setSearchOpen]);

  // ── Click on a recent search ──

  const handleRecentClick = useCallback((q: string) => {
    setQuery(q);
  }, []);

  // ── Listen for hover events from ResultItem ──
  useEffect(() => {
    const handleHover = (e: Event) => {
      const idx = (e as CustomEvent).detail;
      if (typeof idx === 'number') setSelectedIndex(idx);
    };
    window.addEventListener('search-hover', handleHover);
    return () => window.removeEventListener('search-hover', handleHover);
  }, []);

  // ── Close on backdrop click ──

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSearchOpen(false);
    }
  }, [setSearchOpen]);

  // Don't render if not open
  if (!searchOpen) return null;

  const hasResults = allResultIds.length > 0;
  const hasQuery = query.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] animate-in fade-in duration-150"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={containerRef}
        className="bg-card border border-border rounded-2xl w-full max-w-xl mx-4 shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-in slide-in-from-top-4 duration-200"
      >
        {/* Search input */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent text-foreground text-base placeholder:text-muted-foreground outline-none"
              placeholder="Search tracks, artists, albums..."
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
              autoFocus
            />
            <kbd className="px-2 py-0.5 bg-surface border border-border rounded text-[10px] font-mono text-muted-foreground flex-shrink-0">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results area */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* ── Recent Searches ── */}
            {!hasQuery && recentSearches.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Recent Searches</span>
                </div>
                <div className="flex flex-wrap gap-1.5 px-2">
                  {recentSearches.map(q => (
                    <button
                      key={q}
                      onClick={() => handleRecentClick(q)}
                      className="px-3 py-1 bg-surface hover:bg-accent/50 rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                  <button
                    onClick={() => { saveRecentSearches([]); setRecentSearches([]); }}
                    className="px-3 py-1 hover:bg-accent/50 rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Empty state (no query) ── */}
            {!hasQuery && recentSearches.length === 0 && (
              <div className="py-12 text-center">
                <Search className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Start typing to search your library
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Search tracks, artists, albums, genres, and composers
                </p>
              </div>
            )}

            {/* ── Loading indicator for debounce ── */}
            {hasQuery && debouncedQuery !== query && (
              <div className="py-8 text-center">
                <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground mt-2">Searching...</p>
              </div>
            )}

            {/* ── No results ── */}
            {hasQuery && debouncedQuery === query && !hasResults && (
              <div className="py-12 text-center">
                <Search className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No results for &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Try a different search term or check your library
                </p>
              </div>
            )}

            {/* ── Results ── */}
            {hasQuery && debouncedQuery === query && hasResults && (
              <>
                {/* Top Results */}
                {results.top.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1.5">
                      <span className="text-xs font-medium text-muted-foreground">Top Results</span>
                    </div>
                    {results.top.map(item => {
                      const globalIdx = allResultIds.indexOf(item.id);
                      return (
                        <ResultItem
                          key={item.id}
                          item={item}
                          isSelected={globalIdx === selectedIndex}
                          globalIndex={globalIdx}
                          onClick={() => activateResult(item)}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Tracks */}
                {results.trackResults.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        Tracks
                        <span className="ml-1 text-muted-foreground/60">
                          ({tracks.filter(t =>
                            debouncedQuery &&
                            (
                              t.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                              t.artist.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                              t.album.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                              (t.genre && t.genre.toLowerCase().includes(debouncedQuery.toLowerCase())) ||
                              (t.composer && t.composer.toLowerCase().includes(debouncedQuery.toLowerCase()))
                            )
                          ).length})
                        </span>
                      </span>
                    </div>
                    {results.trackResults.map(item => {
                      const globalIdx = allResultIds.indexOf(item.id);
                      return (
                        <ResultItem
                          key={item.id}
                          item={item}
                          isSelected={globalIdx === selectedIndex}
                          globalIndex={globalIdx}
                          onClick={() => activateResult(item)}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Artists */}
                {results.artistResults.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        Artists
                        <span className="ml-1 text-muted-foreground/60">
                          ({results.artistResults.length})
                        </span>
                      </span>
                    </div>
                    {results.artistResults.map(item => {
                      const globalIdx = allResultIds.indexOf(item.id);
                      return (
                        <ResultItem
                          key={item.id}
                          item={item}
                          isSelected={globalIdx === selectedIndex}
                          globalIndex={globalIdx}
                          onClick={() => activateResult(item)}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Albums */}
                {results.albumResults.length > 0 && (
                  <div>
                    <div className="px-2 py-1.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        Albums
                        <span className="ml-1 text-muted-foreground/60">
                          ({results.albumResults.length})
                        </span>
                      </span>
                    </div>
                    {results.albumResults.map(item => {
                      const globalIdx = allResultIds.indexOf(item.id);
                      return (
                        <ResultItem
                          key={item.id}
                          item={item}
                          isSelected={globalIdx === selectedIndex}
                          globalIndex={globalIdx}
                          onClick={() => activateResult(item)}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-surface/50">
          <div className="flex items-center gap-3">
            <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 bg-card border border-border rounded text-[10px] font-mono text-muted-foreground">
              <ArrowUp className="w-2.5 h-2.5" />
              <ArrowDown className="w-2.5 h-2.5" />
            </kbd>
            <span className="text-[10px] text-muted-foreground">navigate</span>
          </div>
          <div className="flex items-center gap-3">
            <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 bg-card border border-border rounded text-[10px] font-mono text-muted-foreground">
              <CornerDownLeft className="w-2.5 h-2.5" />
            </kbd>
            <span className="text-[10px] text-muted-foreground">open</span>
            <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 bg-card border border-border rounded text-[10px] font-mono text-muted-foreground">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
            <span className="text-[10px] text-muted-foreground">close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Result Item Sub-component ─────────────────────────────────────────

interface ResultItemProps {
  item: SearchResultItem;
  isSelected: boolean;
  globalIndex: number;
  onClick: () => void;
}

function ResultItem({ item, isSelected, globalIndex, onClick }: ResultItemProps) {
  const ref = useRef<HTMLButtonElement>(null);

  // Scroll into view when selected
  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.scrollIntoView({ block: 'nearest' });
    }
  }, [isSelected]);

  const TypeIcon = item.type === 'track' ? Music : item.type === 'artist' ? User : Disc3;
  const typeLabel = item.type === 'track' ? 'Track' : item.type === 'artist' ? 'Artist' : 'Album';

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => {
        // Hovering updates the selected index so Enter works naturally
        // We dispatch a custom event because we need to communicate up
        const event = new CustomEvent('search-hover', { detail: globalIndex });
        window.dispatchEvent(event);
      }}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
        isSelected
          ? 'bg-accent/50 text-foreground'
          : 'text-foreground hover:bg-accent/20'
      }`}
    >
      <TypeIcon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{item.label}</span>
          <span className={`px-1.5 py-0 rounded text-[10px] font-medium flex-shrink-0 ${
            item.type === 'track'
              ? 'bg-blue-500/20 text-blue-400'
              : item.type === 'artist'
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-amber-500/20 text-amber-400'
          }`}>
            {typeLabel}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="truncate">{item.detail}</span>
          {item.subDetail && (
            <>
              <span className="flex-shrink-0">·</span>
              <span className="flex-shrink-0">{item.subDetail}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
