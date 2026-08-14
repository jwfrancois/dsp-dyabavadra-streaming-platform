import { create } from 'zustand';
import type { DSPConfig, EQBand } from '@/lib/data';

interface DSPEngineState {
  // Per-zone DSP configs (keyed by zoneId)
  zoneConfigs: Record<string, DSPConfig>;
  
  // Currently selected zone for editing
  selectedZoneId: string;
  
  // Global settings
  bitPerfectDefault: boolean;
  gaplessPlayback: boolean;
  globalDither: { enabled: boolean; type: 'tpdf' | 'triangular' | 'noise-shaped' | 'none' };
  
  // Actions
  selectZone: (zoneId: string) => void;
  getZoneConfig: (zoneId: string) => DSPConfig;
  updateZoneConfig: (zoneId: string, config: Partial<DSPConfig>) => void;
  toggleDSPModule: (zoneId: string, module: keyof DSPConfig) => void;
  updateEQBand: (zoneId: string, bandId: string, updates: Partial<EQBand>) => void;
  addEQBand: (zoneId: string, band: EQBand) => void;
  removeEQBand: (zoneId: string, bandId: string) => void;
  setVolumeMode: (zoneId: string, mode: 'hardware' | 'dsp' | 'fixed') => void;
  setVolumeLimit: (zoneId: string, maxPercent: number, startupMax: number) => void;
  setClockMode: (zoneId: string, mode: 'auto' | 'master' | 'slave' | 'passthrough') => void;
  toggleBitPerfectDefault: () => void;
  toggleGapless: () => void;
  setGlobalDither: (type: 'tpdf' | 'triangular' | 'noise-shaped' | 'none') => void;
  resetZoneConfig: (zoneId: string) => void;
}

export const useDSPEngineStore = create<DSPEngineState>((set, get) => {
  return {
    zoneConfigs: {},
    selectedZoneId: 'zone-1',
    bitPerfectDefault: true,
    gaplessPlayback: true,
    globalDither: { enabled: true, type: 'tpdf' },

    selectZone: (zoneId) => set({ selectedZoneId: zoneId }),

    getZoneConfig: (zoneId) => {
      return get().zoneConfigs[zoneId] || { dither: { enabled: false, type: 'none' } };
    },

    updateZoneConfig: (zoneId, config) => set(s => ({
      zoneConfigs: {
        ...s.zoneConfigs,
        [zoneId]: { ...s.zoneConfigs[zoneId], ...config },
      },
    })),

    toggleDSPModule: (zoneId, module) => set(s => {
      const current = s.zoneConfigs[zoneId] || {};
      const moduleVal = current[module];
      if (!moduleVal || typeof moduleVal !== 'object' || !('enabled' in moduleVal)) return s;
      return {
        zoneConfigs: {
          ...s.zoneConfigs,
          [zoneId]: {
            ...current,
            [module]: { ...(moduleVal as Record<string, unknown>), enabled: !(moduleVal as Record<string, unknown>).enabled },
          },
        },
      };
    }),

    updateEQBand: (zoneId, bandId, updates) => set(s => {
      const config = s.zoneConfigs[zoneId];
      if (!config?.eq) return s;
      return {
        zoneConfigs: {
          ...s.zoneConfigs,
          [zoneId]: {
            ...config,
            eq: config.eq.map(b => b.id === bandId ? { ...b, ...updates } : b),
          },
        },
      };
    }),

    addEQBand: (zoneId, band) => set(s => {
      const config = s.zoneConfigs[zoneId];
      return {
        zoneConfigs: {
          ...s.zoneConfigs,
          [zoneId]: {
            ...config,
            eq: [...(config?.eq || []), band],
          },
        },
      };
    }),

    removeEQBand: (zoneId, bandId) => set(s => {
      const config = s.zoneConfigs[zoneId];
      return {
        zoneConfigs: {
          ...s.zoneConfigs,
          [zoneId]: {
            ...config,
            eq: config?.eq?.filter(b => b.id !== bandId) || [],
          },
        },
      };
    }),

    setVolumeMode: (zoneId, mode) => set(s => ({
      zoneConfigs: {
        ...s.zoneConfigs,
        [zoneId]: {
          ...s.zoneConfigs[zoneId],
          volumeMode: mode,
        },
      },
    })),

    setVolumeLimit: (zoneId, maxPercent, startupMax) => set(s => ({
      zoneConfigs: {
        ...s.zoneConfigs,
        [zoneId]: {
          ...s.zoneConfigs[zoneId],
          volumeLimit: { maxPercent, startupMax },
        },
      },
    })),

    setClockMode: (zoneId, mode) => set(s => ({
      zoneConfigs: {
        ...s.zoneConfigs,
        [zoneId]: {
          ...s.zoneConfigs[zoneId],
          clockMode: mode,
        },
      },
    })),

    toggleBitPerfectDefault: () => set(s => ({ bitPerfectDefault: !s.bitPerfectDefault })),

    toggleGapless: () => set(s => ({ gaplessPlayback: !s.gaplessPlayback })),

    setGlobalDither: (type) => set({ globalDither: { enabled: type !== 'none', type } }),

    resetZoneConfig: (zoneId) => set(s => ({
      zoneConfigs: {
        ...s.zoneConfigs,
        [zoneId]: { dither: { enabled: false, type: 'none' } },
      },
    })),
  };
});
