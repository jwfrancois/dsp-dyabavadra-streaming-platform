// ─── PODCAST DATA TYPES ───
// All mock data has been removed; the app now uses real discovered/subscribed data.

export interface PodcastShow {
  id: string;
  title: string;
  author: string;
  description: string;
  artworkUrl: string;     // API route
  feedUrl: string;        // underlying RSS feed
  genre: string;
  category: string;
  language: string;
  rating: string;         // iTunes content rating (e.g. "clean", "explicit")
  episodeCount: number;
  subscribed: boolean;
  autoDownload: boolean;
  newEpisodeCount: number;
  lastChecked: string;     // ISO date of last feed poll
  itunesId?: number;
  averageDuration: number; // seconds
}

export interface PodcastEpisode {
  id: string;
  showId: string;
  title: string;
  description: string;      // can be long — show notes
  showNotes?: string;       // extended notes / links
  artworkUrl: string;
  audioUrl: string;
  duration: number;          // seconds
  publishDate: string;       // ISO date
  fileSize: number;           // bytes
  format: string;            // typically MP3 or AAC
  bitrate: number;           // typically 64-128 kbps for podcasts
  isDownloaded: boolean;
  isPlayed: boolean;
  resumePosition: number;    // seconds — where the listener left off
  completed: boolean;
  favorite: boolean;
  season?: number;
  episodeNumber?: number;
}

export interface ITunesSearchResult {
  id: string;
  title: string;
  author: string;
  artworkUrl: string;
  genre: string;
  episodeCount: number;
  description: string;
}

// ═══════════════════════════════════════════════════════════
// GENERIC UTILITY FUNCTIONS (do not reference mock data)
// ═══════════════════════════════════════════════════════════

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export function formatRelativeTime(dateStr: string): string {
  return formatDate(dateStr);
}

export function formatEpisodeDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
