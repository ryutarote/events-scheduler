import { create } from 'zustand';
import type { Device } from '../types';

interface DeviceStore {
  devices: Device[];
  isLoading: boolean;
  pairingCode: string | null;

  // Device management (stub implementation)
  addDevice: (name: string) => Device;
  removeDevice: (id: string) => void;
  getDevice: (id: string) => Device | undefined;

  // Pairing operations (stub)
  startPairing: (code: string) => Promise<boolean>;
  cancelPairing: () => void;

  // Sync operations (stub)
  syncWithDevice: (id: string) => Promise<void>;
}

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const useDeviceStore = create<DeviceStore>((set, get) => ({
  devices: [],
  isLoading: false,
  pairingCode: null,

  addDevice: (name: string): Device => {
    const now = new Date().toISOString();
    const newDevice: Device = {
      id: generateId(),
      name,
      pairedAt: now,
      lastSyncAt: now,
    };

    set((state) => ({
      devices: [...state.devices, newDevice],
    }));

    return newDevice;
  },

  removeDevice: (id: string): void => {
    set((state) => ({
      devices: state.devices.filter((device) => device.id !== id),
    }));
  },

  getDevice: (id: string): Device | undefined => {
    return get().devices.find((device) => device.id === id);
  },

  startPairing: async (code: string): Promise<boolean> => {
    set({ isLoading: true, pairingCode: code });

    // Stub: Simulate pairing process
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate successful pairing with a mock device
        const mockDevice: Device = {
          id: generateId(),
          name: `Device-${code}`,
          pairedAt: new Date().toISOString(),
          lastSyncAt: new Date().toISOString(),
        };

        set((state) => ({
          devices: [...state.devices, mockDevice],
          isLoading: false,
          pairingCode: null,
        }));

        resolve(true);
      }, 1500);
    });
  },

  cancelPairing: (): void => {
    set({ isLoading: false, pairingCode: null });
  },

  syncWithDevice: async (id: string): Promise<void> => {
    set({ isLoading: true });

    // Stub: Simulate sync process
    return new Promise((resolve) => {
      setTimeout(() => {
        set((state) => ({
          devices: state.devices.map((device) =>
            device.id === id
              ? { ...device, lastSyncAt: new Date().toISOString() }
              : device
          ),
          isLoading: false,
        }));
        resolve();
      }, 1000);
    });
  },
}));
