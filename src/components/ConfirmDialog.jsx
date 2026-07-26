import React from 'react';

/** Drop-in replacement for window.confirm() that actually matches the
 * app's own dark/amber design system instead of a jarring native
 * browser dialog. Usage: render conditionally when a `pending` piece of
 * local state is truthy, call onConfirm/onCancel to clear it. */
export default function ConfirmDialog({ title = 'Are you sure?', message, confirmLabel = 'Delete', danger = true, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        background: 'var(--bg-surface-raised, #1A140E)',
        border: '1px solid var(--border-strong)',
        borderRadius: 20,
        padding: '24px 22px',
        maxWidth: 320,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <h3 style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 999,
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 999,
              background: danger ? 'var(--alert)' : 'linear-gradient(135deg, #F59E0B, #D97706)',
              border: 'none', color: danger ? '#fff' : '#1A1300', fontWeight: 800, fontSize: 13.5, cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
