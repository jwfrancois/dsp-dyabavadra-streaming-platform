// ═══════════════════════════════════════════════════════════
// DSP Platform — Type Definitions
// All mock data has been removed; the app now uses real imported data.
// ═══════════════════════════════════════════════════════════

export interface Artist {
  id: string;
  name: string;
  imageUrl: string;
  bio: string;
  genres: string[];
  born?: string;
  origin?: string;
  yearsActive?: string;
  type: 'individual' | 'group';
  members?: string[];
  similarArtists: string[];
  playCount: number;
  trackCount: number;
  albumCount: number;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  imageUrl: string;
  year: number;
  genre: string;
  tracks: string[];
  duration: number; // seconds
  format: string;
  bitDepth: number;
  sampleRate: number;
  channels: number;
  label: string;
  catalogNumber?: string;
  type: 'album' | 'single' | 'ep' | 'compilation' | 'live';
  rating: number; // 0-10
  review?: string;
  editions?: Edition[];
}

export interface Edition {
  id: string;
  title: string;
  year: number;
  format: string;
  bitDepth: number;
  sampleRate: number;
  label: string;
  catalogNumber?: string;
}

export interface Track {
  id: string;
  title: string;
  albumId: string;
  albumName: string;
  artistId: string;
  artistName: string;
  trackNumber: number;
  discNumber: number;
  duration: number; // seconds
  format: string;
  bitDepth: number;
  sampleRate: number;
  channels: number;
  bitrate: number;
  filePath: string;
  fileSize: number;
  composers: string[];
  performers: Credit[];
  lyrics?: string;
  genre: string;
  loved: boolean;
  playCount: number;
  lastPlayed?: string;
  source: 'local' | 'tidal' | 'qobuz';
  isAvailable: boolean;
  blobUrl?: string; // Client-side blob URL for browser-imported tracks
  storagePath?: string; // Supabase Storage path (e.g. "audio/{trackId}.{ext}")
  storageUrl?: string; // Supabase CDN URL for streaming (persists across devices)
}

export interface Credit {
  name: string;
  role: string;
  instrument?: string;
}

export interface Zone {
  id: string;
  name: string;
  endpoints: Endpoint[];
  isGroup: boolean;
  isPlaying: boolean;
  currentTrackId?: string;
  volume: number;
  isMuted: boolean;
  isOnline: boolean;
  outputFormat: string;
  sampleRate: number;
  bitDepth: number;
  dspEnabled: boolean;
  dspChain?: string[];
  volumeMode: 'hardware' | 'dsp' | 'fixed';
  maxVolume?: number;
  startupVolume?: number;
  groupZones?: string[];
  syncOffsetMs?: number;
  clockMode?: 'auto' | 'master' | 'slave' | 'passthrough';
  dspConfig?: DSPConfig;
}

export interface Endpoint {
  id: string;
  name: string;
  type: 'bridge' | 'raspberry-pi' | 'mac' | 'pc' | 'mobile' | 'embedded-soc' | 'dedicated-hardware';
  status: 'online' | 'standby' | 'offline' | 'error';
  dac?: string;
  maxSampleRate: number;
  maxBitDepth: number;
  supportsDSD: boolean;
  supportsMQA: boolean;
  supportsDSD256: boolean;
  supportsDoP: boolean;
  firmware?: string;
  ipAddress?: string;
  macAddress?: string;
  latencyMs?: number;
  clockSource?: 'internal' | 'usb' | 'spdif' | 'wordclock' | 'network';
  hasMasterClock?: boolean;
  protocol?: 'dsp-native' | 'raat' | 'airplay' | 'chromecast';
  lastSeen?: string;
  cpuUsage?: number;
  bufferDepth?: number;
}

export interface SignalPathStep {
  label: string;
  format: string;
  sampleRate: number;
  bitDepth: number;
  isBitPerfect: boolean;
  isDSD?: boolean;
  dsdMode?: 'native' | 'DoP' | 'PCM';
  ditherType?: 'none' | 'tpdf' | 'triangular' | 'noise-shaped';
  filterType?: 'minimum-phase' | 'linear-phase' | 'apodizing' | 'brick-wall';
  processingDetail?: string;
  latencyMs?: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  createdAt: string;
  updatedAt: string;
  coverUrl?: string;
  trackCount: number;
  duration: number;
}

export interface Genre {
  id: string;
  name: string;
  trackCount: number;
  albumCount: number;
  artistCount: number;
  imageUrl?: string;
}

// ─── DSP Configuration Types ───

export interface DSPConfig {
  eq?: EQBand[];
  roomCorrection?: RoomCorrection;
  upsampling?: UpsamplingConfig;
  headphoneCorrection?: HeadphoneCorrection;
  crossfeed?: CrossfeedConfig;
  loudness?: LoudnessConfig;
  dither?: DitherConfig;
  volumeLimit?: VolumeLimitConfig;
}

export interface EQBand {
  id: string;
  enabled: boolean;
  type: 'parametric' | 'low-shelf' | 'high-shelf' | 'low-pass' | 'high-pass' | 'band-pass' | 'notch';
  frequency: number; // Hz
  gain: number; // dB, -24 to +24
  q: number; // 0.1 to 20
  label?: string;
}

export interface RoomCorrection {
  enabled: boolean;
  filterName: string;
  filterFilePath?: string;
  samplerate: number;
  channels: number;
  delayMs?: number;
  description?: string;
}

export interface UpsamplingConfig {
  enabled: boolean;
  targetRate: number;
  targetBitDepth: number;
  filterType: 'minimum-phase' | 'linear-phase' | 'apodizing' | 'brick-wall' | 'short-kernel' | 'long-kernel';
  maxSrcRate: number;
}

export interface HeadphoneCorrection {
  enabled: boolean;
  profileName: string;
  manufacturer: string;
  model: string;
  description?: string;
}

export interface CrossfeedConfig {
  enabled: boolean;
  preset: 'none' | 'subtle' | 'moderate' | 'strong' | 'custom';
  customCutoff?: number;
  customFeed?: number;
}

export interface LoudnessConfig {
  enabled: boolean;
  targetLUFS: number;
  method: 'replaygain' | 'ebu-r128' | 'volume-match';
  fallbackGain: number;
}

export interface DitherConfig {
  enabled: boolean;
  type: 'tpdf' | 'triangular' | 'noise-shaped' | 'none';
  noiseShape?: 'flat' | 'f-weighted' | 'shibata';
}

export interface VolumeLimitConfig {
  maxDb?: number;
  maxPercent?: number;
  startupMax?: number;
  rampTimeMs?: number;
}

// ─── Core / Server Status Types ───

export interface CoreStatus {
  id: string;
  name: string;
  version: string;
  status: 'running' | 'starting' | 'stopping' | 'error';
  uptime: number; // seconds
  machineInfo: MachineInfo;
  audioEngine: AudioEngineInfo;
  storageLocations: StorageLocationInfo[];
  networkInfo: NetworkInfo;
  apiInfo: APIInfo;
  streamingServices: StreamingServiceInfo[];
  libraryStats: LibraryStats;
  discoveryMode: 'lan' | 'lan+remote' | 'vpn';
  autoDiscovery: boolean;
  lastScanAt?: string;
}

export interface MachineInfo {
  hostname: string;
  os: string;
  cpuModel: string;
  cpuUsage: number;
  memoryTotal: number;
  memoryUsed: number;
  cores: number;
  architecture: string;
}

export interface AudioEngineInfo {
  status: 'idle' | 'active' | 'overloaded';
  activeZones: number;
  totalZones: number;
  decodingLoad: number;
  dspLoad: number;
  outputLoad: number;
  currentSampleRate: number;
  supportedFormats: string[];
  maxChannels: number;
  bitPerfectCapable: boolean;
  dsdNativeCapable: boolean;
  mqaPassthrough: boolean;
}

export interface StorageLocationInfo {
  id: string;
  name: string;
  path: string;
  type: 'local' | 'nas' | 'usb' | 'network-share';
  enabled: boolean;
  totalSpace: number;
  usedSpace: number;
  trackCount: number;
  albumCount: number;
  isWatching: boolean;
  lastScan?: string;
  scanIntervalMin: number;
}

export interface NetworkInfo {
  hostname: string;
  ipAddress: string;
  macAddress: string;
  protocol: 'dsp-native' | 'raat';
  port: number;
  discoveryPort: number;
  encryption: boolean;
  remoteAccess: boolean;
  vpnActive: boolean;
  connectedEndpoints: number;
}

export interface APIInfo {
  version: string;
  protocol: 'websocket' | 'http-long-poll' | 'grpc';
  port: number;
  wsPort: number;
  authenticated: boolean;
  remoteApps: RemoteAppInfo[];
}

export interface RemoteAppInfo {
  id: string;
  name: string;
  type: 'ios' | 'android' | 'desktop' | 'web';
  connected: boolean;
  lastSeen?: string;
  ipAddress?: string;
}

export interface StreamingServiceInfo {
  id: string;
  name: string;
  type: 'tidal' | 'qobuz' | 'deezer' | 'spotify' | 'apple-music';
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  linked: boolean;
  username?: string;
  qualityTier: string;
  maxQuality?: string;
  lastSync?: string;
  librarySize?: number;
}

export interface LibraryStats {
  totalTracks: number;
  totalAlbums: number;
  totalArtists: number;
  totalDuration: number;
  totalSize: number;
  localTracks: number;
  streamingTracks: number;
  formatBreakdown: Record<string, number>;
  sampleRateBreakdown: Record<string, number>;
}

// ─── Signal Path Components ───

export interface SignalPathComponent {
  stage: string;
  label: string;
  icon: string;
  format: string;
  sampleRate: number;
  bitDepth: number;
  isBitPerfect: boolean;
  description?: string;
}

// ─── Playback Mode ───

export type PlaybackMode = 'music' | 'radio' | 'podcast';

export type ViewName = 'home' | 'browse-artists' | 'browse-albums' | 'browse-tracks' | 'browse-genres' | 'browse-playlists' | 'podcasts' | 'podcast-detail' | 'library' | 'now-playing' | 'artist-detail' | 'album-detail' | 'performer-detail' | 'search' | 'zones' | 'settings' | 'radio' | 'composer-detail' | 'genre-detail' | 'editorial' | 'streaming' | 'work-detail' | 'system' | 'dsp-config' | 'signal-path' | 'endpoints' | 'play-history' | 'profiles' | 'system-health' | 'security' | 'plugins' | 'licensing' | 'listening-stats';

// ─── User Profile ───

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  color: string;
  lovedTrackIds: string[];
  recentlyPlayedIds: string[];
  totalPlayTime: number;
  totalPlays: number;
  joinDate: string;
  isDefault: boolean;
}

// ─── Play History ───

export interface PlayHistoryEntry {
  id: string;
  trackId: string;
  profileId: string;
  playedAt: string;
  completed: boolean;
  source: 'local' | 'tidal' | 'qobuz' | 'radio';
  zoneId: string;
}

// ─── Plugin / Extension ───

export interface DSPPlugin {
  id: string;
  name: string;
  version: string;
  type: 'dsp-module' | 'streaming-service' | 'output-protocol' | 'metadata-provider' | 'codec';
  author: string;
  description: string;
  installed: boolean;
  enabled: boolean;
  status: 'active' | 'error' | 'needs-update' | 'needs-license';
  licenseType: 'open-source' | 'commercial' | 'proprietary' | 'needs-agreement';
  licenseDetail?: string;
  configUrl?: string;
  lastUpdated?: string;
}

// ─── Licensing ───

export interface LicensingItem {
  id: string;
  name: string;
  type: 'codec' | 'protocol' | 'metadata' | 'streaming-api' | 'brand';
  provider: string;
  status: 'clear' | 'needs-agreement' | 'needs-license' | 'proprietary' | 'attribution-required';
  details: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  contact?: string;
  resolved?: boolean;
}

// ─── Tag ───

export interface Tag {
  id: string;
  name: string;
  type: 'genre' | 'mood' | 'era' | 'format' | 'custom';
  trackCount: number;
  color?: string;
}

// ═══════════════════════════════════════════════════════════
// GENERIC UTILITY FUNCTIONS (do not reference mock data)
// ═══════════════════════════════════════════════════════════

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function formatSampleRate(rate: number): string {
  if (rate >= 1000) return `${(rate / 1000).toFixed(1)} kHz`;
  return `${rate} Hz`;
}

export function getCoverGradient(id: string): string {
  const coverColors = [
    'from-purple-900 to-blue-900',
    'from-red-900 to-orange-900',
    'from-green-900 to-teal-900',
    'from-amber-900 to-yellow-900',
    'from-rose-900 to-pink-900',
    'from-indigo-900 to-violet-900',
    'from-cyan-900 to-sky-900',
    'from-emerald-900 to-lime-900',
    'from-slate-800 to-zinc-900',
    'from-fuchsia-900 to-purple-900',
    'from-orange-900 to-red-900',
    'from-teal-900 to-cyan-900',
  ];
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return coverColors[hash % coverColors.length];
}
