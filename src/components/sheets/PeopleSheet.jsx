import React from 'react';
import HexAvatar from '../HexAvatar';
import StatusLabel from '../StatusLabel';
import { defaultAvatar } from '../../data/avatars';

export default function PeopleSheet({ onClose, usersById, currentUser, onMessage, onOpenProfile }) {
  const people = Object.values(usersById || {});

  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)' }}>
      <div className="sheet-handle" />
      <div className="sheet-header">
        <h3>🐝 The Hive</h3>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>
      <div style={{ padding: '0 var(--space-4) var(--space-4)' }}>
        {people.length === 0 ? (
          <div className="empty-state">
            <div className="e-icon">🐝</div>
            <p>No one else has joined yet — invite a classmate!</p>
          </div>
        ) : (
          people.map((p) => {
            const isMe = p.uid === currentUser?.uid;
            return (
              <div
                key={p.uid}
                className={isMe ? '' : 'person-row'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                  padding: '10px 0', borderBottom: '1px solid var(--divider)',
                  cursor: isMe ? 'default' : 'pointer',
                  marginLeft: '-4px', paddingLeft: '4px', marginRight: '-4px', paddingRight: '4px', borderRadius: 8,
                }}
                onClick={() => !isMe && onOpenProfile(p.uid)}
              >
                <HexAvatar src={p.photoURL || defaultAvatar} status={p.status || 'online'} customEmoji={p.customEmoji} size="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>
                    {p.displayName || 'A classmate'}{isMe ? ' (you)' : ''}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {p.handle || ''}
                  </div>
                </div>
                <StatusLabel status={p.status || 'online'} force customEmoji={p.customEmoji} customExpiresAt={p.customExpiresAt} />
                {!isMe && (
                  <button
                    className="modal-btn secondary"
                    style={{ padding: '5px 12px', fontSize: 12, flexShrink: 0 }}
                    onClick={(e) => { e.stopPropagation(); onMessage(p); }}
                  >
                    💬
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
