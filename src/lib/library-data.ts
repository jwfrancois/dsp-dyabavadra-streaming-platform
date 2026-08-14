// ─── Library Management Data Types (Section 5) ───
// All mock data has been removed; the app now uses real imported data.

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
// GENERIC UTILITY FUNCTIONS (do not reference mock data)
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
