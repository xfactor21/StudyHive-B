import React from 'react';

export default function HelpSheet({ onClose, onOpenReport, onOpenCrisis, onOpenStaff }) {
  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)' }}>
      <div className="sheet-handle" />
      <div className="sheet-header">
        <h3>Help & Safety</h3>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>
      <div className="settings-list">
        <Row icon="🚩" label="Report Something" onClick={onOpenReport} />
        <Row icon="❤️‍🩹" label="Crisis Resources" onClick={onOpenCrisis} />
        <Row icon="🏫" label="School Staff Directory" onClick={onOpenStaff} />
      </div>
    </div>
  );
}

function Row({ icon, label, onClick }) {
  return (
    <div className="settings-row" onClick={onClick}>
      <div className="s-icon">{icon}</div>
      <span>{label}</span>
      <div className="chev">›</div>
    </div>
  );
}
