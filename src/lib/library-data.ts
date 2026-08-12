// ─── Library Management Data Types & Mock Data (Section 5) ───

import { tracks, albums, artists } from './data';

// ─── STORAGE LOCATION ───

export type StorageType = 'local' | 'nas' | 'external' | 'network';
export type StorageStatus = 'online' | 'offline' | 'scanning' | 'sleeping';

export interface StorageLocation {
  id: string;
  name: string;
  path: string;
  type: StorageType;
  status: StorageStatus;
  enabled: boolean;
  trackCount: number;
  totalSize: number;        // bytes
  lastScan: string;          // ISO date
  scanDuration: number;      // seconds
  watchForChanges: boolean;
  autoRescanInterval: number; // hours, 0 = manual only
  formatPreferences: string[]; // e.g. ['FLAC', 'DSF', 'WAV']
  minBitDepth: number;
  minSampleRate: number;
}

// ─── STREAMING SERVICE ───

export type StreamingService = 'tidal' | 'qobuz' | 'spotify' | 'apple-music';

export interface StreamingAccount {
  id: string;
  service: StreamingService;
  username: string;
  connected: boolean;
  linkedTrackCount: number;
  qualityTier: string;       // e.g. 'HiRes', 'Master', 'Lossless'
  lastSynced: string;
}

// ─── LIBRARY SCAN ───

export type ScanPhase = 'idle' | 'discovering' | 'reading-tags' | 'fingerprinting' | 'deduplicating' | 'finalizing';
export type ScanStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

export interface LibraryScan {
  id: string;
  status: ScanStatus;
  phase: ScanPhase;
  progress: number;           // 0-100
  startedAt: string;
  completedAt?: string;
  totalFiles: number;
  processedFiles: number;
  newFiles: number;
  updatedFiles: number;
  removedFiles: number;
  errorCount: number;
  currentFile?: string;
  errors: ScanError[];
}

export interface ScanError {
  file: string;
  message: string;
  severity: 'warning' | 'error' | 'critical';
}

// ─── TAGS & COLLECTIONS ───

export interface UserTag {
  id: string;
  name: string;
  color: string;             // hex
  trackCount: number;
  createdAt: string;
}

export interface SmartCollection {
  id: string;
  name: string;
  description: string;
  rules: CollectionRule[];
  trackCount: number;
  updatedAt: string;
}

export interface CollectionRule {
  field: string;              // 'genre', 'year', 'format', 'bitDepth', 'sampleRate', 'playCount', 'loved', 'rating', etc.
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'is_set' | 'is_not_set';
  value: string | number | boolean;
  valueTo?: string | number;  // for 'between'
}

// ─── BOOKMARKS ───

export interface Bookmark {
  id: string;
  trackId: string;
  name: string;
  position: number;           // seconds
  createdAt: string;
}

// ─── PLAY HISTORY ───

export interface PlayHistoryEntry {
  id: string;
  trackId: string;
  playedAt: string;
  duration: number;           // seconds listened
  completed: boolean;
  zoneId: string;
  source: 'local' | 'tidal' | 'qobuz';
}

// ─── DEDUPLICATION ───

export interface DuplicateGroup {
  id: string;
  trackIds: string[];
  confidence: number;          // 0-100, how certain the dedup is
  matchType: 'exact' | 'same-recording' | 'same-song' | 'possible';
  preferredId: string;        // which track the user prefers
  resolved: boolean;
}

// ─── METADATA EDIT LOG ───

export interface MetadataEdit {
  id: string;
  trackId: string;
  field: string;
  oldValue: string;
  newValue: string;
  editedAt: string;
  persisted: boolean;         // whether the edit was written back to file tags
}

// ═══════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════

export const storageLocations: StorageLocation[] = [
  {
    id: 'storage-1',
    name: 'Music Library (Internal SSD)',
    path: '/Volumes/Audio/Music',
    type: 'local',
    status: 'online',
    enabled: true,
    trackCount: 12847,
    totalSize: 185634723584,   // ~173 GB
    lastScan: '2026-08-12T02:15:00Z',
    scanDuration: 245,
    watchForChanges: true,
    autoRescanInterval: 4,
    formatPreferences: ['FLAC', 'DSF', 'WAV', 'AIFF'],
    minBitDepth: 16,
    minSampleRate: 44100,
  },
  {
    id: 'storage-2',
    name: 'NAS — Synology (Roon)',
    path: '//192.168.1.50/music/FLAC',
    type: 'nas',
    status: 'online',
    enabled: true,
    trackCount: 24391,
    totalSize: 527489997824,   // ~491 GB
    lastScan: '2026-08-12T01:00:00Z',
    scanDuration: 890,
    watchForChanges: true,
    autoRescanInterval: 6,
    formatPreferences: ['FLAC', 'ALAC'],
    minBitDepth: 16,
    minSampleRate: 44100,
  },
  {
    id: 'storage-3',
    name: 'Hi-Res Collection (External)',
    path: '/Volumes/HiRes',
    type: 'external',
    status: 'offline',
    enabled: true,
    trackCount: 3205,
    totalSize: 215893491712,   // ~201 GB
    lastScan: '2026-08-10T18:30:00Z',
    scanDuration: 120,
    watchForChanges: false,
    autoRescanInterval: 0,
    formatPreferences: ['FLAC', 'DSF', 'DSDIFF'],
    minBitDepth: 24,
    minSampleRate: 96000,
  },
  {
    id: 'storage-4',
    name: 'Vinyl Rips (USB Drive)',
    path: '/Volumes/VinylRips',
    type: 'external',
    status: 'online',
    enabled: true,
    trackCount: 1842,
    totalSize: 68719476736,    // ~64 GB
    lastScan: '2026-08-08T14:00:00Z',
    scanDuration: 85,
    watchForChanges: false,
    autoRescanInterval: 0,
    formatPreferences: ['FLAC', 'WAV'],
    minBitDepth: 24,
    minSampleRate: 44100,
  },
  {
    id: 'storage-5',
    name: 'Backup Archive (Offline NAS)',
    path: '//192.168.1.51/archive/lossless',
    type: 'nas',
    status: 'offline',
    enabled: false,
    trackCount: 45020,
    totalSize: 1073741824000,  // ~1 TB
    lastScan: '2026-07-15T10:00:00Z',
    scanDuration: 2100,
    watchForChanges: false,
    autoRescanInterval: 0,
    formatPreferences: ['FLAC'],
    minBitDepth: 16,
    minSampleRate: 44100,
  },
];

export const streamingAccounts: StreamingAccount[] = [
  {
    id: 'stream-1',
    service: 'tidal',
    username: 'musiclover@dsp.audio',
    connected: true,
    linkedTrackCount: 32450,
    qualityTier: 'HiRes (Max)',
    lastSynced: '2026-08-12T03:00:00Z',
  },
  {
    id: 'stream-2',
    service: 'qobuz',
    username: 'musiclover@dsp.audio',
    connected: true,
    linkedTrackCount: 28900,
    qualityTier: 'Sublime+',
    lastSynced: '2026-08-12T03:00:00Z',
  },
  {
    id: 'stream-3',
    service: 'spotify',
    username: 'not_connected',
    connected: false,
    linkedTrackCount: 0,
    qualityTier: 'N/A',
    lastSynced: '',
  },
];

export const libraryScan: LibraryScan = {
  id: 'scan-latest',
  status: 'completed',
  phase: 'idle',
  progress: 100,
  startedAt: '2026-08-12T02:15:00Z',
  completedAt: '2026-08-12T02:30:45Z',
  totalFiles: 42285,
  processedFiles: 42285,
  newFiles: 47,
  updatedFiles: 12,
  removedFiles: 3,
  errorCount: 2,
  errors: [
    { file: '/Volumes/HiRes/Unknown/track01.flac', message: 'Corrupt FLAC header: cannot read STREAMINFO', severity: 'error' },
    { file: '//192.168.1.50/music/Various/Ambient/track05.wav', message: 'File permission denied', severity: 'warning' },
  ],
};

export const userTags: UserTag[] = [
  { id: 'tag-1', name: 'Favorites', color: '#ef4444', trackCount: 142, createdAt: '2025-01-15T10:00:00Z' },
  { id: 'tag-2', name: 'Late Night', color: '#6366f1', trackCount: 89, createdAt: '2025-02-20T22:00:00Z' },
  { id: 'tag-3', name: 'Work Focus', color: '#10b981', trackCount: 234, createdAt: '2025-03-10T09:00:00Z' },
  { id: 'tag-4', name: 'Party', color: '#f59e0b', trackCount: 178, createdAt: '2025-04-01T18:00:00Z' },
  { id: 'tag-5', name: 'Acoustic', color: '#8b5cf6', trackCount: 156, createdAt: '2025-05-12T14:00:00Z' },
  { id: 'tag-6', name: 'Reference Tracks', color: '#06b6d4', trackCount: 34, createdAt: '2025-06-08T11:00:00Z' },
  { id: 'tag-7', name: 'Cinema', color: '#ec4899', trackCount: 67, createdAt: '2026-01-20T16:00:00Z' },
];

export const smartCollections: SmartCollection[] = [
  {
    id: 'coll-1',
    name: 'Hi-Res Gems',
    description: 'All tracks with 24-bit depth or higher and sample rate ≥ 96kHz',
    rules: [
      { field: 'bitDepth', operator: 'greater_than', value: 16 },
      { field: 'sampleRate', operator: 'greater_than', value: 48000 },
    ],
    trackCount: 3247,
    updatedAt: '2026-08-12T02:30:00Z',
  },
  {
    id: 'coll-2',
    name: 'Most Played (Last 90 Days)',
    description: 'Tracks played more than 10 times in the last 3 months',
    rules: [
      { field: 'playCount', operator: 'greater_than', value: 10 },
      { field: 'lastPlayed', operator: 'greater_than', value: '2026-05-14' },
    ],
    trackCount: 186,
    updatedAt: '2026-08-12T00:00:00Z',
  },
  {
    id: 'coll-3',
    name: 'Unloved Discoveries',
    description: 'Tracks never played but added in the last 30 days',
    rules: [
      { field: 'playCount', operator: 'equals', value: 0 },
      { field: 'loved', operator: 'is_not_set', value: true },
    ],
    trackCount: 52,
    updatedAt: '2026-08-10T12:00:00Z',
  },
  {
    id: 'coll-4',
    name: 'DSD Collection',
    description: 'All DSD format files (DSF, DFF, DSDIFF)',
    rules: [
      { field: 'format', operator: 'contains', value: 'DS' },
    ],
    trackCount: 845,
    updatedAt: '2026-08-08T15:00:00Z',
  },
  {
    id: 'coll-5',
    name: '5-Star Albums',
    description: 'Tracks from albums rated 9 or higher',
    rules: [
      { field: 'albumRating', operator: 'greater_than', value: 8 },
    ],
    trackCount: 456,
    updatedAt: '2026-08-05T09:00:00Z',
  },
];

export const bookmarks: Bookmark[] = [
  { id: 'bm-1', trackId: 'track-3-4', name: 'Amazing Sax Solo', position: 187, createdAt: '2026-07-28T15:30:00Z' },
  { id: 'bm-2', trackId: 'track-1-3', name: 'Key Change', position: 245, createdAt: '2026-07-25T20:15:00Z' },
  { id: 'bm-3', trackId: 'track-5-2', name: 'Guitar Breakdown', position: 420, createdAt: '2026-07-20T11:00:00Z' },
  { id: 'bm-4', trackId: 'track-2-4', name: 'Cello Entrée', position: 32, createdAt: '2026-07-15T16:45:00Z' },
  { id: 'bm-5', trackId: 'track-4-7', name: 'Bridge Section', position: 198, createdAt: '2026-07-10T22:30:00Z' },
];

export const playHistory: PlayHistoryEntry[] = [
  // Generate 30 recent entries spread across the last week
  ...Array.from({ length: 30 }, (_, i) => {
    const trackIdx = i % tracks.length;
    const track = tracks[trackIdx];
    const hoursAgo = i * 5 + Math.floor(Math.random() * 4);
    const date = new Date(Date.now() - hoursAgo * 3600000);
    return {
      id: `history-${i + 1}`,
      trackId: track.id,
      playedAt: date.toISOString(),
      duration: Math.min(track.duration, Math.floor(Math.random() * track.duration)),
      completed: Math.random() > 0.15,
      zoneId: i % 3 === 0 ? 'zone-2' : 'zone-1',
      source: (['local', 'local', 'local', 'tidal', 'qobuz'] as const)[Math.floor(Math.random() * 5)],
    };
  }),
];

export const duplicateGroups: DuplicateGroup[] = [
  {
    id: 'dup-1',
    trackIds: ['track-1-1', 'track-1-1-alt'],
    confidence: 95,
    matchType: 'exact',
    preferredId: 'track-1-1',
    resolved: true,
  },
  {
    id: 'dup-2',
    trackIds: ['track-3-3', 'track-3-3-remaster'],
    confidence: 82,
    matchType: 'same-recording',
    preferredId: 'track-3-3-remaster',
    resolved: false,
  },
  {
    id: 'dup-3',
    trackIds: ['track-4-2', 'track-4-2-radio'],
    confidence: 71,
    matchType: 'same-song',
    preferredId: 'track-4-2',
    resolved: false,
  },
  {
    id: 'dup-4',
    trackIds: ['track-7-1', 'track-7-1-alt-mix'],
    confidence: 65,
    matchType: 'possible',
    preferredId: 'track-7-1',
    resolved: false,
  },
];

export const metadataEdits: MetadataEdit[] = [
  {
    id: 'edit-1',
    trackId: 'track-1-2',
    field: 'genre',
    oldValue: 'Jazz',
    newValue: 'Nordic Jazz',
    editedAt: '2026-08-10T14:30:00Z',
    persisted: true,
  },
  {
    id: 'edit-2',
    trackId: 'track-3-5',
    field: 'composer',
    oldValue: '',
    newValue: 'Kai Horizon',
    editedAt: '2026-08-09T10:15:00Z',
    persisted: true,
  },
  {
    id: 'edit-3',
    trackId: 'track-5-3',
    field: 'year',
    oldValue: '2024',
    newValue: '2023',
    editedAt: '2026-08-08T16:00:00Z',
    persisted: false,
  },
];

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

export function formatStorageSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes < 1024 * 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB`;
}

export function formatScanDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getStorageIcon(type: StorageType): string {
  const icons: Record<StorageType, string> = {
    local: '💻',
    nas: '🖥️',
    external: '🔌',
    network: '🌐',
  };
  return icons[type] || '📁';
}

export function getStorageStatusColor(status: StorageStatus): string {
  const colors: Record<StorageStatus, string> = {
    online: 'text-signal-green',
    offline: 'text-signal-red',
    scanning: 'text-signal-amber',
    sleeping: 'text-muted-foreground',
  };
  return colors[status] || 'text-muted-foreground';
}

export function getStorageStatusLabel(status: StorageStatus): string {
  const labels: Record<StorageStatus, string> = {
    online: 'Online',
    offline: 'Offline',
    scanning: 'Scanning...',
    sleeping: 'Sleeping',
  };
  return labels[status] || status;
}

export function getServiceIcon(service: StreamingService): string {
  const icons: Record<StreamingService, string> = {
    tidal: '🌊',
    qobuz: '🎵',
    spotify: '🟢',
    'apple-music': '🍎',
  };
  return icons[service] || '🔗';
}

export function getServiceLabel(service: StreamingService): string {
  const labels: Record<StreamingService, string> = {
    tidal: 'Tidal',
    qobuz: 'Qobuz',
    spotify: 'Spotify',
    'apple-music': 'Apple Music',
  };
  return labels[service] || service;
}

export function getTotalLibraryStats() {
  const activeLocations = storageLocations.filter(l => l.enabled);
  return {
    totalTracks: activeLocations.reduce((s, l) => s + l.trackCount, 0),
    totalSize: activeLocations.reduce((s, l) => s + l.totalSize, 0),
    locationCount: activeLocations.length,
    onlineLocations: activeLocations.filter(l => l.status === 'online').length,
    offlineLocations: activeLocations.filter(l => l.status === 'offline').length,
    streamingLinked: streamingAccounts.filter(a => a.connected).reduce((s, a) => s + a.linkedTrackCount, 0),
  };
}

export function getOnThisDay(): typeof tracks {
  const today = new Date();
  const month = today.getMonth();
  const day = today.getDate();

  // Mock: return a few tracks as "played on this day" in previous years
  return tracks.slice(0, 5).map((t, i) => ({
    ...t,
    _playedYearsAgo: [1, 2, 3, 4, 5][i],
    _playCountThatDay: [3, 2, 5, 1, 4][i],
  }));
}
