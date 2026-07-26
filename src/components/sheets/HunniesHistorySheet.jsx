import React, { useState, useEffect } from 'react';
import * as fs from '../../firebase/firestore';

function timeAgo(ts) {
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function HunniesHistorySheet({ onClose, currentUser, usersById }) {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = fs.subscribeToTransactions(currentUser.uid, setTransactions);
    return unsubscribe;
  }, [currentUser]);

  function describe(t) {
    const isSender = t.fromId === currentUser.uid;
    const isSelfBuy = t.fromId === t.toId;
    const label = t.itemName ? `${t.itemEmoji || '🎁'} ${t.itemName}` : (t.itemId ? t.itemId.replace(/_/g, ' ') : 'Hunnies transaction');

    if (isSelfBuy) return `${label} (treat yourself)`;
    if (isSender) {
      const recipient = usersById?.[t.toId]?.displayName || 'a classmate';
      return `${label} → sent to ${recipient}`;
    }
    if (t.fromId) {
      const sender = usersById?.[t.fromId]?.displayName || 'a classmate';
      return `${label} from ${sender}`;
    }
    return label; // earned via likes/uploads/upvotes/Buzz — no other person involved
  }

  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)' }}>
      <div className="sheet-handle" />
      <div className="sheet-header">
        <h3>Hunnies History</h3>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>
      <div style={{ padding: '0 var(--space-4) var(--space-4)' }}>
        {transactions.length === 0 ? (
          <div className="empty-state">
            <div className="e-icon">🍯</div>
            <p>No transactions yet — send a gift or earn some Hunnies!</p>
          </div>
        ) : (
          transactions.map((t) => (
            <div
              key={t.id}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0', borderBottom: '1px solid var(--divider)', gap: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {describe(t)}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {timeAgo(t.timestamp)}
                </div>
              </div>
              <div style={{
                flexShrink: 0, fontWeight: 800, fontSize: 'var(--text-base)',
                color: t.amount > 0 ? 'var(--positive)' : 'var(--alert)',
              }}>
                {t.amount > 0 ? '+' : ''}{t.amount} 🍯
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
