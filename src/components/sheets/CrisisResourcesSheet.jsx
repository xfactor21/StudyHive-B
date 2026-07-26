import React from 'react';

export default function CrisisResourcesSheet({ onClose }) {
  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)' }}>
      <div className="sheet-header">
        <h3>Crisis Resources</h3>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>
      <div style={{ padding: '0 var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <ResourceCard
          title="Crisis Text Line"
          detail="Text HOME to 741741"
          note="Free, 24/7 support by text"
        />
        <ResourceCard
          title="988 Suicide & Crisis Lifeline"
          detail="Call or text 988"
          note="Free, 24/7, confidential support"
        />
        <ResourceCard
          title="School Counselor"
          detail="Available during school hours"
          note="Ask the front office to connect you, or message them directly through Staff Directory"
        />
      </div>
    </div>
  );
}

function ResourceCard({ title, detail, note }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card)', padding: 'var(--space-4)',
    }}>
      <div style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>{title}</div>
      <div style={{ fontWeight: 700, color: 'var(--accent-text)', fontSize: 'var(--text-lg)', marginTop: 4 }}>{detail}</div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>{note}</div>
    </div>
  );
}
