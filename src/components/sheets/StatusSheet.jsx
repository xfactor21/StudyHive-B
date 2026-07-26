import React from 'react';
import { STATUS_TYPES } from '../../data/people';
import { useCountdown } from '../../utils/useCountdown';

export default function StatusSheet({ currentStatus, customExpiresAt, onSelectStatus, onClose }) {
  const isLocked = currentStatus === 'custom' && customExpiresAt && customExpiresAt > Date.now();
  const remaining = useCountdown(isLocked ? customExpiresAt : Date.now());

  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)' }}>
      <div className="sheet-header">
        <h3>Set Your Status</h3>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>

      {isLocked && (
        <div style={{
          margin: '0 var(--space-4) var(--space-3)', padding: '10px 14px',
          background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.35)',
          borderRadius: 12, fontSize: 12.5, color: 'var(--text-secondary)', textAlign: 'center',
        }}>
          🎲 You rolled the dice — locked in for <strong style={{ color: '#C084FC' }}>{remaining}</strong>
        </div>
      )}

      <div className="status-grid">
        {STATUS_TYPES.map((s) => {
          const disabled = isLocked;
          return (
            <div
              key={s.key}
              className={`status-option${currentStatus === s.key ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
              onClick={() => !disabled && onSelectStatus(s.key)}
              style={disabled ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
            >
              <div className="emoji">{s.emoji}</div>
              <div className="label">{s.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
