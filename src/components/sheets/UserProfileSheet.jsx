import React, { useState, useEffect } from 'react';
import HexAvatar from '../HexAvatar';
import StatusLabel from '../StatusLabel';
import * as fs from '../../firebase/firestore';
import { useCountdown } from '../../utils/useCountdown';
import { BADGE_CATALOG } from '../../data/badges';

const BADGE_BY_ID = Object.fromEntries(BADGE_CATALOG.map((b) => [b.id, b]));

function GiftBadge({ gift }) {
  const remaining = useCountdown(gift.expiresAt);
  return (
    <div
      title={`Received ${gift.itemName}`}
      style={{
        background: 'var(--accent-dim)', border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-pill)', padding: '4px 10px',
        fontSize: 13, fontWeight: 700, color: 'var(--accent-text)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      <span>{gift.itemEmoji} {gift.itemName}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
        {remaining}
      </span>
    </div>
  );
}

// Shows either the current user's own profile or a real classmate's,
// depending on what App.jsx passes in as `profile`. `isMe` controls
// whether the Message button shows (doesn't make sense to message
// yourself).
export default function UserProfileSheet({ open, onClose, profile, isMe, onMessage }) {
  const [activeGifts, setActiveGifts] = useState([]);

  useEffect(() => {
    if (!open || !profile?.uid) return undefined;
    const unsubscribe = fs.subscribeToActiveGifts(profile.uid, setActiveGifts);
    return unsubscribe;
  }, [open, profile?.uid]);

  if (!open || !profile) return null;

  const earnedBadges = (profile.badges || []).map((id) => BADGE_BY_ID[id]).filter(Boolean);

  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)' }}>
      <div className="sheet-handle" />
      <div style={{ textAlign: 'right', padding: '8px 12px 0' }}>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>
      <div className="modal-profile-head">
        <HexAvatar src={profile.avatar} status={profile.status} customEmoji={profile.customEmoji} size="xl" cosmetics={profile.activeCosmetics} />
        <h3>{profile.name}</h3>
        <div className="handle">{profile.handle}</div>
        <div style={{ marginTop: 8 }}>
          <StatusLabel status={profile.status} force customEmoji={profile.customEmoji} customExpiresAt={profile.customExpiresAt} />
        </div>
        {profile.bio && (
          <div className="bio" style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 280 }}>
            {profile.bio}
          </div>
        )}
        {earnedBadges.length > 0 && (
          <div className="badge-row">
            {earnedBadges.slice(0, 6).map((b) => (
              <div className="tiny-badge" key={b.id} title={b.desc}>{b.emoji} {b.name}</div>
            ))}
            {earnedBadges.length > 6 && (
              <div className="tiny-badge" style={{ opacity: 0.7 }}>+{earnedBadges.length - 6} more</div>
            )}
          </div>
        )}
        {activeGifts.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {activeGifts.map((g) => <GiftBadge gift={g} key={g.id} />)}
          </div>
        )}
        {!isMe && (
          <button
            className="modal-btn primary"
            style={{ marginTop: 16, padding: '10px 24px' }}
            onClick={() => onMessage(profile)}
          >
            💬 Message
          </button>
        )}
      </div>
      {profile.stats && (
        <div className="stats-grid" style={{ margin: '0 var(--space-4) var(--space-4)' }}>
          {profile.stats.map((s) => (
            <div className="stat-cell" key={s.label}>
              <div className="num">{s.num}</div>
              <div className="lbl">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
