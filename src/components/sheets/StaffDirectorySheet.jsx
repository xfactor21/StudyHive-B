import React from 'react';

const STAFF = [
  { name: 'Ms. Rodriguez', role: 'School Counselor', icon: '🧑‍💼' },
  { name: 'Mr. Hale', role: 'Chemistry Teacher', icon: '🧪' },
  { name: 'Dr. Okafor', role: 'Assistant Principal', icon: '🏫' },
  { name: 'Front Office', role: 'General Support', icon: '📞' },
];

export default function StaffDirectorySheet({ onClose }) {
  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)' }}>
      <div className="sheet-handle" />
      <div className="sheet-header">
        <h3>Lincoln HS Staff</h3>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>
      <div className="settings-list">
        {STAFF.map((s) => (
          <div className="settings-row" key={s.name}>
            <div className="s-icon">{s.icon}</div>
            <span>{s.name} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>· {s.role}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
