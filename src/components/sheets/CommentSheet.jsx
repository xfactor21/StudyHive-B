import React, { useState, useEffect } from 'react';

export default function CommentSheet({ open, onClose, onSubmit }) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (open) setText('');
  }, [open]);

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) { onClose(); return; }
    onSubmit(trimmed);
  }

  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-4)' }}>
      <div className="sheet-header">
        <h3>Add a Comment</h3>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>
      <div style={{ padding: '0 var(--space-4)' }}>
        <textarea
          autoFocus
          placeholder="Write something helpful..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            width: '100%', minHeight: 80, background: 'var(--bg-surface)',
            border: '1px solid var(--border)', borderRadius: 14, padding: 12,
            color: 'var(--text-primary)', fontFamily: 'var(--font)',
            fontSize: 'var(--text-base)', resize: 'none',
          }}
        />
        <button className="modal-btn primary" style={{ width: '100%', marginTop: 10, padding: 12 }} onClick={handleSubmit}>
          Post Comment
        </button>
      </div>
    </div>
  );
}
