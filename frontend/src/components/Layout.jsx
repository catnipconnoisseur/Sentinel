/**
 * Layout — App shell with top navigation bar.
 * Refined: Tighter nav, better branding, clear status indicator.
 */

import { Outlet, Link, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* ─── Top Nav ──────────────────────────────────── */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(8, 12, 20, 0.90)',
        backdropFilter: 'blur(16px)',
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 24px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}>
          {/* Brand */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 14px rgba(99,102,241,0.35)',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
              </svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Senti<span style={{ color: 'var(--accent-hover)' }}>nel</span>
            </span>
          </Link>

          {/* Center: breadcrumb location */}
          {location.pathname !== '/' && (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}>
              <Link to="/" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }} className="hover-link">
                Dashboard
              </Link>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>/</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {location.pathname.includes('/machine/') ? `Machine ${location.pathname.split('/').pop()}` : ''}
              </span>
            </div>
          )}

          {/* Right: status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              AI Engine
            </span>
            <div style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--success)',
              boxShadow: '0 0 7px var(--success)',
            }} />
          </div>
        </div>
      </nav>

      {/* ─── Page Content ─────────────────────────────── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', paddingBottom: 64 }}>
        <Outlet />
      </main>

      {/* ─── Footer ───────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-primary)',
        padding: '24px 0',
        textAlign: 'center',
        marginTop: 'auto',
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} Sentinel. All rights reserved.
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              Powered by <strong style={{ color: 'var(--text-secondary)' }}>AMD Instinct™ MI300X</strong> accelerators
            </span>
            <span style={{ color: 'var(--border-default)', fontSize: 12 }}>|</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Fireworks AI Serverless Compute
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
