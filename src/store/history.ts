import { create } from 'zustand';
import type { PlayHistoryEntry } from '@/lib/data';
import { playHistory } from '@/lib/data';

interface HistoryState {
  entries: PlayHistoryEntry[];
  maxEntries: number;

  addEntry: (entry: Omit<PlayHistoryEntry, 'id'>) => void;
  getEntriesForProfile: (profileId: string) => PlayHistoryEntry[];
  getEntriesForZone: (zoneId: string) => PlayHistoryEntry[];
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: playHistory,
  maxEntries: 500,

  addEntry: (entry) => set(s => {
    const newEntry: PlayHistoryEntry = { ...entry, id: `ph-${Date.now()}` };
    return { entries: [newEntry, ...s.entries].slice(0, s.maxEntries) };
  }),

  getEntriesForProfile: (profileId) => get().entries.filter(e => e.profileId === profileId),

  getEntriesForZone: (zoneId) => get().entries.filter(e => e.zoneId === zoneId),

  clearHistory: () => set({ entries: [] }),
}));
