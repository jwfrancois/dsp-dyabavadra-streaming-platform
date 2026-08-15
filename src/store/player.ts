import { create } from 'zustand';
import type { Track, Zone, ViewName, PlaybackMode } from '@/lib/data';

// ── Helper: build a playable audio URL for any Track ──
// Priority order:
//   1. Supabase Storage CDN URL (storageUrl) — most reliable, works across devices
//   2. Browser blob URL (blobUrl) — immediate playback for just-imported files
//   3. Server-side filesystem streaming (filePath) — for local dev / self-hosted
//   4. IndexedDB fallback — for cached tracks without cloud URL
function buildAudioUrl(track: Track): string {
  // 1. Supabase Storage CDN URL (cloud-persisted)
  if (track.storageUrl && track.storageUrl.startsWith('http')) return track.storageUrl;

  // 2. Browser blob URL (immediate playback)
  if (track.blobUrl) return track.blobUrl;

  // 3. Server-side scanned tracks streamed from filesystem
  if (track.filePath) {
    if (track.filePath.startsWith('http://') || track.filePath.startsWith('https://'))
      return `/api/proxy/podcast?url=${encodeURIComponent(track.filePath)}`;
    if (track.filePath.startsWith('/'))
      return `/api/library/stream?file=${encodeURIComponent(track.filePath)}`;
  }

  // 4. No playable URL available
  return '';
}

/**
 * Async version of buildAudioUrl that tries IndexedDB as a fallback
 * for client-imported tracks whose blobUrl hasn't been restored yet.
 */
export async function resolveAudioUrl(track: Track): Promise<string> {
  // 1. Supabase CDN URL
  if (track.storageUrl && track.storageUrl.startsWith('http')) return track.storageUrl;

  // 2. Check existing blob URL
  if (track.blobUrl) return track.blobUrl;

  // 3. Try to get from IndexedDB (for client-imported tracks)
  if ((track as any).isLocal && track.id) {
    try {
      const { getAudioBlobURL } = await import('@/lib/audio-db');
      const blobUrl = await getAudioBlobURL(track.id);
      if (blobUrl) return blobUrl;
    } catch {
      // audio-db not available (SSR or module error)
    }
  }

  // 4. Fall back to server streaming
  return buildAudioUrl(track);
}

interface PlayerState {
  isPlaying: boolean;
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  activeZoneId: string;
  progress: number; // 0-100
  currentTime: number; // seconds
  duration: number; // actual duration from audio element
  volume: number; // 0-100
  isShuffle: boolean;
  repeatMode: 'off' | 'one' | 'all';
  isMuted: boolean;
  playbackMode: PlaybackMode;
  isBuffering: boolean;
  currentRadioStationId: string | null;
  audioUrl: string | null; // current URL loaded in audio element

  play: (track?: Track) => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  seek: (percent: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setActiveZone: (zoneId: string) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  setBuffering: (buffering: boolean) => void;
  setCurrentTime: (time: number) => void;
  setAudioUrl: (url: string | null) => void;
  playRadioStation: (stationId: string, stationName: string, streamUrl: string, genre: string) => void;
  stopRadio: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  playbackMode: 'music',
  isBuffering: false,
  currentRadioStationId: null,
  audioUrl: null,
  duration: 0,
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  activeZoneId: 'zone-1',
  progress: 0,
  currentTime: 0,
  volume: 72,
  isShuffle: false,
  repeatMode: 'all',
  isMuted: false,

  play: (track) => {
    // If a podcast is playing, clear podcast state first (dynamic import to avoid circular dep)
    import('./podcast').then(({ usePodcastStore: ps }) => {
      if (ps.getState().isPodcastMode) {
        ps.setState({ isPodcastMode: false, currentEpisode: null });
      }
    });

    if (track) {
      const state = get();
      const existingIndex = state.queue.findIndex(t => t.id === track.id);
      const audioUrl = buildAudioUrl(track);
      if (existingIndex >= 0) {
        set({ isPlaying: true, queueIndex: existingIndex, currentTrack: track, progress: 0, currentTime: 0, audioUrl, playbackMode: 'music' as const });
      } else {
        set({
          isPlaying: true, currentTrack: track,
          queue: [track, ...state.queue], queueIndex: 0,
          progress: 0, currentTime: 0, audioUrl, playbackMode: 'music' as const,
        });
      }
    } else {
      const state = get();
      if (state.audioUrl) {
        set({ isPlaying: true });
      }
    }
  },

  pause: () => set({ isPlaying: false }),
  togglePlay: () => set(s => ({ isPlaying: !s.isPlaying })),

  next: () => {
    const { queue, queueIndex, repeatMode, isShuffle } = get();
    if (queue.length === 0) return;
    let nextIndex: number;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') nextIndex = 0;
        else return set({ isPlaying: false });
      }
    }
    const nextTrack = queue[nextIndex];
    const nextAudioUrl = nextTrack ? buildAudioUrl(nextTrack) : null;
    set({
      queueIndex: nextIndex,
      currentTrack: nextTrack,
      progress: 0,
      currentTime: 0,
      isPlaying: true,
      audioUrl: nextAudioUrl,
    });
  },

  previous: () => {
    const { queue, queueIndex, currentTime } = get();
    if (queue.length === 0) return;
    if (currentTime > 3) {
      set({ progress: 0, currentTime: 0 });
      return;
    }
    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) prevIndex = queue.length - 1;
    const prevTrack = queue[prevIndex];
    const prevAudioUrl = prevTrack ? buildAudioUrl(prevTrack) : null;
    set({
      queueIndex: prevIndex,
      currentTrack: prevTrack,
      progress: 0,
      currentTime: 0,
      isPlaying: true,
      audioUrl: prevAudioUrl,
    });
  },

  setQueue: (newTracks, startIndex = 0) => {
    const startTrack = newTracks[startIndex] || null;
    const startAudioUrl = startTrack ? buildAudioUrl(startTrack) : null;
    set({
      queue: newTracks,
      queueIndex: startIndex,
      currentTrack: startTrack,
      isPlaying: true,
      progress: 0,
      currentTime: 0,
      audioUrl: startAudioUrl,
    });
  },

  addToQueue: (track) => set(s => ({ queue: [...s.queue, track] })),

  removeFromQueue: (index) => set(s => {
    const newQueue = [...s.queue];
    newQueue.splice(index, 1);
    let newIndex = s.queueIndex;
    if (index < s.queueIndex) newIndex--;
    else if (index === s.queueIndex && newIndex >= newQueue.length) newIndex = Math.max(0, newQueue.length - 1);
    return {
      queue: newQueue,
      queueIndex: newIndex,
      currentTrack: newQueue[newIndex] || null,
    };
  }),

  reorderQueue: (fromIndex, toIndex) => set(s => {
    const newQueue = [...s.queue];
    const [moved] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, moved);
    let newIndex = s.queueIndex;
    if (fromIndex === s.queueIndex) newIndex = toIndex;
    else if (fromIndex < s.queueIndex && toIndex >= s.queueIndex) newIndex--;
    else if (fromIndex > s.queueIndex && toIndex <= s.queueIndex) newIndex++;
    return { queue: newQueue, queueIndex: newIndex };
  }),

  seek: (percent) => {
    const { currentTrack } = get();
    if (!currentTrack) return;
    const newTime = Math.floor((percent / 100) * currentTrack.duration);
    set({ progress: percent, currentTime: newTime });
  },

  setVolume: (volume) => set({ volume }),
  toggleMute: () => set(s => ({ isMuted: !s.isMuted })),
  toggleShuffle: () => set(s => ({ isShuffle: !s.isShuffle })),
  toggleRepeat: () => set(s => ({
    repeatMode: s.repeatMode === 'off' ? 'all' : s.repeatMode === 'all' ? 'one' : 'off',
  })),
  setActiveZone: (zoneId) => set({ activeZoneId: zoneId }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  setPlaybackMode: (mode) => set({ playbackMode: mode }),
  setBuffering: (buffering) => set({ isBuffering: buffering }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setAudioUrl: (url) => set({ audioUrl: url }),

  playRadioStation: (stationId, stationName, streamUrl, genre) => {
    // If a podcast is playing, clear podcast state first (dynamic import to avoid circular dep)
    import('./podcast').then(({ usePodcastStore: ps }) => {
      if (ps.getState().isPodcastMode) {
        ps.setState({ isPodcastMode: false, currentEpisode: null });
      }
    });

    const proxiedUrl = `/api/proxy/radio?url=${encodeURIComponent(streamUrl)}`;
    const radioTrack: Track = {
      id: `radio-${stationId}`,
      title: stationName,
      albumId: 'radio',
      albumName: genre || 'Internet Radio',
      artistId: 'radio',
      artistName: 'Live Broadcast',
      trackNumber: 0, discNumber: 0,
      duration: 0, format: 'MP3', bitDepth: 16, sampleRate: 44100, channels: 2, bitrate: 128,
      filePath: streamUrl, fileSize: 0, composers: [], performers: [],
      genre: genre || 'Radio', loved: false, playCount: 0, source: 'local', isAvailable: true,
    };
    set({
      isPlaying: true, currentTrack: radioTrack, playbackMode: 'radio',
      currentRadioStationId: stationId, audioUrl: proxiedUrl,
      queue: [radioTrack], queueIndex: 0, progress: 0, currentTime: 0,
    });
  },

  stopRadio: () => {
    set({
      playbackMode: 'music', currentRadioStationId: null, audioUrl: null,
      isPlaying: false,
    });
  },
}));

export type { ViewName };
