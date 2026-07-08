/**
 * Dashboard — Main factory overview.
 * Grid of machine cards with search and status filter.
 */

import { useState, useEffect, useMemo } from 'react';
import MachineCard from './MachineCard';
import { api } from '../api/client';

export default function Dashboard() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    api.getMachines()
      .then(setMachines)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return machines.filter((m) => {
      const matchesSearch =
        String(m.machine_id).includes(search) ||
        m.model.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [machines, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = { all: machines.length, healthy: 0, warning: 0, critical: 0 };
    machines.forEach((m) => counts[m.status]++);
    return counts;
  }, [machines]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="investigating-pulse">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
          <span className="ml-3 text-[var(--text-muted)]">Loading factory data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      {/* ─── Header ───────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          Factory Dashboard
        </h1>
        <p className="text-[var(--text-secondary)]">
          Monitor machine health and investigate failures with AI
        </p>
      </div>

      {/* ─── Filters ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search machines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          {['all', 'critical', 'warning', 'healthy'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border-none
                ${statusFilter === s
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="ml-1.5 opacity-60">{statusCounts[s]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Machine Grid ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filtered.map((machine) => (
          <MachineCard key={machine.machine_id} machine={machine} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-[var(--text-muted)]">
          No machines match your search.
        </div>
      )}
    </div>
  );
}
