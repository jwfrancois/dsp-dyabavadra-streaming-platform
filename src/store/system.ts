import { create } from 'zustand';
import type { CoreStatus, Endpoint } from '@/lib/data';

const defaultCoreStatus: CoreStatus = {
  id: 'core-1',
  name: 'DSP Core',
  version: '2.4.0',
  status: 'running',
  uptime: 0,
  machineInfo: {
    hostname: '',
    os: '',
    cpuModel: '',
    cpuUsage: 0,
    memoryTotal: 0,
    memoryUsed: 0,
    cores: 0,
    architecture: '',
  },
  audioEngine: {
    status: 'idle',
    activeZones: 0,
    totalZones: 0,
    decodingLoad: 0,
    dspLoad: 0,
    outputLoad: 0,
    currentSampleRate: 44100,
    supportedFormats: [],
    maxChannels: 2,
    bitPerfectCapable: true,
    dsdNativeCapable: false,
    mqaPassthrough: false,
  },
  storageLocations: [],
  networkInfo: {
    hostname: '',
    ipAddress: '',
    macAddress: '',
    protocol: 'dsp-native',
    port: 0,
    discoveryPort: 0,
    encryption: false,
    remoteAccess: false,
    vpnActive: false,
    connectedEndpoints: 0,
  },
  apiInfo: {
    version: '',
    protocol: 'websocket',
    port: 0,
    wsPort: 0,
    authenticated: false,
    remoteApps: [],
  },
  streamingServices: [],
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
  
  // Actions
  setCore: (core: Partial<CoreStatus>) => void;
  scanEndpoints: () => void;
  toggleAutoDiscovery: () => void;
  setDiscoveryMode: (mode: 'lan' | 'lan+remote' | 'vpn') => void;
  toggleEncryption: () => void;
  toggleRemoteAccess: () => void;
  rebootCore: () => void;
  startLibraryScan: () => void;
}

export const useSystemStore = create<SystemState>((set, get) => ({
  core: defaultCoreStatus,
  allEndpoints: [],
  isScanning: false,
  autoDiscovery: true,
  discoveryMode: 'lan',
  protocolEncryption: true,
  remoteAccessEnabled: true,

  setCore: (updates) => set(s => ({ core: { ...s.core, ...updates } })),

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
      set(s => ({ core: { ...s.core, status: 'running' as const, uptime: 0 } }));
    }, 5000);
  },

  startLibraryScan: () => {
    const now = new Date().toISOString();
    set(s => ({ core: { ...s.core, lastScanAt: now } }));
  },
}));
