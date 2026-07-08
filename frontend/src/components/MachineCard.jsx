/**
 * MachineCard — Individual machine card for the dashboard grid.
 * Shows machine ID, model, age, health status with animated indicator.
 */

import { Link } from 'react-router-dom';

const statusLabels = {
  healthy: 'Operational',
  warning: 'Warning',
  critical: 'Critical',
};

const statusColors = {
  healthy: 'text-emerald-400',
  warning: 'text-amber-400',
  critical: 'text-red-400',
};

export default function MachineCard({ machine }) {
  const { machine_id, model, age, status, error_count_24h, last_error, last_failure } = machine;

  return (
    <Link
      to={`/machine/${machine_id}`}
      className="no-underline"
    >
      <div className="glass-card p-5 cursor-pointer group">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold
              ${status === 'critical' ? 'bg-red-500/20 text-red-400' :
                status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                'bg-emerald-500/20 text-emerald-400'}`}
            >
              {machine_id}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Machine {machine_id}</p>
              <p className="text-xs text-[var(--text-muted)]">{model.toUpperCase()}</p>
            </div>
          </div>
          <span className={`status-dot ${status}`} />
        </div>

        {/* Status */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-medium ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {age}yr old
          </span>
        </div>

        {/* Metrics */}
        <div className="border-t border-[var(--border-subtle)] pt-3 mt-1">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-muted)]">Errors (24h)</span>
            <span className={error_count_24h > 0 ? 'text-amber-400 font-medium' : 'text-[var(--text-secondary)]'}>
              {error_count_24h}
            </span>
          </div>
          {last_failure && (
            <div className="flex justify-between text-xs mt-1.5">
              <span className="text-[var(--text-muted)]">Last Failure</span>
              <span className="text-red-400 font-medium">{last_failure}</span>
            </div>
          )}
        </div>

        {/* Hover hint */}
        <div className="mt-3 text-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-indigo-400">Click to investigate →</span>
        </div>
      </div>
    </Link>
  );
}
