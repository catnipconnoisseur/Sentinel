/**
 * Layout — App shell with top navigation bar.
 * Dark industrial theme. Minimal chrome, maximum content.
 */

import { Outlet, Link, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* ─── Top Nav ──────────────────────────────────── */}
      <nav className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
            </div>
            <span className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
              Senti<span className="text-indigo-400">nel</span>
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <span className="text-xs text-[var(--text-muted)] font-mono tracking-wider uppercase">
              AI Investigation Engine
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          </div>
        </div>
      </nav>

      {/* ─── Page Content ─────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
