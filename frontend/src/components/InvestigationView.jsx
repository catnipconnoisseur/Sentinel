/**
 * InvestigationView — The main investigation page for a single machine.
 *
 * Layout:
 * - Machine header with status
 * - Query input
 * - Two-column: Telemetry + History | Reasoning Graph
 * - Evidence drawer (slide-out)
 * - Recommendation panel
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useInvestigation } from '../hooks/useInvestigation';
import QueryInput from './QueryInput';
import TelemetryChart from './TelemetryChart';
import ReasoningGraph from './ReasoningGraph';
import EvidenceDrawer from './EvidenceDrawer';

const statusConfig = {
  healthy: { label: 'Operational', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  warning: { label: 'Warning', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

export default function InvestigationView() {
  const { machineId } = useParams();
  const id = parseInt(machineId, 10);

  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);

  const { result, loading: investigating, error: investigationError, investigate } = useInvestigation(id);

  useEffect(() => {
    setLoading(true);
    api.getMachine(id)
      .then(setMachine)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="investigating-pulse">
          <div className="dot" /><div className="dot" /><div className="dot" />
          <span className="ml-3 text-[var(--text-muted)]">Loading machine data...</span>
        </div>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--text-muted)]">Machine {machineId} not found.</p>
        <Link to="/" className="text-indigo-400 text-sm mt-2 inline-block">← Back to Dashboard</Link>
      </div>
    );
  }

  const status = statusConfig[machine.status] || statusConfig.healthy;

  return (
    <div className="fade-in-up">
      {/* ─── Breadcrumb + Header ─────────────────────── */}
      <div className="mb-6">
        <Link to="/" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors no-underline">
          ← Back to Dashboard
        </Link>
        <div className="flex items-center gap-4 mt-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold ${status.bg} ${status.color} border ${status.border}`}>
            {machine.machine_id}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Machine {machine.machine_id}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-[var(--text-secondary)]">{machine.model.toUpperCase()}</span>
              <span className="text-[var(--text-muted)]">·</span>
              <span className="text-sm text-[var(--text-muted)]">{machine.age} years old</span>
              <span className="text-[var(--text-muted)]">·</span>
              <span className={`text-sm font-medium ${status.color}`}>
                <span className={`status-dot ${machine.status} mr-1.5`} />
                {status.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Query Input ─────────────────────────────── */}
      <div className="mb-8">
        <QueryInput onSubmit={investigate} loading={investigating} />
      </div>

      {/* ─── Investigation Loading State ─────────────── */}
      {investigating && (
        <div className="glass-card p-8 mb-6 text-center">
          <div className="investigating-pulse justify-center mb-4">
            <div className="dot" /><div className="dot" /><div className="dot" />
          </div>
          <p className="text-[var(--text-primary)] font-medium">Sentinel is investigating...</p>
          <p className="text-xs text-[var(--text-muted)] mt-2">Retrieving evidence from telemetry, logs, maintenance records, and manuals</p>
        </div>
      )}

      {/* ─── Investigation Error ──────────────────────── */}
      {investigationError && (
        <div className="glass-card p-4 mb-6 border-red-500/30">
          <p className="text-red-400 text-sm">⚠️ Investigation failed: {investigationError}</p>
        </div>
      )}

      {/* ─── Investigation Result ─────────────────────── */}
      {result && (
        <div className="space-y-6 mb-8 fade-in-up">
          {/* Summary */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🔍</span>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Investigation Summary</h3>
              <span className="ml-auto text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-medium">
                {Math.round(result.confidence * 100)}% confidence
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{result.summary}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">Root cause:</span>
              <span className="text-xs font-medium text-red-400">{result.root_cause}</span>
            </div>
          </div>

          {/* Reasoning Graph */}
          <ReasoningGraph investigation={result} onNodeClick={setSelectedNode} />

          {/* Recommendation */}
          <div className="glass-card p-6 border-emerald-500/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">✅</span>
              <h3 className="text-sm font-semibold text-emerald-400">Recommendation</h3>
            </div>
            <div className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
              {result.recommendation}
            </div>
          </div>

          {/* Sources */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[var(--text-muted)]">Sources consulted:</span>
            {result.sources_consulted.map((source) => (
              <span key={source} className="text-xs px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                {source}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─── Machine Data (always visible) ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Telemetry */}
        <TelemetryChart data={machine.recent_telemetry} />

        {/* History */}
        <div className="space-y-4">
          {/* Errors */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              ⚠️ Recent Errors
            </h3>
            {machine.recent_errors.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">No recent errors</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {machine.recent_errors.slice(0, 10).map((e, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[var(--bg-primary)]">
                    <span className="text-amber-400 font-mono">{e.error_id}</span>
                    <span className="text-[var(--text-muted)]">{new Date(e.datetime).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Maintenance */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              🔧 Recent Maintenance
            </h3>
            {machine.recent_maintenance.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">No recent maintenance</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {machine.recent_maintenance.slice(0, 10).map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[var(--bg-primary)]">
                    <span className="text-cyan-400 font-mono">{m.comp}</span>
                    <span className="text-[var(--text-muted)]">{new Date(m.datetime).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Failures */}
          {machine.recent_failures.length > 0 && (
            <div className="glass-card p-5 border-red-500/20">
              <h3 className="text-sm font-semibold text-red-400 mb-3">
                💥 Recent Failures
              </h3>
              <div className="space-y-2">
                {machine.recent_failures.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-red-500/5">
                    <span className="text-red-400 font-mono font-medium">{f.failure}</span>
                    <span className="text-[var(--text-muted)]">{new Date(f.datetime).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Evidence Drawer ──────────────────────────── */}
      <EvidenceDrawer node={selectedNode} onClose={() => setSelectedNode(null)} />

      {/* Overlay when drawer is open */}
      {selectedNode && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
