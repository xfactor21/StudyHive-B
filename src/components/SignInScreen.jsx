import React from 'react';
import BuzzMascot from './BuzzMascot';

export default function SignInScreen({ onSignIn, error }) {
  return (
    <div
      id="splash"
      style={{ position: 'fixed', display: 'flex', flexDirection: 'column' }}
    >
      <div className="splash-hex">
        <BuzzMascot size={110} />
      </div>
      <h1 style={{ marginTop: 'var(--space-5)' }}>StudyHive</h1>
      <p style={{ marginBottom: 'var(--space-6)' }}>Bee Yourself. Study With the Swarm.</p>

      <button
        onClick={onSignIn}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#fff', color: '#1A1300',
          border: 'none', borderRadius: 'var(--radius-pill)',
          padding: '12px 24px', fontWeight: 700, fontSize: 'var(--text-base)',
          cursor: 'pointer',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5 44.5 36.3 44.5 25c0-1.5-.2-3-.4-4.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z" />
          <path fill="#4CAF50" d="M24 45.5c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.4c-2.1 1.5-4.8 2.5-7.7 2.5-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.5 40.9 16.2 45.5 24 45.5z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.6 5.4C41.7 35.8 44.5 30.9 44.5 25c0-1.5-.2-3-.9-4.5z" />
        </svg>
        Sign in with Google
      </button>

      {error && (
        <p style={{ color: 'var(--alert)', marginTop: 'var(--space-3)', fontStyle: 'normal' }}>
          {error}
        </p>
      )}
    </div>
  );
}
