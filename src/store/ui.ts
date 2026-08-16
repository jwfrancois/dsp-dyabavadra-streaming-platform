import { create } from 'zustand';
import type { ViewName } from './player';

interface UIState {
  currentView: ViewName;
  viewParams: Record<string, string>;
  sidebarOpen: boolean;
  queueDrawerOpen: boolean;
  zonePickerOpen: boolean;
  searchQuery: string;
  searchOpen: boolean;

  navigate: (view: ViewName, params?: Record<string, string>) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setQueueDrawerOpen: (open: boolean) => void;
  toggleQueueDrawer: () => void;
  setZonePickerOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'home',
  viewParams: {},
  sidebarOpen: true,
  queueDrawerOpen: false,
  zonePickerOpen: false,
  searchQuery: '',
  searchOpen: false,

  navigate: (view, params = {}) => set({ currentView: view, viewParams: params }),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setQueueDrawerOpen: (open) => set({ queueDrawerOpen: open }),
  toggleQueueDrawer: () => set(s => ({ queueDrawerOpen: !s.queueDrawerOpen })),
  setZonePickerOpen: (open) => set({ zonePickerOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  toggleSearch: () => set(s => ({ searchOpen: !s.searchOpen })),
}));
