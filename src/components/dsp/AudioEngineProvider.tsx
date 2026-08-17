'use client';

import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/player';
import { usePodcastStore } from '@/store/podcast';
import { useDSPEngineStore } from '@/store/dsp-engine';
import { useSystemStore } from '@/store/system';
import { useHistoryStore } from '@/store/history';
import { useProfilesStore } from '@/store/profiles';
import {
  getAudioContext,
  connectMediaElement,
  rebuildChain,
  setDSPVolume,
  isDSPActive,
} from '@/lib/dsp/audio-engine';

// Singleton audio element — created lazily on client only
let _audio: HTMLAudioElement | null = null;
let _dspConnected = false;

function getAudio(): HTMLAudioElement {
  if (!_audio) {
    _audio = new Audio();
    _audio.preload = 'auto';
    _audio.crossOrigin = 'anonymous';
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

  // ── Initialize system uptime counter ──
  useEffect(() => {
    const sysStore = useSystemStore.getState();
    sysStore.initUptime();
    return () => {
      useSystemStore.getState().stopUptime();
    };
  }, []);

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
      } else if (modeRef.current === 'music') {
        // Music: reset isPlaying so the user can retry via togglePlay
        console.warn('[AudioEngine] Music playback error — resetting isPlaying');
        usePlayerStore.setState({ isPlaying: false });
      }
    };

    const onPlay = () => {
      startTimeTracking();
      // Connect DSP on first play (user gesture required for AudioContext)
      if (!_dspConnected) {
        try {
          connectMediaElement(a);
          _dspConnected = true;
        } catch (err) {
          console.warn('[AudioEngine] Could not connect DSP (may already be connected):', err);
          _dspConnected = true; // don't retry
        }
      }
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

  // ── DSP Config subscription: rebuild chain when DSP settings change ──
  useEffect(() => {
    const dspStore = useDSPEngineStore.getState();
    const initialConfig = dspStore.getZoneConfig(dspStore.selectedZoneId);
    rebuildChain(initialConfig);

    const unsub = useDSPEngineStore.subscribe(
      (state) => {
        const cfg = state.getZoneConfig(state.selectedZoneId);
        rebuildChain(cfg);
      }
    );

    return unsub;
  }, []);

  // ── Main audio state subscription ──
  useEffect(() => {
    const a = getAudio();
    // Don't set HTML volume if DSP is managing it
    if (!isDSPActive()) {
      a.volume = 0.72;
    }

    // Generic subscribe: fires on every setState
    const unsub = usePlayerStore.subscribe(
      (state) => {
        // Process audio URL and play state changes
        const url = state.audioUrl;
        const isPlaying = state.isPlaying;
        const mode = state.playbackMode;

        modeRef.current = mode;

        // Use a ref-based approach for URL comparison
        const normalizedNew = url ? normalizeUrl(url) : '';
        const normalizedExisting = normalizeUrl(a.src || '');

        if (normalizedNew !== normalizedExisting) {
          // URL changed: load new source
          if (url) {
            console.log('[AudioEngine] Loading:', url.substring(0, 120));
            console.log('[AudioEngine] Mode:', mode, 'isPlaying:', isPlaying);
            a.pause();
            stopTimeTracking();
            a.src = url;

            if (isPlaying) {
              a.play().catch((e) => console.warn('[AudioEngine] play() after src change failed:', e));

              // Record in history store
              if (mode === 'music' && state.currentTrack) {
                const historyStore = useHistoryStore.getState();
                const profilesStore = useProfilesStore.getState();
                historyStore.addEntry({
                  trackId: state.currentTrack.id,
                  profileId: profilesStore.activeProfileId || 'profile-1',
                  playedAt: new Date().toISOString(),
                  completed: false,
                  source: 'local',
                  zoneId: state.activeZoneId,
                });
              }
            }
          } else {
            a.pause();
            a.removeAttribute('src');
            a.load();
            stopTimeTracking();
          }
        } else if (url && normalizedNew === normalizedExisting) {
          // Same URL — just handle play/pause state
          if (isPlaying && a.paused) {
            if (a.ended || (a.duration > 0 && a.currentTime >= a.duration - 1)) {
              a.currentTime = 0;
            }
            a.play().catch((e) => console.warn('[AudioEngine] resume failed:', e));
          } else if (!isPlaying && !a.paused) {
            a.pause();
          }
        }
      }
    );

    // Volume subscription — route through DSP master gain
    let lastVolume = usePlayerStore.getState().volume;
    const unsubVolume = usePlayerStore.subscribe(
      (state) => {
        const volume = state.volume;
        if (volume === lastVolume) return;
        lastVolume = volume;
        volumeRef.current = volume;
        const isMuted = usePlayerStore.getState().isMuted;
        if (isDSPActive()) {
          setDSPVolume(volume, isMuted);
        } else {
          getAudio().volume = isMuted ? 0 : volume / 100;
        }
      }
    );

    let lastMuted = usePlayerStore.getState().isMuted;
    const unsubMute = usePlayerStore.subscribe(
      (state) => {
        const isMuted = state.isMuted;
        if (isMuted === lastMuted) return;
        lastMuted = isMuted;
        if (isDSPActive()) {
          setDSPVolume(volumeRef.current, isMuted);
        } else {
          getAudio().volume = isMuted ? 0 : volumeRef.current / 100;
        }
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
