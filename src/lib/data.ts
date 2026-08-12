// Comprehensive mock data for Dyabavadra-Streaming Platform

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
  targetRate: number; // e.g., 176400 for 4x 44.1k
  targetBitDepth: number;
  filterType: 'minimum-phase' | 'linear-phase' | 'apodizing' | 'brick-wall' | 'short-kernel' | 'long-kernel';
  maxSrcRate: number; // don't upsample sources above this rate
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
  decodingLoad: number; // percent
  dspLoad: number; // percent
  outputLoad: number; // percent
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

// ─── Cover Art URLs (using gradients as placeholders) ───

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

function coverGradient(index: number): string {
  return coverColors[index % coverColors.length];
}

function albumArtUrl(id: string): string {
  return `/api/cover/${id}`;
}

// ─── ARTISTS ───

export const artists: Artist[] = [
  {
    id: 'artist-1',
    name: 'Lena Viktoria',
    imageUrl: albumArtUrl('artist-1'),
    bio: 'Lena Viktoria is a Swedish jazz vocalist and composer known for her ethereal interpretations of Scandinavian folk melodies combined with modern jazz harmony. Based in Stockholm, she has released four critically acclaimed albums and collaborated with artists across Europe and North America. Her voice, described by critics as "crystalline and deeply emotive," has become a defining sound in contemporary Nordic jazz.',
    genres: ['Jazz', 'Nordic Folk', 'Vocal Jazz'],
    born: '1988, Stockholm, Sweden',
    origin: 'Stockholm, Sweden',
    yearsActive: '2012–present',
    type: 'individual',
    similarArtists: ['artist-2', 'artist-5', 'artist-8'],
    playCount: 18432,
    trackCount: 48,
    albumCount: 4,
  },
  {
    id: 'artist-2',
    name: 'The Meridian Ensemble',
    imageUrl: albumArtUrl('artist-2'),
    bio: 'The Meridian Ensemble is a Berlin-based contemporary classical group that bridges the gap between minimalism, ambient music, and modern chamber composition. Founded in 2015 by composer Elias Richter, the ensemble has earned praise for their immersive live performances and meticulous studio recordings, often captured in 24-bit/192kHz for maximum fidelity.',
    genres: ['Contemporary Classical', 'Minimalism', 'Ambient', 'Chamber'],
    born: '2015',
    origin: 'Berlin, Germany',
    yearsActive: '2015–present',
    type: 'group',
    members: ['Elias Richter (composer)', 'Maren Fischer (violin)', 'Jonas Berg (cello)', 'Yuki Tanaka (piano)', 'Sophie Müller (flute)'],
    similarArtists: ['artist-1', 'artist-6', 'artist-9'],
    playCount: 12450,
    trackCount: 36,
    albumCount: 3,
  },
  {
    id: 'artist-3',
    name: 'Kai Horizon',
    imageUrl: albumArtUrl('artist-3'),
    bio: 'Kai Horizon is an electronic music producer and sound designer from Tokyo, Japan. His work spans ambient techno, IDM, and experimental soundscapes, drawing inspiration from the city\'s intersection of tradition and hypermodernity. His productions are meticulously crafted, with releases available in hi-res FLAC up to 32-bit/96kHz.',
    genres: ['Electronic', 'Ambient', 'Techno', 'IDM'],
    born: '1991, Tokyo, Japan',
    origin: 'Tokyo, Japan',
    yearsActive: '2014–present',
    type: 'individual',
    similarArtists: ['artist-7', 'artist-10', 'artist-2'],
    playCount: 21300,
    trackCount: 64,
    albumCount: 5,
  },
  {
    id: 'artist-4',
    name: 'Amara Osei',
    imageUrl: albumArtUrl('artist-4'),
    bio: 'Ghanaian-British singer-songwriter Amara Osei fuses highlife, neo-soul, and electronic music into a vibrant, deeply personal sound. Raised in London and Accra, her lyrics explore themes of identity, migration, and joy. Her debut album "Golden Hour" won the 2023 Mercury Prize and established her as one of the most exciting voices in modern British music.',
    genres: ['Neo-Soul', 'Highlife', 'Electronic', 'World'],
    born: '1994, London, UK',
    origin: 'London, UK / Accra, Ghana',
    yearsActive: '2018–present',
    type: 'individual',
    similarArtists: ['artist-1', 'artist-8', 'artist-11'],
    playCount: 31200,
    trackCount: 42,
    albumCount: 3,
  },
  {
    id: 'artist-5',
    name: 'Aethon',
    imageUrl: albumArtUrl('artist-5'),
    bio: 'Aethon is a progressive metal band from Oslo, Norway, known for their complex time signatures, extended compositions, and atmospheric soundscapes. Formed in 2010, they have released five albums that blend technical precision with emotional depth. Their most recent album, "Celestial Mechanics," was recorded in DXD (352.8kHz/32-bit) and mixed by legendary engineer Steve Wilson.',
    genres: ['Progressive Metal', 'Post-Rock', 'Atmospheric'],
    born: '2010',
    origin: 'Oslo, Norway',
    yearsActive: '2010–present',
    type: 'group',
    members: ['Magnus Helle (guitar, vocals)', 'Ingrid Solberg (bass)', 'Torsten Dahl (drums)', 'Erik Voss (keyboards)'],
    similarArtists: ['artist-6', 'artist-9', 'artist-12'],
    playCount: 15780,
    trackCount: 52,
    albumCount: 5,
  },
  {
    id: 'artist-6',
    name: 'Isabella Reyes',
    imageUrl: albumArtUrl('artist-6'),
    bio: 'Isabella Reyes is an Argentine pianist and composer specializing in contemporary classical and nuevo tango. A graduate of the Buenos Aires Conservatory, her work reimagines tango traditions through a modern classical lens, incorporating prepared piano, field recordings, and electronic processing. Her performances are celebrated for their emotional intensity and technical precision.',
    genres: ['Contemporary Classical', 'Tango Nuevo', 'Piano'],
    born: '1985, Buenos Aires, Argentina',
    origin: 'Buenos Aires, Argentina',
    yearsActive: '2009–present',
    type: 'individual',
    similarArtists: ['artist-2', 'artist-9', 'artist-5'],
    playCount: 9800,
    trackCount: 38,
    albumCount: 3,
  },
  {
    id: 'artist-7',
    name: 'Drift Signal',
    imageUrl: albumArtUrl('artist-7'),
    bio: 'Drift Signal is the recording alias of Canadian ambient artist David Chen. Based in Vancouver, his work explores the boundaries between music and silence, using field recordings, granular synthesis, and extended reverb to create immersive sonic environments. His albums are recorded and mastered at the highest possible resolution, with several releases available in DSD256.',
    genres: ['Ambient', 'Drone', 'Electronic', 'Field Recording'],
    born: '1979, Vancouver, Canada',
    origin: 'Vancouver, Canada',
    yearsActive: '2006–present',
    type: 'individual',
    similarArtists: ['artist-3', 'artist-10', 'artist-2'],
    playCount: 8900,
    trackCount: 44,
    albumCount: 6,
  },
  {
    id: 'artist-8',
    name: 'The Velvet Current',
    imageUrl: albumArtUrl('artist-8'),
    bio: 'The Velvet Current is a London-based jazz-funk collective featuring some of the UK\'s finest session musicians. Their sound draws from Herbie Hancock\'s Head Hunters era, Weather Report, and modern London jazz, creating tight, groove-driven instrumentals that showcase exceptional ensemble playing and virtuosic solos.',
    genres: ['Jazz Funk', 'Fusion', 'Jazz'],
    born: '2016',
    origin: 'London, UK',
    yearsActive: '2016–present',
    type: 'group',
    members: ['James Okonkwo (keys)', 'Sarah Chen (saxophone)', 'Marco Rossi (bass)', 'Devon Wright (drums)', 'Amir Hassan (guitar)'],
    similarArtists: ['artist-1', 'artist-4', 'artist-11'],
    playCount: 14600,
    trackCount: 30,
    albumCount: 2,
  },
  {
    id: 'artist-9',
    name: 'Pale Horizon',
    imageUrl: albumArtUrl('artist-9'),
    bio: 'Pale Horizon is an Australian post-rock ensemble known for expansive, cinematic compositions that build from delicate textures to overwhelming crescendos. Their live performances feature synchronized visuals and surround sound, and their studio recordings are acclaimed for their dynamic range and spatial mixing.',
    genres: ['Post-Rock', 'Ambient', 'Instrumental', 'Cinematic'],
    born: '2013',
    origin: 'Melbourne, Australia',
    yearsActive: '2013–present',
    type: 'group',
    members: ['Liam Foster (guitar)', 'Emma Nguyen (guitar)', 'Jack Morrison (bass)', 'Chris Taylor (drums)', 'Rachel Kim (strings)'],
    similarArtists: ['artist-5', 'artist-6', 'artist-7'],
    playCount: 11300,
    trackCount: 28,
    albumCount: 3,
  },
  {
    id: 'artist-10',
    name: 'Mira Sol',
    imageUrl: albumArtUrl('artist-10'),
    bio: 'Mira Sol is a Catalan singer-songwriter whose intimate, understated pop blends electronic production with acoustic instruments and multilingual lyrics in Catalan, Spanish, and English. Her music is characterized by warm analog synths, delicate vocal harmonies, and poetic lyrics that explore memory, place, and identity.',
    genres: ['Indie Pop', 'Electronic', 'Art Pop', 'Catalan'],
    born: '1993, Girona, Spain',
    origin: 'Girona, Catalonia',
    yearsActive: '2016–present',
    type: 'individual',
    similarArtists: ['artist-3', 'artist-4', 'artist-7'],
    playCount: 16800,
    trackCount: 40,
    albumCount: 4,
  },
  {
    id: 'artist-11',
    name: 'Ironroot',
    imageUrl: albumArtUrl('artist-11'),
    bio: 'Ironroot is a Nigerian-American Afrobeat and jazz fusion group based in Brooklyn, New York. Founded by drummer and bandleader Tobi Adeyemi, Ironroot channels the spirit of Fela Kuti through a modern lens, incorporating hip-hop rhythms, jazz harmony, and electronic production. Their explosive live shows have made them a festival favorite.',
    genres: ['Afrobeat', 'Jazz Fusion', 'Funk', 'World'],
    born: '2017',
    origin: 'Brooklyn, New York, USA',
    yearsActive: '2017–present',
    type: 'group',
    members: ['Tobi Adeyemi (drums, percussion)', 'Kofi Mensah (bass)', 'Nneka Obi (vocals)', 'David Park (keys)', 'Carlos Ruiz (trumpet)', 'Jake Thompson (saxophone)'],
    similarArtists: ['artist-4', 'artist-8', 'artist-10'],
    playCount: 19500,
    trackCount: 34,
    albumCount: 2,
  },
  {
    id: 'artist-12',
    name: 'Sigrid Haugen',
    imageUrl: albumArtUrl('artist-12'),
    bio: 'Norwegian violinist and composer Sigrid Haugen bridges classical, folk, and experimental electronic music. A former member of the Norwegian Chamber Orchestra, she now creates solo works that combine virtuosic violin technique with live electronics, field recordings from Arctic landscapes, and algorithms that respond to her playing in real time.',
    genres: ['Experimental', 'Contemporary Classical', 'Electroacoustic', 'Folk'],
    born: '1987, Tromsø, Norway',
    origin: 'Tromsø, Norway',
    yearsActive: '2011–present',
    type: 'individual',
    similarArtists: ['artist-5', 'artist-6', 'artist-9'],
    playCount: 7200,
    trackCount: 22,
    albumCount: 2,
  },
];

// ─── ALBUMS ───

export const albums: Album[] = [
  {
    id: 'album-1',
    title: 'Northern Lights',
    artistId: 'artist-1',
    artistName: 'Lena Viktoria',
    imageUrl: albumArtUrl('album-1'),
    year: 2023,
    genre: 'Jazz',
    tracks: ['track-1-1', 'track-1-2', 'track-1-3', 'track-1-4', 'track-1-5', 'track-1-6', 'track-1-7', 'track-1-8'],
    duration: 2840,
    format: 'FLAC',
    bitDepth: 24,
    sampleRate: 96,
    channels: 2,
    label: 'ECM Records',
    catalogNumber: 'ECM 2891',
    type: 'album',
    rating: 9,
    review: 'A masterful recording that captures Viktoria at the peak of her powers. The Stockholm studio sessions yielded an album of remarkable intimacy and clarity, with each note perfectly rendered in 24/96.',
    editions: [
      { id: 'ed-1a', title: 'Original Release', year: 2023, format: 'FLAC', bitDepth: 24, sampleRate: 96, label: 'ECM Records', catalogNumber: 'ECM 2891' },
      { id: 'ed-1b', title: 'Vinyl Edition', year: 2024, format: 'FLAC', bitDepth: 24, sampleRate: 192, label: 'ECM Records', catalogNumber: 'ECM 2891-V' },
    ],
  },
  {
    id: 'album-2',
    title: 'Silent Architecture',
    artistId: 'artist-2',
    artistName: 'The Meridian Ensemble',
    imageUrl: albumArtUrl('album-2'),
    year: 2022,
    genre: 'Contemporary Classical',
    tracks: ['track-2-1', 'track-2-2', 'track-2-3', 'track-2-4', 'track-2-5', 'track-2-6'],
    duration: 3420,
    format: 'FLAC',
    bitDepth: 24,
    sampleRate: 192,
    channels: 2,
    label: 'Deutsche Grammophon',
    type: 'album',
    rating: 8,
    review: 'A stunning exploration of space and silence. Richter\'s compositions breathe with an organic quality that belies their mathematical precision. The 24/192 recording captures every nuance of the ensemble\'s delicate interplay.',
  },
  {
    id: 'album-3',
    title: 'Phantom Frequencies',
    artistId: 'artist-3',
    artistName: 'Kai Horizon',
    imageUrl: albumArtUrl('album-3'),
    year: 2024,
    genre: 'Electronic',
    tracks: ['track-3-1', 'track-3-2', 'track-3-3', 'track-3-4', 'track-3-5', 'track-3-6', 'track-3-7', 'track-3-8', 'track-3-9'],
    duration: 3780,
    format: 'FLAC',
    bitDepth: 32,
    sampleRate: 96,
    channels: 2,
    label: 'Brainfeeder',
    type: 'album',
    rating: 9,
    review: 'Horizon\'s most accomplished work to date. Phantom Frequencies weaves intricate rhythmic patterns with lush ambient pads, creating a sonic world that rewards repeated listening at high resolution.',
  },
  {
    id: 'album-4',
    title: 'Golden Hour',
    artistId: 'artist-4',
    artistName: 'Amara Osei',
    imageUrl: albumArtUrl('album-4'),
    year: 2023,
    genre: 'Neo-Soul',
    tracks: ['track-4-1', 'track-4-2', 'track-4-3', 'track-4-4', 'track-4-5', 'track-4-6', 'track-4-7', 'track-4-8', 'track-4-9', 'track-4-10'],
    duration: 3120,
    format: 'FLAC',
    bitDepth: 24,
    sampleRate: 96,
    channels: 2,
    label: 'XL Recordings',
    type: 'album',
    rating: 10,
    review: 'A triumphant debut that announces Osei as a generational talent. Golden Hour effortlessly blends genres while remaining deeply personal. The production is immaculate, with every texture and vocal nuance captured in stunning detail.',
  },
  {
    id: 'album-5',
    title: 'Celestial Mechanics',
    artistId: 'artist-5',
    artistName: 'Aethon',
    imageUrl: albumArtUrl('album-5'),
    year: 2024,
    genre: 'Progressive Metal',
    tracks: ['track-5-1', 'track-5-2', 'track-5-3', 'track-5-4', 'track-5-5', 'track-5-6'],
    duration: 4800,
    format: 'FLAC',
    bitDepth: 32,
    sampleRate: 352,
    channels: 2,
    label: 'InsideOut Music',
    type: 'album',
    rating: 9,
    review: 'Aethon\'s magnum opus. Recorded in DXD for maximum fidelity, Celestial Mechanics pushes the boundaries of progressive metal both in composition and sonic quality. Steve Wilson\'s mix is reference-grade.',
    editions: [
      { id: 'ed-5a', title: 'Standard Edition', year: 2024, format: 'FLAC', bitDepth: 32, sampleRate: 352, label: 'InsideOut Music' },
      { id: 'ed-5b', title: 'Atmos Mix', year: 2024, format: 'FLAC', bitDepth: 24, sampleRate: 96, label: 'InsideOut Music' },
    ],
  },
  {
    id: 'album-6',
    title: 'Cartas al Silencio',
    artistId: 'artist-6',
    artistName: 'Isabella Reyes',
    imageUrl: albumArtUrl('album-6'),
    year: 2021,
    genre: 'Contemporary Classical',
    tracks: ['track-6-1', 'track-6-2', 'track-6-3', 'track-6-4', 'track-6-5'],
    duration: 2640,
    format: 'FLAC',
    bitDepth: 24,
    sampleRate: 192,
    channels: 2,
    label: 'Harmonia Mundi',
    type: 'album',
    rating: 8,
    review: 'Reyes\'s most personal work, Cartas al Silencio is a meditation on memory and absence. The piano recordings are exemplary, with the 192kHz capture revealing the full resonance of her Steinway D.',
  },
  {
    id: 'album-7',
    title: 'Subtractive Landscapes',
    artistId: 'artist-7',
    artistName: 'Drift Signal',
    imageUrl: albumArtUrl('album-7'),
    year: 2022,
    genre: 'Ambient',
    tracks: ['track-7-1', 'track-7-2', 'track-7-3', 'track-7-4', 'track-7-5', 'track-7-6', 'track-7-7'],
    duration: 4200,
    format: 'DSF',
    bitDepth: 1,
    sampleRate: 2822,
    channels: 2,
    label: 'Room 40',
    type: 'album',
    rating: 9,
    review: 'Recorded in DSD256 for the ultimate in analog warmth, Subtractive Landscapes is Chen\'s most immersive work. The layering of field recordings and synthesizer textures creates an almost tactile listening experience.',
  },
  {
    id: 'album-8',
    title: 'Current Affairs',
    artistId: 'artist-8',
    artistName: 'The Velvet Current',
    imageUrl: albumArtUrl('album-8'),
    year: 2024,
    genre: 'Jazz Funk',
    tracks: ['track-8-1', 'track-8-2', 'track-8-3', 'track-8-4', 'track-8-5', 'track-8-6', 'track-8-7'],
    duration: 2940,
    format: 'FLAC',
    bitDepth: 24,
    sampleRate: 96,
    channels: 2,
    label: 'Nonesuch Records',
    type: 'album',
    rating: 8,
    review: 'A tight, funk-driven session that showcases the ensemble\'s incredible chemistry. The rhythm section locks in with surgical precision, while the horn arrangements are both complex and deeply groovable.',
  },
  {
    id: 'album-9',
    title: 'The Weight of Light',
    artistId: 'artist-9',
    artistName: 'Pale Horizon',
    imageUrl: albumArtUrl('album-9'),
    year: 2023,
    genre: 'Post-Rock',
    tracks: ['track-9-1', 'track-9-2', 'track-9-3', 'track-9-4', 'track-9-5'],
    duration: 3600,
    format: 'FLAC',
    bitDepth: 24,
    sampleRate: 96,
    channels: 2,
    label: 'Temporary Residence Ltd.',
    type: 'album',
    rating: 9,
    review: 'The Weight of Light is a masterclass in dynamic range and emotional storytelling through sound. From whispered beginnings to overwhelming climaxes, every moment is captured with breathtaking clarity.',
  },
  {
    id: 'album-10',
    title: 'L\'altra ribera',
    artistId: 'artist-10',
    artistName: 'Mira Sol',
    imageUrl: albumArtUrl('album-10'),
    year: 2024,
    genre: 'Indie Pop',
    tracks: ['track-10-1', 'track-10-2', 'track-10-3', 'track-10-4', 'track-10-5', 'track-10-6', 'track-10-7', 'track-10-8'],
    duration: 2520,
    format: 'FLAC',
    bitDepth: 24,
    sampleRate: 44,
    channels: 2,
    label: 'Música Global',
    type: 'album',
    rating: 8,
    review: 'Written during a period of self-reflection in Girona, L\'altra ribera (The Other Shore) is Sol\'s most lyrically mature work. The warm analog production perfectly complements her intimate vocal delivery.',
  },
  {
    id: 'album-11',
    title: 'Lagos to Brooklyn',
    artistId: 'artist-11',
    artistName: 'Ironroot',
    imageUrl: albumArtUrl('album-11'),
    year: 2023,
    genre: 'Afrobeat',
    tracks: ['track-11-1', 'track-11-2', 'track-11-3', 'track-11-4', 'track-11-5', 'track-11-6', 'track-11-7', 'track-11-8'],
    duration: 3360,
    format: 'FLAC',
    bitDepth: 24,
    sampleRate: 96,
    channels: 2,
    label: 'Daptone Records',
    type: 'album',
    rating: 9,
    review: 'A transatlantic musical journey that channels the spirit of Fela Kuti through the lens of 21st-century Brooklyn. Ironroot\'s energy is infectious, and the recording quality is outstanding.',
  },
  {
    id: 'album-12',
    title: 'Magnetic North',
    artistId: 'artist-12',
    artistName: 'Sigrid Haugen',
    imageUrl: albumArtUrl('album-12'),
    year: 2023,
    genre: 'Experimental',
    tracks: ['track-12-1', 'track-12-2', 'track-12-3', 'track-12-4', 'track-12-5', 'track-12-6'],
    duration: 2760,
    format: 'FLAC',
    bitDepth: 24,
    sampleRate: 96,
    channels: 2,
    label: 'Rune Grammofon',
    type: 'album',
    rating: 9,
    review: 'Haugen\'s violin becomes a one-woman orchestra on Magnetic North, with live electronics creating a spectral accompaniment to her luminous playing. A groundbreaking recording.',
  },
];

// ─── TRACKS ───

export const tracks: Track[] = [
  // Album 1 - Northern Lights
  { id: 'track-1-1', title: 'Fjord Morning', albumId: 'album-1', albumName: 'Northern Lights', artistId: 'artist-1', artistName: 'Lena Viktoria', trackNumber: 1, discNumber: 1, duration: 312, format: 'FLAC', bitDepth: 24, sampleRate: 96, channels: 2, bitrate: 3456, filePath: '/music/Lena Viktoria/Northern Lights/01 - Fjord Morning.flac', fileSize: 134217728, composers: ['Lena Viktoria', 'Erik Lindqvist'], performers: [{ name: 'Lena Viktoria', role: 'vocals' }, { name: 'Erik Lindqvist', role: 'piano' }, { name: 'Staffan Björk', role: 'double bass' }, { name: 'Åsa Karlsson', role: 'percussion' }], genre: 'Jazz', loved: true, playCount: 245, lastPlayed: '2026-08-12T00:30:00Z', source: 'local', isAvailable: true },
  { id: 'track-1-2', title: 'Ice Crystal', albumId: 'album-1', albumName: 'Northern Lights', artistId: 'artist-1', artistName: 'Lena Viktoria', trackNumber: 2, discNumber: 1, duration: 278, format: 'FLAC', bitDepth: 24, sampleRate: 96, channels: 2, bitrate: 3456, filePath: '/music/Lena Viktoria/Northern Lights/02 - Ice Crystal.flac', fileSize: 120586240, composers: ['Lena Viktoria'], performers: [{ name: 'Lena Viktoria', role: 'vocals' }, { name: 'Erik Lindqvist', role: 'piano' }, { name: 'Staffan Björk', role: 'double bass' }, { name: 'Åsa Karlsson', role: 'percussion' }], genre: 'Jazz', loved: false, playCount: 198, lastPlayed: '2026-08-11T22:15:00Z', source: 'local', isAvailable: true },
  { id: 'track-1-3', title: 'Aurora', albumId: 'album-1', albumName: 'Northern Lights', artistId: 'artist-1', artistName: 'Lena Viktoria', trackNumber: 3, discNumber: 1, duration: 445, format: 'FLAC', bitDepth: 24, sampleRate: 96, channels: 2, bitrate: 3456, filePath: '/music/Lena Viktoria/Northern Lights/03 - Aurora.flac', fileSize: 193273528, composers: ['Lena Viktoria', 'Erik Lindqvist'], performers: [{ name: 'Lena Viktoria', role: 'vocals' }, { name: 'Erik Lindqvist', role: 'piano' }, { name: 'Staffan Björk', role: 'double bass' }, { name: 'Åsa Karlsson', role: 'percussion' }], genre: 'Jazz', loved: true, playCount: 312, lastPlayed: '2026-08-12T01:00:00Z', source: 'local', isAvailable: true },
  { id: 'track-1-4', title: 'Timberline', albumId: 'album-1', albumName: 'Northern Lights', artistId: 'artist-1', artistName: 'Lena Viktoria', trackNumber: 4, discNumber: 1, duration: 324, format: 'FLAC', bitDepth: 24, sampleRate: 96, channels: 2, bitrate: 3456, filePath: '/music/Lena Viktoria/Northern Lights/04 - Timberline.flac', fileSize: 140928614, composers: ['Lena Viktoria'], performers: [{ name: 'Lena Viktoria', role: 'vocals' }, { name: 'Erik Lindqvist', role: 'piano' }, { name: 'Staffan Björk', role: 'double bass' }, { name: 'Åsa Karlsson', role: 'percussion' }], genre: 'Jazz', loved: false, playCount: 156, lastPlayed: '2026-08-10T18:45:00Z', source: 'local', isAvailable: true },
  { id: 'track-1-5', title: 'Solstice Dance', albumId: 'album-1', albumName: 'Northern Lights', artistId: 'artist-1', artistName: 'Lena Viktoria', trackNumber: 5, discNumber: 1, duration: 356, format: 'FLAC', bitDepth: 24, sampleRate: 96, channels: 2, bitrate: 3456, filePath: '/music/Lena Viktoria/Northern Lights/05 - Solstice Dance.flac', fileSize: 154350387, composers: ['Lena Viktoria', 'Erik Lindqvist'], performers: [{ name: 'Lena Viktoria', role: 'vocals' }, { name: 'Erik Lindqvist', role: 'piano' }, { name: 'Staffan Björk', role: 'double bass' }, { name: 'Åsa Karlsson', role: 'percussion' }], genre: 'Jazz', loved: false, playCount: 187, lastPlayed: '2026-08-09T20:30:00Z', source: 'local', isAvailable: true },
  { id: 'track-1-6', title: 'White Silence', albumId: 'album-1', albumName: 'Northern Lights', artistId: 'artist-1', artistName: 'Lena Viktoria', trackNumber: 6, discNumber: 1, duration: 401, format: 'FLAC', bitDepth: 24, sampleRate: 96, channels: 2, bitrate: 3456, filePath: '/music/Lena Viktoria/Northern Lights/06 - White Silence.flac', fileSize: 173885030, composers: ['Lena Viktoria'], performers: [{ name: 'Lena Viktoria', role: 'vocals' }, { name: 'Erik Lindqvist', role: 'piano' }, { name: 'Staffan Björk', role: 'double bass' }, { name: 'Åsa Karlsson', role: 'percussion' }], genre: 'Jazz', loved: true, playCount: 267, lastPlayed: '2026-08-11T21:00:00Z', source: 'local', isAvailable: true },
  { id: 'track-1-7', title: 'Midnight Sun', albumId: 'album-1', albumName: 'Northern Lights', artistId: 'artist-1', artistName: 'Lena Viktoria', trackNumber: 7, discNumber: 1, duration: 389, format: 'FLAC', bitDepth: 24, sampleRate: 96, channels: 2, bitrate: 3456, filePath: '/music/Lena Viktoria/Northern Lights/07 - Midnight Sun.flac', fileSize: 168694220, composers: ['Lena Viktoria', 'Erik Lindqvist'], performers: [{ name: 'Lena Viktoria', role: 'vocals' }, { name: 'Erik Lindqvist', role: 'piano' }, { name: 'Staffan Björk', role: 'double bass' }, { name: 'Åsa Karlsson', role: 'percussion' }], genre: 'Jazz', loved: false, playCount: 134, lastPlayed: '2026-08-08T19:00:00Z', source: 'local', isAvailable: true },
  { id: 'track-1-8', title: 'Horizon', albumId: 'album-1', albumName: 'Northern Lights', artistId: 'artist-1', artistName: 'Lena Viktoria', trackNumber: 8, discNumber: 1, duration: 335, format: 'FLAC', bitDepth: 24, sampleRate: 96, channels: 2, bitrate: 3456, filePath: '/music/Lena Viktoria/Northern Lights/08 - Horizon.flac', fileSize: 145172992, composers: ['Lena Viktoria'], performers: [{ name: 'Lena Viktoria', role: 'vocals' }, { name: 'Erik Lindqvist', role: 'piano' }, { name: 'Staffan Björk', role: 'double bass' }, { name: 'Åsa Karlsson', role: 'percussion' }], genre: 'Jazz', loved: false, playCount: 178, lastPlayed: '2026-08-10T16:20:00Z', source: 'local', isAvailable: true },

  // Album 2 - Silent Architecture
  { id: 'track-2-1', title: 'I. Foundation', albumId: 'album-2', albumName: 'Silent Architecture', artistId: 'artist-2', artistName: 'The Meridian Ensemble', trackNumber: 1, discNumber: 1, duration: 612, format: 'FLAC', bitDepth: 24, sampleRate: 192, channels: 2, bitrate: 6912, filePath: '/music/The Meridian Ensemble/Silent Architecture/01 - I. Foundation.flac', fileSize: 530579456, composers: ['Elias Richter'], performers: [{ name: 'Elias Richter', role: 'composer', instrument: 'conductor' }, { name: 'Maren Fischer', role: 'violin' }, { name: 'Jonas Berg', role: 'cello' }, { name: 'Yuki Tanaka', role: 'piano' }, { name: 'Sophie Müller', role: 'flute' }], genre: 'Contemporary Classical', loved: false, playCount: 156, lastPlayed: '2026-08-07T14:00:00Z', source: 'local', isAvailable: true },
  { id: 'track-2-2', title: 'II. Tension', albumId: 'album-2', albumName: 'Silent Architecture', artistId: 'artist-2', artistName: 'The Meridian Ensemble', trackNumber: 2, discNumber: 1, duration: 534, format: 'FLAC', bitDepth: 24, sampleRate: 192, channels: 2, bitrate: 6912, filePath: '/music/The Meridian Ensemble/Silent Architecture/02 - II. Tension.flac', fileSize: 463088128, composers: ['Elias Richter'], performers: [{ name: 'Elias Richter', role: 'composer', instrument: 'conductor' }, { name: 'Maren Fischer', role: 'violin' }, { name: 'Jonas Berg', role: 'cello' }, { name: 'Yuki Tanaka', role: 'piano' }, { name: 'Sophie Müller', role: 'flute' }], genre: 'Contemporary Classical', loved: true, playCount: 203, lastPlayed: '2026-08-10T11:30:00Z', source: 'local', isAvailable: true },
  { id: 'track-2-3', title: 'III. Release', albumId: 'album-2', albumName: 'Silent Architecture', artistId: 'artist-2', artistName: 'The Meridian Ensemble', trackNumber: 3, discNumber: 1, duration: 480, format: 'FLAC', bitDepth: 24, sampleRate: 192, channels: 2, bitrate: 6912, filePath: '/music/The Meridian Ensemble/Silent Architecture/03 - III. Release.flac', fileSize: 416074752, composers: ['Elias Richter'], performers: [{ name: 'Elias Richter', role: 'composer', instrument: 'conductor' }, { name: 'Maren Fischer', role: 'violin' }, { name: 'Jonas Berg', role: 'cello' }, { name: 'Yuki Tanaka', role: 'piano' }, { name: 'Sophie Müller', role: 'flute' }], genre: 'Contemporary Classical', loved: false, playCount: 145, lastPlayed: '2026-08-06T09:00:00Z', source: 'local', isAvailable: true },
  { id: 'track-2-4', title: 'IV. Stillness', albumId: 'album-2', albumName: 'Silent Architecture', artistId: 'artist-2', artistName: 'The Meridian Ensemble', trackNumber: 4, discNumber: 1, duration: 726, format: 'FLAC', bitDepth: 24, sampleRate: 192, channels: 2, bitrate: 6912, filePath: '/music/The Meridian Ensemble/Silent Architecture/04 - IV. Stillness.flac', fileSize: 629452800, composers: ['Elias Richter'], performers: [{ name: 'Elias Richter', role: 'composer', instrument: 'conductor' }, { name: 'Maren Fischer', role: 'violin' }, { name: 'Jonas Berg', role: 'cello' }, { name: 'Yuki Tanaka', role: 'piano' }, { name: 'Sophie Müller', role: 'flute' }], genre: 'Contemporary Classical', loved: false, playCount: 98, lastPlayed: '2026-08-05T16:00:00Z', source: 'local', isAvailable: true },
  { id: 'track-2-5', title: 'V. Emergence', albumId: 'album-2', albumName: 'Silent Architecture', artistId: 'artist-2', artistName: 'The Meridian Ensemble', trackNumber: 5, discNumber: 1, duration: 558, format: 'FLAC', bitDepth: 24, sampleRate: 192, channels: 2, bitrate: 6912, filePath: '/music/The Meridian Ensemble/Silent Architecture/05 - V. Emergence.flac', fileSize: 483183872, composers: ['Elias Richter'], performers: [{ name: 'Elias Richter', role: 'composer', instrument: 'conductor' }, { name: 'Maren Fischer', role: 'violin' }, { name: 'Jonas Berg', role: 'cello' }, { name: 'Yuki Tanaka', role: 'piano' }, { name: 'Sophie Müller', role: 'flute' }], genre: 'Contemporary Classical', loved: true, playCount: 178, lastPlayed: '2026-08-11T10:00:00Z', source: 'local', isAvailable: true },
  { id: 'track-2-6', title: 'VI. Threshold', albumId: 'album-2', albumName: 'Silent Architecture', artistId: 'artist-2', artistName: 'The Meridian Ensemble', trackNumber: 6, discNumber: 1, duration: 510, format: 'FLAC', bitDepth: 24, sampleRate: 192, channels: 2, bitrate: 6912, filePath: '/music/The Meridian Ensemble/Silent Architecture/06 - VI. Threshold.flac', fileSize: 442091520, composers: ['Elias Richter'], performers: [{ name: 'Elias Richter', role: 'composer', instrument: 'conductor' }, { name: 'Maren Fischer', role: 'violin' }, { name: 'Jonas Berg', role: 'cello' }, { name: 'Yuki Tanaka', role: 'piano' }, { name: 'Sophie Müller', role: 'flute' }], genre: 'Contemporary Classical', loved: false, playCount: 112, lastPlayed: '2026-08-04T20:00:00Z', source: 'local', isAvailable: true },

  // Album 3 - Phantom Frequencies
  { id: 'track-3-1', title: 'Ghost in the Machine', albumId: 'album-3', albumName: 'Phantom Frequencies', artistId: 'artist-3', artistName: 'Kai Horizon', trackNumber: 1, discNumber: 1, duration: 402, format: 'FLAC', bitDepth: 32, sampleRate: 96, channels: 2, bitrate: 4608, filePath: '/music/Kai Horizon/Phantom Frequencies/01 - Ghost in the Machine.flac', fileSize: 231735296, composers: ['Kai Horizon'], performers: [{ name: 'Kai Horizon', role: 'production', instrument: 'synthesizers' }], genre: 'Electronic', loved: true, playCount: 356, lastPlayed: '2026-08-12T00:15:00Z', source: 'local', isAvailable: true },
  { id: 'track-3-2', title: 'Quantum Lattice', albumId: 'album-3', albumName: 'Phantom Frequencies', artistId: 'artist-3', artistName: 'Kai Horizon', trackNumber: 2, discNumber: 1, duration: 378, format: 'FLAC', bitDepth: 32, sampleRate: 96, channels: 2, bitrate: 4608, filePath: '/music/Kai Horizon/Phantom Frequencies/02 - Quantum Lattice.flac', fileSize: 218103808, composers: ['Kai Horizon'], performers: [{ name: 'Kai Horizon', role: 'production', instrument: 'synthesizers' }], genre: 'Electronic', loved: false, playCount: 289, lastPlayed: '2026-08-11T23:45:00Z', source: 'local', isAvailable: true },
  { id: 'track-3-3', title: 'Neon Dissolution', albumId: 'album-3', albumName: 'Phantom Frequencies', artistId: 'artist-3', artistName: 'Kai Horizon', trackNumber: 3, discNumber: 1, duration: 445, format: 'FLAC', bitDepth: 32, sampleRate: 96, channels: 2, bitrate: 4608, filePath: '/music/Kai Horizon/Phantom Frequencies/03 - Neon Dissolution.flac', fileSize: 256901120, composers: ['Kai Horizon'], performers: [{ name: 'Kai Horizon', role: 'production', instrument: 'synthesizers' }], genre: 'Electronic', loved: false, playCount: 234, lastPlayed: '2026-08-10T21:30:00Z', source: 'local', isAvailable: true },
  { id: 'track-3-4', title: 'Digital Rain', albumId: 'album-3', albumName: 'Phantom Frequencies', artistId: 'artist-3', artistName: 'Kai Horizon', trackNumber: 4, discNumber: 1, duration: 356, format: 'FLAC', bitDepth: 32, sampleRate: 96, channels: 2, bitrate: 4608, filePath: '/music/Kai Horizon/Phantom Frequencies/04 - Digital Rain.flac', fileSize: 205520896, composers: ['Kai Horizon'], performers: [{ name: 'Kai Horizon', role: 'production', instrument: 'synthesizers' }], genre: 'Electronic', loved: true, playCount: 412, lastPlayed: '2026-08-12T00:45:00Z', source: 'tidal', isAvailable: true },
  { id: 'track-3-5', title: 'Phase Shift', albumId: 'album-3', albumName: 'Phantom Frequencies', artistId: 'artist-3', artistName: 'Kai Horizon', trackNumber: 5, discNumber: 1, duration: 523, format: 'FLAC', bitDepth: 32, sampleRate: 96, channels: 2, bitrate: 4608, filePath: '/music/Kai Horizon/Phantom Frequencies/05 - Phase Shift.flac', fileSize: 301989888, composers: ['Kai Horizon'], performers: [{ name: 'Kai Horizon', role: 'production', instrument: 'synthesizers' }], genre: 'Electronic', loved: false, playCount: 198, lastPlayed: '2026-08-09T18:15:00Z', source: 'local', isAvailable: true },
  { id: 'track-3-6', title: 'Binary Sunset', albumId: 'album-3', albumName: 'Phantom Frequencies', artistId: 'artist-3', artistName: 'Kai Horizon', trackNumber: 6, discNumber: 1, duration: 290, format: 'FLAC', bitDepth: 32, sampleRate: 96, channels: 2, bitrate: 4608, filePath: '/music/Kai Horizon/Phantom Frequencies/06 - Binary Sunset.flac', fileSize: 167402496, composers: ['Kai Horizon'], performers: [{ name: 'Kai Horizon', role: 'production', instrument: 'synthesizers' }], genre: 'Electronic', loved: false, playCount: 167, lastPlayed: '2026-08-08T22:00:00Z', source: 'local', isAvailable: true },
  { id: 'track-3-7', title: 'Spectral Drift', albumId: 'album-3', albumName: 'Phantom Frequencies', artistId: 'artist-3', artistName: 'Kai Horizon', trackNumber: 7, discNumber: 1, duration: 467, format: 'FLAC', bitDepth: 32, sampleRate: 96, channels: 2, bitrate: 4608, filePath: '/music/Kai Horizon/Phantom Frequencies/07 - Spectral Drift.flac', fileSize: 269484032, composers: ['Kai Horizon'], performers: [{ name: 'Kai Horizon', role: 'production', instrument: 'synthesizers' }], genre: 'Electronic', loved: false, playCount: 145, lastPlayed: '2026-08-07T17:30:00Z', source: 'local', isAvailable: true },
  { id: 'track-3-8', title: 'Zero Point', albumId: 'album-3', albumName: 'Phantom Frequencies', artistId: 'artist-3', artistName: 'Kai Horizon', trackNumber: 8, discNumber: 1, duration: 512, format: 'FLAC', bitDepth: 32, sampleRate: 96, channels: 2, bitrate: 4608, filePath: '/music/Kai Horizon/Phantom Frequencies/08 - Zero Point.flac', fileSize: 295279001, composers: ['Kai Horizon'], performers: [{ name: 'Kai Horizon', role: 'production', instrument: 'synthesizers' }], genre: 'Electronic', loved: true, playCount: 278, lastPlayed: '2026-08-11T19:00:00Z', source: 'local', isAvailable: true },
  { id: 'track-3-9', title: 'Event Horizon', albumId: 'album-3', albumName: 'Phantom Frequencies', artistId: 'artist-3', artistName: 'Kai Horizon', trackNumber: 9, discNumber: 1, duration: 407, format: 'FLAC', bitDepth: 32, sampleRate: 96, channels: 2, bitrate: 4608, filePath: '/music/Kai Horizon/Phantom Frequencies/09 - Event Horizon.flac', fileSize: 234881024, composers: ['Kai Horizon'], performers: [{ name: 'Kai Horizon', role: 'production', instrument: 'synthesizers' }], genre: 'Electronic', loved: false, playCount: 189, lastPlayed: '2026-08-06T15:00:00Z', source: 'local', isAvailable: true },

  // Album 4 - Golden Hour
  { id: 'track-4-1', title: 'Ankobra Sunrise', albumId: 'album-4', albumName: 'Golden Hour', artistId: 'artist-4', artistName: 'Amara Osei', trackNumber: 1, discNumber: 1, duration: 258, format: 'FLAC', bitDepth: 24, sampleRate: 96, channels: 2, bitrate: 3456, filePath: '/music/Amara Osei/Golden Hour/01 - Ankobra Sunrise.flac', fileSize: 111669149, composers: ['Amara Osei', 'Kwame Asante'], performers: [{ name: 'Amara Osei', role: 'vocals' }, { name: 'Kwame Asante', role: 'guitar' }, { name: 'Elena Petrova', role: 'keys' }], genre: 'Neo-Soul', loved: true, playCount: 489, lastPlayed: '2026-08-12T00:00:00Z', source: 'local', isAvailable: true },
  { id: 'track-4-2', title: 'Riversong', albumId: 'album-4', albumName: 'Golden Hour', artistId: 'artist-4', artistName: 'Amara Osei', trackNumber: 2, discNumber: 1, duration: 312, format: 'FLAC', bitDepth: 24, sampleRate: 96, channels: 2, bitrate: 3456, filePath: '/music/Amara Osei/Golden Hour/02 - Riversong.flac', fileSize: 135295946, composers: ['Amara Osei'], performers: [{ name: 'Amara Osei', role: 'vocals' }, { name: 'Kwame Asante', role: 'guitar' }, { name: 'Elena Petrova', role: 'keys' }], genre: 'Neo-Soul', loved: true, playCount: 567, lastPlayed: '2026-08-11T23:30:00Z', source: 'local', isAvailable: true },
  { id: 'track-4-3', title: 'London Skyline', albumId: 'album-4', albumName: 'Golden Hour', artistId: 'artist-4', artistName: 'Amara Osei', trackNumber: 3, discNumber: 1, duration: 289, format: 'FLAC', bitDepth: 24, sampleRate: 96, channels: 2, bitrate: 3456, filePath: '/music/Amara Osei/Golden Hour/03 - London Skyline.flac', fileSize: 125402378, composers: ['Amara Osei', 'Elena Petrova'], performers: [{ name: 'Amara Osei', role: 'vocals' }, { name: 'Kwame Asante', role: 'guitar' }, { name: 'Elena Petrova', role: 'keys' }], genre: 'Neo-Soul', loved: false, playCount: 345, lastPlayed: '2026-08-10T22:00:00Z', source: 'local', isAvailable: true },
  { id: 'track-4-4', title: 'Golden Thread', albumId: 'album-4', albumName: 'Golden Hour', artistId: 'artist-4', artistName: 'Amara Osei', trackNumber: 4, discNumber: 1, duration: 267, format: 'FLAC', bitDepth: 24, sampleRate: 96, channels: 2, bitrate: 3456, filePath: '/music/Amara Osei/Golden Hour/04 - Golden Thread.flac', fileSize: 115762790, composers: ['Amara Osei'], performers: [{ name: 'Amara Osei', role: 'vocals' }, { name: 'Kwame Asante', role: 'guitar' }, { name: 'Elena Petrova', role: 'keys' }], genre: 'Neo-Soul', loved: false, playCount: 298, lastPlayed: '2026-08-09T20:00:00Z', source: 'local', isAvailable: true },
  { id: 'track-4-5', title: 'Accra Nights', albumId: 'album-4', albumName: 'Golden Hour', artistId: 'artist-4', artistName: 'Amara Osei', trackNumber: 5, discNumber: 1, duration: 345, format: 'FLAC', bitDepth: 24, sampleRate: 96, channels: 2, bitrate: 3456, filePath: '/music/Amara Osei/Golden Hour/05 - Accra Nights.flac', fileSize: 149660774, composers: ['Amara Osei', 'Kwame Asante'], performers: [{ name: 'Amara Osei', role: 'vocals' }, { name: 'Kwame Asante', role: 'guitar' }, { name: 'Elena Petrova', role: 'keys' }], genre: 'Neo-Soul', loved: true, playCount: 423, lastPlayed: '2026-08-12T01:15:00Z', source: 'local', isAvailable: true },

  // Album 5 - Celestial Mechanics (partial)
  { id: 'track-5-1', title: 'Overture: Dark Matter', albumId: 'album-5', albumName: 'Celestial Mechanics', artistId: 'artist-5', artistName: 'Aethon', trackNumber: 1, discNumber: 1, duration: 723, format: 'FLAC', bitDepth: 32, sampleRate: 352, channels: 2, bitrate: 22528, filePath: '/music/Aethon/Celestial Mechanics/01 - Overture - Dark Matter.flac', fileSize: 203882956, composers: ['Magnus Helle'], performers: [{ name: 'Magnus Helle', role: 'guitar', instrument: 'vocals' }, { name: 'Ingrid Solberg', role: 'bass' }, { name: 'Torsten Dahl', role: 'drums' }, { name: 'Erik Voss', role: 'keyboards' }], genre: 'Progressive Metal', loved: true, playCount: 189, lastPlayed: '2026-08-11T18:00:00Z', source: 'local', isAvailable: true },
  { id: 'track-5-2', title: 'Gravitational Lensing', albumId: 'album-5', albumName: 'Celestial Mechanics', artistId: 'artist-5', artistName: 'Aethon', trackNumber: 2, discNumber: 1, duration: 856, format: 'FLAC', bitDepth: 32, sampleRate: 352, channels: 2, bitrate: 22528, filePath: '/music/Aethon/Celestial Mechanics/02 - Gravitational Lensing.flac', fileSize: 241591910, composers: ['Magnus Helle', 'Erik Voss'], performers: [{ name: 'Magnus Helle', role: 'guitar', instrument: 'vocals' }, { name: 'Ingrid Solberg', role: 'bass' }, { name: 'Torsten Dahl', role: 'drums' }, { name: 'Erik Voss', role: 'keyboards' }], genre: 'Progressive Metal', loved: false, playCount: 156, lastPlayed: '2026-08-10T15:00:00Z', source: 'local', isAvailable: true },
  { id: 'track-5-3', title: 'Orbital Decay', albumId: 'album-5', albumName: 'Celestial Mechanics', artistId: 'artist-5', artistName: 'Aethon', trackNumber: 3, discNumber: 1, duration: 634, format: 'FLAC', bitDepth: 32, sampleRate: 352, channels: 2, bitrate: 22528, filePath: '/music/Aethon/Celestial Mechanics/03 - Orbital Decay.flac', fileSize: 179047444, composers: ['Magnus Helle'], performers: [{ name: 'Magnus Helle', role: 'guitar', instrument: 'vocals' }, { name: 'Ingrid Solberg', role: 'bass' }, { name: 'Torsten Dahl', role: 'drums' }, { name: 'Erik Voss', role: 'keyboards' }], genre: 'Progressive Metal', loved: false, playCount: 134, lastPlayed: '2026-08-09T12:00:00Z', source: 'local', isAvailable: true },
  { id: 'track-5-4', title: 'Supernova (Part I)', albumId: 'album-5', albumName: 'Celestial Mechanics', artistId: 'artist-5', artistName: 'Aethon', trackNumber: 4, discNumber: 1, duration: 712, format: 'FLAC', bitDepth: 32, sampleRate: 352, channels: 2, bitrate: 22528, filePath: '/music/Aethon/Celestial Mechanics/04 - Supernova Part I.flac', fileSize: 201064345, composers: ['Magnus Helle', 'Ingrid Solberg'], performers: [{ name: 'Magnus Helle', role: 'guitar', instrument: 'vocals' }, { name: 'Ingrid Solberg', role: 'bass' }, { name: 'Torsten Dahl', role: 'drums' }, { name: 'Erik Voss', role: 'keyboards' }], genre: 'Progressive Metal', loved: true, playCount: 201, lastPlayed: '2026-08-11T20:30:00Z', source: 'local', isAvailable: true },
  { id: 'track-5-5', title: 'Supernova (Part II)', albumId: 'album-5', albumName: 'Celestial Mechanics', artistId: 'artist-5', artistName: 'Aethon', trackNumber: 5, discNumber: 1, duration: 589, format: 'FLAC', bitDepth: 32, sampleRate: 352, channels: 2, bitrate: 22528, filePath: '/music/Aethon/Celestial Mechanics/05 - Supernova Part II.flac', fileSize: 166429982, composers: ['Magnus Helle', 'Torsten Dahl'], performers: [{ name: 'Magnus Helle', role: 'guitar', instrument: 'vocals' }, { name: 'Ingrid Solberg', role: 'bass' }, { name: 'Torsten Dahl', role: 'drums' }, { name: 'Erik Voss', role: 'keyboards' }], genre: 'Progressive Metal', loved: false, playCount: 178, lastPlayed: '2026-08-10T18:45:00Z', source: 'local', isAvailable: true },
  { id: 'track-5-6', title: 'Eventual Entropy', albumId: 'album-5', albumName: 'Celestial Mechanics', artistId: 'artist-5', artistName: 'Aethon', trackNumber: 6, discNumber: 1, duration: 1286, format: 'FLAC', bitDepth: 32, sampleRate: 352, channels: 2, bitrate: 22528, filePath: '/music/Aethon/Celestial Mechanics/06 - Eventual Entropy.flac', fileSize: 363079832, composers: ['Magnus Helle', 'Erik Voss'], performers: [{ name: 'Magnus Helle', role: 'guitar', instrument: 'vocals' }, { name: 'Ingrid Solberg', role: 'bass' }, { name: 'Torsten Dahl', role: 'drums' }, { name: 'Erik Voss', role: 'keyboards' }], genre: 'Progressive Metal', loved: true, playCount: 245, lastPlayed: '2026-08-12T00:15:00Z', source: 'local', isAvailable: true },
];

// ─── ZONES ───

export const zones: Zone[] = [
  {
    id: 'zone-1',
    name: 'Living Room',
    endpoints: [{
      id: 'ep-1', name: 'Living Room Bridge', type: 'dedicated-hardware', status: 'online',
      dac: 'Chord Hugo 2', maxSampleRate: 768, maxBitDepth: 32, supportsDSD: true, supportsMQA: true,
      supportsDSD256: true, supportsDoP: true, firmware: 'v3.42', ipAddress: '192.168.1.101',
      macAddress: 'AA:BB:CC:DD:EE:01', latencyMs: 2.1, clockSource: 'usb', hasMasterClock: true,
      protocol: 'dsp-native', lastSeen: '2026-08-12T14:30:00Z', cpuUsage: 12, bufferDepth: 4096,
    }],
    isGroup: false,
    isPlaying: true,
    currentTrackId: 'track-3-4',
    volume: 72,
    isMuted: false,
    isOnline: true,
    outputFormat: 'PCM',
    sampleRate: 96,
    bitDepth: 32,
    dspEnabled: true,
    dspChain: ['Loudness', 'EQ (Flat)'],
    volumeMode: 'dsp',
    maxVolume: 85,
    startupVolume: 40,
    clockMode: 'passthrough',
    dspConfig: {
      eq: [
        { id: 'eq-1', enabled: true, type: 'parametric', frequency: 80, gain: 2.5, q: 1.2, label: 'Bass Boost' },
        { id: 'eq-2', enabled: true, type: 'parametric', frequency: 2500, gain: -1.0, q: 2.0, label: 'Presence Cut' },
        { id: 'eq-3', enabled: false, type: 'high-shelf', frequency: 12000, gain: -2.0, q: 0.7, label: 'Air' },
      ],
      loudness: { enabled: true, targetLUFS: -16, method: 'ebu-r128', fallbackGain: 0 },
      dither: { enabled: true, type: 'tpdf' },
    },
  },
  {
    id: 'zone-2',
    name: 'Study',
    endpoints: [{
      id: 'ep-2', name: 'Study DAC', type: 'raspberry-pi', status: 'online',
      dac: 'iFi Zen DAC V2', maxSampleRate: 384, maxBitDepth: 32, supportsDSD: true, supportsMQA: false,
      supportsDSD256: true, supportsDoP: true, firmware: 'v2.1.3', ipAddress: '192.168.1.102',
      macAddress: 'AA:BB:CC:DD:EE:02', latencyMs: 4.8, clockSource: 'usb', hasMasterClock: false,
      protocol: 'dsp-native', lastSeen: '2026-08-12T14:29:45Z', cpuUsage: 28, bufferDepth: 2048,
    }],
    isGroup: false,
    isPlaying: true,
    currentTrackId: 'track-5-6',
    volume: 55,
    isMuted: false,
    isOnline: true,
    outputFormat: 'PCM',
    sampleRate: 352,
    bitDepth: 32,
    dspEnabled: true,
    dspChain: ['Headphone Correction (HD800S)', 'Crossfeed'],
    volumeMode: 'dsp',
    maxVolume: 75,
    startupVolume: 35,
    clockMode: 'auto',
    syncOffsetMs: 0,
    dspConfig: {
      headphoneCorrection: {
        enabled: true, profileName: 'HD800S AutoEQ', manufacturer: 'Sennheiser',
        model: 'HD 800S', description: 'AutoEQ-derived correction profile',
      },
      crossfeed: { enabled: true, preset: 'subtle' },
      upsampling: {
        enabled: true, targetRate: 352800, targetBitDepth: 32,
        filterType: 'minimum-phase', maxSrcRate: 96000,
      },
    },
  },
  {
    id: 'zone-3',
    name: 'Kitchen + Dining',
    endpoints: [
      { id: 'ep-3', name: 'Kitchen Speaker', type: 'bridge', status: 'online', dac: 'Built-in DAC', maxSampleRate: 96, maxBitDepth: 24, supportsDSD: false, supportsMQA: false, supportsDSD256: false, supportsDoP: false, firmware: 'v1.8', ipAddress: '192.168.1.103', latencyMs: 6.2, clockSource: 'internal', protocol: 'dsp-native', lastSeen: '2026-08-12T14:30:10Z', cpuUsage: 8, bufferDepth: 1024 },
      { id: 'ep-4', name: 'Dining Room Speaker', type: 'bridge', status: 'online', dac: 'Built-in DAC', maxSampleRate: 96, maxBitDepth: 24, supportsDSD: false, supportsMQA: false, supportsDSD256: false, supportsDoP: false, firmware: 'v1.8', ipAddress: '192.168.1.104', latencyMs: 6.5, clockSource: 'internal', protocol: 'dsp-native', lastSeen: '2026-08-12T14:30:08Z', cpuUsage: 7, bufferDepth: 1024 },
    ],
    isGroup: true,
    isPlaying: true,
    currentTrackId: 'track-4-2',
    volume: 45,
    isMuted: false,
    isOnline: true,
    outputFormat: 'PCM',
    sampleRate: 96,
    bitDepth: 24,
    dspEnabled: false,
    dspChain: [],
    volumeMode: 'hardware',
    maxVolume: 60,
    startupVolume: 25,
    clockMode: 'slave',
    syncOffsetMs: 3.2,
    groupZones: [],
  },
  {
    id: 'zone-4',
    name: 'Bedroom',
    endpoints: [{
      id: 'ep-5', name: 'Bedroom Bridge', type: 'bridge', status: 'standby',
      dac: 'Cambridge Audio DacMagic', maxSampleRate: 192, maxBitDepth: 24, supportsDSD: false, supportsMQA: false,
      supportsDSD256: false, supportsDoP: false, firmware: 'v4.0', ipAddress: '192.168.1.105',
      latencyMs: 3.5, clockSource: 'internal', protocol: 'dsp-native', lastSeen: '2026-08-12T12:15:00Z', cpuUsage: 0, bufferDepth: 2048,
    }],
    isGroup: false,
    isPlaying: false,
    volume: 30,
    isMuted: false,
    isOnline: true,
    outputFormat: 'PCM',
    sampleRate: 44,
    bitDepth: 16,
    dspEnabled: false,
    dspChain: [],
    volumeMode: 'hardware',
    maxVolume: 50,
    startupVolume: 20,
    clockMode: 'auto',
  },
];

// ─── GENRES ───

export const genres: Genre[] = [
  { id: 'genre-1', name: 'Jazz', trackCount: 38, albumCount: 3, artistCount: 3, imageUrl: albumArtUrl('genre-1') },
  { id: 'genre-2', name: 'Electronic', trackCount: 64, albumCount: 5, artistCount: 3, imageUrl: albumArtUrl('genre-2') },
  { id: 'genre-3', name: 'Classical', trackCount: 36, albumCount: 3, artistCount: 2, imageUrl: albumArtUrl('genre-3') },
  { id: 'genre-4', name: 'Ambient', trackCount: 44, albumCount: 6, artistCount: 2, imageUrl: albumArtUrl('genre-4') },
  { id: 'genre-5', name: 'Post-Rock', trackCount: 28, albumCount: 3, artistCount: 1, imageUrl: albumArtUrl('genre-5') },
  { id: 'genre-6', name: 'Neo-Soul', trackCount: 42, albumCount: 3, artistCount: 1, imageUrl: albumArtUrl('genre-6') },
  { id: 'genre-7', name: 'Progressive Metal', trackCount: 52, albumCount: 5, artistCount: 1, imageUrl: albumArtUrl('genre-7') },
  { id: 'genre-8', name: 'Indie Pop', trackCount: 40, albumCount: 4, artistCount: 1, imageUrl: albumArtUrl('genre-8') },
  { id: 'genre-9', name: 'Afrobeat', trackCount: 34, albumCount: 2, artistCount: 1, imageUrl: albumArtUrl('genre-9') },
  { id: 'genre-10', name: 'Experimental', trackCount: 22, albumCount: 2, artistCount: 1, imageUrl: albumArtUrl('genre-10') },
  { id: 'genre-11', name: 'World', trackCount: 18, albumCount: 2, artistCount: 2, imageUrl: albumArtUrl('genre-11') },
  { id: 'genre-12', name: 'Fusion', trackCount: 30, albumCount: 2, artistCount: 2, imageUrl: albumArtUrl('genre-12') },
];

// ─── PLAYLISTS ───

export const playlists: Playlist[] = [
  {
    id: 'playlist-1',
    name: 'Late Night Focus',
    description: 'Ambient and electronic for deep work sessions',
    trackIds: ['track-3-1', 'track-3-4', 'track-3-8', 'track-7-1', 'track-7-3', 'track-2-4', 'track-7-5'],
    createdAt: '2026-06-15T10:00:00Z',
    updatedAt: '2026-08-10T22:00:00Z',
    coverUrl: albumArtUrl('playlist-1'),
    trackCount: 7,
    duration: 2864,
  },
  {
    id: 'playlist-2',
    name: 'Morning Coffee',
    description: 'Warm jazz and neo-soul to start the day',
    trackIds: ['track-1-1', 'track-1-3', 'track-4-1', 'track-4-2', 'track-8-1', 'track-8-3'],
    createdAt: '2026-05-20T08:00:00Z',
    updatedAt: '2026-08-08T07:30:00Z',
    coverUrl: albumArtUrl('playlist-2'),
    trackCount: 6,
    duration: 1789,
  },
  {
    id: 'playlist-3',
    name: 'Audiophile Test',
    description: 'Reference recordings for system evaluation',
    trackIds: ['track-2-1', 'track-5-1', 'track-7-2', 'track-1-6', 'track-6-3'],
    createdAt: '2026-07-01T14:00:00Z',
    updatedAt: '2026-08-05T16:00:00Z',
    coverUrl: albumArtUrl('playlist-3'),
    trackCount: 5,
    duration: 2171,
  },
  {
    id: 'playlist-4',
    name: 'Energy Boost',
    description: 'High-energy tracks for workouts and drives',
    trackIds: ['track-5-4', 'track-5-5', 'track-3-2', 'track-11-1', 'track-11-3', 'track-8-2'],
    createdAt: '2026-04-10T12:00:00Z',
    updatedAt: '2026-08-11T06:00:00Z',
    coverUrl: albumArtUrl('playlist-4'),
    trackCount: 6,
    duration: 2817,
  },
];

// ─── HELPER FUNCTIONS ───

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
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
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return coverGradient(hash);
}

export function getArtistById(id: string): Artist | undefined {
  return artists.find(a => a.id === id);
}

export function getAlbumById(id: string): Album | undefined {
  return albums.find(a => a.id === id);
}

export function getTrackById(id: string): Track | undefined {
  return tracks.find(t => t.id === id);
}

export function getTracksByAlbum(albumId: string): Track[] {
  return tracks.filter(t => t.albumId === albumId).sort((a, b) => a.trackNumber - b.trackNumber);
}

export function getAlbumsByArtist(artistId: string): Album[] {
  return albums.filter(a => a.artistId === artistId);
}

export function searchLibrary(query: string): { artists: Artist[]; albums: Album[]; tracks: Track[] } {
  const q = query.toLowerCase();
  return {
    artists: artists.filter(a => a.name.toLowerCase().includes(q)),
    albums: albums.filter(a => a.title.toLowerCase().includes(q) || a.artistName.toLowerCase().includes(q)),
    tracks: tracks.filter(t => t.title.toLowerCase().includes(q) || t.artistName.toLowerCase().includes(q) || t.albumName.toLowerCase().includes(q)),
  };
}

// Note: Podcast search is in podcast-data.ts via searchPodcasts()

// ─── CORE STATUS (Mock Data) ───

export const coreStatus: CoreStatus = {
  id: 'core-1',
  name: 'DSP Core — NAS Server',
  version: '2.4.0-beta.7',
  status: 'running',
  uptime: 14 * 86400 + 7 * 3600 + 32 * 60,
  machineInfo: {
    hostname: 'nas-dsp-core',
    os: 'Debian 12 (Bookworm)',
    cpuModel: 'Intel Core i5-12400T',
    cpuUsage: 18,
    memoryTotal: 8589934592,
    memoryUsed: 1288490189,
    cores: 6,
    architecture: 'x86_64',
  },
  audioEngine: {
    status: 'active',
    activeZones: 3,
    totalZones: 4,
    decodingLoad: 12,
    dspLoad: 28,
    outputLoad: 8,
    currentSampleRate: 192000,
    supportedFormats: ['FLAC', 'ALAC', 'WAV', 'AIFF', 'DSF', 'DFF', 'MP3', 'AAC', 'OGG Vorbis', 'WavPack'],
    maxChannels: 8,
    bitPerfectCapable: true,
    dsdNativeCapable: true,
    mqaPassthrough: true,
  },
  storageLocations: [
    {
      id: 'storage-1',
      name: 'Music Library (NAS)',
      path: '/nas/music',
      type: 'nas',
      enabled: true,
      totalSpace: 4398046511104,
      usedSpace: 2576980377344,
      trackCount: 12450,
      albumCount: 1580,
      isWatching: true,
      lastScan: '2026-08-12T06:00:00Z',
      scanIntervalMin: 30,
    },
    {
      id: 'storage-2',
      name: 'Local SSD Cache',
      path: '/local/music',
      type: 'local',
      enabled: true,
      totalSpace: 274877906944,
      usedSpace: 85899345920,
      trackCount: 3200,
      albumCount: 420,
      isWatching: true,
      lastScan: '2026-08-12T06:00:00Z',
      scanIntervalMin: 15,
    },
    {
      id: 'storage-3',
      name: 'External USB Drive',
      path: '/Volumes/External',
      type: 'usb',
      enabled: true,
      totalSpace: 2199023255552,
      usedSpace: 966367641600,
      trackCount: 8900,
      albumCount: 1120,
      isWatching: false,
      lastScan: '2026-08-11T18:00:00Z',
      scanIntervalMin: 60,
    },
  ],
  networkInfo: {
    hostname: 'nas-dsp-core',
    ipAddress: '192.168.1.100',
    macAddress: 'AA:BB:CC:DD:EE:FF',
    protocol: 'dsp-native',
    port: 9500,
    discoveryPort: 9501,
    encryption: true,
    remoteAccess: true,
    vpnActive: false,
    connectedEndpoints: 6,
  },
  apiInfo: {
    version: 'v2',
    protocol: 'websocket',
    port: 9600,
    wsPort: 9601,
    authenticated: true,
    remoteApps: [
      { id: 'app-1', name: 'DSP Remote (iPhone)', type: 'ios', connected: true, lastSeen: '2026-08-12T14:30:00Z', ipAddress: '192.168.1.50' },
      { id: 'app-2', name: 'DSP Remote (iPad)', type: 'ios', connected: true, lastSeen: '2026-08-12T14:29:55Z', ipAddress: '192.168.1.51' },
      { id: 'app-3', name: 'DSP Desktop', type: 'desktop', connected: false, lastSeen: '2026-08-12T08:00:00Z', ipAddress: '192.168.1.200' },
      { id: 'app-4', name: 'Web Controller', type: 'web', connected: true, lastSeen: '2026-08-12T14:30:10Z', ipAddress: '192.168.1.201' },
    ],
  },
  streamingServices: [
    { id: 'svc-1', name: 'TIDAL', type: 'tidal', status: 'connected', linked: true, username: 'user@example.com', qualityTier: 'HiRes', maxQuality: '24-bit/96kHz FLAC', lastSync: '2026-08-12T12:00:00Z', librarySize: 2840 },
    { id: 'svc-2', name: 'Qobuz', type: 'qobuz', status: 'disconnected', linked: false, qualityTier: '—' },
    { id: 'svc-3', name: 'Deezer', type: 'deezer', status: 'disconnected', linked: false, qualityTier: '—' },
  ],
  libraryStats: {
    totalTracks: 24550,
    totalAlbums: 3120,
    totalArtists: 890,
    totalDuration: 9424800,
    totalSize: 3500000000000,
    localTracks: 24550,
    streamingTracks: 0,
    formatBreakdown: { FLAC: 14200, ALAC: 3200, WAV: 1800, DSD: 1200, MP3: 2800, AAC: 1350 },
    sampleRateBreakdown: { '44.1kHz': 8200, '48kHz': 1800, '88.2kHz': 2400, '96kHz': 5100, '176.4kHz': 3200, '192kHz': 2500, '352.8kHz': 800, '384kHz': 550 },
  },
  discoveryMode: 'lan',
  autoDiscovery: true,
  lastScanAt: '2026-08-12T06:00:00Z',
};

// ─── ENHANCED SIGNAL PATH ───

export function getSignalPath(trackId: string, zoneId: string): SignalPathStep[] {
  const track = getTrackById(trackId);
  const zone = zones.find(z => z.id === zoneId);
  if (!track || !zone) return [];

  const steps: SignalPathStep[] = [];
  let currentFormat = track.format;
  let currentSR = track.sampleRate;
  let currentBD = track.bitDepth;
  let isDSD = track.format === 'DSF' || track.format === 'DFF';

  // Source step
  steps.push({
    label: 'Source',
    format: currentFormat,
    sampleRate: currentSR,
    bitDepth: currentBD,
    isBitPerfect: true,
    isDSD,
    dsdMode: isDSD ? 'native' : undefined,
    processingDetail: `Local: ${track.filePath}`,
    latencyMs: 0,
  });

  if (zone.dspConfig) {
    // Room Correction (convolution)
    if (zone.dspConfig.roomCorrection?.enabled) {
      steps.push({
        label: 'Room Correction',
        format: 'PCM',
        sampleRate: currentSR,
        bitDepth: currentBD,
        isBitPerfect: false,
        filterType: 'linear-phase',
        processingDetail: `Filter: ${zone.dspConfig.roomCorrection.filterName}`,
        latencyMs: 5.2,
      });
    }

    // Parametric EQ
    const activeBands = zone.dspConfig.eq?.filter(b => b.enabled) || [];
    if (activeBands.length > 0) {
      steps.push({
        label: 'Parametric EQ',
        format: 'PCM',
        sampleRate: currentSR,
        bitDepth: currentBD,
        isBitPerfect: false,
        processingDetail: `${activeBands.length} active band${activeBands.length > 1 ? 's' : ''}`,
        latencyMs: 0.1,
      });
    }

    // Headphone Correction
    if (zone.dspConfig.headphoneCorrection?.enabled) {
      steps.push({
        label: `Headphone: ${zone.dspConfig.headphoneCorrection.profileName}`,
        format: 'PCM',
        sampleRate: currentSR,
        bitDepth: currentBD,
        isBitPerfect: false,
        processingDetail: `${zone.dspConfig.headphoneCorrection.manufacturer} ${zone.dspConfig.headphoneCorrection.model}`,
        latencyMs: 0.3,
      });
    }

    // Crossfeed
    if (zone.dspConfig.crossfeed?.enabled && zone.dspConfig.crossfeed.preset !== 'none') {
      steps.push({
        label: `Crossfeed (${zone.dspConfig.crossfeed.preset})`,
        format: 'PCM',
        sampleRate: currentSR,
        bitDepth: currentBD,
        isBitPerfect: false,
        processingDetail: `Preset: ${zone.dspConfig.crossfeed.preset}`,
        latencyMs: 0.1,
      });
    }

    // Loudness / ReplayGain
    if (zone.dspConfig.loudness?.enabled) {
      steps.push({
        label: `Loudness (${zone.dspConfig.loudness.method})`,
        format: 'PCM',
        sampleRate: currentSR,
        bitDepth: currentBD,
        isBitPerfect: false,
        processingDetail: `Target: ${zone.dspConfig.loudness.targetLUFS} LUFS`,
        latencyMs: 0,
      });
    }

    // Upsampling
    if (zone.dspConfig.upsampling?.enabled && currentSR <= zone.dspConfig.upsampling.maxSrcRate) {
      const wasBitPerfect = steps.every(s => s.isBitPerfect);
      currentSR = zone.dspConfig.upsampling.targetRate / 1000;
      currentBD = zone.dspConfig.upsampling.targetBitDepth;
      isDSD = false;
      currentFormat = 'PCM';
      steps.push({
        label: 'Upsampling',
        format: 'PCM',
        sampleRate: currentSR,
        bitDepth: currentBD,
        isBitPerfect: false,
        filterType: zone.dspConfig.upsampling.filterType,
        processingDetail: `${formatSampleRate(zone.dspConfig.upsampling.targetRate / 1000)} / ${currentBD}-bit`,
        latencyMs: 2.8,
      });
    }
  }

  // Volume Control
  const isVolBitPerfect = zone.volumeMode !== 'dsp';
  steps.push({
    label: 'Volume Control',
    format: isDSD ? (track.format) : 'PCM',
    sampleRate: currentSR,
    bitDepth: currentBD,
    isBitPerfect: isVolBitPerfect,
    processingDetail: zone.volumeMode === 'hardware' ? 'Hardware (DAC)' : zone.volumeMode === 'dsp' ? 'DSP attenuator + TPDF dither' : 'Fixed output',
    ditherType: zone.volumeMode === 'dsp' ? 'tpdf' : 'none',
    latencyMs: 0,
  });

  // Format conversion if needed for output
  const endpoint = zone.endpoints[0];
  const needsDownsample = currentSR > (endpoint?.maxSampleRate || zone.sampleRate);
  const needsBDReduce = currentBD > (endpoint?.maxBitDepth || zone.bitDepth);
  const needsDoP = isDSD && endpoint?.supportsDoP && !endpoint?.supportsDSD;

  if (needsDoP) {
    steps.push({
      label: 'DSD → DoP Conversion',
      format: 'PCM (DoP)',
      sampleRate: currentSR,
      bitDepth: currentBD,
      isBitPerfect: false,
      isDSD: true,
      dsdMode: 'DoP',
      processingDetail: `DSD over PCM for ${endpoint?.name}`,
      latencyMs: 0.1,
    });
    isDSD = false;
    currentFormat = 'PCM';
  }

  if (needsDownsample || needsBDReduce) {
    steps.push({
      label: 'Format Conversion',
      format: currentFormat,
      sampleRate: needsDownsample ? (endpoint?.maxSampleRate || zone.sampleRate) : currentSR,
      bitDepth: needsBDReduce ? (endpoint?.maxBitDepth || zone.bitDepth) : currentBD,
      isBitPerfect: false,
      filterType: 'linear-phase',
      processingDetail: `Target: ${formatSampleRate(needsDownsample ? (endpoint?.maxSampleRate || zone.sampleRate) : currentSR)}`,
      latencyMs: 1.5,
    });
  }

  // Network transport
  steps.push({
    label: 'Network Transport',
    format: currentFormat,
    sampleRate: needsDownsample ? (endpoint?.maxSampleRate || zone.sampleRate) : currentSR,
    bitDepth: needsBDReduce ? (endpoint?.maxBitDepth || zone.bitDepth) : currentBD,
    isBitPerfect: true,
    processingDetail: `DSP Audio Protocol · ${(endpoint?.latencyMs || 5).toFixed(1)}ms latency`,
    latencyMs: endpoint?.latencyMs || 5,
  });

  // Output endpoint / DAC
  steps.push({
    label: `DAC: ${endpoint?.dac || 'Unknown'}`,
    format: needsDoP ? 'DoP' : currentFormat,
    sampleRate: needsDownsample ? (endpoint?.maxSampleRate || zone.sampleRate) : currentSR,
    bitDepth: needsBDReduce ? (endpoint?.maxBitDepth || zone.bitDepth) : currentBD,
    isBitPerfect: !needsDownsample && !needsBDReduce && isVolBitPerfect,
    processingDetail: endpoint?.clockSource ? `Clock: ${endpoint.clockSource}` : undefined,
    latencyMs: 0.01,
  });

  return steps;
}

export function getDetailedSignalPath(trackId: string, zoneId: string): {
  steps: SignalPathStep[];
  overallBitPerfect: boolean;
  sourceFormat: string;
  outputFormat: string;
  totalLatencyMs: number;
  dspChainCount: number;
  zoneInfo: Zone | undefined;
  trackInfo: Track | undefined;
} {
  const steps = getSignalPath(trackId, zoneId);
  const track = getTrackById(trackId);
  const zone = zones.find(z => z.id === zoneId);
  const dspSteps = steps.filter(s => !s.isBitPerfect);
  const totalLatency = steps.reduce((sum, s) => sum + (s.latencyMs || 0), 0);

  return {
    steps,
    overallBitPerfect: steps.every(s => s.isBitPerfect),
    sourceFormat: track ? `${track.format} ${formatSampleRate(track.sampleRate)} ${track.bitDepth}-bit` : '—',
    outputFormat: steps.length > 0 ? `${steps[steps.length - 1].format} ${formatSampleRate(steps[steps.length - 1].sampleRate)} ${steps[steps.length - 1].bitDepth}-bit` : '—',
    totalLatencyMs: totalLatency,
    dspChainCount: dspSteps.length,
    zoneInfo: zone,
    trackInfo: track,
  };
}
