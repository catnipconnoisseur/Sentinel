/**
 * QueryInput — "Ask Sentinel" investigation input.
 * Redesigned: larger, more prominent, cleaner prompt hints.
 */

import { useState } from 'react';

const SUGGESTED_QUERIES = [
  'Why did this machine fail recently?',
  'What is causing the vibration spike?',
  'Is a failure imminent based on current telemetry?',
];

export default function QueryInput({ onSubmit, loading }) {
  const [question, setQuestion] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim() && !loading) {
      onSubmit(question.trim());
    }
  };

  const handleSuggestion = (q) => {
    setQuestion(q);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'flex',
          gap: 10,
          background: 'var(--bg-card)',
          border: `1px solid ${focused ? 'var(--border-focus)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '4px 4px 4px 16px',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}>
          {/* Icon */}
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M11 8v3M11 14h.01" strokeWidth="2.5" />
            </svg>
          </div>

          {/* Input */}
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ask Sentinel — e.g. 'Why did this machine fail?'"
            disabled={loading}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              padding: '10px 0',
            }}
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="btn btn-primary"
            style={{ flexShrink: 0 }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 14,
                  height: 14,
                  border: '2px solid rgba(255,255,255,0.25)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Analyzing
              </span>
            ) : 'Investigate'}
          </button>
        </div>
      </form>

      {/* Suggested queries */}
      {!loading && !question && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {SUGGESTED_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => handleSuggestion(q)}
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 12px',
                cursor: 'pointer',
                transition: 'color 0.15s ease, border-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-default)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
