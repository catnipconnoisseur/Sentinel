/**
 * EvidenceDrawer — Slide-out panel showing evidence for a selected reasoning node.
 * Opens when a graph node is clicked. Shows evidence items with source icons.
 */

import { useMemo } from 'react';

const sourceIcons = {
  telemetry: '📊',
  error_log: '⚠️',
  maintenance: '🔧',
  manual: '📖',
  sop: '📋',
  historical_case: '💥',
  failure_history: '💥',
};

const sourceLabels = {
  telemetry: 'Telemetry Observation',
  error_log: 'Error Log Entry',
  maintenance: 'Maintenance Log',
  manual: 'Technical Manual Guidance',
  sop: 'Standard Operating Procedure (SOP)',
  historical_case: 'Historical Precedent / Case',
  failure_history: 'Failure History Log',
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

  // Group evidence by source type
  const groupedEvidence = useMemo(() => {
    if (!node.evidence) return {};
    const groups = {};
    node.evidence.forEach((item) => {
      const src = item.source || 'other';
      if (!groups[src]) groups[src] = [];
      groups[src].push(item);
    });
    return groups;
  }, [node.evidence]);

  const categories = [
    { key: 'telemetry', label: 'Telemetry Observations', icon: '📊' },
    { key: 'error_log', label: 'Error Log Entries', icon: '⚠️' },
    { key: 'maintenance', label: 'Maintenance Records', icon: '🔧' },
    { key: 'manual', label: 'Technical Manuals', icon: '📖' },
    { key: 'sop', label: 'Standard Operating Procedures (SOP)', icon: '📋' },
    { key: 'historical_case', label: 'Historical Precedents & Cases', icon: '💥' },
    { key: 'failure_history', label: 'Failure History Logs', icon: '💥' }
  ];

  const totalEvidenceCount = node.evidence?.length || 0;

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

      {/* Grouped Evidence Display */}
      {totalEvidenceCount > 0 ? (
        <div className="space-y-6">
          <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Supporting Evidence Trace
          </h3>
          
          {categories.map((cat) => {
            const items = groupedEvidence[cat.key];
            if (!items || items.length === 0) return null;

            return (
              <div key={cat.key} className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] px-1">
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className="text-[var(--text-muted)]">({items.length})</span>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => {
                    const hasDocInfo = item.document_title || item.section;
                    const metaInfo = item.metadata || {};
                    
                    return (
                      <div key={index} className="glass-card p-4 hover:transform-none space-y-2">
                        {/* Title & Section for Manuals/SOPs/Cases */}
                        {hasDocInfo && (
                          <div className="border-b border-[var(--border-subtle)] pb-2 mb-2">
                            <div className="text-xs font-semibold text-indigo-400 leading-tight">
                              {item.document_title || 'Unknown Source'}
                            </div>
                            {item.section && (
                              <div className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">
                                📌 {item.section}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Content Excerpt / Description */}
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                          {item.excerpt || item.description}
                        </p>

                        {/* Timestamp */}
                        {item.timestamp && (
                          <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-1">
                            <span>🕐</span>
                            <span>{new Date(item.timestamp).toLocaleString()}</span>
                          </div>
                        )}

                        {/* Raw Data (Telemetry/Metrics) */}
                        {item.data && Object.keys(item.data).length > 0 && (
                          <div className="mt-2 p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-muted)] grid grid-cols-2 gap-2">
                            {Object.entries(item.data).map(([k, v]) => (
                              <div key={k} className="flex justify-between border-b border-[var(--border-subtle)] pb-1 last:border-b-0">
                                <span className="text-indigo-400 font-semibold">{k}</span>
                                <span>{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Metadata Badges (Component, Failure Mode, Sensor) */}
                        {Object.keys(metaInfo).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2 pt-1">
                            {metaInfo.component && metaInfo.component !== 'None' && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                                ⚙️ {metaInfo.component}
                              </span>
                            )}
                            {metaInfo.failure_mode && metaInfo.failure_mode !== 'None' && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                                ⚠️ {metaInfo.failure_mode}
                              </span>
                            )}
                            {metaInfo.sensor && metaInfo.sensor !== 'None' && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                                🔌 {metaInfo.sensor}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-[var(--text-muted)] italic text-center py-8 border border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-2">
          <span>⚠️</span>
          <span>Insufficient supporting evidence available.</span>
        </div>
      )}
    </div>
  );
}
