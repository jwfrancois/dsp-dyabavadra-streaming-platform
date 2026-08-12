'use client';

import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/player';
import { usePodcastStore } from '@/store/podcast';

// Singleton audio element — created lazily on client only
let _audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!_audio) {
    _audio = new Audio();
    _audio.preload = 'auto';
  }
  return _audio;
}

// Time update interval
let timeUpdateInterval: ReturnType<typeof setInterval> | null = null;

function startTimeTracking() {
  if (timeUpdateInterval) return;
  timeUpdateInterval = setInterval(() => {
    const a = getAudio();
    if (a.paused) return;
    const podcastStore = usePodcastStore.getState();

    const ct = a.currentTime;
    const dur = a.duration || 0;
    const progress = (dur > 0 && isFinite(dur)) ? (ct / dur) * 100 : 0;

    usePlayerStore.setState({ currentTime: ct, progress: Math.min(progress, 100), duration: isFinite(dur) ? dur : 0 });

    if (podcastStore.isPodcastMode && podcastStore.currentEpisode) {
      podcastStore.updateResumePosition(podcastStore.currentEpisode.id, ct);
    }
  }, 250);
}

function stopTimeTracking() {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
    timeUpdateInterval = null;
  }
}

// Normalize a URL for comparison (browsers may resolve paths differently)
function normalizeUrl(raw: string): string {
  try {
    return new URL(raw, typeof window !== 'undefined' ? window.location.origin : 'http://localhost').href;
  } catch {
    return raw;
  }
}

export function AudioEngineProvider({ children }: { children: React.ReactNode }) {
  const volumeRef = useRef(72);
  const modeRef = useRef<'music' | 'radio' | 'podcast'>('music');

  // Audio element event handlers
  useEffect(() => {
    const a = getAudio();

    const onEnded = () => {
      stopTimeTracking();
      const store = usePlayerStore.getState();
      const podcastStore = usePodcastStore.getState();

      if (modeRef.current === 'music') {
        store.next();
      } else if (modeRef.current === 'podcast' && podcastStore.currentEpisode) {
        podcastStore.markEpisodePlayed(podcastStore.currentEpisode.id);
        usePlayerStore.setState({ isPlaying: false });
      }
      // Radio: proxy handles reconnection — no action needed here
    };

    const onError = (e: Event) => {
      const a = e.target as HTMLAudioElement;
      const errCode = a.error?.code;
      const errMsg = a.error?.message;
      console.error('[AudioEngine] Audio error:', errMsg || errCode, 'src:', a.src?.substring(0, 120));
      usePlayerStore.setState({ isBuffering: false });

      if (modeRef.current === 'radio') {
        // Radio: stop playback on error — don't silently loop retries
        const currentState = usePlayerStore.getState();
        if (currentState.playbackMode === 'radio' && currentState.isPlaying) {
          console.warn('[AudioEngine] Radio stream error — stopping playback');
          usePlayerStore.setState({
            isPlaying: false,
            isBuffering: false,
            currentRadioStationId: null,
          });
        }
      } else if (modeRef.current === 'podcast') {
        usePlayerStore.setState({ isPlaying: false });
      }
    };

    const onPlay = () => {
      startTimeTracking();
    };

    const onPause = () => {
      stopTimeTracking();
    };

    const onWaiting = () => usePlayerStore.setState({ isBuffering: true });
    const onCanPlay = () => usePlayerStore.setState({ isBuffering: false });

    a.addEventListener('ended', onEnded);
    a.addEventListener('error', onError);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('waiting', onWaiting);
    a.addEventListener('canplay', onCanPlay);

    return () => {
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('error', onError);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('waiting', onWaiting);
      a.removeEventListener('canplay', onCanPlay);
      stopTimeTracking();
    };
  }, []);

  // ── SINGLE combined subscription for audioUrl + isPlaying ──
  // This eliminates the race condition between two separate subscriptions.
  // When both change in the same setState(), this handler fires once and
  // can coordinate the load + play in the correct order.
  useEffect(() => {
    const a = getAudio();
    a.volume = 0.72;

    // Generic subscribe: fires on every setState, receives (newState, prevState)
    const unsub = usePlayerStore.subscribe(
      (state, prevState) => {
        const urlChanged = state.audioUrl !== prevState.audioUrl;
        const playingChanged = state.isPlaying !== prevState.isPlaying;
        const modeChanged = state.playbackMode !== prevState.playbackMode;

        if (modeChanged) {
          modeRef.current = state.playbackMode;
        }

        // ── URL changed: load new source ──
        if (urlChanged) {
          const url = state.audioUrl;
          if (url) {
            const normalizedNew = normalizeUrl(url);
            const normalizedExisting = normalizeUrl(a.src || '');

            if (normalizedNew === normalizedExisting) {
              // Same URL — just ensure playback state matches
              if (state.isPlaying && a.paused) {
                // If at the end, restart from beginning
                if (a.ended || (a.duration > 0 && a.currentTime >= a.duration - 1)) {
                  a.currentTime = 0;
                }
                a.play().catch((e) => console.warn('[AudioEngine] resume same URL failed:', e));
              } else if (!state.isPlaying && !a.paused) {
                a.pause();
              }
            } else {
              console.log('[AudioEngine] Loading:', url.substring(0, 120));
              // Stop anything currently playing
              a.pause();
              stopTimeTracking();

              // Load new source
              a.src = url;
              // Don't call load() explicitly — setting src implicitly loads.
              // Calling load() can reset the readyState and prevent play() from working.

              if (state.isPlaying) {
                a.play().catch((e) => console.warn('[AudioEngine] play() after src change failed:', e));
              }
            }
          } else {
            // URL cleared — stop everything
            a.pause();
            a.removeAttribute('src');
            a.load();
            stopTimeTracking();
          }
          return; // Don't also process the isPlaying change below
        }

        // ── Only isPlaying changed (no URL change): toggle play/pause on current source ──
        if (playingChanged) {
          if (state.isPlaying) {
            a.play().catch((e) => console.warn('[AudioEngine] play() toggle failed:', e));
          } else {
            a.pause();
          }
        }
      }
    );

    // Volume and mute are independent — simple selector subscriptions are fine
    const unsubVolume = usePlayerStore.subscribe(
      (state) => state.volume,
      (volume) => {
        volumeRef.current = volume;
        const isMuted = usePlayerStore.getState().isMuted;
        getAudio().volume = isMuted ? 0 : volume / 100;
      }
    );

    const unsubMute = usePlayerStore.subscribe(
      (state) => state.isMuted,
      (isMuted) => {
        getAudio().volume = isMuted ? 0 : volumeRef.current / 100;
      }
    );

    return () => {
      unsub();
      unsubVolume();
      unsubMute();
    };
  }, []);

  return <>{children}</>;
}

// Override seek to control real audio
export function audioSeekTo(percent: number) {
  const a = getAudio();
  const dur = a.duration || 0;
  if (dur > 0 && isFinite(dur)) {
    a.currentTime = (percent / 100) * dur;
  }
}

// Set playback speed (for podcasts)
export function audioSetPlaybackSpeed(speed: number) {
  getAudio().playbackRate = speed;
}
