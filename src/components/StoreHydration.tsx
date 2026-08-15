'use client';

import React, { useEffect, useState } from 'react';
import { useLocalLibraryStore } from '@/store/local-library';

/**
 * StoreHydrationGate — prevents rendering children until all Zustand persisted stores
 * have fully rehydrated from localStorage. Without this gate, Next.js SSR renders
 * the page with default (empty) state, and the Zustand rehydration may not trigger
 * a visible re-render, causing the user to see an empty library even though data
 * exists in localStorage.
 *
 * Additionally, if localStorage is empty but a server-side backup exists,
 * it will attempt to restore the library from the server backup.
 *
 * Usage: wrap the main app content (inside page.tsx).
 */
export function StoreHydrationGate({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const doHydrate = async () => {
      // Step 1: Force Zustand persist to read from localStorage
      const store = useLocalLibraryStore.getState();

      // Check if Zustand has already hydrated (from persist middleware)
      if (useLocalLibraryStore.persist.hasHydrated()) {
        const currentTracks = useLocalLibraryStore.getState().tracks;

        // If localStorage has tracks, we're done
        if (currentTracks.length > 0) {
          console.log(`[HydrationGate] Rehydrated ${currentTracks.length} tracks from localStorage`);
          if (!cancelled) setHydrated(true);
          return;
        }

        // Step 2: localStorage is empty — try server-side backup
        console.log('[HydrationGate] localStorage empty, checking server backup...');
        try {
          const res = await fetch('/api/library/save');
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.backup && data.backup.tracks?.length > 0) {
              console.log(
                `[HydrationGate] Found server backup with ${data.backup.tracks.length} tracks from ${data.backup.savedAt}`,
              );

              // Restore from server backup
              useLocalLibraryStore.setState({
                tracks: data.backup.tracks.map((t: any) => ({
                  ...t,
                  coverArt: null,
                  isLocal: t.isLocal ?? false,
                  cached: false,
                })),
                directories: data.backup.directories || [],
                lastScanTime: data.backup.lastScanTime,
                scanStats: data.backup.scanStats,
              });

              console.log('[HydrationGate] Restored library from server backup');
              // Note: audio blobs need to be re-imported from the browser
              // Cover art will be restored from IndexedDB if available
            }
          }
        } catch (err) {
          console.warn('[HydrationGate] Server backup check failed:', err);
        }

        if (!cancelled) setHydrated(true);
        return;
      }

      // Wait for Zustand's persist middleware to finish hydrating
      const unsubFinish = useLocalLibraryStore.persist.onFinishHydration(() => {
        console.log('[HydrationGate] Zustand persist finished hydration');

        const tracks = useLocalLibraryStore.getState().tracks;

        if (tracks.length === 0) {
          // Try server backup
          (async () => {
            try {
              const res = await fetch('/api/library/save');
              if (res.ok) {
                const data = await res.json();
                if (data.success && data.backup && data.backup.tracks?.length > 0) {
                  console.log(
                    `[HydrationGate] Restored ${data.backup.tracks.length} tracks from server backup`,
                  );
                  useLocalLibraryStore.setState({
                    tracks: data.backup.tracks.map((t: any) => ({
                      ...t,
                      coverArt: null,
                      isLocal: t.isLocal ?? false,
                      cached: false,
                    })),
                    directories: data.backup.directories || [],
                    lastScanTime: data.backup.lastScanTime,
                    scanStats: data.backup.scanStats,
                  });
                }
              }
            } catch (err) {
              console.warn('[HydrationGate] Server backup check failed:', err);
            }
            if (!cancelled) setHydrated(true);
          })();
        } else {
          console.log(`[HydrationGate] Rehydrated ${tracks.length} tracks from localStorage`);
          if (!cancelled) setHydrated(true);
        }

        unsubFinish();
      });

      // Force rehydration
      useLocalLibraryStore.persist.rehydrate();

      // Safety timeout: if hydration doesn't complete in 3s, show the app anyway
      setTimeout(() => {
        if (!cancelled && !hydrated) {
          console.warn('[HydrationGate] Hydration timed out after 3s, showing app anyway');
          setHydrated(true);
          unsubFinish();
        }
      }, 3000);
    };

    doHydrate();

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show a minimal loading state while stores rehydrate
  if (!hydrated) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">D</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">DSP</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          <span>Restoring library…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
