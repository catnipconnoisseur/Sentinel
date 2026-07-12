/**
 * Dashboard — Main factory overview.
 * Redesigned: stat bar at top, cleaner filters, proper empty state, skeleton loaders.
 */

import { useState, useEffect, useMemo } from 'react';
import MachineCard from './MachineCard';
import { api } from '../api/client';

const STAT_CONFIG = [
  { key: 'all',      label: 'Total Machines',    color: 'var(--text-secondary)' },
  { key: 'healthy',  label: 'Operational',        color: 'var(--success)' },
  { key: 'warning',  label: 'Needs Attention',    color: 'var(--warning)' },
  { key: 'critical', label: 'Critical',           color: 'var(--danger)' },
];

function SkeletonCard() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="skeleton" style={{ height: 12, width: '60%' }} />
          <div className="skeleton" style={{ height: 10, width: '40%' }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 10, width: '50%', marginBottom: 8 }} />
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 8 }}>
        <div className="skeleton" style={{ height: 10, width: '70%' }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadMachines = () => {
    setLoading(true);
    setFetchError(null);
    api.getMachines()
      .then((data) => {
        // Guard: backend must return an array
        if (!Array.isArray(data)) {
          console.error('[Dashboard] /api/machines returned non-array:', data);
          setFetchError('Unexpected response from server. Expected a list of machines.');
          return;
        }
        setMachines(data);
      })
      .catch((err) => {
        console.error('[Dashboard] getMachines failed:', err);
        setFetchError(err.message || 'Failed to load machines. Check backend connectivity.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMachines();
  }, []);

  const filtered = useMemo(() => {
    const res = machines.filter((m) => {
      const matchesSearch =
        String(m.machine_id).includes(search) ||
        m.model.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    return res;
  }, [machines, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = { all: machines.length, healthy: 0, warning: 0, critical: 0 };
    machines.forEach((m) => counts[m.status]++);
    return counts;
  }, [machines]);

  return (
    <div className="fade-in-up">
      {/* ─── Page Header ──────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="t-page-title" style={{ marginBottom: 6 }}>Factory Floor</h1>
            <p className="t-body">
              AI-powered predictive maintenance across {machines.length} monitored assets
            </p>
          </div>
        </div>
      </div>

      {/* ─── Fetch Error Banner ────────────────────────── */}
      {fetchError && (
        <div style={{
          background: 'var(--danger-subtle)',
          border: '1px solid var(--danger-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: 24,
          color: 'var(--danger)',
          fontSize: 'var(--text-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}>
          <div>
            <strong style={{ display: 'block', marginBottom: 4 }}>Connection Error</strong>
            <span>{fetchError}</span>
          </div>
          <button
            onClick={loadMachines}
            className="btn btn-danger btn-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── Stat Bar ─────────────────────────────────── */}
      {!loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}>
          {STAT_CONFIG.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              style={{
                background: statusFilter === key ? 'var(--bg-elevated)' : 'var(--bg-card)',
                border: `1px solid ${statusFilter === key ? 'var(--border-default)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'var(--transition-fast)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {statusFilter === key && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '3px',
                  height: '100%',
                  background: color,
                  borderRadius: '4px 0 0 4px',
                }} />
              )}
              <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1.1, marginBottom: 4 }}>
                {loading ? '–' : statusCounts[key]}
              </div>
              <div className="t-caption">{label}</div>
            </button>
          ))}
        </div>
      )}

      {/* ─── Filters ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 320 }}>
          <svg
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by ID or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ paddingLeft: 36 }}
          />
        </div>

        {/* Results count */}
        {!loading && (
          <span className="t-caption">
            {filtered.length === machines.length
              ? `${machines.length} machines`
              : `${filtered.length} of ${machines.length}`}
          </span>
        )}
      </div>

      {/* ─── Machine Grid ─────────────────────────────── */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
        }}>
          {Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 24px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
          </div>
          <p style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>No machines found</p>
          <p className="t-caption">Try a different search or filter</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
        }}>
          {filtered.map((machine) => (
            <MachineCard key={machine.machine_id} machine={machine} />
          ))}
        </div>
      )}
    </div>
  );
}
