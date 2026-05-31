import { RotateCw, Settings } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function SettingsScreen() {
  const { settings, setSettings } = useAppStore();

  const refreshSettings = async () => {
    if (window.gateway) {
      setSettings(await window.gateway.getSettings());
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-amber-400" />
          <h1 className="text-lg font-bold text-zinc-100 tracking-tight">CONFIGURATION</h1>
        </div>
        <button
          type="button"
          onClick={refreshSettings}
          className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
          title="Refresh configuration"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-zinc-900/40 border border-zinc-800 rounded-sm p-4">
        <pre className="text-xs font-mono text-zinc-400 whitespace-pre-wrap">
          {settings ? JSON.stringify(settings, null, 2) : 'Loading configuration...'}
        </pre>
      </div>
    </div>
  );
}
