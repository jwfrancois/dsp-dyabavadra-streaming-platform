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

export function AudioEngineProvider({ children }: { children: React.ReactNode }) {
  const isPlayingRef = useRef(false);
  const volumeRef = useRef(72);
  const modeRef = useRef<'music' | 'radio' | 'podcast'>('music');
  // Flag to prevent the isPlaying subscription from fighting with the audioUrl subscription
  const urlChangingRef = useRef(false);

  // Sync audio element events
  useEffect(() => {
    const a = getAudio(); // Ensure audio exists on client

    const onEnded = () => {
      stopTimeTracking();
      const store = usePlayerStore.getState();
      const podcastStore = usePodcastStore.getState();

      if (modeRef.current === 'radio') {
        setTimeout(() => {
          const s = usePlayerStore.getState();
          if (s.audioUrl && s.playbackMode === 'radio') {
            const aa = getAudio();
            aa.src = s.audioUrl;
            aa.load();
            aa.play().catch(() => {});
          }
        }, 1000);
      } else if (modeRef.current === 'music') {
        store.next();
      } else if (modeRef.current === 'podcast' && podcastStore.currentEpisode) {
        podcastStore.markEpisodePlayed(podcastStore.currentEpisode.id);
        usePlayerStore.setState({ isPlaying: false });
      }
    };

    const onError = (e: Event) => {
      const a = e.target as HTMLAudioElement;
      console.error('[AudioEngine] Audio error:', a.error?.message || a.error?.code, 'src:', a.src);
      if (modeRef.current === 'radio') {
        setTimeout(() => {
          const s = usePlayerStore.getState();
          if (s.audioUrl && s.playbackMode === 'radio') {
            const aa = getAudio();
            aa.src = s.audioUrl;
            aa.load();
            aa.play().catch(() => {});
          }
        }, 3000);
      }
    };

    const onPlay = () => startTimeTracking();
    const onPause = () => stopTimeTracking();
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

  // Subscribe to player store changes
  useEffect(() => {
    const a = getAudio();
    a.volume = 0.72;

    const unsubPlay = usePlayerStore.subscribe(
      (state) => state.isPlaying,
      (isPlaying) => {
        // If a URL change is in progress, let the URL handler manage playback
        if (urlChangingRef.current) return;

        isPlayingRef.current = isPlaying;
        const aa = getAudio();
        if (isPlaying) {
          aa.play().catch((e) => {
            console.warn('[AudioEngine] play() from isPlaying subscription failed:', e);
          });
        } else {
          aa.pause();
        }
      }
    );

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

    const unsubUrl = usePlayerStore.subscribe(
      (state) => state.audioUrl,
      (url) => {
        const aa = getAudio();
        if (url) {
          // Normalize both URLs for comparison — browsers may add trailing slashes or resolve paths differently
          try {
            const normalizedNew = new URL(url, window.location.origin).href;
            const normalizedExisting = new URL(aa.src, window.location.origin).href;
            if (normalizedNew === normalizedExisting) {
              // Same URL — but we still need to ensure playback if isPlaying is true
              const storeIsPlaying = usePlayerStore.getState().isPlaying;
              isPlayingRef.current = storeIsPlaying;
              if (storeIsPlaying) {
                // If the audio ended or is at the end, reset to beginning
                if (aa.ended || (aa.duration > 0 && aa.currentTime >= aa.duration - 1)) {
                  aa.currentTime = 0;
                }
                if (aa.paused) {
                  aa.play().catch(() => {});
                }
              }
              return; // same URL, skip reload
            }
          } catch {
            // URL parse failed — just compare raw strings
            if (url === aa.src) return;
          }
          console.log('[AudioEngine] Loading new URL:', url);

          // Set flag to prevent isPlaying subscription from interfering
          urlChangingRef.current = true;

          // Pause current audio to ensure clean transition
          aa.pause();
          stopTimeTracking();

          // Reset and load new source
          aa.src = url;
          aa.load();

          // Check if we should auto-play after load
          const storeIsPlaying = usePlayerStore.getState().isPlaying;
          if (storeIsPlaying) {
            // Wait for canplay before calling play() to avoid race conditions
            const onCanPlayOnce = () => {
              aa.removeEventListener('canplaythrough', onCanPlayOnce);
              aa.removeEventListener('canplay', onCanPlayOnce);
              aa.play().catch((e) => console.warn('[AudioEngine] play() after load failed:', e));
              // Release the flag after a short delay to allow isPlaying subscription to work again
              setTimeout(() => { urlChangingRef.current = false; }, 100);
            };
            aa.addEventListener('canplaythrough', onCanPlayOnce);
            aa.addEventListener('canplay', onCanPlayOnce);
            // Fallback: if canplay doesn't fire within 3s, try play anyway and release flag
            setTimeout(() => {
              if (urlChangingRef.current) {
                urlChangingRef.current = false;
                if (aa.paused && storeIsPlaying) {
                  aa.play().catch(() => {});
                }
              }
            }, 3000);
          } else {
            // Not playing, just release the flag
            setTimeout(() => { urlChangingRef.current = false; }, 100);
          }
        } else {
          // URL is null — stop playback
          aa.pause();
          aa.removeAttribute('src');
          aa.load();
          stopTimeTracking();
        }
      }
    );

    const unsubMode = usePlayerStore.subscribe(
      (state) => state.playbackMode,
      (mode) => {
        modeRef.current = mode;
      }
    );

    return () => {
      unsubPlay();
      unsubVolume();
      unsubMute();
      unsubUrl();
      unsubMode();
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
