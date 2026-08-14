// ─── Metadata & Discovery Data Types for Sections 6 & 7 ───
// Classical music, Radio stations, Editorial content, Streaming services
// All mock data has been removed; the app now uses real imported data.

// ═══════════════════════════════════════════════════════
// CLASSICAL MUSIC
// ═══════════════════════════════════════════════════════

export interface Composer {
  id: string;
  name: string;
  nameFull: string; // e.g., "Ludwig van Beethoven"
  born: string;
  died?: string;
  period: string; // "Classical", "Romantic", "Baroque", "Modern", etc.
  nationality: string;
  imageUrl: string;
  bio: string;
  works: string[]; // Work IDs
  portrait?: string;
  similarComposers: string[];
}

export interface Work {
  id: string;
  title: string;
  titleFull: string; // e.g., "Symphony No. 9 in D minor, Op. 125"
  composerId: string;
  composerName: string;
  catalogNumber?: string; // Op., BWV, K., etc.
  genre: string; // "Symphony", "Concerto", "Sonata", "String Quartet", etc.
  key: string; // "D minor", "C major", etc.
  yearComposed?: number;
  yearFirstPerformed?: number;
  movements: Movement[];
  duration: number; // total seconds
  recordings: WorkRecording[];
  description?: string;
}

export interface Movement {
  number: number;
  title: string;
  tempoMarking: string; // "Allegro", "Andante", etc.
  key?: string;
  duration: number;
}

export interface WorkRecording {
  id: string;
  workId: string;
  performers: string[]; // artist IDs
  performerNames: string[];
  conductor?: string;
  orchestra?: string;
  albumId: string;
  albumName: string;
  year: number;
  format: string;
  sampleRate: number;
  bitDepth: number;
  label: string;
  rating: number;
}

// ═══════════════════════════════════════════════════════
// RADIO STATIONS (for metadata.ts — note: actual stations are in radio-stations.ts)
// ═══════════════════════════════════════════════════════

export interface RadioStation {
  id: string;
  name: string;
  description: string;
  genre: string;
  country: string;
  streamUrl: string;
  codec: string;
  bitrate: number;
  sampleRate: number;
  logoUrl: string;
  isFavorite: boolean;
  tags: string[];
  website?: string;
}

// ═══════════════════════════════════════════════════════
// EDITORIAL CONTENT
// ═══════════════════════════════════════════════════════

export interface EditorialCollection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  type: 'new-releases' | 'genre-primer' | 'best-of' | 'curated' | 'staff-picks' | 'on-this-day';
  coverUrl: string;
  curator?: string;
  trackIds: string[];
  albumIds: string[];
  tags: string[];
  publishedAt: string;
  featured: boolean;
}

export interface GenreDetail {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  moods: string[];
  relatedGenres: string[];
  topArtists: string[];
  essentialAlbums: string[];
  editorialCollections: string[];
  origins?: string;
  characteristics?: string;
}

// ═══════════════════════════════════════════════════════
// STREAMING SERVICES
// ═══════════════════════════════════════════════════════

export interface StreamingService {
  id: string;
  name: string;
  logoUrl: string;
  maxQuality: string;
  maxSampleRate: number;
  maxBitDepth: number;
  supportsDSD: boolean;
  supportsMQA: boolean;
  catalogSize: string;
  oauthUrl: string;
  linked: boolean;
  linkedAccount?: string;
  linkedSince?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'offline';
  features: string[];
  color: string;
}

export interface StreamingTrack {
  id: string;
  serviceId: string;
  serviceName: string;
  title: string;
  albumName: string;
  artistName: string;
  albumArtistName: string;
  duration: number;
  format: string;
  sampleRate: number;
  bitDepth: number;
  isAvailable: boolean;
  isRegionRestricted: boolean;
  quality: string;
  artworkUrl: string;
  composerIds?: string[];
  genre: string;
  trackNumber: number;
  year: number;
  label: string;
}

// ═══════════════════════════════════════════════════════
// FANCY SEARCH
// ═══════════════════════════════════════════════════════

export interface FuzzySearchResult {
  artists: Array<{ id: string; name: string; type: string; score: number }>;
  albums: Array<{ id: string; title: string; artistName: string; score: number }>;
  tracks: Array<{ id: string; title: string; artistName: string; albumName: string; score: number }>;
  composers: Array<{ id: string; name: string; period: string; score: number }>;
  works: Array<{ id: string; title: string; composerName: string; score: number }>;
  credits: Array<{ name: string; role: string; trackId: string; trackTitle: string; score: number }>;
  radioStations: Array<{ id: string; name: string; genre: string; score: number }>;
  genres: Array<{ id: string; name: string; score: number }>;
}

// ═══════════════════════════════════════════════════════
// RADIO SEED / GENERATED RADIO
// ═══════════════════════════════════════════════════════

export interface RadioSeed {
  type: 'track' | 'artist' | 'genre' | 'playlist';
  id: string;
  name: string;
}

export interface RadioStationGenerated {
  id: string;
  name: string;
  seed: RadioSeed;
  trackIds: string[];
  description: string;
}
