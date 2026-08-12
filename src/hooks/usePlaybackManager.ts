'use client';

import { useCallback } from 'react';
import { usePlayerStore } from '@/store/player';
import { usePodcastStore } from '@/store/podcast';
import type { Track } from '@/lib/data';
import type { PodcastEpisode } from '@/lib/podcast-data';
import type { PlaybackMode } from '@/hooks/useAudioEngine';

// Singleton audio element
let audioEl: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = 'auto';
  }
  return audioEl;
}

// Store reference to the current load/seek handler
let _loadUrl: ((url: string, mode: PlaybackMode, isLive?: boolean) => void) | null = null;
let _seekTo: ((percent: number) => void) | null = null;

export function registerAudioCallbacks(loadUrl: (url: string, mode: PlaybackMode, isLive?: boolean) => void, seekTo: (percent: number) => void) {
  _loadUrl = loadUrl;
  _seekTo = seekTo;
}

/**
 * Creates a playback manager that the player store can use to control real audio.
 * This hooks into the audio engine from useAudioEngine.
 */
export function usePlaybackManager() {
  /**
   * Play a music track (local or streaming)
   */
  const playTrack = useCallback((track: Track) => {
    // Determine the audio URL based on track source
    let url: string;
    if (track.source === 'local') {
      url = `/api/library/stream?file=${encodeURIComponent(track.filePath)}`;
    } else if (track.source === 'tidal' || track.source === 'qobuz') {
      // Streaming services - for now use a demo tone or proxy
      url = `/api/proxy/stream?url=${encodeURIComponent('')}`;
      // In production, this would resolve through the streaming service API
    } else {
      url = `/api/library/stream?file=${encodeURIComponent(track.filePath)}`;
    }

    if (_loadUrl) {
      _loadUrl(url, 'music', false);
    } else {
      // Fallback: directly set audio src
      const audio = getAudio();
      audio.src = url;
      audio.load();
      audio.play().catch(() => {});
    }

    usePlayerStore.getState().play(track);
  }, []);

  /**
   * Play a radio station stream
   */
  const playRadioStation = useCallback((stationId: string, stationName: string, streamUrl: string) => {
    if (_loadUrl) {
      _loadUrl(streamUrl, 'radio', true);
    } else {
      const audio = getAudio();
      audio.src = streamUrl;
      audio.load();
      audio.play().catch(() => {});
    }

    // Create a fake "track" for radio to display in player bar
    const radioTrack: Track = {
      id: `radio-${stationId}`,
      title: stationName,
      albumId: '',
      albumName: 'Internet Radio',
      artistId: '',
      artistName: '',
      trackNumber: 0,
      discNumber: 0,
      duration: 0, // Live stream, no duration
      format: 'MP3',
      bitDepth: 16,
      sampleRate: 44100,
      channels: 2,
      bitrate: 128,
      filePath: streamUrl,
      fileSize: 0,
      composers: [],
      performers: [],
      genre: 'Radio',
      loved: false,
      playCount: 0,
      source: 'local',
      isAvailable: true,
    };

    usePlayerStore.getState().play(radioTrack);
  }, []);

  /**
   * Play a podcast episode
   */
  const playPodcastEpisode = useCallback((episode: PodcastEpisode) => {
    // Use the audio URL from the episode (may need proxy for CORS)
    let url = episode.audioUrl;
    if (!url.startsWith('http')) {
      url = `/api/proxy/podcast?url=${encodeURIComponent(url)}`;
    }

    if (_loadUrl) {
      _loadUrl(url, 'podcast', false);
    } else {
      const audio = getAudio();
      audio.src = url;
      audio.load();
      audio.play().catch(() => {});
    }

    usePodcastStore.getState().playEpisode(episode);
    usePlayerStore.setState({ isPlaying: true });

    // Create a track-like object for the player bar display
    // The podcast mode in PlayerBar handles display
  }, []);

  /**
   * Handle seek (for music and podcast modes)
   */
  const handleSeek = useCallback((percent: number) => {
    if (_seekTo) {
      _seekTo(percent);
    } else {
      const audio = getAudio();
      const duration = audio.duration || 0;
      if (duration > 0 && isFinite(duration)) {
        audio.currentTime = (percent / 100) * duration;
      }
    }
    usePlayerStore.getState().seek(percent);
  }, []);

  return {
    playTrack,
    playRadioStation,
    playPodcastEpisode,
    handleSeek,
  };
}
