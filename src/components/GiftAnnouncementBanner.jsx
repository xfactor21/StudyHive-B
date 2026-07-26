import React, { useState, useEffect } from 'react';
import * as fs from '../firebase/firestore';

const FRESH_WINDOW_MS = 2 * 60 * 60 * 1000; // only show gifts from the last 2 hours

export default function GiftAnnouncementBanner({ usersById, currentUser }) {
  const [recentGifts, setRecentGifts] = useState([]);

  useEffect(() => {
    const unsubscribe = fs.subscribeToRecentGifts(setRecentGifts);
    return unsubscribe;
  }, []);

  const freshest = recentGifts.find((g) =>
    Date.now() - (g.sentAt || 0) < FRESH_WINDOW_MS && g.fromId !== g.toId
  );
  if (!freshest) return null;

  const senderName = freshest.fromId === currentUser?.uid
    ? 'You'
    : (usersById?.[freshest.fromId]?.displayName || 'Someone');
  const receiverName = freshest.toId === currentUser?.uid
    ? 'you'
    : (usersById?.[freshest.toId]?.displayName || 'a classmate');

  return (
    <div style={{
      margin: '0 var(--space-4) var(--space-3)',
      background: 'linear-gradient(135deg, var(--accent-dim), rgba(245,158,11,0.04))',
      border: '1px solid var(--border-strong)',
      borderRadius: 14,
      padding: '10px 14px',
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: 13,
    }}>
      <span style={{ fontSize: 20 }}>{freshest.itemEmoji || '🎁'}</span>
      <span style={{ color: 'var(--text-secondary)' }}>
        <strong style={{ color: 'var(--text-primary)' }}>{senderName}</strong> sent{' '}
        <strong style={{ color: 'var(--text-primary)' }}>{receiverName}</strong>{' '}
        {freshest.itemName}!
      </span>
    </div>
  );
}
