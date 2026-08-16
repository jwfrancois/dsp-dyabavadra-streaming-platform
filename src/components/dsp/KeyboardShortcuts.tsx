'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { usePlayerStore } from '@/store/player';
import { useUIStore } from '@/store/ui';
import { useProfilesStore } from '@/store/profiles';

export function KeyboardShortcuts() {
  const [showOverlay, setShowOverlay] = useState(false);

  const toggleOverlay = useCallback(() => {
    setShowOverlay(prev => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const playerState = usePlayerStore.getState();
      const uiState = useUIStore.getState();

      // ? — Show shortcuts overlay
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toggleOverlay();
        return;
      }

      if (showOverlay) {
        if (e.key === 'Escape' || e.key === '?') {
          e.preventDefault();
          setShowOverlay(false);
        }
        return;
      }

      // Space — Play/Pause
      if (e.key === ' ' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        playerState.togglePlay();
        return;
      }

      // Arrow keys — Seek
      if (e.key === 'ArrowRight' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const current = playerState.currentTime || 0;
        const dur = playerState.duration || playerState.currentTrack?.duration || 0;
        if (dur > 0) {
          const newPct = Math.min(100, ((current + 5) / dur) * 100);
          playerState.seek(newPct);
        }
        return;
      }

      if (e.key === 'ArrowLeft' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const current = playerState.currentTime || 0;
        const dur = playerState.duration || playerState.currentTrack?.duration || 0;
        if (dur > 0) {
          const newPct = Math.max(0, ((current - 5) / dur) * 100);
          playerState.seek(newPct);
        }
        return;
      }

      // Up/Down — Volume
      if (e.key === 'ArrowUp' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const newVol = Math.min(100, playerState.volume + 5);
        playerState.setVolume(newVol);
        return;
      }

      if (e.key === 'ArrowDown' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const newVol = Math.max(0, playerState.volume - 5);
        playerState.setVolume(newVol);
        return;
      }

      // Cmd/Ctrl + Right — Next track
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowRight') {
        e.preventDefault();
        playerState.next();
        return;
      }

      // Cmd/Ctrl + Left — Previous track
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowLeft') {
        e.preventDefault();
        playerState.previous();
        return;
      }

      // S — Toggle shuffle
      if (e.key === 's' && !e.metaKey && !e.ctrlKey) {
        playerState.toggleShuffle();
        return;
      }

      // R — Toggle repeat
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey) {
        playerState.toggleRepeat();
        return;
      }

      // M — Toggle mute
      if (e.key === 'm' && !e.metaKey && !e.ctrlKey) {
        playerState.toggleMute();
        return;
      }

      // / — Focus search
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        uiState.navigate('search');
        return;
      }

      // L — Toggle love
      if (e.key === 'l' && !e.metaKey && !e.ctrlKey && playerState.currentTrack) {
        useProfilesStore.getState().toggleLoveTrack(playerState.currentTrack.id);
        return;
      }

      // N — Now Playing
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        uiState.navigate('now-playing');
        return;
      }

      // H — Home
      if (e.key === 'h' && !e.metaKey && !e.ctrlKey) {
        uiState.navigate('home');
        return;
      }

      // Q — Toggle queue
      if (e.key === 'q' && !e.metaKey && !e.ctrlKey) {
        uiState.toggleQueueDrawer();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showOverlay, toggleOverlay]);

  return (
    <>
      {showOverlay && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setShowOverlay(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold">Keyboard Shortcuts</h2>
                <p className="text-xs text-muted-foreground">Press ? to toggle this overlay</p>
              </div>
              <kbd className="px-2 py-0.5 bg-surface rounded text-xs font-mono text-muted-foreground">ESC</kbd>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
              {[
                { key: 'Space', desc: 'Play / Pause' },
                { key: '← →', desc: 'Seek ±5 seconds' },
                { key: '↑ ↓', desc: 'Volume ±5%' },
                { key: '⌘/Ctrl + →', desc: 'Next Track' },
                { key: '⌘/Ctrl + ←', desc: 'Previous Track' },
                { key: 'S', desc: 'Toggle Shuffle' },
                { key: 'R', desc: 'Toggle Repeat' },
                { key: 'M', desc: 'Toggle Mute' },
                { key: 'L', desc: 'Love Track' },
                { key: 'Q', desc: 'Toggle Queue' },
                { key: 'N', desc: 'Now Playing' },
                { key: 'H', desc: 'Home' },
                { key: '/', desc: 'Search' },
                { key: '?', desc: 'This Overlay' },
              ].map(({ key, desc }) => (
                <div key={key} className="flex items-center gap-3">
                  <kbd className="px-2 py-0.5 bg-surface border border-border rounded text-[11px] font-mono text-foreground min-w-[60px] text-center flex-shrink-0">
                    {key}
                  </kbd>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
