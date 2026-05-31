import { providerRegistry } from '@tessera-gateway/core/providers/registry';
import { Activity, Box, Server, Zap } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'warn' | 'stubbed';
  label?: string;
}

function StatusBadge({ status, label }: StatusBadgeProps) {
  const styles = {
    online: 'text-status-healthy bg-status-healthy/10 border-status-healthy/30',
    offline: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/30',
    warn: 'text-status-warning bg-status-warning/10 border-status-warning/30',
    stubbed: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  };
  const defaultLabels = { online: 'ONLINE', offline: 'OFFLINE', warn: 'WARN', stubbed: 'STUBBED' };
  return (
    <span
      className={`px-2 py-0.5 text-[10px] font-bold border rounded ${styles[status]}`}
      role="status"
      aria-label={label || defaultLabels[status]}
    >
      {label || defaultLabels[status]}
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: typeof Activity;
  status?: 'online' | 'offline' | 'warn';
}

function StatCard({ label, value, subtext, icon: Icon, status }: StatCardProps) {
  return (
    <div
      className="group relative bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-md p-4 transition-all duration-200 hover:-translate-y-0.5"
      role="region"
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-zinc-500 text-[10px] font-bold tracking-wider uppercase">{label}</span>
        <Icon
          className={`w-4 h-4 ${status === 'online' ? 'text-status-healthy' : 'text-zinc-600'}`}
          aria-hidden="true"
        />
      </div>
      <div className="text-xl font-bold text-zinc-100 tracking-tight">{value}</div>
      {subtext && <div className="text-zinc-600 text-[10px] mt-1 font-mono">{subtext}</div>}
      {status && (
        <div className="absolute top-3 right-3">
          <StatusBadge status={status} label={status.toUpperCase()} />
        </div>
      )}
    </div>
  );
}

interface ProviderRowProps {
  name: string;
  status: string;
  capabilities: string[];
}

function ProviderRow({ name, status, capabilities }: ProviderRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
      <div className="flex items-center gap-3">
        <Box className="w-4 h-4 text-zinc-600" aria-hidden="true" />
        <span className="text-zinc-300">{name}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex gap-1.5">
          {capabilities.map((c) => (
            <span key={c} className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-[9px] rounded font-mono">
              {c}
            </span>
          ))}
        </div>
        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/30 rounded">
          {status.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

export default function DashboardScreen() {
  const { gatewayHealth, mcpHealth } = useAppStore();
  const gatewayRunning = gatewayHealth?.running ?? false;
  const mcpRunning = mcpHealth?.running ?? false;

  return (
    <div className="space-y-6" role="region" aria-label="Dashboard">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"
          role="img"
          aria-label="System status indicator"
        />
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight">SYSTEM_DASHBOARD</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Gateway"
          value="127.0.0.1:7860"
          subtext="HTTP API"
          icon={Activity}
          status={gatewayRunning ? 'online' : 'offline'}
        />
        <StatCard
          label="MCP Server"
          value="127.0.0.1:7861"
          subtext="Protocol"
          icon={Server}
          status={mcpRunning ? 'online' : 'offline'}
        />
        <StatCard
          label="Providers"
          value={Object.keys(providerRegistry).length.toString()}
          subtext="Configured"
          icon={Zap}
        />
      </div>

      {/* Provider Matrix */}
      <div
        className="bg-zinc-900/40 border border-zinc-800 rounded-lg overflow-hidden"
        role="region"
        aria-label="Provider status matrix"
      >
        <div className="px-4 py-3 bg-zinc-900/80 border-b border-zinc-800 flex items-center gap-2">
          <Box className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <span className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">Provider Matrix</span>
        </div>
        <div className="p-2">
          {Object.values(providerRegistry).map((provider) => (
            <ProviderRow
              key={provider.id}
              name={provider.name}
              status={provider.status}
              capabilities={[
                ...(provider.capabilities.streaming ? ['STREAM'] : []),
                ...(provider.capabilities.vision ? ['VISION'] : []),
                ...(provider.capabilities.codeExecution ? ['CODE'] : []),
              ]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
