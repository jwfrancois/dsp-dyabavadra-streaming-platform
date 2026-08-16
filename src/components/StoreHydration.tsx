'use client';

import React, { useEffect } from 'react';
import { useLocalLibraryStore } from '@/store/local-library';

/**
 * CloudSyncWrapper — non-blocking background cloud sync.
 *
 * Unlike the old StoreHydrationGate (which blocked ALL rendering with a spinner),
 * this wrapper NEVER prevents the app from showing. It simply syncs from the
 * cloud database in the background after the component mounts.
 *
 * The music store now auto-hydrates from localStorage on client mount —
 * same as the podcast store (which has always worked reliably).
 * This wrapper is just an optional enhancement for cloud data.
 */
export function StoreHydrationGate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let cancelled = false;

    const syncFromCloud = async () => {
      // Small delay to let zustand finish its auto-hydration from localStorage first
      await new Promise(r => setTimeout(r, 500));
      if (cancelled) return;

      const localTrackCount = useLocalLibraryStore.getState().tracks.length;

      try {
        const res = await fetch('/api/library/sync');
        if (!res.ok) return;

        const data = await res.json();
        if (!data.success || !data.tracks?.length) return;

        // Only use cloud data if local is empty (e.g. first visit on a new device)
        if (localTrackCount === 0 && data.tracks.length > 0) {
          console.log(`[CloudSync] Local empty, loading ${data.tracks.length} tracks from cloud`);
          useLocalLibraryStore.setState({
            tracks: data.tracks,
            lastScanTime: data.syncedAt,
          });

          // Try restoring cover art from IndexedDB for cloud tracks
          try {
            const { getCoverArt } = await import('@/lib/audio-db');
            const trackIds = data.tracks.map((t: any) => t.id);
            const promises = trackIds.map(async (id: string) => {
              const coverArt = await getCoverArt(id);
              return coverArt ? { id, coverArt } : null;
            });
            const results = await Promise.all(promises);
            const coverUpdates = results.filter(Boolean) as Array<{ id: string; coverArt: string }>;
            if (coverUpdates.length > 0) {
              const coverMap = new Map(coverUpdates.map(u => [u.id, u.coverArt]));
              useLocalLibraryStore.setState((prev) => ({
                tracks: prev.tracks.map((t) => ({
                  ...t,
                  coverArt: coverMap.get(t.id) ?? t.coverArt,
                })),
              }));
            }
          } catch {
            // IndexedDB not available
          }
        } else {
          console.log(`[CloudSync] Local has ${localTrackCount} tracks, keeping local`);
        }
      } catch {
        // Cloud not available — localStorage data is already loaded by zustand
      }
    };

    syncFromCloud();
    return () => { cancelled = true; };
  }, []);

  // ALWAYS render children — never block the app
  return <>{children}</>;
}
