import React, { useState } from 'react';
import { EVENT_TYPE_META } from '../../utils/calendarGrid';

const EVENT_TYPES = Object.entries(EVENT_TYPE_META).map(([key, meta]) => ({
  key, label: `${meta.emoji} ${meta.label}`, color: meta.color,
}));

export default function CreateEventSheet({ onClose, onSubmit }) {
  const [subject, setSubject] = useState('');
  const [type, setType] = useState('homework');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState(null);

  const inputStyle = {
    width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)',
    fontFamily: 'var(--font)', fontSize: 'var(--text-base)', marginBottom: 'var(--space-3)',
  };
  const labelStyle = { fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 };

  function handleSubmit() {
    if (!subject.trim() || !date) {
      setError(!subject.trim() ? 'Add a class or subject first.' : 'Pick a date.');
      return;
    }
    onSubmit({
      title: title.trim() || EVENT_TYPES.find((t) => t.key === type).label.replace(/^\S+\s/, ''),
      date,
      subject: subject.trim(),
      type,
    });
  }

  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)' }}>
      <div className="sheet-header">
        <h3>New Class Event</h3>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>
      <div style={{ padding: '0 var(--space-4)' }}>
        <label style={labelStyle}>Class / Subject</label>
        <input style={inputStyle} value={subject} onChange={(e) => { setSubject(e.target.value); setError(null); }} placeholder="AP Bio, 3rd period" autoFocus />

        <label style={labelStyle}>Type</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
          {EVENT_TYPES.map((t) => (
            <div
              key={t.key}
              onClick={() => setType(t.key)}
              style={{
                padding: '6px 12px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${type === t.key ? t.color : 'var(--border)'}`,
                background: type === t.key ? t.color + '22' : 'var(--bg-surface)',
                color: type === t.key ? t.color : 'var(--text-secondary)',
              }}
            >
              {t.label}
            </div>
          ))}
        </div>

        <label style={labelStyle}>Details (optional)</label>
        <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chapter 4 quiz, chs. 1-3" />

        <label style={labelStyle}>Date</label>
        <input type="date" style={inputStyle} value={date} onChange={(e) => { setDate(e.target.value); setError(null); }} />

        {error && <p style={{ color: 'var(--alert)', fontSize: 'var(--text-sm)', marginTop: -8, marginBottom: 12 }}>{error}</p>}

        <button className="modal-btn primary" style={{ width: '100%', padding: 12 }} onClick={handleSubmit}>
          Add to Calendar
        </button>
      </div>
    </div>
  );
}
