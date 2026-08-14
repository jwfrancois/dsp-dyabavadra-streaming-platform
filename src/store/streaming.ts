import { create } from 'zustand';
import type { StreamingService, StreamingTrack } from '@/lib/metadata';

interface StreamingState {
  services: StreamingService[];
  streamingTracks: StreamingTrack[];
  isOfflineMode: boolean;

  // Actions
  linkService: (serviceId: string) => void;
  unlinkService: (serviceId: string) => void;
  setOfflineMode: (offline: boolean) => void;
  getLinkedServices: () => StreamingService[];
  getAvailableTracks: () => StreamingTrack[];
  getServiceById: (id: string) => StreamingService | undefined;
}

export const useStreamingStore = create<StreamingState>((set, get) => ({
  services: [],
  streamingTracks: [],
  isOfflineMode: false,

  linkService: (serviceId) => set(s => ({
    services: s.services.map(svc =>
      svc.id === serviceId
        ? { ...svc, linked: true, status: 'connected' as const, linkedSince: new Date().toISOString() }
        : svc
    ),
  })),

  unlinkService: (serviceId) => set(s => ({
    services: s.services.map(svc =>
      svc.id === serviceId
        ? { ...svc, linked: false, status: 'disconnected' as const, linkedAccount: undefined, linkedSince: undefined }
        : svc
    ),
  })),

  setOfflineMode: (offline) => set({ isOfflineMode: offline }),

  getLinkedServices: () => get().services.filter(s => s.linked && s.status === 'connected'),

  getAvailableTracks: () => {
    const { streamingTracks, isOfflineMode } = get();
    if (isOfflineMode) return [];
    return streamingTracks.filter(t => t.isAvailable && !t.isRegionRestricted);
  },

  getServiceById: (id) => get().services.find(s => s.id === id),
}));
