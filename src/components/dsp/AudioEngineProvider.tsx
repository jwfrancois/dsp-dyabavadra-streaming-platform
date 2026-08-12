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

    const onError = () => {
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
        isPlayingRef.current = isPlaying;
        const aa = getAudio();
        if (isPlaying) {
          aa.play().catch(() => {});
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
        if (url && url !== aa.src) {
          aa.src = url;
          aa.load();
          if (isPlayingRef.current) {
            aa.play().catch(() => {});
          }
        }
      }
    );

    const unsubMode = usePlayerStore.subscribe(
      (state) => state.playbackMode,
      (mode) => {
        modeRef.current = mode;
      }
    );

    const unsubSeek = usePlayerStore.subscribe(
      (state) => state.currentTime,
      () => {
        // Seek is handled through the seek action, not direct time changes
      }
    );

    return () => {
      unsubPlay();
      unsubVolume();
      unsubMute();
      unsubUrl();
      unsubMode();
      unsubSeek();
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
