import { create } from 'zustand';
import type { Track, Zone } from '@/lib/data';
import { tracks as allTracks } from '@/lib/data';

export type ViewName = 'home' | 'browse-artists' | 'browse-albums' | 'browse-tracks' | 'browse-genres' | 'browse-playlists' | 'podcasts' | 'podcast-detail' | 'library' | 'now-playing' | 'artist-detail' | 'album-detail' | 'search' | 'zones' | 'settings';

interface PlayerState {
  isPlaying: boolean;
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  activeZoneId: string;
  progress: number; // 0-100
  currentTime: number; // seconds
  volume: number; // 0-100
  isShuffle: boolean;
  repeatMode: 'off' | 'one' | 'all';
  isMuted: boolean;

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
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: true,
  currentTrack: allTracks.find(t => t.id === 'track-3-4') || null,
  queue: [
    allTracks.find(t => t.id === 'track-3-4')!,
    allTracks.find(t => t.id === 'track-3-2')!,
    allTracks.find(t => t.id === 'track-3-8')!,
    allTracks.find(t => t.id === 'track-3-5')!,
    allTracks.find(t => t.id === 'track-3-1')!,
    allTracks.find(t => t.id === 'track-3-9')!,
  ].filter(Boolean) as Track[],
  queueIndex: 0,
  activeZoneId: 'zone-1',
  progress: 34,
  currentTime: 121,
  volume: 72,
  isShuffle: false,
  repeatMode: 'all',
  isMuted: false,

  play: (track) => {
    if (track) {
      const state = get();
      const existingIndex = state.queue.findIndex(t => t.id === track.id);
      if (existingIndex >= 0) {
        set({ isPlaying: true, queueIndex: existingIndex, currentTrack: track, progress: 0, currentTime: 0 });
      } else {
        set({
          isPlaying: true,
          currentTrack: track,
          queue: [track, ...state.queue],
          queueIndex: 0,
          progress: 0,
          currentTime: 0,
        });
      }
    } else {
      set({ isPlaying: true });
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
    set({
      queueIndex: nextIndex,
      currentTrack: queue[nextIndex],
      progress: 0,
      currentTime: 0,
      isPlaying: true,
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
    set({
      queueIndex: prevIndex,
      currentTrack: queue[prevIndex],
      progress: 0,
      currentTime: 0,
      isPlaying: true,
    });
  },

  setQueue: (newTracks, startIndex = 0) =>
    set({
      queue: newTracks,
      queueIndex: startIndex,
      currentTrack: newTracks[startIndex] || null,
      isPlaying: true,
      progress: 0,
      currentTime: 0,
    }),

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
}));
