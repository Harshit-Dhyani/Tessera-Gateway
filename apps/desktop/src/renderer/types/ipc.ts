import type { LayoutMode, ProviderBrowserState, ProviderSummary, RuntimeState } from '@tessera-gateway/core';

export interface ProviderStatus extends ProviderSummary {}

export interface ServerHealth {
  running: boolean;
  port: number;
  host: string;
  version?: string;
  uptime?: number;
  error?: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  provider: string;
  modelAlias: string;
  latencyMs: number;
  result: 'success' | 'error' | 'timeout';
  errorCode?: string;
}

export interface AppSettings {
  gateway: {
    port: number;
    host: string;
  };
  runtime: {
    port: number;
    host: string;
  };
  mcp: {
    port: number;
  };
  providers: {
    enabled: string[];
    defaultModel: string;
  };
  logs: {
    retention: number;
  };
}

export interface LogFilter {
  provider?: string;
  result?: 'success' | 'error' | 'timeout';
  limit?: number;
  offset?: number;
}

export type ScreenId = 'dashboard' | 'providers' | 'runtime' | 'logs' | 'settings';

export type { ProviderBrowserState, RuntimeState, LayoutMode };

export type ProviderViewState = ProviderBrowserState;

export interface GatewayHealth {
  running: boolean;
  port: number;
  host: string;
  error?: string;
}

export interface Settings {
  gateway: { port: number; host: string };
  runtime: { port: number; host: string };
  mcp: { port: number };
  providers: { enabled: string[]; defaultModel: string };
  logs: { retention: number };
}
