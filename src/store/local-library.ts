'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LocalTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArtist: string;
  trackNumber: number;
  discNumber: number;
  duration: number;
  format: string;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  bitrate: number;
  filePath: string;
  fileSize: number;
  year: number;
  genre: string;
  composer: string;
  coverArt: string | null;
}

interface LocalLibraryState {
  tracks: LocalTrack[];
  isScanning: boolean;
  scanProgress: number;
  scanError: string | null;
  directories: string[];
  lastScanTime: string | null;
  scanStats: {
    totalFiles: number;
    scannedFiles: number;
    failedFiles: number;
    totalDuration: number;
    totalSize: number;
    formats: Record<string, number>;
    scanDurationMs: number;
  } | null;

  startScan: (directory: string) => Promise<void>;
  scanAllDirectories: () => Promise<void>;
  addDirectory: (dir: string) => void;
  removeDirectory: (dir: string) => void;
  clearLibrary: () => void;
  getTrackById: (id: string) => LocalTrack | undefined;
  searchTracks: (query: string) => LocalTrack[];
  getTracksByAlbum: (album: string, artist?: string) => LocalTrack[];
  getTracksByArtist: (artist: string) => LocalTrack[];
  getAlbums: () => Array<{ name: string; artist: string; albumArtist: string; trackCount: number; year: number; coverArt: string | null }>;
  getArtists: () => string[];
  getTotalDuration: () => number;
  getTotalSize: () => number;
  getFormatCounts: () => Record<string, number>;
}

export const useLocalLibraryStore = create<LocalLibraryState>()(
  persist(
    (set, get) => ({
      tracks: [],
      isScanning: false,
      scanProgress: 0,
      scanError: null,
      directories: [],
      lastScanTime: null,
      scanStats: null,

      startScan: async (directory: string) => {
        set({ isScanning: true, scanProgress: 5, scanError: null });

        try {
          const res = await fetch('/api/library/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ directory }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Scan failed' }));
            throw new Error(err.error || `Scan failed with status ${res.status}`);
          }

          // Try SSE streaming first, fall back to JSON
          const contentType = res.headers.get('content-type') || '';

          if (contentType.includes('text/event-stream') || contentType.includes('text/plain')) {
            // SSE streaming progress
            const reader = res.body?.getReader();
            if (reader) {
              const decoder = new TextDecoder();
              let buffer = '';
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const data = JSON.parse(line.slice(6));
                      if (typeof data.progress === 'number') {
                        set({ scanProgress: data.progress });
                      }
                      if (data.tracks) {
                        set((prev) => ({
                          tracks: data.tracks,
                          scanProgress: 100,
                        }));
                      }
                      if (data.stats) {
                        set({ scanStats: data.stats });
                      }
                      if (data.error) {
                        throw new Error(data.error);
                      }
                    } catch (e) {
                      if (e instanceof Error && e.message !== 'Scan failed' && !e.message.startsWith('Unexpected')) {
                        throw e;
                      }
                    }
                  }
                }
              }
            }
          } else {
            // JSON response — parse directly
            set({ scanProgress: 50 });
            const data = await res.json();
            if (data.success !== false) {
              set({
                tracks: data.tracks || [],
                scanProgress: 100,
                scanStats: data.stats || null,
              });
            } else {
              throw new Error(data.error || 'Scan returned failure');
            }
          }

          set({
            isScanning: false,
            scanProgress: 100,
            lastScanTime: new Date().toISOString(),
            scanError: null,
          });
        } catch (err) {
          set({
            isScanning: false,
            scanProgress: 0,
            scanError: err instanceof Error ? err.message : 'Unknown scan error',
          });
        }
      },

      scanAllDirectories: async () => {
        const { directories } = get();
        if (directories.length === 0) return;

        set({ isScanning: true, scanProgress: 0, scanError: null });

        const allTracks: LocalTrack[] = [...get().tracks];
        let combinedStats: LocalLibraryState['scanStats'] = null;

        for (let i = 0; i < directories.length; i++) {
          const dir = directories[i];
          const baseProgress = Math.round((i / directories.length) * 100);
          set({ scanProgress: baseProgress, scanError: null });

          try {
            const res = await fetch('/api/library/scan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ directory: dir }),
            });

            if (!res.ok) {
              const err = await res.json().catch(() => ({ error: `Failed to scan ${dir}` }));
              console.error(`[LocalLibrary] Scan failed for ${dir}:`, err.error);
              continue; // Skip failed directories, don't abort all
            }

            const data = await res.json();
            if (data.tracks && Array.isArray(data.tracks)) {
              // Merge tracks: avoid duplicates by ID
              const existingIds = new Set(allTracks.map(t => t.id));
              for (const track of data.tracks) {
                if (!existingIds.has(track.id)) {
                  allTracks.push(track);
                  existingIds.add(track.id);
                }
              }
            }
            if (data.stats) {
              combinedStats = data.stats;
            }

            set({ scanProgress: Math.round(((i + 1) / directories.length) * 100) });
          } catch (err) {
            console.error(`[LocalLibrary] Scan error for ${dir}:`, err);
            continue;
          }
        }

        set({
          tracks: allTracks,
          isScanning: false,
          scanProgress: 100,
          scanStats: combinedStats,
          lastScanTime: new Date().toISOString(),
          scanError: null,
        });
      },

      addDirectory: (dir: string) => {
        const { directories } = get();
        if (!directories.includes(dir)) {
          set({ directories: [...directories, dir] });
        }
      },

      removeDirectory: (dir: string) => {
        set({ directories: get().directories.filter(d => d !== dir) });
      },

      clearLibrary: () => {
        set({ tracks: [], scanProgress: 0, scanError: null, lastScanTime: null, scanStats: null });
      },

      getTrackById: (id: string) => {
        return get().tracks.find(t => t.id === id);
      },

      searchTracks: (query: string) => {
        const q = query.toLowerCase();
        return get().tracks.filter(
          t =>
            t.title.toLowerCase().includes(q) ||
            t.artist.toLowerCase().includes(q) ||
            t.album.toLowerCase().includes(q) ||
            t.genre.toLowerCase().includes(q) ||
            (t.composer && t.composer.toLowerCase().includes(q)) ||
            (t.albumArtist && t.albumArtist.toLowerCase().includes(q))
        );
      },

      getTracksByAlbum: (album: string, artist?: string) => {
        return get().tracks.filter(
          t => t.album === album && (artist ? t.artist === artist || t.albumArtist === artist : true)
        );
      },

      getTracksByArtist: (artist: string) => {
        return get().tracks.filter(
          t => t.artist === artist || t.albumArtist === artist
        );
      },

      getAlbums: () => {
        const { tracks } = get();
        const albumMap = new Map<string, { name: string; artist: string; albumArtist: string; trackCount: number; year: number; coverArt: string | null }>();
        for (const t of tracks) {
          const key = `${t.albumArtist || t.artist}|||${t.album}`;
          const existing = albumMap.get(key);
          if (existing) {
            existing.trackCount++;
            if (t.year && (!existing.year || t.year > existing.year)) existing.year = t.year;
            if (!existing.coverArt && t.coverArt) existing.coverArt = t.coverArt;
          } else {
            albumMap.set(key, {
              name: t.album,
              artist: t.artist,
              albumArtist: t.albumArtist || t.artist,
              trackCount: 1,
              year: t.year,
              coverArt: t.coverArt,
            });
          }
        }
        return Array.from(albumMap.values());
      },

      getArtists: () => {
        const { tracks } = get();
        const artists = new Set<string>();
        for (const t of tracks) {
          if (t.artist) artists.add(t.artist);
          if (t.albumArtist && t.albumArtist !== t.artist) artists.add(t.albumArtist);
        }
        return [...artists].sort();
      },

      getTotalDuration: () => {
        return get().tracks.reduce((s, t) => s + t.duration, 0);
      },

      getTotalSize: () => {
        return get().tracks.reduce((s, t) => s + t.fileSize, 0);
      },

      getFormatCounts: () => {
        const counts: Record<string, number> = {};
        for (const t of get().tracks) {
          const fmt = t.format.toUpperCase();
          counts[fmt] = (counts[fmt] || 0) + 1;
        }
        return counts;
      },
    }),
    {
      name: 'dsp-local-library-store',
      // Persist tracks and directories, but not transient scanning state
      partialize: (state) => ({
        tracks: state.tracks,
        directories: state.directories,
        lastScanTime: state.lastScanTime,
        scanStats: state.scanStats,
      }),
    }
  )
);
