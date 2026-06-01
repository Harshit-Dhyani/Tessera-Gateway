import { providerRegistry } from '@tessera-gateway/core/providers/registry';
import { LayoutGrid, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { LayoutMode, ProviderBrowserState } from '../../types/ipc';
import { ProviderTabs } from './ProviderTabs';
import { ProviderToolbar } from './ProviderToolbar';
import { ProviderWorkspace } from './ProviderWorkspace';

export default function ProvidersScreen() {
  const [browserStates, setBrowserStates] = useState<ProviderBrowserState[]>([]);
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);
  const [layout, setLayout] = useState<LayoutMode>('grid');
  const [loading, setLoading] = useState<string | null>(null);

  const loadBrowserStates = useCallback(async () => {
    if (window.gateway) {
      const states = await window.gateway.getProviderBrowserStates();
      setBrowserStates(states);

      const active = await window.gateway.getActiveProviderState();
      if (active) {
        setActiveProviderId(active.providerId);
      }
    }
  }, []);

  useEffect(() => {
    loadBrowserStates();
    const interval = window.setInterval(loadBrowserStates, 1000);
    return () => window.clearInterval(interval);
  }, [loadBrowserStates]);

  const handleSelectProvider = useCallback(
    async (providerId: string) => {
      setLoading(providerId);
      try {
        if (window.gateway) {
          await window.gateway.selectProvider(providerId);
          setActiveProviderId(providerId);
          await loadBrowserStates();
        }
      } finally {
        setLoading(null);
      }
    },
    [loadBrowserStates],
  );

  const handleOpenProvider = useCallback(
    async (providerId: string) => {
      setLoading(providerId);
      try {
        if (window.gateway) {
          await window.gateway.openProviderView(providerId);
          setActiveProviderId(providerId);
          await loadBrowserStates();
        }
      } finally {
        setLoading(null);
      }
    },
    [loadBrowserStates],
  );

  const handleLayoutChange = useCallback(async (newLayout: LayoutMode) => {
    setLayout(newLayout);
    if (window.gateway) {
      await window.gateway.setProviderLayout(newLayout);
    }
  }, []);

  const handleBack = useCallback(async () => {
    if (activeProviderId && window.gateway) {
      await window.gateway.providerBack(activeProviderId);
    }
  }, [activeProviderId]);

  const handleForward = useCallback(async () => {
    if (activeProviderId && window.gateway) {
      await window.gateway.providerForward(activeProviderId);
    }
  }, [activeProviderId]);

  const handleReload = useCallback(async () => {
    if (activeProviderId && window.gateway) {
      await window.gateway.providerReload(activeProviderId);
    }
  }, [activeProviderId]);

  const handleOpenExternal = useCallback(async () => {
    if (activeProviderId && window.gateway) {
      await window.gateway.openProviderExternal(activeProviderId);
    }
  }, [activeProviderId]);

  const handleLogin = useCallback(async () => {
    if (activeProviderId && window.gateway) {
      await window.gateway.providerLogin(activeProviderId);
    }
  }, [activeProviderId]);

  const openProviders = browserStates.filter((s) => s.isOpen && s.isMounted).map((s) => s.providerId);

  const activeProvider = browserStates.find((s) => s.isFocused) || browserStates.find((s) => s.isActive) || null;

  const getAutoLayout = (): LayoutMode => {
    if (openProviders.length <= 1) return 'single';
    if (openProviders.length === 2) return 'split';
    return 'grid';
  };

  const effectiveLayout = layout === 'grid' && openProviders.length <= 2 ? getAutoLayout() : layout;

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h1 className="text-lg font-bold text-zinc-100 tracking-tight">PROVIDER_WORKSPACE</h1>
        </div>

        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-zinc-500" />
          <select
            value={layout}
            onChange={(e) => handleLayoutChange(e.target.value as LayoutMode)}
            className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs px-2 py-1 rounded"
          >
            <option value="single">Single</option>
            <option value="split">Split</option>
            <option value="grid">Grid</option>
          </select>
        </div>
      </div>

      {/* Provider Tabs */}
      <ProviderTabs
        activeProviderId={activeProviderId}
        browserStates={browserStates}
        onSelectProvider={handleSelectProvider}
        onOpenSettings={() => {}}
      />

      {/* Toolbar */}
      <ProviderToolbar
        activeProvider={activeProvider}
        onBack={handleBack}
        onForward={handleForward}
        onReload={handleReload}
        onOpenExternal={handleOpenExternal}
        onLogin={handleLogin}
      />

      {/* Workspace */}
      <ProviderWorkspace
        layout={effectiveLayout}
        openProviders={openProviders}
        activeProviderId={activeProviderId}
        onSelectProvider={handleSelectProvider}
      />

      {/* Provider List (collapsed) */}
      <div className="border-t border-zinc-800 bg-zinc-900/50 p-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {Object.values(providerRegistry).map((provider) => {
            const state = browserStates.find((s) => s.providerId === provider.id);
            const isOpen = state?.isVisible || false;

            return (
              <button
                type="button"
                key={provider.id}
                onClick={() => (isOpen ? handleSelectProvider(provider.id) : handleOpenProvider(provider.id))}
                disabled={loading === provider.id}
                className={`
                  flex items-center gap-2 px-2 py-1 rounded-sm text-[10px] font-medium whitespace-nowrap transition-colors
                  ${
                    isOpen
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }
                  disabled:opacity-50
                `}
              >
                <span className="w-4 h-4 bg-zinc-700 rounded flex items-center justify-center text-[8px] font-bold">
                  {provider.name[0]}
                </span>
                {provider.name}
                {loading === provider.id && <span className="animate-pulse">...</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
