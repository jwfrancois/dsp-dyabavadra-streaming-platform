'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Playlist } from '@/lib/data';

interface PlaylistState {
  playlists: Playlist[];
  createPlaylist: (name: string, description?: string) => Playlist;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addToPlaylist: (playlistId: string, trackId: string) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  hasTrack: (playlistId: string, trackId: string) => boolean;
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      playlists: [],

      createPlaylist: (name: string, description?: string) => {
        const playlist: Playlist = {
          id: `pl-${Date.now()}`,
          name,
          description,
          trackIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          trackCount: 0,
          duration: 0,
        };
        set(s => ({ playlists: [...s.playlists, playlist] }));
        return playlist;
      },

      deletePlaylist: (id: string) => {
        set(s => ({ playlists: s.playlists.filter(p => p.id !== id) }));
      },

      renamePlaylist: (id: string, name: string) => {
        set(s => ({
          playlists: s.playlists.map(p =>
            p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      addToPlaylist: (playlistId: string, trackId: string) => {
        set(s => ({
          playlists: s.playlists.map(p => {
            if (p.id !== playlistId) return p;
            if (p.trackIds.includes(trackId)) return p;
            return {
              ...p,
              trackIds: [...p.trackIds, trackId],
              trackCount: p.trackIds.length + 1,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      removeFromPlaylist: (playlistId: string, trackId: string) => {
        set(s => ({
          playlists: s.playlists.map(p => {
            if (p.id !== playlistId) return p;
            return {
              ...p,
              trackIds: p.trackIds.filter(id => id !== trackId),
              trackCount: p.trackIds.filter(id => id !== trackId).length,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      hasTrack: (playlistId: string, trackId: string) => {
        const playlist = get().playlists.find(p => p.id === playlistId);
        return playlist?.trackIds.includes(trackId) ?? false;
      },
    }),
    { name: 'dsp-playlists-store' }
  )
);
