/**
 * InvestigationView — Full machine investigation page.
 * Redesigned: cleaner header, better section hierarchy, polished states.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useInvestigation } from '../hooks/useInvestigation';
import QueryInput from './QueryInput';
import TelemetryChart from './TelemetryChart';
import ReasoningGraph from './ReasoningGraph';
import EvidenceDrawer from './EvidenceDrawer';

const STATUS_CONFIG = {
  healthy:  { label: 'Operational', color: 'var(--success)', badgeClass: 'badge-healthy' },
  warning:  { label: 'Warning',     color: 'var(--warning)', badgeClass: 'badge-warning' },
  critical: { label: 'Critical',    color: 'var(--danger)',  badgeClass: 'badge-critical' },
};

const INVESTIGATION_STEPS = [
  { label: 'Retrieving telemetry data',         icon: '📡' },
  { label: 'Reviewing maintenance history',     icon: '🔧' },
  { label: 'Searching technical documentation', icon: '📖' },
  { label: 'Analyzing historical patterns',     icon: '📊' },
  { label: 'Building causal reasoning graph',   icon: '🧠' },
];

function SectionHeader({ icon, title, badge }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      paddingBottom: 12,
      borderBottom: '1px solid var(--border-subtle)',
      marginBottom: 16,
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span className="t-card-title">{title}</span>
      {badge && (
        <span className="badge badge-neutral" style={{ marginLeft: 'auto' }}>{badge}</span>
      )}
    </div>
  );
}

function DataRow({ label, value, valueColor }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <span className="t-caption">{label}</span>
      <span style={{
        fontSize: 'var(--text-xs)',
        fontWeight: 500,
        color: valueColor || 'var(--text-secondary)',
        fontFamily: 'var(--font-mono)',
      }}>
        {value}
      </span>
    </div>
  );
}

export default function InvestigationView() {
  const { machineId } = useParams();
  const id = parseInt(machineId, 10);

  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const { result, loading: investigating, error: investigationError, investigate, retry, cancel, lastQuestion } =
    useInvestigation(id);

  useEffect(() => {
    if (!investigating) { setLoadingStep(0); return; }
    const iv = setInterval(() => setLoadingStep((p) => (p < INVESTIGATION_STEPS.length - 1 ? p + 1 : p)), 2200);
    return () => clearInterval(iv);
  }, [investigating]);

  useEffect(() => {
    if (!investigating) { setElapsedSeconds(0); return; }
    const iv = setInterval(() => setElapsedSeconds((p) => p + 1), 1000);
    return () => clearInterval(iv);
  }, [investigating]);

  useEffect(() => {
    setLoading(true);
    api.getMachine(id).then(setMachine).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="investigating-pulse">
          <div className="dot" /><div className="dot" /><div className="dot" />
          <span style={{ marginLeft: 12, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            Loading machine data...
          </span>
        </div>
      </div>
    );
  }

  if (!machine) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 'var(--text-md)', color: 'var(--text-secondary)', marginBottom: 12 }}>
          Machine {machineId} not found
        </div>
        <Link to="/" style={{ color: 'var(--accent-hover)', fontSize: 'var(--text-sm)' }}>
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[machine.status] || STATUS_CONFIG.healthy;

  return (
    <div className="fade-in-up">
      {/* ─── Machine Header ───────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 'var(--radius-lg)',
            background: machine.status === 'critical' ? 'var(--danger-subtle)' :
                        machine.status === 'warning'  ? 'var(--warning-subtle)' : 'var(--success-subtle)',
            border: `1px solid ${machine.status === 'critical' ? 'var(--danger-border)' :
                                  machine.status === 'warning'  ? 'var(--warning-border)' : 'var(--success-border)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 700,
            color: statusCfg.color,
            flexShrink: 0,
          }}>
            {machine.machine_id}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <h1 className="t-section-title" style={{ marginBottom: 4 }}>
              Machine {machine.machine_id}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="t-mono" style={{ letterSpacing: '0.5px' }}>
                {machine.model.toUpperCase()}
              </span>
              <span style={{ color: 'var(--border-default)' }}>·</span>
              <span className="t-caption">{machine.age} years in service</span>
              <span style={{ color: 'var(--border-default)' }}>·</span>
              <span className={`badge ${statusCfg.badgeClass}`}>
                <span className={`status-dot ${machine.status}`} style={{ width: 5, height: 5 }} />
                {statusCfg.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Query Input ──────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <QueryInput onSubmit={investigate} loading={investigating} />
      </div>

      {/* ─── Investigation Loading State ──────────────── */}
      {investigating && (
        <div className="card" style={{ marginBottom: 20, overflow: 'hidden' }}>
          {/* Progress bar at top */}
          <div style={{
            height: 2,
            background: 'var(--border-subtle)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: 0, left: 0,
              height: '100%',
              width: `${Math.min(95, (loadingStep / (INVESTIGATION_STEPS.length - 1)) * 100)}%`,
              background: 'linear-gradient(90deg, var(--accent), var(--violet))',
              transition: 'width 1.5s ease',
            }} />
          </div>

          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="investigating-pulse">
                  <div className="dot" /><div className="dot" /><div className="dot" />
                </div>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Sentinel is investigating
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="t-mono" style={{ color: 'var(--text-muted)' }}>
                  {elapsedSeconds}s elapsed
                </span>
                <button onClick={cancel} className="btn btn-danger btn-sm">
                  Cancel
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {INVESTIGATION_STEPS.map((step, idx) => {
                const done    = loadingStep > idx;
                const active  = loadingStep === idx;
                const pending = loadingStep < idx;
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '7px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: active ? 'var(--accent-subtle)' : 'transparent',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <div style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: 10,
                      background: done ? 'var(--success)' : active ? 'var(--accent)' : 'var(--bg-surface)',
                      border: pending ? '1px solid var(--border-subtle)' : 'none',
                    }}>
                      {done ? (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : active ? (
                        <div style={{
                          width: 6, height: 6,
                          borderRadius: '50%',
                          background: 'white',
                          animation: 'pulse-dot 1s ease-in-out infinite',
                        }} />
                      ) : null}
                    </div>
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      color: done ? 'var(--text-muted)' : active ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: active ? 500 : 400,
                      textDecoration: done ? 'line-through' : 'none',
                    }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Investigation Error ──────────────────────── */}
      {investigationError && (
        <div style={{
          background: 'var(--danger-subtle)',
          border: '1px solid var(--danger-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 20,
          marginBottom: 20,
          display: 'flex',
          gap: 14,
          alignItems: 'flex-start',
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--danger-subtle)',
            border: '1px solid var(--danger-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 14,
          }}>⚠</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--danger)', marginBottom: 6 }}>
              Investigation Failed
            </div>
            <p className="t-body" style={{ marginBottom: 16 }}>{investigationError}</p>
            {lastQuestion && (
              <button onClick={retry} className="btn btn-primary btn-sm">
                Retry Investigation
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Investigation Result ─────────────────────── */}
      {result && (
        <div style={{ marginBottom: 28 }} className="fade-in-up">
          {/* Summary + Root Cause */}
          <div className="card" style={{ padding: 24, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Investigation Summary
                  </span>
                  <span className="badge badge-accent">
                    {Math.round(result.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="t-body" style={{ lineHeight: 1.7 }}>{result.summary}</p>
              </div>
            </div>

            {/* Root Cause highlight */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              background: 'var(--danger-subtle)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--danger)',
                boxShadow: '0 0 6px var(--danger)',
                flexShrink: 0,
              }} />
              <span className="t-caption" style={{ color: 'var(--text-muted)' }}>Root cause</span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--danger)' }}>
                {result.root_cause}
              </span>
            </div>
          </div>

          {/* Reasoning Graph */}
          <ReasoningGraph investigation={result} onNodeClick={setSelectedNode} />

          {/* Recommendation */}
          <div className="card" style={{
            padding: 24,
            marginTop: 12,
            borderColor: 'var(--success-border)',
            background: 'linear-gradient(135deg, var(--bg-card), rgba(16,185,129,0.03))',
          }}>
            <SectionHeader icon="✓" title="Recommended Action" />
            <p className="t-body" style={{ lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {result.recommendation}
            </p>
          </div>

          {/* Sources */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <span className="t-caption">Sources consulted:</span>
            {result.sources_consulted?.map((source) => (
              <span key={source} className="badge badge-neutral">{source}</span>
            ))}
          </div>
        </div>
      )}

      {/* ─── Machine Data ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Telemetry */}
        <TelemetryChart data={machine.recent_telemetry} />

        {/* History column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Errors */}
          <div className="card" style={{ padding: 20 }}>
            <SectionHeader
              icon="⚠"
              title="Recent Errors"
              badge={machine.recent_errors.length > 0 ? machine.recent_errors.length : null}
            />
            {machine.recent_errors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p className="t-caption">No recent errors</p>
              </div>
            ) : (
              <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {machine.recent_errors.slice(0, 10).map((e, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: i % 2 === 0 ? 'transparent' : 'var(--bg-base)',
                  }}>
                    <span className="t-mono" style={{ color: 'var(--warning)' }}>{e.error_id}</span>
                    <span className="t-caption">{new Date(e.datetime).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Maintenance */}
          <div className="card" style={{ padding: 20 }}>
            <SectionHeader
              icon="⚙"
              title="Maintenance Log"
              badge={machine.recent_maintenance.length > 0 ? machine.recent_maintenance.length : null}
            />
            {machine.recent_maintenance.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p className="t-caption">No recent maintenance records</p>
              </div>
            ) : (
              <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {machine.recent_maintenance.slice(0, 10).map((m, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: i % 2 === 0 ? 'transparent' : 'var(--bg-base)',
                  }}>
                    <span className="t-mono" style={{ color: 'var(--info)' }}>{m.comp}</span>
                    <span className="t-caption">{new Date(m.datetime).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Failures */}
          {machine.recent_failures.length > 0 && (
            <div className="card" style={{
              padding: 20,
              borderColor: 'var(--danger-border)',
              background: 'linear-gradient(135deg, var(--bg-card), rgba(239,68,68,0.02))',
            }}>
              <SectionHeader
                icon="💥"
                title="Failure Events"
                badge={machine.recent_failures.length}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {machine.recent_failures.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--danger-subtle)',
                  }}>
                    <span className="t-mono" style={{ color: 'var(--danger)', fontWeight: 600 }}>{f.failure}</span>
                    <span className="t-caption">{new Date(f.datetime).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Evidence Drawer ──────────────────────────── */}
      <EvidenceDrawer node={selectedNode} onClose={() => setSelectedNode(null)} />
      {selectedNode && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
            backdropFilter: 'blur(2px)',
          }}
          className="fade-in"
          onClick={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
