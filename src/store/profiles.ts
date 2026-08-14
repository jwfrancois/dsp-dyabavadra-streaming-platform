import { create } from 'zustand';
import type { UserProfile } from '@/lib/data';

interface ProfilesState {
  profiles: UserProfile[];
  activeProfileId: string;

  switchProfile: (profileId: string) => void;
  getActiveProfile: () => UserProfile | undefined;
  toggleLoveTrack: (trackId: string) => void;
  addRecentlyPlayed: (trackId: string) => void;
  isTrackLoved: (trackId: string) => boolean;
}

export const useProfilesStore = create<ProfilesState>((set, get) => ({
  profiles: [],
  activeProfileId: '',

  switchProfile: (profileId) => set({ activeProfileId: profileId }),

  getActiveProfile: () => {
    const { profiles, activeProfileId } = get();
    return profiles.find(p => p.id === activeProfileId) || profiles[0];
  },

  toggleLoveTrack: (trackId) => set(s => ({
    profiles: s.profiles.map(p => {
      if (p.id !== s.activeProfileId) return p;
      const loved = p.lovedTrackIds.includes(trackId);
      return {
        ...p,
        lovedTrackIds: loved ? p.lovedTrackIds.filter(id => id !== trackId) : [...p.lovedTrackIds, trackId],
      };
    }),
  })),

  addRecentlyPlayed: (trackId) => set(s => ({
    profiles: s.profiles.map(p => {
      if (p.id !== s.activeProfileId) return p;
      const filtered = p.recentlyPlayedIds.filter(id => id !== trackId);
      return { ...p, recentlyPlayedIds: [trackId, ...filtered].slice(0, 50) };
    }),
  })),

  isTrackLoved: (trackId) => {
    const profile = get().getActiveProfile();
    return profile?.lovedTrackIds.includes(trackId) || false;
  },
}));
