import { create } from 'zustand';
import type { RadioStationGenerated } from '@/lib/metadata';

interface DiscoveryState {
  // Radio
  isRadioPlaying: boolean;
  currentRadioStation: RadioStationGenerated | null;
  currentGeneratedRadio: RadioStationGenerated | null;
  favoriteStationIds: string[];

  // Browse mode
  browseBy: 'artist-album' | 'composer-work' | 'performer';

  // Actions
  playRadioStation: (station: RadioStationGenerated) => void;
  stopRadio: () => void;
  startRadioFrom: (seed: { type: 'track' | 'artist' | 'genre' | 'playlist'; id: string; name: string }) => RadioStationGenerated | null;
  toggleStationFavorite: (stationId: string) => void;
  setBrowseBy: (mode: 'artist-album' | 'composer-work' | 'performer') => void;
}

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
  isRadioPlaying: false,
  currentRadioStation: null,
  currentGeneratedRadio: null,
  favoriteStationIds: [],
  browseBy: 'artist-album',

  playRadioStation: (station) => set({
    isRadioPlaying: true,
    currentRadioStation: station,
    currentGeneratedRadio: null,
  }),

  stopRadio: () => set({
    isRadioPlaying: false,
    currentRadioStation: null,
    currentGeneratedRadio: null,
  }),

  startRadioFrom: (seed) => {
    // No mock data available to generate radio from; return empty radio
    const radio: RadioStationGenerated = {
      id: `radio-gen-${Date.now()}`,
      name: seed.name,
      seed,
      trackIds: [],
      description: `Radio seeded from ${seed.name}.`,
    };
    set({
      isRadioPlaying: true,
      currentGeneratedRadio: radio,
      currentRadioStation: null,
    });
    return radio;
  },

  toggleStationFavorite: (stationId) => set(s => ({
    favoriteStationIds: s.favoriteStationIds.includes(stationId)
      ? s.favoriteStationIds.filter(id => id !== stationId)
      : [...s.favoriteStationIds, stationId],
  })),

  setBrowseBy: (mode) => set({ browseBy: mode }),
}));
