import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PodcastEpisode, PodcastShow } from '@/lib/podcast-data';
import { podcastEpisodes, podcastShows } from '@/lib/podcast-data';
import { usePlayerStore } from './player';

interface EpisodeState {
  isPlayed: boolean;
  completed: boolean;
  resumePosition: number;
  isDownloaded: boolean;
  favorite: boolean;
}

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
  episodeStates: Record<string, EpisodeState>;

  // Discovered shows from iTunes search (transient, not persisted)
  discoveredShows: Record<string, PodcastShow>;
  setDiscoveredShow: (show: PodcastShow) => void;

  // Episodes fetched from RSS feeds for discovered shows (transient, not persisted)
  discoveredEpisodes: Record<string, PodcastEpisode[]>;  // keyed by showId
  feedLoading: boolean;
  feedError: string | null;
  fetchDiscoveredEpisodes: (showId: string, feedUrl: string) => Promise<void>;

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

// Initialize episode states from mock data (used only when no persisted state exists)
function buildInitialEpisodeStates(): Record<string, EpisodeState> {
  const initialStates: Record<string, EpisodeState> = {};
  for (const ep of podcastEpisodes) {
    initialStates[ep.id] = {
      isPlayed: ep.isPlayed,
      completed: ep.completed,
      resumePosition: ep.resumePosition,
      isDownloaded: ep.isDownloaded,
      favorite: ep.favorite,
    };
  }
  return initialStates;
}

export const usePodcastStore = create<PodcastState>()(
  persist(
    (set, get) => {
      return {
        currentEpisode: null,
        isPodcastMode: false,
        playbackSpeed: 1.0,
        skipSilence: true,
        sleepTimerMinutes: null,
        sleepTimerRemaining: null,

        subscribedShowIds: podcastShows.filter(s => s.subscribed).map(s => s.id),
        episodeStates: buildInitialEpisodeStates(),
        discoveredShows: {},
        discoveredEpisodes: {},
        feedLoading: false,
        feedError: null,

        setDiscoveredShow: (show) => set(s => ({
          discoveredShows: { ...s.discoveredShows, [show.id]: show },
        })),

        fetchDiscoveredEpisodes: async (showId, feedUrl) => {
          // Skip if already fetched
          const existing = get().discoveredEpisodes[showId];
          if (existing && existing.length > 0) return;

          set({ feedLoading: true, feedError: null });
          try {
            const res = await fetch(`/api/podcasts/feed?url=${encodeURIComponent(feedUrl)}&max=50`);
            if (!res.ok) throw new Error(`Feed fetch failed (${res.status})`);
            const data = await res.json();
            const episodes: PodcastEpisode[] = (data.episodes || []).map((ep: Record<string, unknown>) => ({
              id: String(ep.id || `ep-${Math.random().toString(36).slice(2, 10)}`),
              showId,
              title: String(ep.title || 'Untitled Episode'),
              description: String(ep.description || ''),
              showNotes: String(ep.showNotes || ''),
              artworkUrl: String(ep.artworkUrl || ''),
              audioUrl: String(ep.audioUrl || ''),
              duration: Number(ep.duration || 0),
              publishDate: String(ep.publishDate || new Date().toISOString()),
              fileSize: Number(ep.fileSize || 0),
              format: String(ep.format || 'MP3'),
              bitrate: Number(ep.bitrate || 128),
              isDownloaded: false,
              isPlayed: false,
              resumePosition: 0,
              completed: false,
              favorite: false,
              season: ep.season ? Number(ep.season) : undefined,
              episodeNumber: ep.episodeNumber ? Number(ep.episodeNumber) : undefined,
            }));
            set(s => ({
              discoveredEpisodes: { ...s.discoveredEpisodes, [showId]: episodes },
              feedLoading: false,
            }));
          } catch (err) {
            set({
              feedLoading: false,
              feedError: err instanceof Error ? err.message : 'Failed to load episodes',
            });
          }
        },

        playEpisode: (episode) => {
          // Guard: skip episodes with no audio URL
          if (!episode.audioUrl) {
            console.warn('[PodcastStore] playEpisode called with no audioUrl:', episode.id, episode.title);
            return;
          }

          const state = get();
          const epState = state.episodeStates[episode.id];
          const startPos = epState && !epState.completed ? epState.resumePosition : 0;

          // Build proxied audio URL
          const url = episode.audioUrl.startsWith('http')
            ? `/api/proxy/podcast?url=${encodeURIComponent(episode.audioUrl)}`
            : episode.audioUrl;

          // Sync player store so AudioEngineProvider picks up the new source
          usePlayerStore.setState({
            audioUrl: url,
            isPlaying: true,
            playbackMode: 'podcast' as const,
            isBuffering: true,
            currentTime: 0,
            progress: 0,
            duration: 0,
          });

          set({
            currentEpisode: episode,
            isPodcastMode: true,
          });
          get().updateResumePosition(episode.id, startPos);

          // Seek to resume position after audio element loads
          if (startPos > 0 && episode.duration > 0) {
            const seekPercent = (startPos / episode.duration) * 100;
            setTimeout(() => {
              // Dynamic import to avoid circular dependency at module load time
              import('@/components/dsp/AudioEngineProvider').then(({ audioSeekTo, audioSetPlaybackSpeed }) => {
                audioSetPlaybackSpeed(state.playbackSpeed);
                audioSeekTo(seekPercent);
              });
            }, 300);
          } else {
            // Ensure playback speed is set even without resume
            import('@/components/dsp/AudioEngineProvider').then(({ audioSetPlaybackSpeed }) => {
              audioSetPlaybackSpeed(state.playbackSpeed);
            });
          }
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
            [episodeId]: { ...s.episodeStates[episodeId], isPlayed: true, completed: true, resumePosition: s.episodeStates[episodeId]?.resumePosition || 0 },
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
          // Mark local episodes
          for (const ep of podcastEpisodes.filter(ep => ep.showId === showId)) {
            if (newStates[ep.id]) {
              newStates[ep.id] = { ...newStates[ep.id], isPlayed: true, completed: true };
            }
          }
          // Mark discovered episodes
          const discoveredEps = s.discoveredEpisodes[showId] || [];
          for (const ep of discoveredEps) {
            const existing = newStates[ep.id] || { isPlayed: false, completed: false, resumePosition: 0, isDownloaded: false, favorite: false };
            newStates[ep.id] = { ...existing, isPlayed: true, completed: true };
          }
          return { episodeStates: newStates };
        }),

        updateResumePosition: (episodeId, position) => set(s => {
          const existing = s.episodeStates[episodeId] || { isPlayed: false, completed: false, resumePosition: 0, isDownloaded: false, favorite: false };
          return {
            episodeStates: {
              ...s.episodeStates,
              [episodeId]: { ...existing, resumePosition: position },
            },
          };
        }),

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
    },
    {
      name: 'dsp-podcast-store',
      partialize: (state) => ({
        subscribedShowIds: state.subscribedShowIds,
        episodeStates: state.episodeStates,
      }),
    }
  )
);
