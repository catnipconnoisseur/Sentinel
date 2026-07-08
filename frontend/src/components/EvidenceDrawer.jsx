/**
 * EvidenceDrawer — Slide-out panel showing evidence for a selected reasoning node.
 * Opens when a graph node is clicked. Shows evidence items with source icons.
 */

const sourceIcons = {
  telemetry: '📊',
  error_log: '⚠️',
  maintenance: '🔧',
  manual: '📖',
  failure_history: '💥',
};

const sourceLabels = {
  telemetry: 'Telemetry Data',
  error_log: 'Error Log',
  maintenance: 'Maintenance Record',
  manual: 'Machine Manual',
  failure_history: 'Failure History',
};

const typeColors = {
  root_cause: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
  symptom: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  contributing_factor: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  evidence: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  recommendation: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
};

export default function EvidenceDrawer({ node, onClose }) {
  if (!node) return null;

  const colors = typeColors[node.type] || typeColors.evidence;

  return (
    <div className={`evidence-drawer ${node ? 'open' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium mb-2 ${colors.bg} ${colors.text} border ${colors.border}`}>
            {node.type?.replace('_', ' ')}
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            {node.label}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
        {node.description}
      </p>

      {/* Confidence */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[var(--text-muted)]">Confidence</span>
          <span className="text-xs font-medium text-[var(--text-primary)]">
            {Math.round(node.confidence * 100)}%
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[var(--bg-primary)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${node.confidence * 100}%` }}
          />
        </div>
      </div>

      {/* Evidence Items */}
      {node.evidence && node.evidence.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Supporting Evidence
          </h3>
          <div className="space-y-3">
            {node.evidence.map((item, index) => (
              <div
                key={index}
                className="glass-card p-4 hover:transform-none"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{sourceIcons[item.source] || '📋'}</span>
                  <span className="text-xs font-medium text-indigo-400">
                    {sourceLabels[item.source] || item.source}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {item.description}
                </p>
                {item.timestamp && (
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    🕐 {new Date(item.timestamp).toLocaleString()}
                  </p>
                )}
                {item.data && (
                  <div className="mt-2 p-2 rounded-lg bg-[var(--bg-primary)] font-mono text-xs text-[var(--text-muted)]">
                    {Object.entries(item.data).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-indigo-400">{k}</span>: {String(v)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(!node.evidence || node.evidence.length === 0) && (
        <div className="text-sm text-[var(--text-muted)] italic">
          No direct evidence items for this node.
        </div>
      )}
    </div>
  );
}
