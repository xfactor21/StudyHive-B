import React from 'react';
import { BADGE_CATALOG } from '../../data/badges';

export default function BadgesSheet({ onClose, earnedIds }) {
  const earnedSet = new Set(earnedIds || []);
  const earnedCount = BADGE_CATALOG.filter((b) => earnedSet.has(b.id)).length;

  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)' }}>
      <div className="sheet-header">
        <h3>Badges — {earnedCount}/{BADGE_CATALOG.length}</h3>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
        padding: '0 var(--space-4) var(--space-4)',
      }}>
        {BADGE_CATALOG.map((b) => {
          const earned = earnedSet.has(b.id);
          return (
            <div
              key={b.id}
              title={b.desc}
              style={{
                textAlign: 'center', padding: '14px 8px', borderRadius: 14,
                background: earned ? 'var(--accent-dim)' : 'var(--bg-surface)',
                border: `1px solid ${earned ? 'var(--accent)' : 'var(--border)'}`,
                opacity: earned ? 1 : 0.45,
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 6, filter: earned ? 'none' : 'grayscale(1)' }}>
                {b.emoji}
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: earned ? 'var(--accent-text)' : 'var(--text-secondary)', lineHeight: 1.3 }}>
                {b.name}
              </div>
              {!earned && (
                <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 4, lineHeight: 1.3 }}>
                  {b.desc}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
