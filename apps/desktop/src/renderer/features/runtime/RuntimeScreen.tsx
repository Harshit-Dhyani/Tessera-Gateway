import { RotateCw, Shield, Terminal } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'warn';
}

function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    online: 'text-status-healthy bg-status-healthy/10 border-status-healthy/30',
    offline: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/30',
    warn: 'text-status-warning bg-status-warning/10 border-status-warning/30',
  };
  const labels = { online: 'ONLINE', offline: 'OFFLINE', warn: 'WARN' };
  return (
    <span
      className={`px-2 py-0.5 text-[10px] font-bold border rounded ${styles[status]}`}
      role="status"
      aria-label={labels[status]}
    >
      {labels[status]}
    </span>
  );
}

export default function RuntimeScreen() {
  const { gatewayHealth, mcpHealth, appVersion, setGatewayHealth, setMcpHealth } = useAppStore();

  const refreshRuntime = async () => {
    if (window.gateway) {
      setGatewayHealth(await window.gateway.getGatewayHealth());
      setMcpHealth(await window.gateway.getMcpHealth());
    }
  };

  return (
    <div className="space-y-6" role="region" aria-label="Runtime Status">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-amber-400" aria-hidden="true" />
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">RUNTIME_STATUS</h1>
        </div>
        <button
          type="button"
          onClick={refreshRuntime}
          className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
          title="Refresh runtime status"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Server Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gateway Server */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4" role="region" aria-label="Gateway Server">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">Gateway</span>
            <StatusBadge status={gatewayHealth?.running ? 'online' : 'offline'} />
          </div>
          <dl className="space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <dt className="text-zinc-500">HOST</dt>
              <dd className="text-zinc-300">127.0.0.1</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">PORT</dt>
              <dd className="text-zinc-300">7860</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">STATUS</dt>
              <dd className={gatewayHealth?.running ? 'text-status-healthy' : 'text-zinc-500'}>
                {gatewayHealth?.running ? 'ACTIVE' : 'INACTIVE'}
              </dd>
            </div>
          </dl>
        </div>

        {/* MCP Server */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4" role="region" aria-label="MCP Server">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">MCP</span>
            <StatusBadge status={mcpHealth?.running ? 'online' : 'offline'} />
          </div>
          <dl className="space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <dt className="text-zinc-500">HOST</dt>
              <dd className="text-zinc-300">{mcpHealth?.host || '127.0.0.1'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">PORT</dt>
              <dd className="text-zinc-300">{mcpHealth?.port || 7861}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">STATUS</dt>
              <dd className={mcpHealth?.running ? 'text-status-healthy' : 'text-zinc-500'}>
                {mcpHealth?.running ? 'ACTIVE' : 'MANUAL_START'}
              </dd>
            </div>
            {mcpHealth?.error && (
              <div className="flex flex-col">
                <dt className="text-zinc-500">NOTE</dt>
                <dd className="text-zinc-400 text-[10px]">{mcpHealth.error}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Version Info */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4" role="region" aria-label="Build version">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-zinc-600" aria-hidden="true" />
            <span className="text-zinc-500 text-xs uppercase tracking-wider">Build Version</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-zinc-300">{appVersion || '0.0.1'}</span>
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/30 rounded">
              SCAFFOLD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
