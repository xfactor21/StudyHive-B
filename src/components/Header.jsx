import React, { useRef, useState } from 'react';
import BuzzMascot from './BuzzMascot';

export default function Header({ onOpenSheet, dmUnreadCount, notifUnreadCount, onOpenDev, onShare }) {
  const tapCount = useRef(0);
  const tapTimer = useRef(null);

  function handleLogoTap() {
    tapCount.current += 1;
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      clearTimeout(tapTimer.current);
      onOpenDev();
      return;
    }
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 1500);
  }

  return (
    <div className="app-header">
      <div className="brand-mark" onClick={handleLogoTap} style={{ cursor: 'pointer' }}>
        <BuzzMascot size={39} face={false} animated={true} shadow={false} />
        <span className="brand-title">StudyHive</span>
      </div>
      <div className="header-icons">
        <button className="icon-btn wave-icon-color" style={{ '--wave-delay': '0.7s' }} onClick={onShare} title="Invite a friend">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>
        <button className="icon-btn wave-icon-color" style={{ '--wave-delay': '0.7s' }} onClick={() => onOpenSheet('people')} title="The Hive">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </button>
        <button className="icon-btn wave-icon-color" style={{ '--wave-delay': '0.7s' }} onClick={() => onOpenSheet('dms')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          {dmUnreadCount > 0 && <span className="badge-dot">{dmUnreadCount}</span>}
        </button>
        <button className="icon-btn wave-icon-color" style={{ '--wave-delay': '0.7s' }} onClick={() => onOpenSheet('notifs')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          {notifUnreadCount > 0 && <span className="badge-dot">{notifUnreadCount}</span>}
        </button>
      </div>
    </div>
  );
}
