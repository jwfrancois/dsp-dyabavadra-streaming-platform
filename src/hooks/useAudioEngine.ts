'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/store/player';
import { usePodcastStore } from '@/store/podcast';

// Playback modes
export type PlaybackMode = 'music' | 'radio' | 'podcast';

interface AudioEngineState {
  audio: HTMLAudioElement | null;
  playbackMode: PlaybackMode;
  currentUrl: string | null;
  isLiveStream: boolean;
}

// Singleton audio element shared across the app
let audioElement: HTMLAudioElement | null = null;
let engineState: AudioEngineState = {
  audio: null,
  playbackMode: 'music',
  currentUrl: null,
  isLiveStream: false,
};

function getAudioElement(): HTMLAudioElement {
  if (!audioElement) {
    audioElement = new Audio();
    audioElement.preload = 'auto';
    audioElement.crossOrigin = 'anonymous';
  }
  return audioElement;
}

export function useAudioEngine() {
  const animFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // Load a URL into the audio element
  const loadUrl = useCallback((url: string, mode: PlaybackMode, isLiveStream = false) => {
    const audio = getAudioElement();
    engineState.playbackMode = mode;
    engineState.isLiveStream = isLiveStream;
    engineState.currentUrl = url;

    // Cancel any pending time updates
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // For radio/live streams, we don't set a specific src duration
    if (isLiveStream) {
      audio.src = url;
      audio.load();
    } else {
      audio.src = url;
      audio.load();
    }
  }, []);

  // Start time update loop
  const startTimeUpdates = useCallback(() => {
    const update = () => {
      const audio = getAudioElement();
      if (!audio || audio.paused) return;

      const now = performance.now();
      if (now - lastUpdateTimeRef.current >= 250) { // Update 4x per second
        lastUpdateTimeRef.current = now;
        const currentTime = audio.currentTime;
        const duration = audio.duration || 0;
        const progress = duration > 0 && isFinite(duration)
          ? (currentTime / duration) * 100
          : 0;

        const store = usePlayerStore.getState();
        store.setProgress(progress);
        // We directly update internal time - use setProgress to sync
      }
      animFrameRef.current = requestAnimationFrame(update);
    };
    animFrameRef.current = requestAnimationFrame(update);
  }, []);

  // Stop time update loop
  const stopTimeUpdates = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    const audio = getAudioElement();
    engineState.audio = audio;

    const onLoadedMetadata = () => {
      // Update duration info when metadata loads
      const duration = audio.duration || 0;
      if (duration > 0 && isFinite(duration)) {
        // Could update track duration here
      }
    };

    const onTimeUpdate = () => {
      const store = usePlayerStore.getState();
      const podcastStore = usePodcastStore.getState();
      const currentTime = audio.currentTime;
      const duration = audio.duration || 0;

      // Update player store time
      if (store.isPlaying) {
        const progress = duration > 0 && isFinite(duration)
          ? (currentTime / duration) * 100
          : 0;
        // Direct set for performance (avoid re-render from store)
        usePlayerStore.setState({ currentTime, progress: Math.min(progress, 100) });
      }

      // Update podcast resume position
      if (podcastStore.isPodcastMode && podcastStore.currentEpisode) {
        podcastStore.updateResumePosition(podcastStore.currentEpisode.id, currentTime);
      }
    };

    const onEnded = () => {
      stopTimeUpdates();
      const mode = engineState.playbackMode;
      if (mode === 'radio') {
        // Radio streams loop on error/ended, but we try to reconnect
        setTimeout(() => {
          if (engineState.currentUrl) {
            audio.src = engineState.currentUrl;
            audio.load();
            audio.play().catch(() => {});
          }
        }, 1000);
      } else if (mode === 'music') {
        usePlayerStore.getState().next();
      } else if (mode === 'podcast') {
        const podcastStore = usePodcastStore.getState();
        if (podcastStore.currentEpisode) {
          podcastStore.markEpisodePlayed(podcastStore.currentEpisode.id);
        }
      }
    };

    const onError = () => {
      const mode = engineState.playbackMode;
      if (mode === 'radio') {
        // Retry radio streams
        setTimeout(() => {
          if (engineState.currentUrl && audio.paused) {
            audio.src = engineState.currentUrl;
            audio.load();
            audio.play().catch(() => {});
          }
        }, 3000);
      }
    };

    const onPlay = () => {
      startTimeUpdates();
    };

    const onPause = () => {
      stopTimeUpdates();
    };

    const onWaiting = () => {
      // Buffering - could show buffering indicator
    };

    const onCanPlay = () => {
      // Ready to play
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      stopTimeUpdates();
    };
  }, [startTimeUpdates, stopTimeUpdates]);

  // Sync player store play/pause to real audio
  useEffect(() => {
    const unsubPlay = usePlayerStore.subscribe(
      (state) => state.isPlaying,
      (isPlaying) => {
        const audio = getAudioElement();
        if (isPlaying) {
          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
      }
    );

    const unsubVolume = usePlayerStore.subscribe(
      (state) => state.volume,
      (volume) => {
        const audio = getAudioElement();
        const isMuted = usePlayerStore.getState().isMuted;
        audio.volume = isMuted ? 0 : volume / 100;
      }
    );

    const unsubMute = usePlayerStore.subscribe(
      (state) => state.isMuted,
      (isMuted) => {
        const audio = getAudioElement();
        const volume = usePlayerStore.getState().volume;
        audio.volume = isMuted ? 0 : volume / 100;
      }
    );

    return () => {
      unsubPlay();
      unsubVolume();
      unsubMute();
    };
  }, []);

  // Sync seek to real audio
  useEffect(() => {
    const unsub = usePlayerStore.subscribe(
      (state) => state.seek,
      () => {
        // Seek is a method, not a state value - handle via intercepting progress changes
        // We'll handle seek via a different mechanism
      }
    );
    return () => unsub();
  }, []);

  return {
    loadUrl,
    getAudioElement,
    getEngineState: () => engineState,
    // Override seek to control real audio
    seekTo: useCallback((percent: number) => {
      const audio = getAudioElement();
      const duration = audio.duration || 0;
      if (duration > 0 && isFinite(duration)) {
        audio.currentTime = (percent / 100) * duration;
      }
    }, []),
  };
}
