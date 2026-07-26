import React, { useState } from 'react';

export default function MissMeSheet({ myClasses, onClose, onConfirm }) {
  const [picked, setPicked] = useState(myClasses[0] || '');
  const [sending, setSending] = useState(false);

  if (myClasses.length === 0) {
    return (
      <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)' }}>
        <div className="sheet-header">
          <h3>Miss Me?</h3>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '0 var(--space-4)', textAlign: 'center' }}>
          <div style={{ fontSize: 36, margin: '10px 0' }}>📚</div>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Add your classes in Edit Profile first — that's how Miss Me? knows who to actually notify.
          </p>
        </div>
      </div>
    );
  }

  async function handleConfirm() {
    setSending(true);
    await onConfirm(picked);
    setSending(false);
  }

  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)' }}>
      <div className="sheet-header">
        <h3>Which class did you miss?</h3>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>
      <div style={{ padding: '0 var(--space-4)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {myClasses.map((c) => (
            <div
              key={c}
              onClick={() => setPicked(c)}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-pill)', fontSize: 13.5, fontWeight: 600,
                cursor: 'pointer',
                background: picked === c ? 'var(--accent)' : 'var(--bg-surface)',
                color: picked === c ? '#1A1300' : 'var(--text-secondary)',
                border: `1px solid ${picked === c ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {c}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>
          This posts to your feed and notifies every classmate who also has "{picked}" in their classes.
        </p>
        <button className="modal-btn primary" style={{ width: '100%', padding: 12 }} onClick={handleConfirm} disabled={sending}>
          {sending ? 'Sending...' : `Let ${picked} know`}
        </button>
      </div>
    </div>
  );
}
