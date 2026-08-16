import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

export const useProfilesStore = create<ProfilesState>()(
  persist(
    (set, get) => ({
      profiles: [], // Will be replaced by onRehydrateStorage
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
    }),
    {
      name: 'dsp-profiles-store',
      partialize: (state) => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.profiles.length === 0) {
          const defaultProfile: UserProfile = {
            id: 'profile-1',
            name: 'Music Lover',
            avatar: '',
            color: 'from-primary to-primary/60',
            lovedTrackIds: [],
            recentlyPlayedIds: [],
            totalPlayTime: 0,
            totalPlays: 0,
            joinDate: new Date().toISOString(),
            isDefault: true,
          };
          state.profiles = [defaultProfile];
          state.activeProfileId = defaultProfile.id;
        } else if (state && !state.activeProfileId) {
          state.activeProfileId = state.profiles[0]?.id || '';
        }
      },
    }
  )
);
