import type {
  GatewayHealth,
  LayoutMode,
  LogEntry,
  ProviderBrowserState,
  ProviderViewState,
  ScreenId,
  Settings,
} from './ipc';

declare global {
  interface Window {
    gateway: {
      getVersion: () => Promise<string>;
      openProviderView: (providerId: string) => Promise<ProviderViewState>;
      closeProviderView: (providerId: string) => Promise<ProviderViewState>;
      focusProviderView: (providerId: string) => Promise<void>;
      setProviderLayout: (layout: LayoutMode) => Promise<void>;
      getProviderViewState: () => Promise<ProviderViewState[]>;
      resetProviderSession: (providerId: string) => Promise<void>;
      selectProvider: (providerId: string) => Promise<void>;
      navigateProvider: (providerId: string, url: string) => Promise<void>;
      providerBack: (providerId: string) => Promise<void>;
      providerForward: (providerId: string) => Promise<void>;
      providerReload: (providerId: string) => Promise<void>;
      openProviderExternal: (providerId: string) => Promise<void>;
      providerLogin: (providerId: string) => Promise<void>;
      getProviderBrowserStates: () => Promise<ProviderBrowserState[]>;
      getActiveProviderState: () => Promise<ProviderBrowserState | null>;
      getProviderStatuses: () => Promise<unknown>;
      resetSession: (providerId: string) => Promise<unknown>;
      getSettings: () => Promise<Settings>;
      updateSettings: (settings: Partial<Settings>) => Promise<{ success: boolean }>;
      getGatewayHealth: () => Promise<GatewayHealth>;
      getMcpHealth: () => Promise<GatewayHealth>;
      getLogs: () => Promise<LogEntry[]>;
      clearLogs: () => Promise<{ success: boolean }>;
      setProviderWorkspaceBounds: (bounds: { x: number; y: number; width: number; height: number }) => Promise<{
        success: boolean;
      }>;
      getProviderWorkspaceBounds: () => Promise<{ x: number; y: number; width: number; height: number } | null>;
      setActiveScreen: (screenId: ScreenId) => Promise<{ success: boolean }>;
      onActivateScreen: (callback: (screenId: ScreenId) => void) => () => void;
    };
  }
}
