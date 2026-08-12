import { create } from 'zustand';
import type { ViewName } from './player';

interface UIState {
  currentView: ViewName;
  viewParams: Record<string, string>;
  sidebarOpen: boolean;
  queueDrawerOpen: boolean;
  searchQuery: string;

  navigate: (view: ViewName, params?: Record<string, string>) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setQueueDrawerOpen: (open: boolean) => void;
  toggleQueueDrawer: () => void;
  setSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'home',
  viewParams: {},
  sidebarOpen: true,
  queueDrawerOpen: false,
  searchQuery: '',

  navigate: (view, params = {}) => set({ currentView: view, viewParams: params }),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setQueueDrawerOpen: (open) => set({ queueDrawerOpen: open }),
  toggleQueueDrawer: () => set(s => ({ queueDrawerOpen: !s.queueDrawerOpen })),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
