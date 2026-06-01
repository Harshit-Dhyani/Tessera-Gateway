import { providerRegistry } from '@tessera-gateway/core/providers/registry';
import { Bolt, ChevronRight, FileText, Home, PowerOff, Server, Settings, Zap } from 'lucide-react';
import { useEffect } from 'react';

import DashboardScreen from './features/dashboard/DashboardScreen';
import LogsScreen from './features/logs/LogsScreen';
import ProvidersScreen from './features/providers/ProvidersScreen';
import RuntimeScreen from './features/runtime/RuntimeScreen';
import SettingsScreen from './features/settings/SettingsScreen';
import { useAppStore } from './store/useAppStore';
import type { ProviderStatus, ScreenId } from './types/ipc';

const navItems: { id: ScreenId; label: string; icon: typeof Home; desc: string }[] = [
  { id: 'dashboard', label: 'DASH', icon: Home, desc: 'System overview' },
  { id: 'providers', label: 'PROV', icon: Zap, desc: 'AI providers' },
  { id: 'runtime', label: 'RUNT', icon: Server, desc: 'Server status' },
  { id: 'logs', label: 'LOGS', icon: FileText, desc: 'Activity log' },
  { id: 'settings', label: 'CONF', icon: Settings, desc: 'Configuration' },
];

const screens = {
  dashboard: DashboardScreen,
  providers: ProvidersScreen,
  runtime: RuntimeScreen,
  logs: LogsScreen,
  settings: SettingsScreen,
};

export default function App() {
  const {
    activeScreen,
    setActiveScreen,
    appVersion,
    setAppVersion,
    setProviderStatuses,
    setGatewayHealth,
    setMcpHealth,
    setSettings,
    setLogs,
    gatewayHealth,
    mcpHealth,
  } = useAppStore();

  useEffect(() => {
    if (window.gateway) {
      const refreshRuntimeSurfaces = () => {
        window.gateway.getGatewayHealth().then(setGatewayHealth);
        window.gateway.getMcpHealth().then(setMcpHealth);
        window.gateway.getLogs().then(setLogs);
      };

      window.gateway.getVersion().then(setAppVersion);
      window.gateway.getSettings().then(setSettings);

      const initialStatuses: Record<string, ProviderStatus> = {};
      Object.values(providerRegistry).forEach((provider) => {
        initialStatuses[provider.id] = {
          providerId: provider.id,
          displayName: provider.name,
          aliases: provider.aliases,
          capabilities: provider.capabilities,
          status: provider.status,
          authMethod: provider.authMethod,
          isOpen: false,
          isVisible: false,
          isActive: false,
          isFocused: false,
          isLoggedIn: false,
          loadState: 'idle',
          participatesInLayout: false,
        };
      });
      setProviderStatuses(initialStatuses);

      refreshRuntimeSurfaces();
      const interval = window.setInterval(refreshRuntimeSurfaces, 5000);
      return () => window.clearInterval(interval);
    }
  }, [setAppVersion, setSettings, setProviderStatuses, setGatewayHealth, setMcpHealth, setLogs]);

  useEffect(() => {
    if (window.gateway) {
      window.gateway.setActiveScreen(activeScreen);
    }
  }, [activeScreen]);

  useEffect(() => {
    if (!window.gateway) return;

    let unsubscribe: (() => void) | undefined;

    window.gateway.getActiveScreen().then((screenId) => {
      setActiveScreen(screenId);
    });

    if (window.gateway.onActivateScreen) {
      unsubscribe = window.gateway.onActivateScreen((screenId) => {
        setActiveScreen(screenId);
      });
    }

    return () => {
      unsubscribe?.();
    };
  }, [setActiveScreen]);

  const ScreenComponent = screens[activeScreen];
  const gatewayRunning = gatewayHealth?.running ?? false;
  const mcpRunning = mcpHealth?.running ?? false;

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a]">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-black focus:rounded"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="flex items-center justify-between h-12 px-4 border-b border-zinc-800 bg-zinc-950/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Bolt className="w-5 h-5 text-amber-400" aria-hidden="true" />
            <span className="font-bold text-zinc-200 tracking-tight">TESSERA</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="text-zinc-600">v{appVersion}</span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium border ${gatewayRunning ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'}`}
          >
            {gatewayRunning ? 'GATEWAY ONLINE' : 'GATEWAY OFFLINE'}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <nav className="w-40 border-r border-zinc-800 bg-zinc-950/30 flex flex-col" aria-label="Main navigation">
          <div className="flex-1 p-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeScreen === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setActiveScreen(item.id)}
                  aria-pressed={isActive}
                  aria-label={`${item.label} - ${item.desc}`}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150
                    min-h-[44px] /* Touch target minimum per ui-ux-pro-max */
                    ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950'
                    }
                  `}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-400' : 'text-zinc-600'}`}
                    aria-hidden="true"
                  />
                  <span className={`text-[11px] font-bold tracking-wider ${isActive ? 'text-amber-400' : ''}`}>
                    {item.label}
                  </span>
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto text-amber-400" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          {/* Status Panel */}
          <div className="p-3 border-t border-zinc-800">
            <div className="text-[9px] text-zinc-600 space-y-2 font-mono" role="status" aria-label="Runtime status">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-healthy animate-pulse" aria-hidden="true" />
                <span>127.0.0.1:7860</span>
                <span className="sr-only">{gatewayRunning ? 'Gateway running' : 'Gateway offline'}</span>
              </div>
              <div className="flex items-center gap-2">
                <PowerOff className="w-3 h-3 text-zinc-600" aria-hidden="true" />
                <span className={mcpRunning ? 'text-zinc-300' : 'text-zinc-700'}>127.0.0.1:7861</span>
                <span className="sr-only">{mcpRunning ? 'MCP running' : 'MCP stopped'}</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main id="main-content" className="flex-1 p-6 overflow-auto bg-[#0a0a0a]" tabIndex={-1}>
          <ScreenComponent />
        </main>
      </div>

      {/* Footer */}
      <footer
        className="h-8 flex items-center justify-between px-4 border-t border-zinc-800 bg-zinc-950/30 text-[10px] text-zinc-600 font-mono"
        role="contentinfo"
      >
        <span>TESSERA_GATEWAY</span>
        <span className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${gatewayRunning ? 'bg-status-healthy' : 'bg-zinc-700'}`}
              aria-hidden="true"
            />
            GATEWAY: {gatewayRunning ? '127.0.0.1:7860' : 'offline'}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${mcpRunning ? 'bg-status-healthy' : 'bg-zinc-700'}`}
              aria-hidden="true"
            />
            MCP: {mcpRunning ? '127.0.0.1:7861' : 'offline'}
          </span>
        </span>
      </footer>
    </div>
  );
}
