'use client';

import React, { useEffect, useState } from 'react';
import { useLocalLibraryStore } from '@/store/local-library';

/**
 * StoreHydrationGate — waits for zustand to auto-hydrate from localStorage,
 * then optionally enhances with cloud data from Supabase.
 *
 * Design (matching the podcast store pattern):
 *   1. zustand auto-reads localStorage → tracks appear immediately (no skipHydration)
 *   2. Once hydrated, fetch cloud DB in background → merge if newer data available
 *   3. IndexedDB cover art restoration is handled by the store's onRehydrateStorage
 *
 * This gate just ensures the initial localStorage hydration has completed
 * before rendering the UI, preventing a flash of empty state.
 */
export function StoreHydrationGate({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Loading library…');

  useEffect(() => {
    let cancelled = false;

    const doHydrate = async () => {
      // ── Wait for zustand's automatic localStorage hydration ──
      setStatusMessage('Loading library…');

      const unsubFinish = useLocalLibraryStore.persist.onFinishHydration(() => {
        if (cancelled) { unsubFinish(); return; }

        const tracks = useLocalLibraryStore.getState().tracks;
        console.log(`[HydrationGate] Store hydrated: ${tracks.length} tracks from localStorage`);

        // ── Background: try cloud sync (non-blocking) ──
        // If cloud has data and local is empty, use cloud.
        // If both have data, prefer local (most recent import).
        syncFromCloud(tracks.length);

        setHydrated(true);
        unsubFinish();
      });

      // Safety timeout (zustand should hydrate almost instantly from localStorage)
      setTimeout(() => {
        if (!cancelled) {
          console.warn('[HydrationGate] Timeout — showing app');
          setHydrated(true);
          unsubFinish();
        }
      }, 3000);
    };

    doHydrate();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          <span>{statusMessage}</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/** Background cloud sync — enhances localStorage data with cloud tracks if local is empty */
async function syncFromCloud(localTrackCount: number) {
  try {
    const res = await fetch('/api/library/sync');
    if (!res.ok) return;

    const data = await res.json();
    if (!data.success || !data.tracks?.length) return;

    // Only use cloud data if local is empty (e.g. first visit on a new device)
    // If local already has tracks, prefer those (they're from the most recent import)
    if (localTrackCount === 0 && data.tracks.length > 0) {
      console.log(`[HydrationGate] Local empty, loading ${data.tracks.length} tracks from cloud`);
      useLocalLibraryStore.setState({
        tracks: data.tracks,
        lastScanTime: data.syncedAt,
      });

      // Restore cover art from IndexedDB for cloud tracks
      const trackIds = data.tracks.map((t: any) => t.id);
      try {
        const { getCoverArt } = await import('@/lib/audio-db');
        const promises = trackIds.map(async (id: string) => {
          const result = await getCoverArt(id);
          return result ? { id, coverArt: result } : null;
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
        // IndexedDB not available — skip cover art restoration
      }
    } else {
      console.log(`[HydrationGate] Local has ${localTrackCount} tracks, cloud has ${data.tracks.length} — keeping local`);
    }
  } catch {
    // Cloud not available — localStorage data is already loaded
  }
}
