'use client';

import { create } from 'zustand';

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

  startScan: (directory: string) => Promise<void>;
  addDirectory: (dir: string) => void;
  removeDirectory: (dir: string) => void;
  clearLibrary: () => void;
  getTrackById: (id: string) => LocalTrack | undefined;
  searchTracks: (query: string) => LocalTrack[];
  getTracksByAlbum: (album: string) => LocalTrack[];
  getTracksByArtist: (artist: string) => LocalTrack[];
  getAlbums: () => Array<{ name: string; artist: string; trackCount: number }>;
  getArtists: () => string[];
}

export const useLocalLibraryStore = create<LocalLibraryState>((set, get) => ({
  tracks: [],
  isScanning: false,
  scanProgress: 0,
  scanError: null,
  directories: [],
  lastScanTime: null,

  startScan: async (directory: string) => {
    set({ isScanning: true, scanProgress: 0, scanError: null });

    try {
      const res = await fetch(`/api/local-library/scan?XTransformPort=3001&directory=${encodeURIComponent(directory)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Scan failed' }));
        throw new Error(err.error || 'Scan failed');
      }

      // Simulate progress while reading streamed response
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
                if (data.progress !== undefined) {
                  set({ scanProgress: data.progress });
                }
                if (data.tracks) {
                  set({ tracks: data.tracks });
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
      } else {
        const data = await res.json();
        if (data.tracks) set({ tracks: data.tracks });
      }

      set({
        isScanning: false,
        scanProgress: 100,
        lastScanTime: new Date().toISOString(),
      });
    } catch (err) {
      set({
        isScanning: false,
        scanError: err instanceof Error ? err.message : 'Unknown error',
      });
    }
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
    set({ tracks: [], scanProgress: 0, scanError: null, lastScanTime: null });
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
        (t.composer && t.composer.toLowerCase().includes(q))
    );
  },

  getTracksByAlbum: (album: string) => {
    return get().tracks.filter(t => t.album === album);
  },

  getTracksByArtist: (artist: string) => {
    return get().tracks.filter(t => t.artist === artist);
  },

  getAlbums: () => {
    const { tracks } = get();
    const albumMap = new Map<string, { name: string; artist: string; trackCount: number }>();
    for (const t of tracks) {
      const key = `${t.artist}|||${t.album}`;
      const existing = albumMap.get(key);
      if (existing) {
        existing.trackCount++;
      } else {
        albumMap.set(key, { name: t.album, artist: t.artist, trackCount: 1 });
      }
    }
    return Array.from(albumMap.values());
  },

  getArtists: () => {
    const { tracks } = get();
    return [...new Set(tracks.map(t => t.artist))].sort();
  },
}));
