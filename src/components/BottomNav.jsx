import React from 'react';
import { BuzzNavIcon } from './BuzzMascot';

const TABS = [
  { key: 'feed', label: 'Feed', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></svg>
  )},
  { key: 'calendar', label: 'Calendar', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
  )},
  { key: 'buzz', label: 'Buzz', isFab: true },
  { key: 'library', label: 'Library', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
  )},
  { key: 'profile', label: 'Profile', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0 1 16 0v1" /></svg>
  )},
];

export default function BottomNav({ activeTab, onChangeTab }) {
  return (
    <div className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`nav-item${tab.isFab ? ' center-action' : ' wave-icon-color'}${activeTab === tab.key ? ' active' : ''}`}
          style={tab.isFab ? undefined : { '--wave-delay': '1.2s' }}
          onClick={() => onChangeTab(tab.key)}
        >
          {tab.isFab ? (
            <div className="hex-fab"><BuzzNavIcon size={51} /></div>
          ) : (
            tab.icon
          )}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
