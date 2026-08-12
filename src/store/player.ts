import { create } from 'zustand';
import type { Track, Zone } from '@/lib/data';
import { tracks as allTracks } from '@/lib/data';

export type ViewName = 'home' | 'browse-artists' | 'browse-albums' | 'browse-tracks' | 'browse-genres' | 'browse-playlists' | 'podcasts' | 'podcast-detail' | 'library' | 'now-playing' | 'artist-detail' | 'album-detail' | 'performer-detail' | 'search' | 'zones' | 'settings' | 'radio' | 'composer-detail' | 'genre-detail' | 'editorial' | 'streaming' | 'work-detail' | 'system' | 'dsp-config' | 'signal-path' | 'endpoints' | 'play-history' | 'profiles' | 'system-health' | 'security' | 'plugins' | 'licensing';

export type PlaybackMode = 'music' | 'radio' | 'podcast';

// ── Helper: build a playable audio URL for any Track ──
const DEMO_TRACKS = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
];

function buildAudioUrl(track: Track): string {
  if (track.filePath) {
    if (track.filePath.startsWith('http://') || track.filePath.startsWith('https://'))
      return `/api/proxy/podcast?url=${encodeURIComponent(track.filePath)}`;
    if (track.filePath.startsWith('/'))
      return `/api/library/stream?file=${encodeURIComponent(track.filePath)}`;
  }
  // Fallback: demo audio for mock library tracks
  const hash = track.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return `/api/proxy/podcast?url=${encodeURIComponent(DEMO_TRACKS[hash % DEMO_TRACKS.length])}`;
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
      const audioUrl = buildAudioUrl(track);
      if (existingIndex >= 0) {
        set({ isPlaying: true, queueIndex: existingIndex, currentTrack: track, progress: 0, currentTime: 0, audioUrl, playbackMode: 'music' as const });
      } else {
        set({
          isPlaying: true,
          currentTrack: track,
          queue: [track, ...state.queue],
          queueIndex: 0,
          progress: 0,
          currentTime: 0,
          audioUrl,
          playbackMode: 'music' as const,
        });
      }
    } else {
      // Resume: if we have a URL and not playing, just hit play
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
    // Proxy radio stream through our API to avoid CORS issues on deployment
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
