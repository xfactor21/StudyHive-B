import React, { useState, useEffect } from 'react';

const POST_TYPES = [
  { key: 'thought', label: 'Thought' },
  { key: 'question', label: 'Question' },
  { key: 'study-group', label: 'Study Group' },
];

export default function NewPostSheet({ open, onClose, onSubmit, myClasses = [] }) {
  const [text, setText] = useState('');
  const [type, setType] = useState('thought');
  const [classTag, setClassTag] = useState('');

  useEffect(() => {
    if (open) { setText(''); setType('thought'); setClassTag(''); }
  }, [open]);

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) { onClose(); return; }
    onSubmit(trimmed, type, classTag || null);
  }

  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-4)' }}>
      <div className="sheet-header">
        <h3>New Post</h3>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>
      <div style={{ padding: '0 var(--space-4)' }}>
        <div className="tab-row" style={{ margin: '0 0 var(--space-3)' }}>
          {POST_TYPES.map((t) => (
            <button
              key={t.key}
              className={`tab-btn${type === t.key ? ' active' : ''}`}
              onClick={() => setType(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <textarea
          autoFocus
          placeholder="Share something with your hive..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            width: '100%', minHeight: 90, background: 'var(--bg-surface)',
            border: '1px solid var(--border)', borderRadius: 14, padding: 12,
            color: 'var(--text-primary)', fontFamily: 'var(--font)',
            fontSize: 'var(--text-base)', resize: 'none',
          }}
        />
        {myClasses.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 6 }}>Tag a class? (optional)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {myClasses.map((c) => (
                <div
                  key={c}
                  onClick={() => setClassTag(classTag === c ? '' : c)}
                  style={{
                    padding: '5px 12px', borderRadius: 'var(--radius-pill)', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer',
                    background: classTag === c ? 'var(--accent)' : 'var(--bg-surface)',
                    color: classTag === c ? '#1A1300' : 'var(--text-secondary)',
                    border: `1px solid ${classTag === c ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
          </div>
        )}
        <button className="modal-btn primary" style={{ width: '100%', marginTop: 10, padding: 12 }} onClick={handleSubmit}>
          Post to Feed
        </button>
      </div>
    </div>
  );
}
