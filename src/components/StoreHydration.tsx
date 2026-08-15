'use client';

import React, { useEffect, useState } from 'react';
import { useLocalLibraryStore } from '@/store/local-library';

/**
 * StoreHydrationGate — prevents rendering children until all Zustand persisted stores
 * have fully rehydrated from localStorage.
 *
 * WHY THIS EXISTS:
 * - Next.js SSR renders the page on the server where localStorage doesn't exist
 * - Zustand persist's skipHydration=true prevents SSR from falsely marking hydration complete
 * - This gate explicitly calls rehydrate() on the client, waits for it to finish,
 *   then checks if data was found. If not, it tries a server-side backup.
 *
 * VERCEL NOTE:
 * - localStorage and IndexedDB are CLIENT-SIDE and persist across page loads
 *   as long as the domain stays the same (production URL, not preview URLs)
 * - The server-side backup uses filesystem writes which are EPHEMERAL on Vercel
 *   serverless (files vanish between function invocations)
 * - So the primary persistence strategy is: localStorage + IndexedDB (client-side)
 * - Server backup is a fallback for non-Vercel deployments only
 *
 * Usage: wrap the main app content (inside page.tsx).
 */
export function StoreHydrationGate({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Restoring library…');

  useEffect(() => {
    let cancelled = false;

    const doHydrate = async () => {
      // ── Step 1: Force Zustand to read from localStorage ──
      // With skipHydration: true, this is the ONLY time localStorage is read.
      // onRehydrateStorage will fire when this completes.
      setStatusMessage('Restoring library…');

      const unsubFinish = useLocalLibraryStore.persist.onFinishHydration(() => {
        if (cancelled) { unsubFinish(); return; }

        const tracks = useLocalLibraryStore.getState().tracks;
        console.log(
          `[HydrationGate] Rehydration complete — ${tracks.length} tracks from localStorage`,
        );

        if (tracks.length > 0) {
          // Success: library data found in localStorage
          setStatusMessage(`Loaded ${tracks.length} tracks`);
          setTimeout(() => { if (!cancelled) setHydrated(true); }, 300);
          unsubFinish();
          return;
        }

        // ── Step 2: localStorage empty — try server backup ──
        // NOTE: On Vercel, this will likely fail because filesystem is ephemeral.
        // This fallback works on self-hosted deployments (VPS, Docker, bare metal).
        setStatusMessage('Checking server backup…');

        fetch('/api/library/save')
          .then((res) => res.json())
          .then((data) => {
            if (cancelled) return;

            if (data?.success && data.backup?.tracks?.length > 0) {
              console.log(
                `[HydrationGate] Server backup found: ${data.backup.tracks.length} tracks from ${data.backup.savedAt}`,
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
              setStatusMessage(`Restored ${data.backup.tracks.length} tracks from backup`);
            } else {
              console.log('[HydrationGate] No localStorage or server backup found — fresh library');
            }

            setTimeout(() => { if (!cancelled) setHydrated(true); }, 500);
            unsubFinish();
          })
          .catch((err) => {
            console.warn('[HydrationGate] Server backup check failed:', err);
            // Continue anyway — user just has an empty library
            setTimeout(() => { if (!cancelled) setHydrated(true); }, 300);
            unsubFinish();
          });
      });

      // Kick off rehydration — reads localStorage, fires onRehydrateStorage,
      // then fires onFinishHydration callback above
      useLocalLibraryStore.persist.rehydrate();

      // Safety timeout: show the app after 4s no matter what
      setTimeout(() => {
        if (!cancelled && !hydrated) {
          console.warn('[HydrationGate] Timeout after 4s — showing app');
          setStatusMessage('Loading…');
          setHydrated(true);
          unsubFinish();
        }
      }, 4000);
    };

    doHydrate();

    return () => {
      cancelled = true;
    };
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
