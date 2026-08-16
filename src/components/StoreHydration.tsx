'use client';

import React, { useEffect } from 'react';
import { useLocalLibraryStore, useIndexedDBRestore } from '@/store/local-library';

/**
 * CloudSyncWrapper — non-blocking background cloud sync + IndexedDB restoration.
 *
 * This wrapper NEVER prevents the app from showing. It does two things in background:
 *   1. Restores cover art + audio blobs from IndexedDB (via useIndexedDBRestore hook)
 *   2. Syncs from Supabase cloud database if localStorage is empty
 *
 * The music store auto-hydrates from localStorage on client mount —
 * same as the podcast store (which has always worked reliably).
 */
export function StoreHydrationGate({ children }: { children: React.ReactNode }) {
  // Trigger IndexedDB restoration of cover art + audio blobs (client-side only)
  useIndexedDBRestore();

  useEffect(() => {
    let cancelled = false;

    const syncFromCloud = async () => {
      // Small delay to let zustand + IndexedDB restoration finish first
      await new Promise(r => setTimeout(r, 1000));
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
        }
      } catch {
        // Cloud not available — localStorage + IndexedDB data is already loaded
      }
    };

    syncFromCloud();
    return () => { cancelled = true; };
  }, []);

  // ALWAYS render children — never block the app
  return <>{children}</>;
}
