import { create } from 'zustand';
import type { RadioStation, RadioSeed, RadioStationGenerated } from '@/lib/metadata';
import { radioStations, generateRadio } from '@/lib/metadata';

interface DiscoveryState {
  // Radio
  isRadioPlaying: boolean;
  currentRadioStation: RadioStation | null;
  currentGeneratedRadio: RadioStationGenerated | null;
  favoriteStationIds: string[];

  // Browse mode
  browseBy: 'artist-album' | 'composer-work' | 'performer';

  // Actions
  playRadioStation: (station: RadioStation) => void;
  stopRadio: () => void;
  startRadioFrom: (seed: RadioSeed) => void;
  toggleStationFavorite: (stationId: string) => void;
  setBrowseBy: (mode: 'artist-album' | 'composer-work' | 'performer') => void;
}

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
  isRadioPlaying: false,
  currentRadioStation: null,
  currentGeneratedRadio: null,
  favoriteStationIds: radioStations.filter(s => s.isFavorite).map(s => s.id),
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
    const radio = generateRadio(seed, 25);
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
