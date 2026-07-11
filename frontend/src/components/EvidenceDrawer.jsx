/**
 * EvidenceDrawer — Slide-out evidence panel.
 * Redesigned: cleaner structure, better source grouping, improved empty state.
 */

import { useMemo } from 'react';

const SOURCE_CONFIG = {
  telemetry:       { label: 'Telemetry',           icon: '📡', color: 'var(--info)',    badgeClass: 'badge-accent' },
  error_log:       { label: 'Error Log',           icon: '⚠',  color: 'var(--warning)', badgeClass: 'badge-warning' },
  maintenance:     { label: 'Maintenance Log',     icon: '⚙',  color: 'var(--info)',    badgeClass: 'badge-neutral' },
  manual:          { label: 'Technical Manual',    icon: '📖', color: 'var(--accent)',  badgeClass: 'badge-accent' },
  sop:             { label: 'SOP',                 icon: '📋', color: 'var(--violet)',  badgeClass: 'badge-neutral' },
  historical_case: { label: 'Historical Case',     icon: '🗂',  color: 'var(--danger)',  badgeClass: 'badge-critical' },
  failure_history: { label: 'Failure History',     icon: '💥', color: 'var(--danger)',  badgeClass: 'badge-critical' },
};

const NODE_TYPE_CONFIG = {
  root_cause:          { label: 'Root Cause',          badgeClass: 'badge-critical' },
  symptom:             { label: 'Symptom',              badgeClass: 'badge-warning' },
  contributing_factor: { label: 'Contributing Factor',  badgeClass: 'badge-neutral' },
  evidence:            { label: 'Evidence',             badgeClass: 'badge-accent' },
  recommendation:      { label: 'Recommendation',       badgeClass: 'badge-healthy' },
};

const CATEGORIES = [
  'telemetry', 'error_log', 'maintenance',
  'manual', 'sop', 'historical_case', 'failure_history',
];

export default function EvidenceDrawer({ node, onClose }) {
  const groupedEvidence = useMemo(() => {
    if (!node?.evidence) return {};
    const groups = {};
    node.evidence.forEach((item) => {
      const src = item.source || 'other';
      if (!groups[src]) groups[src] = [];
      groups[src].push(item);
    });
    return groups;
  }, [node?.evidence]);

  if (!node) return null;

  const typeCfg = NODE_TYPE_CONFIG[node.type] || { label: node.type, badgeClass: 'badge-neutral' };
  const totalEvidenceCount = node.evidence?.length || 0;
  const confidencePct = Math.round((node.confidence || 0) * 100);

  return (
    <div className={`evidence-drawer ${node ? 'open' : ''}`}>
      {/* ─── Drawer Header ────────────────────────────── */}
      <div style={{
        padding: '20px 24px 0',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: 20,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: 8 }}>
              <span className={`badge ${typeCfg.badgeClass}`}>{typeCfg.label}</span>
            </div>
            <h2 style={{
              fontSize: 'var(--text-md)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
              wordBreak: 'break-word',
            }}>
              {node.label}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ flexShrink: 0, marginTop: 2 }}
            aria-label="Close evidence panel"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="t-body" style={{ marginBottom: 16 }}>{node.description}</p>

        {/* Confidence bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="t-caption">Confidence score</span>
            <span style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              color: confidencePct >= 80 ? 'var(--success)' : confidencePct >= 60 ? 'var(--warning)' : 'var(--danger)',
              fontFamily: 'var(--font-mono)',
            }}>
              {confidencePct}%
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--bg-surface)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${confidencePct}%`,
              background: confidencePct >= 80
                ? 'linear-gradient(90deg, var(--success), #34d399)'
                : confidencePct >= 60
                  ? 'linear-gradient(90deg, var(--warning), #fbbf24)'
                  : 'linear-gradient(90deg, var(--danger), #f87171)',
              borderRadius: 99,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      </div>

      {/* ─── Evidence Content ──────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {totalEvidenceCount === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px',
            textAlign: 'center',
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              fontSize: 18,
            }}>
              🔍
            </div>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              No direct evidence
            </p>
            <p className="t-caption">
              This node was inferred from surrounding context rather than a direct source.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="t-label">Supporting Evidence</span>
              <span className="badge badge-neutral">{totalEvidenceCount}</span>
            </div>

            {CATEGORIES.map((catKey) => {
              const items = groupedEvidence[catKey];
              if (!items?.length) return null;
              const src = SOURCE_CONFIG[catKey] || { label: catKey, icon: '📄', badgeClass: 'badge-neutral' };

              return (
                <div key={catKey}>
                  {/* Category header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 10,
                    paddingBottom: 8,
                    borderBottom: '1px solid var(--border-subtle)',
                  }}>
                    <span style={{ fontSize: 13 }}>{src.icon}</span>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {src.label}
                    </span>
                    <span className={`badge ${src.badgeClass}`} style={{ marginLeft: 'auto' }}>{items.length}</span>
                  </div>

                  {/* Evidence items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: 14,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        {/* Document title + section */}
                        {(item.document_title || item.section) && (
                          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                            {item.document_title && (
                              <div style={{
                                fontSize: 'var(--text-xs)',
                                fontWeight: 600,
                                color: 'var(--accent-hover)',
                                marginBottom: 3,
                              }}>
                                {item.document_title}
                              </div>
                            )}
                            {item.section && (
                              <div className="t-caption" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span>§</span>
                                <span>{item.section}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Excerpt or description */}
                        <p style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-line',
                        }}>
                          {item.excerpt || item.description}
                        </p>

                        {/* Timestamp */}
                        {item.timestamp && (
                          <div className="t-caption" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 6v6l4 2" strokeLinecap="round" />
                            </svg>
                            {new Date(item.timestamp).toLocaleString()}
                          </div>
                        )}

                        {/* Metadata badges */}
                        {item.metadata && Object.keys(item.metadata).length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {item.metadata.component && item.metadata.component !== 'None' && (
                              <span className="badge badge-accent" style={{ fontSize: 10 }}>
                                ⚙ {item.metadata.component}
                              </span>
                            )}
                            {item.metadata.failure_mode && item.metadata.failure_mode !== 'None' && (
                              <span className="badge badge-critical" style={{ fontSize: 10 }}>
                                ⚠ {item.metadata.failure_mode}
                              </span>
                            )}
                            {item.metadata.sensor && item.metadata.sensor !== 'None' && (
                              <span className="badge badge-warning" style={{ fontSize: 10 }}>
                                📡 {item.metadata.sensor}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
