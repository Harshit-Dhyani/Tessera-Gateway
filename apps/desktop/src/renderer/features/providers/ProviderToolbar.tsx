import { Check, ChevronLeft, ChevronRight, Copy, ExternalLink, LogIn, RotateCw } from 'lucide-react';
import { useState } from 'react';
import type { ProviderBrowserState } from '../../types/ipc';

interface ProviderToolbarProps {
  activeProvider: ProviderBrowserState | null;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onOpenExternal: () => void;
  onLogin: () => void;
}

export function ProviderToolbar({
  activeProvider,
  onBack,
  onForward,
  onReload,
  onOpenExternal,
  onLogin,
}: ProviderToolbarProps) {
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    if (activeProvider?.currentUrl) {
      await navigator.clipboard.writeText(activeProvider.currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!activeProvider) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border-b border-zinc-800 text-zinc-500 text-xs">
        Select a provider to start browsing
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border-b border-zinc-800">
      {/* Navigation Controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onBack}
          disabled={!activeProvider.canGoBack}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Back"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onForward}
          disabled={!activeProvider.canGoForward}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Forward"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onReload}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
          title="Reload"
        >
          <RotateCw className={`w-4 h-4 ${activeProvider.loadState === 'loading' ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* URL Bar */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-sm min-w-0">
          {activeProvider.loadState === 'loading' && (
            <div className="w-3 h-3 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin flex-shrink-0" />
          )}
          <input
            type="text"
            value={activeProvider.currentUrl || activeProvider.allowedDomain}
            readOnly
            className="flex-1 bg-transparent text-zinc-400 text-xs truncate outline-none"
            title={activeProvider.currentUrl || activeProvider.allowedDomain}
          />
          <button
            type="button"
            onClick={copyUrl}
            className="p-1 text-zinc-600 hover:text-zinc-400 transition-colors flex-shrink-0"
            title="Copy URL"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenExternal}
          className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
          title="Open in Browser"
        >
          <ExternalLink className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onLogin}
          className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
          title="Login / Re-authenticate"
        >
          <LogIn className="w-4 h-4" />
        </button>

        {/* Login Status Badge */}
        <div
          className={`px-2 py-0.5 text-[10px] font-medium rounded-sm ${
            activeProvider.isLoggedIn ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-500'
          }`}
        >
          {activeProvider.isLoggedIn ? 'LOGGED IN' : 'NOT LOGGED IN'}
        </div>
      </div>
    </div>
  );
}
