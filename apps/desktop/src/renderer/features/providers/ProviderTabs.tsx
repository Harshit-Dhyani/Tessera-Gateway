import { providerRegistry } from '@tessera-gateway/core/providers/registry';
import { Settings } from 'lucide-react';
import type { ProviderBrowserState } from '../../types/ipc';

interface ProviderTabsProps {
  activeProviderId: string | null;
  browserStates: ProviderBrowserState[];
  onSelectProvider: (id: string) => void;
  onOpenSettings: () => void;
}

export function ProviderTabs({ activeProviderId, browserStates, onSelectProvider, onOpenSettings }: ProviderTabsProps) {
  const getState = (id: string) => browserStates.find((s) => s.providerId === id);
  const isOpen = (id: string) => getState(id)?.isOpen || false;

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-zinc-900 border-b border-zinc-800">
      {Object.values(providerRegistry).map((provider) => {
        const state = getState(provider.id);
        const isActive = activeProviderId === provider.id;
        const isProviderOpen = isOpen(provider.id);

        return (
          <button
            type="button"
            key={provider.id}
            onClick={() => onSelectProvider(provider.id)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors
              ${
                isActive
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                  : isProviderOpen
                    ? 'bg-zinc-900/50 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50'
                    : 'text-zinc-600 hover:text-zinc-400'
              }
            `}
          >
            <span className="w-5 h-5 rounded bg-zinc-700 flex items-center justify-center text-[10px] font-bold">
              {provider.name[0]}
            </span>
            <span>{provider.name}</span>
            {isProviderOpen && (
              <span
                className={`w-2 h-2 rounded-full ${state?.isExecuting || state?.loadState === 'loading' ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`}
              />
            )}
          </button>
        );
      })}

      <div className="flex-1" />

      <button
        type="button"
        onClick={onOpenSettings}
        className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-sm transition-colors"
        title="Provider Settings"
      >
        <Settings className="w-4 h-4" />
      </button>
    </div>
  );
}
