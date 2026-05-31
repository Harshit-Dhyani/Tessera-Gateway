import { FileText, RotateCw, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function LogsScreen() {
  const { logs, setLogs } = useAppStore();

  const refreshLogs = async () => {
    if (window.gateway) {
      setLogs(await window.gateway.getLogs());
    }
  };

  const clearLogs = async () => {
    if (window.gateway) {
      await window.gateway.clearLogs();
      await refreshLogs();
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <h1 className="text-lg font-bold text-zinc-100 tracking-tight">SYSTEM_LOGS</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={refreshLogs}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
            title="Refresh logs"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={clearLogs}
            className="p-1.5 text-zinc-500 hover:text-red-300 hover:bg-zinc-800 rounded transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-zinc-900/40 border border-zinc-800 rounded-sm overflow-hidden min-h-[300px]">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText className="w-8 h-8 text-zinc-700 mb-3" />
            <p className="text-zinc-500 text-sm">NO_LOGS_RECORDED</p>
            <p className="text-zinc-700 text-xs mt-1">Request logs will appear after first API call</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="bg-zinc-900/80 text-zinc-500 border-b border-zinc-800">
                  <th className="text-left p-3 font-medium">TIMESTAMP</th>
                  <th className="text-left p-3 font-medium">PROVIDER</th>
                  <th className="text-left p-3 font-medium">MODEL</th>
                  <th className="text-left p-3 font-medium">LATENCY</th>
                  <th className="text-left p-3 font-medium">RESULT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {logs.map((log) => (
                  <tr key={log.id} className="text-zinc-400 hover:bg-zinc-800/30">
                    <td className="p-3">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-3">{log.provider}</td>
                    <td className="p-3 text-zinc-500">{log.modelAlias}</td>
                    <td className="p-3">{log.latencyMs}ms</td>
                    <td className="p-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          log.result === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : log.result === 'error'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {log.result.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
