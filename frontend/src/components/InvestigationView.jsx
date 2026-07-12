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

const getSeverityColor = (val) => {
  if (!val) return 'var(--text-secondary)';
  const v = val.toLowerCase();
  if (v.includes('critical') || v.includes('very high')) return 'var(--danger)';
  if (v.includes('high')) return '#f97316'; // Orange
  if (v.includes('mod') || v.includes('medium')) return '#f59e0b'; // Yellow/Amber
  if (v.includes('low')) return 'var(--success)';
  return 'var(--text-secondary)';
};


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
    <>
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
          {/* Contradictory Evidence Alert Box */}
          {result.contradictory_evidence && result.contradictory_evidence.length > 0 && (
            <div className="card" style={{
              padding: '16px 20px',
              marginBottom: 16,
              borderLeft: '4px solid var(--warning)',
              background: 'rgba(245, 158, 11, 0.04)',
            }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--warning)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                ⚠️ Conflicting Signals Detected (Physical Verification Recommended)
              </span>
              <ul style={{ paddingLeft: 16, margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                {result.contradictory_evidence.map((ce, idx) => (
                  <li key={idx} style={{ padding: '2px 0', lineHeight: 1.4 }}>{ce}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary + Root Cause + Urgency + Info Briefing */}
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
              {/* Left Column: Causal Analysis */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Incident Briefing
                  </span>
                  {result.executive_summary?.urgency && (
                    <span className={`badge ${
                      result.executive_summary.urgency.toLowerCase() === 'critical' ? 'badge-critical' :
                      result.executive_summary.urgency.toLowerCase() === 'high' ? 'badge-warning' : 'badge-neutral'
                    }`}>
                      {result.executive_summary.urgency} Urgency
                    </span>
                  )}
                  {result.inference_time_ms && (
                    <span className="badge badge-accent" style={{
                      marginLeft: 'auto',
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: 'var(--accent-hover)',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      ⚡ {(result.inference_time_ms / 1000).toFixed(1)}s inference using {result.model_name ? result.model_name.split('/').pop().toUpperCase() : 'GLM-5P2'} on AMD Instinct™ MI300X
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div className="t-caption" style={{ color: 'var(--text-muted)', marginBottom: 2 }}>What Happened</div>
                    <p className="t-body" style={{ lineHeight: 1.6 }}>{result.executive_summary?.what_happened || result.summary}</p>
                  </div>
                  <div>
                    <div className="t-caption" style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Why It Happened</div>
                    <p className="t-body" style={{ lineHeight: 1.6 }}>{result.executive_summary?.why_it_happened}</p>
                  </div>
                  <div>
                    <div className="t-caption" style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Current Condition</div>
                    <p className="t-body" style={{ lineHeight: 1.6 }}>{result.executive_summary?.current_condition}</p>
                  </div>
                </div>

                {/* Root Cause highlight banner */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  background: 'var(--danger-subtle)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-md)',
                  marginTop: 16,
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

              {/* Right Column: Confidence Breakdown & Business Metrics */}
              <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Confidence Score
                    </span>
                    <span className="t-card-title" style={{ color: 'var(--accent)' }}>
                      {Math.round(result.confidence * 100)}%
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ width: `${result.confidence * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--violet))' }} />
                  </div>
                  
                  {/* Detailed breakdown factors */}
                  {result.confidence_breakdown && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                        <span>Telemetry: {Math.round(result.confidence_breakdown.telemetry * 100)}%</span>
                        <span>Manuals: {Math.round(result.confidence_breakdown.manual_evidence * 100)}%</span>
                        <span>History: {Math.round(result.confidence_breakdown.maintenance_history * 100)}%</span>
                      </div>
                      <p className="t-caption" style={{ fontStyle: 'italic', marginTop: 4, lineHeight: 1.4 }}>
                        "{result.confidence_breakdown.explanation}"
                      </p>
                      {result.confidence_breakdown.supporting_factors?.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                          <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase' }}>High confidence because:</span>
                          <ul style={{ paddingLeft: 12, margin: '2px 0 0 0', fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {result.confidence_breakdown.supporting_factors.map((f, idx) => <li key={idx}>✓ {f}</li>)}
                          </ul>
                        </div>
                      )}
                      {result.confidence_breakdown.reducing_factors?.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                          <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--warning)', textTransform: 'uppercase' }}>Confidence reduced because:</span>
                          <ul style={{ paddingLeft: 12, margin: '2px 0 0 0', fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {result.confidence_breakdown.reducing_factors.map((f, idx) => <li key={idx}>⚠ {f}</li>)}
                          </ul>
                        </div>
                      )}
                      {result.confidence_breakdown.missing_evidence < 0 && (
                        <div style={{ fontSize: '10px', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          ⚠️ Penalty of {Math.round(result.confidence_breakdown.missing_evidence * -100)}% applied for missing evidence
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Business Impact Card Grid */}
                {result.business_impact && (
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 10 }}>
                      Operational & Business Impact
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div className="card" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Downtime</span>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: getSeverityColor(result.business_impact.downtime) }}>
                          {result.business_impact.downtime}
                        </span>
                      </div>
                      <div className="card" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Disruption</span>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: getSeverityColor(result.business_impact.production_disruption) }}>
                          {result.business_impact.production_disruption}
                        </span>
                      </div>
                      <div className="card" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Est. Cost</span>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: getSeverityColor(result.business_impact.potential_cost_range) }}>
                          {result.business_impact.potential_cost_range}
                        </span>
                      </div>
                      <div className="card" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Adjacent Risk</span>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: getSeverityColor(result.business_impact.risk_to_adjacent_equipment) }}>
                          {result.business_impact.risk_to_adjacent_equipment}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reasoning Graph Section */}
          <div style={{ marginBottom: 16 }}>
            <ReasoningGraph investigation={result} onNodeClick={setSelectedNode} />
          </div>

          {/* Causal Evidence Correlation Callout */}
          {result.evidence_correlation && (
            <div className="card" style={{
              padding: '16px 20px',
              marginBottom: 16,
              borderLeft: '4px solid var(--accent)',
              background: 'linear-gradient(90deg, rgba(99,102,241,0.03), transparent)'
            }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                Causal Evidence Correlation
              </span>
              <p className="t-body" style={{ lineHeight: 1.6, fontStyle: 'italic' }}>
                "{result.evidence_correlation}"
              </p>
            </div>
          )}

          {/* Alternative Hypotheses Card Section */}
          {result.alternative_hypotheses && result.alternative_hypotheses.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 10 }}>
                <span className="t-card-title" style={{ fontSize: 'var(--text-sm)' }}>
                  Competing Hypotheses Evaluation
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${result.alternative_hypotheses.length}, 1fr)`, gap: 12 }}>
                {result.alternative_hypotheses.map((hyp, i) => (
                  <div key={i} className="card" style={{ padding: 16, background: hyp.status === 'rejected' ? 'rgba(239, 68, 68, 0.01)' : 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{hyp.name}</span>
                      <span className={`badge ${
                        hyp.status === 'rejected' ? 'badge-critical' :
                        hyp.status === 'evaluated' ? 'badge-accent' : 'badge-neutral'
                      }`}>
                        {hyp.status.toUpperCase()} ({Math.round(hyp.confidence * 100)}%)
                      </span>
                    </div>
                    <p className="t-caption" style={{ lineHeight: 1.4, marginBottom: 12 }}>{hyp.rationale}</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {hyp.supporting_evidence?.length > 0 && (
                        <div>
                          <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase', marginBottom: 2 }}>Supporting</div>
                          <ul style={{ paddingLeft: 12, margin: 0, fontSize: '10px', color: 'var(--text-secondary)' }}>
                            {hyp.supporting_evidence.map((se, j) => <li key={j} style={{ padding: '2px 0' }}>✓ {se}</li>)}
                          </ul>
                        </div>
                      )}
                      {hyp.contradicting_evidence?.length > 0 && (
                        <div>
                          <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--danger)', textTransform: 'uppercase', marginBottom: 2 }}>Contradicting</div>
                          <ul style={{ paddingLeft: 12, margin: 0, fontSize: '10px', color: 'var(--text-secondary)' }}>
                            {hyp.contradicting_evidence.map((ce, j) => <li key={j} style={{ padding: '2px 0' }}>✗ {ce}</li>)}
                          </ul>
                        </div>
                      )}
                      {hyp.missing_evidence?.length > 0 && (
                        <div>
                          <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Missing/Unverified</div>
                          <ul style={{ paddingLeft: 12, margin: 0, fontSize: '10px', color: 'var(--text-secondary)' }}>
                            {hyp.missing_evidence.map((me, j) => <li key={j} style={{ padding: '2px 0' }}>? {me}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Operational Risk & Failure Progression sequence */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16, marginBottom: 16 }}>
            {/* Risk Assessment */}
            {result.risk_assessment && (
              <div className="card" style={{ padding: 20 }}>
                <SectionHeader icon="⚠️" title="Operational Risk Assessment" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span className="t-caption">Severity:</span>
                  <span className={`badge ${
                    result.risk_assessment.severity.toLowerCase() === 'critical' ? 'badge-critical' :
                    result.risk_assessment.severity.toLowerCase() === 'high' ? 'badge-warning' : 'badge-neutral'
                  }`}>
                    {result.risk_assessment.severity}
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Consequences of continued unchecked operation:</div>
                <ul style={{ paddingLeft: 16, margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {result.risk_assessment.consequences?.map((cons, idx) => (
                    <li key={idx} style={{ lineHeight: 1.4 }}>{cons}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Timeline progression flow */}
            <div className="card" style={{ padding: 20 }}>
              <SectionHeader icon="🔮" title="Chronological Event Timeline" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', paddingLeft: 16 }}>
                {/* Vertical line connection */}
                <div style={{
                  position: 'absolute',
                  top: 8, bottom: 8, left: 21,
                  width: 2,
                  background: 'linear-gradient(180deg, var(--accent), var(--danger))'
                }} />

                {result.timeline && result.timeline.length > 0 ? (
                  result.timeline.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, position: 'relative', zIndex: 1, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 12, height: 12,
                        borderRadius: '50%',
                        background: idx === 0 ? 'var(--accent)' : idx === result.timeline.length - 1 ? 'var(--danger)' : 'var(--border-default)',
                        border: '2px solid var(--bg-card)',
                        flexShrink: 0,
                        marginTop: 4,
                      }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>
                          {step.timestamp}
                        </span>
                        <span className="t-caption" style={{
                          color: idx === result.timeline.length - 1 ? 'var(--danger)' : 'var(--text-primary)',
                          fontWeight: idx === result.timeline.length - 1 ? 600 : 400,
                          lineHeight: 1.4
                        }}>
                          {step.event}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  result.failure_progression?.map((prog, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
                      <div style={{
                        width: 12, height: 12,
                        borderRadius: '50%',
                        background: idx === 0 ? 'var(--accent)' : idx === result.failure_progression.length - 1 ? 'var(--danger)' : 'var(--border-default)',
                        border: '2px solid var(--bg-card)',
                        flexShrink: 0,
                      }} />
                      <span className="t-caption" style={{
                        color: idx === 0 ? 'var(--text-primary)' : idx === result.failure_progression.length - 1 ? 'var(--danger)' : 'var(--text-secondary)',
                        fontWeight: idx === 0 || idx === result.failure_progression.length - 1 ? 600 : 400
                      }}>
                        {prog}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Engineering Diagnostic Audit (Self-Challenge) */}
          {result.self_challenge && (
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <SectionHeader icon="🧐" title="Engineering Self-Challenge Audit" />
              <p className="t-caption" style={{ marginBottom: 12, color: 'var(--text-muted)' }}>
                Independent verification audit challenging the primary diagnosis against competing signals.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase', marginBottom: 6 }}>Supporting Evidence</div>
                  <ul style={{ paddingLeft: 12, margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {result.self_challenge.supporting_evidence?.map((item, idx) => (
                      <li key={idx} style={{ lineHeight: 1.4 }}>✓ {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--danger)', textTransform: 'uppercase', marginBottom: 6 }}>Contradicting / Conflicting</div>
                  <ul style={{ paddingLeft: 12, margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {result.self_challenge.contradicting_evidence?.length > 0 ? (
                      result.self_challenge.contradicting_evidence.map((item, idx) => (
                        <li key={idx} style={{ lineHeight: 1.4 }}>✗ {item}</li>
                      ))
                    ) : (
                      <li style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No conflicting signals found in logs</li>
                    )}
                  </ul>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', marginBottom: 6 }}>Additional Evidence Needed</div>
                  <ul style={{ paddingLeft: 12, margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {result.self_challenge.additional_evidence_needed?.map((item, idx) => (
                      <li key={idx} style={{ lineHeight: 1.4 }}>? {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Phased Recommendations Action Cards */}
          {result.phased_recommendations && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 10 }}>
                <span className="t-card-title" style={{ fontSize: 'var(--text-sm)' }}>
                  Phased Action Plan
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {/* Immediate actions */}
                <div className="card" style={{ padding: 18, borderTop: '4px solid var(--danger)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--danger)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🚨 Immediate Actions</span>
                    <span className="badge badge-critical" style={{ fontSize: '9px', height: 16 }}>&lt; 1 Hour</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {result.phased_recommendations.immediate && result.phased_recommendations.immediate.length > 0 ? (
                      result.phased_recommendations.immediate.map((rec, j) => (
                        <div key={j} style={{ borderBottom: j < result.phased_recommendations.immediate.length - 1 ? '1px solid var(--border-subtle)' : 'none', paddingBottom: 6 }}>
                          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>• {rec.action}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', paddingLeft: 8, marginTop: 2, lineHeight: 1.3 }}>
                            Rationale: {rec.reason}
                          </div>
                        </div>
                      ))
                    ) : (
                      result.phased_recommendations.immediate_1h?.map((rec, j) => (
                        <div key={j} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>• {rec}</div>
                      ))
                    )}
                  </div>
                </div>

                {/* Short term actions */}
                <div className="card" style={{ padding: 18, borderTop: '4px solid #f97316' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: '#f97316', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>⏳ Short Term Actions</span>
                    <span className="badge badge-warning" style={{ fontSize: '9px', height: 16 }}>&lt; 24 Hours</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {result.phased_recommendations.short_term && result.phased_recommendations.short_term.length > 0 ? (
                      result.phased_recommendations.short_term.map((rec, j) => (
                        <div key={j} style={{ borderBottom: j < result.phased_recommendations.short_term.length - 1 ? '1px solid var(--border-subtle)' : 'none', paddingBottom: 6 }}>
                          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>• {rec.action}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', paddingLeft: 8, marginTop: 2, lineHeight: 1.3 }}>
                            Rationale: {rec.reason}
                          </div>
                        </div>
                      ))
                    ) : (
                      result.phased_recommendations.short_term_24h?.map((rec, j) => (
                        <div key={j} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>• {rec}</div>
                      ))
                    )}
                  </div>
                </div>

                {/* Preventive actions */}
                <div className="card" style={{ padding: 18, borderTop: '4px solid var(--success)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--success)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🛡️ Long Term Preventive</span>
                    <span className="badge badge-healthy" style={{ fontSize: '9px', height: 16 }}>Proactive</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {result.phased_recommendations.preventive && result.phased_recommendations.preventive.length > 0 ? (
                      result.phased_recommendations.preventive.map((rec, j) => (
                        <div key={j} style={{ borderBottom: j < result.phased_recommendations.preventive.length - 1 ? '1px solid var(--border-subtle)' : 'none', paddingBottom: 6 }}>
                          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>• {rec.action}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', paddingLeft: 8, marginTop: 2, lineHeight: 1.3 }}>
                            Rationale: {rec.reason}
                          </div>
                        </div>
                      ))
                    ) : (
                      result.phased_recommendations.long_term_preventive?.map((rec, j) => (
                        <div key={j} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>• {rec}</div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preventability Assessment */}
          {result.preventability && (
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <SectionHeader icon="🛡️" title="Preventability Assessment" />
              <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr 1.2fr', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 6 }}>Incident Preventable?</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: result.preventability.preventable ? 'var(--success-subtle)' : 'var(--danger-subtle)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                      color: result.preventability.preventable ? 'var(--success)' : 'var(--danger)'
                    }}>
                      {result.preventability.preventable ? '✓' : '✗'}
                    </div>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: result.preventability.preventable ? 'var(--success)' : 'var(--danger)' }}>
                      {result.preventability.preventable ? 'Preventable' : 'Unpreventable'}
                    </span>
                  </div>
                </div>

                {result.preventability.warnings?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Early Warning Signs</div>
                    <ul style={{ paddingLeft: 12, margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {result.preventability.warnings.map((warn, k) => <li key={k} style={{ lineHeight: 1.4 }}>{warn}</li>)}
                    </ul>
                  </div>
                )}

                {result.preventability.thresholds?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Telemetry Alarm Thresholds</div>
                    <ul style={{ paddingLeft: 12, margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {result.preventability.thresholds.map((thresh, k) => <li key={k} style={{ lineHeight: 1.4 }}>{thresh}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Key Insight Highlight Banner */}
          {result.key_insight && (
            <div className="card" style={{
              padding: 20,
              marginBottom: 16,
              background: 'linear-gradient(135deg, var(--bg-card), rgba(99,102,241,0.04))',
              border: '1px solid var(--border-default)',
              boxShadow: '0 0 20px rgba(99,102,241,0.03)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Radial glow background */}
              <div style={{
                position: 'absolute',
                top: '-50%', right: '-30%',
                width: 250, height: 250,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 20 }}>💡</div>
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>
                    Reliability Key Conclusion
                  </span>
                  <p style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 500,
                    lineHeight: 1.6,
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    {result.key_insight}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Action (Full Description) */}
          <div className="card" style={{
            padding: 24,
            marginBottom: 16,
            borderColor: 'var(--success-border)',
            background: 'linear-gradient(135deg, var(--bg-card), rgba(16,185,129,0.02))',
          }}>
            <SectionHeader icon="✓" title="General Summary & Recommendation" />
            <p className="t-body" style={{ lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {result.recommendation}
            </p>
          </div>

          {/* Sources */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
    </>
  );
}
