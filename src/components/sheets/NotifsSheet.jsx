import React, { useState, useRef } from 'react';
import * as fs from '../../firebase/firestore';

function timeAgo(ms) {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotifRow({ n, onDismiss, onMarkRead }) {
  const [dragX, setDragX] = useState(0);
  const startX = useRef(null);
  const dragging = useRef(false);

  function handleStart(clientX) {
    startX.current = clientX;
    dragging.current = true;
  }
  function handleMove(clientX) {
    if (!dragging.current || startX.current === null) return;
    const delta = clientX - startX.current;
    if (delta < 0) setDragX(delta); // only allow swiping left to dismiss
  }
  function handleEnd() {
    dragging.current = false;
    if (dragX < -80) {
      onDismiss(n.id);
    } else {
      setDragX(0);
    }
  }

  return (
    <div
      style={{ position: 'relative', overflow: 'hidden' }}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => e.buttons === 1 && handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={() => dragging.current && handleEnd()}
    >
      <div style={{
        position: 'absolute', inset: 0, background: 'var(--alert)',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        padding: '0 20px', color: '#fff', fontWeight: 700, fontSize: 12,
      }}>
        Remove
      </div>
      <div
        className={`notif-row${!n.read ? ' unread' : ''}`}
        onClick={() => !n.read && onMarkRead(n.id)}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging.current ? 'none' : 'transform 0.2s ease',
          background: 'var(--bg-surface)',
          cursor: 'pointer',
        }}
      >
        <div className="notif-icon-circle" style={{ background: n.iconBg }}>{n.icon}</div>
        <div className="notif-text">
          {n.text}
          <div className="notif-time">{timeAgo(n.timestamp || Date.now())}</div>
        </div>
      </div>
    </div>
  );
}

export default function NotifsSheet({ onClose, notifications, onDismiss, onMarkRead, onMarkAllRead }) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)' }}>
      <div className="sheet-handle" />
      <div className="sheet-header">
        <h3>Notifications</h3>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>
      {unreadCount > 0 && (
        <div style={{ padding: '0 var(--space-4) var(--space-3)', textAlign: 'right' }}>
          <span
            onClick={onMarkAllRead}
            style={{ fontSize: 12, color: 'var(--accent-text)', cursor: 'pointer', fontWeight: 600 }}
          >
            Mark all read
          </span>
        </div>
      )}
      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="e-icon">🔔</div>
          <p>Nothing yet — likes, comments, gifts, upvotes, and badges will show up here.</p>
        </div>
      ) : (
        notifications.map((n) => (
          <NotifRow key={n.id} n={n} onDismiss={onDismiss} onMarkRead={onMarkRead} />
        ))
      )}
    </div>
  );
}
