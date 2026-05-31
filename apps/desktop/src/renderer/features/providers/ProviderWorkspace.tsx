import { Zap } from 'lucide-react';
import { type KeyboardEvent, useCallback, useEffect, useRef } from 'react';
import type { LayoutMode } from '../../types/ipc';

interface ProviderWorkspaceProps {
  layout: LayoutMode;
  openProviders: string[];
  activeProviderId: string | null;
  onSelectProvider: (id: string) => void;
}

export function ProviderWorkspace({
  layout,
  openProviders,
  activeProviderId,
  onSelectProvider,
}: ProviderWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevBoundsRef = useRef<string>('');
  const rafRef = useRef<number | null>(null);

  const sendBounds = useCallback(() => {
    if (!containerRef.current || !window.gateway) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const boundsStr = `${rect.left},${rect.top},${rect.width},${rect.height}`;

    if (boundsStr !== prevBoundsRef.current) {
      prevBoundsRef.current = boundsStr;
      window.gateway.setProviderWorkspaceBounds({
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    sendBounds();

    const resizeObserver = new ResizeObserver(() => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        sendBounds();
      });
    });

    resizeObserver.observe(container);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [sendBounds]);

  if (openProviders.length === 0) {
    return (
      <div ref={containerRef} className="flex-1 flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <Zap className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-zinc-500 font-medium mb-2">No Provider Selected</h3>
          <p className="text-zinc-600 text-sm mb-4">Select a provider from the tabs above to start browsing</p>
          <div className="flex items-center justify-center gap-4 text-xs text-zinc-600">
            <span>1 provider → Single</span>
            <span>2 providers → Split</span>
            <span>3-4 providers → Grid</span>
          </div>
        </div>
      </div>
    );
  }

  const getLayoutClass = () => {
    switch (layout) {
      case 'split':
        return 'grid-cols-2';
      case 'grid':
        return 'grid-cols-2 grid-rows-2';
      default:
        return 'grid-cols-1';
    }
  };

  const handlePaneKeyDown = (event: KeyboardEvent<HTMLDivElement>, providerId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectProvider(providerId);
    }
  };

  return (
    <div ref={containerRef} className={`flex-1 grid ${getLayoutClass()} gap-1 p-1 bg-zinc-950 overflow-hidden`}>
      {openProviders.slice(0, layout === 'grid' ? 4 : layout === 'split' ? 2 : 1).map((providerId) => (
        <div
          key={providerId}
          role="button"
          tabIndex={0}
          onClick={() => onSelectProvider(providerId)}
          onKeyDown={(event) => handlePaneKeyDown(event, providerId)}
          className={`
            relative bg-zinc-900 border rounded-sm cursor-pointer transition-all
            ${
              activeProviderId === providerId
                ? 'border-amber-500/50 ring-1 ring-amber-500/20'
                : 'border-zinc-800 hover:border-zinc-700'
            }
          `}
        >
          {layout !== 'single' && (
            <div className="absolute top-0 left-0 right-0 px-2 py-1 bg-zinc-900/90 border-b border-zinc-800 text-[10px] font-medium text-zinc-400 uppercase tracking-wider truncate z-10">
              {providerId}
            </div>
          )}

          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <span className="text-sm">Provider: {providerId}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
