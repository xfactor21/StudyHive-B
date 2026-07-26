import React, { useState } from 'react';

export default function ReportSheet({ onClose, onSubmit }) {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (!text.trim()) return;
    setSubmitted(true);
    onSubmit(text.trim());
  }

  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)' }}>
      <div className="sheet-header">
        <h3>Report Something</h3>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>
      <div style={{ padding: '0 var(--space-4)' }}>
        {submitted ? (
          <div className="empty-state">
            <div className="e-icon">✅</div>
            <p>Your report was submitted anonymously. No user ID is attached to it.</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
              This report is completely anonymous — nothing here is linked to your account.
            </p>
            <textarea
              autoFocus
              placeholder="What happened?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                width: '100%', minHeight: 110, background: 'var(--bg-surface)',
                border: '1px solid var(--border)', borderRadius: 14, padding: 12,
                color: 'var(--text-primary)', fontFamily: 'var(--font)',
                fontSize: 'var(--text-base)', resize: 'none',
              }}
            />
            <button className="modal-btn primary" style={{ width: '100%', marginTop: 10, padding: 12 }} onClick={handleSubmit}>
              Submit Anonymously
            </button>
          </>
        )}
      </div>
    </div>
  );
}
