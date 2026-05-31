import { create } from 'zustand';
import type { AppSettings, LogEntry, ProviderStatus, ScreenId, ServerHealth } from '../types/ipc';

interface AppState {
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId) => void;

  appVersion: string;
  setAppVersion: (version: string) => void;

  providerStatuses: Record<string, ProviderStatus>;
  setProviderStatuses: (statuses: Record<string, ProviderStatus>) => void;

  gatewayHealth: ServerHealth | null;
  setGatewayHealth: (health: ServerHealth) => void;

  mcpHealth: ServerHealth | null;
  setMcpHealth: (health: ServerHealth) => void;

  settings: AppSettings | null;
  setSettings: (settings: AppSettings) => void;

  logs: LogEntry[];
  setLogs: (logs: LogEntry[]) => void;
  appendLogs: (logs: LogEntry[]) => void;

  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeScreen: 'dashboard',
  setActiveScreen: (screen) => set({ activeScreen: screen }),

  appVersion: '0.1.0',
  setAppVersion: (version) => set({ appVersion: version }),

  providerStatuses: {},
  setProviderStatuses: (statuses) => set({ providerStatuses: statuses }),

  gatewayHealth: null,
  setGatewayHealth: (health) => set({ gatewayHealth: health }),

  mcpHealth: null,
  setMcpHealth: (health) => set({ mcpHealth: health }),

  settings: null,
  setSettings: (settings) => set({ settings }),

  logs: [],
  setLogs: (logs) => set({ logs }),
  appendLogs: (newLogs) => set((state) => ({ logs: [...state.logs, ...newLogs] })),

  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}));
