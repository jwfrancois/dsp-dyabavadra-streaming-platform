import { create } from 'zustand';
import type { CoreStatus, Endpoint, Zone } from '@/lib/data';
import { coreStatus, zones } from '@/lib/data';

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
  core: coreStatus,
  allEndpoints: zones.flatMap(z => z.endpoints),
  isScanning: false,
  autoDiscovery: true,
  discoveryMode: 'lan',
  protocolEncryption: true,
  remoteAccessEnabled: true,

  setCore: (updates) => set(s => ({ core: { ...s.core, ...updates } })),

  scanEndpoints: () => {
    set({ isScanning: true });
    // Simulate scan completing after 3 seconds
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
