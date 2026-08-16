import { create } from 'zustand';
import type { CoreStatus, Endpoint } from '@/lib/data';

// ─── Browser-detected system info ───

function detectMachineInfo() {
  if (typeof navigator === 'undefined') {
    return {
      hostname: 'DSP Core',
      os: 'Server',
      cpuModel: 'Unknown',
      cpuUsage: 0,
      memoryTotal: 0,
      memoryUsed: 0,
      cores: 0,
      architecture: 'x86_64',
    };
  }

  const ua = navigator.userAgent;
  let os = 'Unknown';
  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone')) os = 'iOS';

  const cores = navigator.hardwareConcurrency ?? 4;

  // Get device memory if available (Chrome only)
  const deviceMemory = (navigator as any).deviceMemory; // GB
  const memoryTotal = deviceMemory ? deviceMemory * 1073741824 : cores * 2 * 1073741824; // rough estimate

  return {
    hostname: 'DSP Core',
    os,
    cpuModel: `${cores}-core Processor`,
    cpuUsage: Math.floor(Math.random() * 15) + 3, // Simulated low usage
    memoryTotal,
    memoryUsed: Math.floor(memoryTotal * 0.3), // Simulated 30% usage
    cores,
    architecture: 'x86_64',
  };
}

function detectNetworkInfo() {
  if (typeof window === 'undefined') {
    return {
      hostname: '',
      ipAddress: '',
      macAddress: '',
      protocol: 'dsp-native' as const,
      port: 9200,
      discoveryPort: 9300,
      encryption: true,
      remoteAccess: true,
      vpnActive: false,
      connectedEndpoints: 0,
    };
  }

  return {
    hostname: window.location.hostname,
    ipAddress: '127.0.0.1',
    macAddress: '—',
    protocol: 'dsp-native' as const,
    port: 9200,
    discoveryPort: 9300,
    encryption: true,
    remoteAccess: true,
    vpnActive: false,
    connectedEndpoints: 1,
  };
}

function buildDefaultCoreStatus(): CoreStatus {
  const machineInfo = detectMachineInfo();
  const networkInfo = detectNetworkInfo();

  return {
    id: 'core-1',
    name: 'DSP Core',
    version: '2.4.0',
    status: 'running',
    uptime: 0,
    machineInfo,
    audioEngine: {
      status: 'idle',
      activeZones: 1,
      totalZones: 4,
      decodingLoad: 0,
      dspLoad: 0,
      outputLoad: 0,
      currentSampleRate: 44100,
      supportedFormats: ['FLAC', 'WAV', 'AIFF', 'ALAC', 'MP3', 'AAC', 'OGG', 'DSD'],
      maxChannels: 8,
      bitPerfectCapable: true,
      dsdNativeCapable: true,
      mqaPassthrough: false,
    },
    storageLocations: [
      {
        id: 'storage-1',
        name: 'Music Library',
        path: '/music',
        type: 'local',
        enabled: true,
        totalSpace: 1099511627776, // 1 TB
        usedSpace: 0,
        trackCount: 0,
        albumCount: 0,
        isWatching: false,
        lastScan: undefined,
        scanIntervalMin: 30,
      },
    ],
    networkInfo,
    apiInfo: {
      version: '2.0',
      protocol: 'websocket',
      port: 9100,
      wsPort: 9101,
      authenticated: false,
      remoteApps: [
        {
          id: 'app-web',
          name: 'DSP Web Client',
          type: 'web',
          connected: true,
          lastSeen: new Date().toISOString(),
          ipAddress: '127.0.0.1',
        },
      ],
    },
    streamingServices: [
      {
        id: 'svc-tidal',
        name: 'TIDAL',
        type: 'tidal',
        status: 'disconnected',
        linked: false,
        qualityTier: '—',
        maxQuality: 'HiRes FLAC',
      },
      {
        id: 'svc-qobuz',
        name: 'Qobuz',
        type: 'qobuz',
        status: 'disconnected',
        linked: false,
        qualityTier: '—',
        maxQuality: 'HiRes 24-bit',
      },
    ],
    libraryStats: {
      totalTracks: 0,
      totalAlbums: 0,
      totalArtists: 0,
      totalDuration: 0,
      totalSize: 0,
      localTracks: 0,
      streamingTracks: 0,
      formatBreakdown: {},
      sampleRateBreakdown: {},
    },
    discoveryMode: 'lan',
    autoDiscovery: true,
  };
}

interface SystemState {
  // Core
  core: CoreStatus;

  // All discovered endpoints (across all zones)
  allEndpoints: Endpoint[];

  // Discovery
  isScanning: boolean;
  autoDiscovery: boolean;
  discoveryMode: 'lan' | 'lan+remote' | 'vpn';

  // Network protocol
  protocolEncryption: boolean;
  remoteAccessEnabled: boolean;

  // Uptime tracker
  _startTime: number;
  _tickInterval: ReturnType<typeof setInterval> | null;

  // Actions
  setCore: (core: Partial<CoreStatus>) => void;
  scanEndpoints: () => void;
  toggleAutoDiscovery: () => void;
  setDiscoveryMode: (mode: 'lan' | 'lan+remote' | 'vpn') => void;
  toggleEncryption: () => void;
  toggleRemoteAccess: () => void;
  rebootCore: () => void;
  startLibraryScan: () => void;
  initUptime: () => void;
  stopUptime: () => void;
  updateLibraryStats: (stats: Partial<CoreStatus['libraryStats']>) => void;
}

export const useSystemStore = create<SystemState>((set, get) => ({
  core: buildDefaultCoreStatus(),
  allEndpoints: [],
  isScanning: false,
  autoDiscovery: true,
  discoveryMode: 'lan',
  protocolEncryption: true,
  remoteAccessEnabled: true,
  _startTime: Date.now(),
  _tickInterval: null,

  setCore: (updates) => set(s => ({ core: { ...s.core, ...updates } })),

  initUptime: () => {
    // Clear any existing interval
    const existing = get()._tickInterval;
    if (existing) clearInterval(existing);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      set(s => ({
        core: { ...s.core, uptime: elapsed },
      }));
    }, 1000);

    set({ _startTime: startTime, _tickInterval: interval });
  },

  stopUptime: () => {
    const interval = get()._tickInterval;
    if (interval) {
      clearInterval(interval);
      set({ _tickInterval: null });
    }
  },

  scanEndpoints: () => {
    set({ isScanning: true });
    setTimeout(() => {
      set({ isScanning: false });
    }, 3000);
  },

  toggleAutoDiscovery: () => set(s => {
    const newMode = !s.autoDiscovery;
    return {
      autoDiscovery: newMode,
      core: { ...s.core, autoDiscovery: newMode },
    };
  }),

  setDiscoveryMode: (mode) => set(s => ({
    discoveryMode: mode,
    core: { ...s.core, discoveryMode: mode },
  })),

  toggleEncryption: () => set(s => {
    const newEnc = !s.protocolEncryption;
    return {
      protocolEncryption: newEnc,
      core: { ...s.core, networkInfo: { ...s.core.networkInfo, encryption: newEnc } },
    };
  }),

  toggleRemoteAccess: () => set(s => {
    const newRA = !s.remoteAccessEnabled;
    return {
      remoteAccessEnabled: newRA,
      core: { ...s.core, networkInfo: { ...s.core.networkInfo, remoteAccess: newRA } },
    };
  }),

  rebootCore: () => {
    set(s => ({ core: { ...s.core, status: 'starting' as const } }));
    setTimeout(() => {
      const startTime = Date.now();
      set(s => ({ core: { ...s.core, status: 'running' as const, uptime: 0 }, _startTime: startTime }));
    }, 5000);
  },

  startLibraryScan: () => {
    const now = new Date().toISOString();
    set(s => ({ core: { ...s.core, lastScanAt: now } }));
  },

  updateLibraryStats: (stats) => set(s => ({
    core: { ...s.core, libraryStats: { ...s.core.libraryStats, ...stats } },
  })),
}));
