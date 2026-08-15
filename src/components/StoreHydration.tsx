'use client';

import React, { useEffect, useState } from 'react';
import { useLocalLibraryStore } from '@/store/local-library';

/**
 * StoreHydrationGate — prevents rendering children until the library is loaded.
 *
 * Loading priority (checked in order):
 *   1. Supabase PostgreSQL via /api/library/sync (most reliable, cloud)
 *   2. localStorage (fallback, same-device same-origin)
 *   3. IndexedDB for cover art + audio blob URLs (completes the picture)
 *
 * With skipHydration: true on the Zustand persist middleware, SSR never touches
 * localStorage. This gate runs ONLY on the client and controls the load sequence.
 *
 * IMPORTANT: On Vercel, localStorage/IndexedDB persist across reloads IF the
 * domain is the same (use production URL, not preview URLs).
 */
export function StoreHydrationGate({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Loading library…');
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const doHydrate = async () => {
      // ── Step 1: Try loading from cloud database ──
      setStatusMessage('Loading from cloud…');

      try {
        const res = await fetch('/api/library/sync');

        if (res.ok) {
          const data = await res.json();

          if (data.success && data.tracks?.length > 0) {
            console.log(`[HydrationGate] Loaded ${data.tracks.length} tracks from cloud database`);
            setSource('cloud');

            useLocalLibraryStore.setState({
              tracks: data.tracks,
              lastScanTime: data.syncedAt,
              scanProgress: 100,
              scanError: null,
            });

            // Cloud tracks have storageUrl but may be missing cover art.
            // Try IndexedDB for cover art images (stored there as fallback).
            const trackIds = data.tracks.map((t: any) => t.id);
            try {
              const { getCoverArt } = await import('@/lib/audio-db');
              const coverUpdates: Array<{ id: string; coverArt: string | null }> = [];

              const promises = trackIds.map(async (id: string) => {
                const results = await Promise.allSettled([getCoverArt(id)]);
                const coverArt = results[0].status === 'fulfilled' ? results[0].value : null;
                if (coverArt) coverUpdates.push({ id, coverArt });
              });

              await Promise.all(promises);

              if (coverUpdates.length > 0) {
                const coverMap = new Map(coverUpdates.map(u => [u.id, u.coverArt]));
                useLocalLibraryStore.setState((prev) => ({
                  tracks: prev.tracks.map((t) => ({
                    ...t,
                    coverArt: coverMap.get(t.id) ?? t.coverArt,
                  })),
                }));
                console.log(`[HydrationGate] Restored ${coverUpdates.length} cover arts from IndexedDB`);
              }
            } catch {
              // audio-db not available — cover art restoration skipped
            }

            setStatusMessage(`${data.tracks.length} tracks loaded`);
            // Brief delay so user sees the count
            setTimeout(() => { if (!cancelled) setHydrated(true); }, 400);
            return;
          } else {
            console.log('[HydrationGate] Cloud database is empty or not configured');
          }
        } else if (res.status === 503) {
          console.log('[HydrationGate] Cloud database not available (503) — falling back to local');
        } else {
          console.warn('[HydrationGate] Cloud sync failed:', res.status);
        }
      } catch (err) {
        console.warn('[HydrationGate] Cloud sync error:', err);
        // Supabase not configured or network error — fall through to localStorage
      }

      // ── Step 2: Fall back to localStorage ──
      setStatusMessage('Loading locally…');

      const unsubFinish = useLocalLibraryStore.persist.onFinishHydration(() => {
        if (cancelled) { unsubFinish(); return; }

        const tracks = useLocalLibraryStore.getState().tracks;
        console.log(
          `[HydrationGate] Rehydrated ${tracks.length} tracks from localStorage`,
        );

        if (tracks.length > 0) {
          setSource('localStorage');
          setStatusMessage(`${tracks.length} tracks loaded`);
          setTimeout(() => { if (!cancelled) setHydrated(true); }, 300);
        } else {
          // Nothing in cloud or localStorage — fresh library
          console.log('[HydrationGate] No library data found — starting fresh');
          setSource(null);
          setHydrated(true);
        }

        unsubFinish();
      });

      // Force Zustand to read from localStorage
      useLocalLibraryStore.persist.rehydrate();

      // Safety timeout
      setTimeout(() => {
        if (!cancelled) {
          console.warn('[HydrationGate] Timeout — showing app');
          setHydrated(true);
          unsubFinish();
        }
      }, 6000);
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
        {source && (
          <p className="text-xs text-muted-foreground/60 mt-2">
            from {source}
          </p>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
