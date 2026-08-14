import { create } from 'zustand';
import type {
  StorageLocation, LibraryScan, UserTag, SmartCollection,
  Bookmark, PlayHistoryEntry, DuplicateGroup, MetadataEdit,
  ScanStatus, ScanPhase,
} from '@/lib/library-data';

interface LibraryState {
  // Storage locations
  locations: StorageLocation[];
  toggleLocation: (id: string) => void;
  removeLocation: (id: string) => void;

  // Scan state
  scan: LibraryScan;
  triggerScan: (locationId?: string) => void;

  // Tags
  tags: UserTag[];
  addTag: (name: string, color: string) => void;
  removeTag: (id: string) => void;

  // Smart collections
  collections: SmartCollection[];
  addCollection: (name: string, description: string, rules: SmartCollection['rules']) => void;
  removeCollection: (id: string) => void;

  // Bookmarks
  bookmarks: Bookmark[];
  addBookmark: (trackId: string, name: string, position: number) => void;
  removeBookmark: (id: string) => void;

  // Play history
  history: PlayHistoryEntry[];
  clearHistory: () => void;

  // Duplicates
  duplicates: DuplicateGroup[];
  resolveDuplicate: (groupId: string, preferredId: string) => void;

  // Metadata edits
  edits: MetadataEdit[];
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  locations: [],
  scan: {
    id: 'scan-init',
    status: 'idle',
    phase: 'idle',
    progress: 0,
    startedAt: '',
    totalFiles: 0,
    processedFiles: 0,
    newFiles: 0,
    updatedFiles: 0,
    removedFiles: 0,
    errorCount: 0,
    errors: [],
  },
  tags: [],
  collections: [],
  bookmarks: [],
  history: [],
  duplicates: [],
  edits: [],

  toggleLocation: (id) => set(s => ({
    locations: s.locations.map(l =>
      l.id === id ? { ...l, enabled: !l.enabled } : l
    ),
  })),

  removeLocation: (id) => set(s => ({
    locations: s.locations.filter(l => l.id !== id),
  })),

  triggerScan: (_locationId) => {
    set(s => ({
      scan: {
        ...s.scan,
        status: 'running' as ScanStatus,
        phase: 'discovering' as ScanPhase,
        progress: 0,
        startedAt: new Date().toISOString(),
        completedAt: undefined,
        processedFiles: 0,
        newFiles: 0,
        updatedFiles: 0,
        removedFiles: 0,
        errorCount: 0,
        errors: [],
      },
    }));
  },

  addTag: (name, color) => set(s => ({
    tags: [...s.tags, {
      id: `tag-${Date.now()}`,
      name,
      color,
      trackCount: 0,
      createdAt: new Date().toISOString(),
    }],
  })),

  removeTag: (id) => set(s => ({
    tags: s.tags.filter(t => t.id !== id),
  })),

  addCollection: (name, description, rules) => set(s => ({
    collections: [...s.collections, {
      id: `coll-${Date.now()}`,
      name,
      description,
      rules,
      trackCount: 0,
      updatedAt: new Date().toISOString(),
    }],
  })),

  removeCollection: (id) => set(s => ({
    collections: s.collections.filter(c => c.id !== id),
  })),

  addBookmark: (trackId, name, position) => set(s => ({
    bookmarks: [...s.bookmarks, {
      id: `bm-${Date.now()}`,
      trackId,
      name,
      position,
      createdAt: new Date().toISOString(),
    }],
  })),

  removeBookmark: (id) => set(s => ({
    bookmarks: s.bookmarks.filter(b => b.id !== id),
  })),

  clearHistory: () => set({ history: [] }),

  resolveDuplicate: (groupId, preferredId) => set(s => ({
    duplicates: s.duplicates.map(d =>
      d.id === groupId ? { ...d, resolved: true, preferredId } : d
    ),
  })),
}));
