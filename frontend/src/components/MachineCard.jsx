/**
 * MachineCard — Individual machine card for the dashboard grid.
 * Redesigned: consistent padding, badge status, cleaner hierarchy.
 */

import { Link } from 'react-router-dom';

const STATUS_CONFIG = {
  healthy:  { label: 'Operational', color: 'var(--success)', badgeClass: 'badge-healthy' },
  warning:  { label: 'Warning',     color: 'var(--warning)', badgeClass: 'badge-warning' },
  critical: { label: 'Critical',    color: 'var(--danger)',  badgeClass: 'badge-critical' },
};

const MODEL_ICONS = {
  model1: 'M',
  model2: 'M',
  model3: 'M',
  model4: 'M',
};

export default function MachineCard({ machine }) {
  const { machine_id, model, age, status, error_count_24h, last_failure } = machine;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.healthy;

  const avatarBg = {
    critical: 'var(--danger-subtle)',
    warning:  'var(--warning-subtle)',
    healthy:  'var(--success-subtle)',
  }[status];

  const avatarColor = cfg.color;

  return (
    <Link to={`/machine/${machine_id}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div
        className="card-interactive"
        style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: avatarBg,
            border: `1px solid ${cfg.color}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 13,
            color: avatarColor,
            flexShrink: 0,
          }}>
            {machine_id}
          </div>
          <span className={`status-dot ${status}`} style={{ marginTop: 4 }} />
        </div>

        {/* Identity */}
        <div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
            Machine {machine_id}
          </div>
          <div className="t-caption" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.3px' }}>
            {model.toUpperCase()}
          </div>
        </div>

        {/* Status badge */}
        <div>
          <span className={`badge ${cfg.badgeClass}`}>
            <span className={`status-dot ${status}`} style={{ width: 5, height: 5 }} />
            {cfg.label}
          </span>
        </div>

        {/* Metrics */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="t-caption">Age</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {age} yr
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="t-caption">Errors (24h)</span>
            <span style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: error_count_24h > 0 ? 'var(--warning)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}>
              {error_count_24h}
            </span>
          </div>
          {last_failure && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="t-caption">Last Failure</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', fontWeight: 500 }}>
                {last_failure}
              </span>
            </div>
          )}
        </div>

        {/* CTA hint */}
        <div style={{
          textAlign: 'center',
          fontSize: 'var(--text-xs)',
          color: 'var(--accent-hover)',
          opacity: 0,
          transition: 'opacity 0.15s ease',
        }}
          className="card-cta"
        >
          Investigate →
        </div>
      </div>
    </Link>
  );
}
