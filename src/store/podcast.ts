import { create } from 'zustand';
import type { PodcastEpisode, PodcastShow } from '@/lib/podcast-data';
import { podcastEpisodes, podcastShows } from '@/lib/podcast-data';

interface PodcastState {
  // Playback state for podcasts (separate from music)
  currentEpisode: PodcastEpisode | null;
  isPodcastMode: boolean;  // true when a podcast is playing (affects PlayerBar)
  playbackSpeed: number;    // 0.5x to 3x
  skipSilence: boolean;
  sleepTimerMinutes: number | null;  // null = off
  sleepTimerRemaining: number | null; // seconds remaining, null = off

  // Episode library state
  subscribedShowIds: string[];
  episodeStates: Record<string, {
    isPlayed: boolean;
    completed: boolean;
    resumePosition: number;
    isDownloaded: boolean;
    favorite: boolean;
  }>;

  // Actions
  playEpisode: (episode: PodcastEpisode) => void;
  pausePodcast: () => void;
  resumePodcast: () => void;
  seekPodcast: (percent: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  cyclePlaybackSpeed: () => void;
  toggleSkipSilence: () => void;
  setSleepTimer: (minutes: number | null) => void;
  toggleSubscribe: (showId: string) => void;
  markEpisodePlayed: (episodeId: string) => void;
  markEpisodeUnplayed: (episodeId: string) => void;
  toggleEpisodeFavorite: (episodeId: string) => void;
  toggleEpisodeDownload: (episodeId: string) => void;
  markAllPlayed: (showId: string) => void;
  updateResumePosition: (episodeId: string, position: number) => void;
  stopPodcast: () => void;
  getTotalNewEpisodes: () => number;
}

export const usePodcastStore = create<PodcastState>((set, get) => {
  // Initialize episode states from mock data
  const initialStates: Record<string, { isPlayed: boolean; completed: boolean; resumePosition: number; isDownloaded: boolean; favorite: boolean }> = {};
  for (const ep of podcastEpisodes) {
    initialStates[ep.id] = {
      isPlayed: ep.isPlayed,
      completed: ep.completed,
      resumePosition: ep.resumePosition,
      isDownloaded: ep.isDownloaded,
      favorite: ep.favorite,
    };
  }

  return {
    currentEpisode: null,
    isPodcastMode: false,
    playbackSpeed: 1.0,
    skipSilence: true,
    sleepTimerMinutes: null,
    sleepTimerRemaining: null,

    subscribedShowIds: podcastShows.filter(s => s.subscribed).map(s => s.id),
    episodeStates: initialStates,

    playEpisode: (episode) => {
      const state = get();
      const epState = state.episodeStates[episode.id];
      const startPos = epState && !epState.completed ? epState.resumePosition : 0;
      set({
        currentEpisode: episode,
        isPodcastMode: true,
      });
      // Also set resume position via update
      get().updateResumePosition(episode.id, startPos);
    },

    pausePodcast: () => set({ /* delegate to main player */ }),
    resumePodcast: () => set({ /* delegate to main player */ }),

    seekPodcast: (_percent) => {
      // Handled by main player seek
    },

    setPlaybackSpeed: (speed) => set({ playbackSpeed: Math.max(0.5, Math.min(3, speed)) }),

    cyclePlaybackSpeed: () => set(s => {
      const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];
      const idx = speeds.indexOf(s.playbackSpeed);
      const nextIdx = idx >= 0 ? (idx + 1) % speeds.length : 2; // default to 1x
      return { playbackSpeed: speeds[nextIdx] };
    }),

    toggleSkipSilence: () => set(s => ({ skipSilence: !s.skipSilence })),
    setSleepTimer: (minutes) => set({ sleepTimerMinutes: minutes, sleepTimerRemaining: minutes ? minutes * 60 : null }),

    toggleSubscribe: (showId) => set(s => ({
      subscribedShowIds: s.subscribedShowIds.includes(showId)
        ? s.subscribedShowIds.filter(id => id !== showId)
        : [...s.subscribedShowIds, showId],
    })),

    markEpisodePlayed: (episodeId) => set(s => ({
      episodeStates: {
        ...s.episodeStates,
        [episodeId]: { ...s.episodeStates[episodeId], isPlayed: true, completed: true, resumePosition: s.episodeStates[episodeId]?.duration || 0 },
      },
    })),

    markEpisodeUnplayed: (episodeId) => set(s => ({
      episodeStates: {
        ...s.episodeStates,
        [episodeId]: { ...s.episodeStates[episodeId], isPlayed: false, completed: false, resumePosition: 0 },
      },
    })),

    toggleEpisodeFavorite: (episodeId) => set(s => ({
      episodeStates: {
        ...s.episodeStates,
        [episodeId]: { ...s.episodeStates[episodeId], favorite: !s.episodeStates[episodeId]?.favorite },
      },
    })),

    toggleEpisodeDownload: (episodeId) => set(s => ({
      episodeStates: {
        ...s.episodeStates,
        [episodeId]: { ...s.episodeStates[episodeId], isDownloaded: !s.episodeStates[episodeId]?.isDownloaded },
      },
    })),

    markAllPlayed: (showId) => set(s => {
      const newStates = { ...s.episodeStates };
      for (const ep of podcastEpisodes.filter(ep => ep.showId === showId)) {
        if (newStates[ep.id]) {
          newStates[ep.id] = { ...newStates[ep.id], isPlayed: true, completed: true };
        }
      }
      return { episodeStates: newStates };
    }),

    updateResumePosition: (episodeId, position) => set(s => ({
      episodeStates: {
        ...s.episodeStates,
        [episodeId]: { ...(s.episodeStates[episodeId] || {}), resumePosition: position } as NonNullable<typeof s.episodeStates[string]>,
      },
    })),

    stopPodcast: () => set({ currentEpisode: null, isPodcastMode: false }),

    getTotalNewEpisodes: () => {
      const state = get();
      let count = 0;
      for (const showId of state.subscribedShowIds) {
        for (const ep of podcastEpisodes.filter(e => e.showId === showId)) {
          const epState = state.episodeStates[ep.id];
          if (epState && !epState.isPlayed && !epState.completed) count++;
        }
      }
      return count;
    },
  };
});
