import React, { useState, useEffect, useRef } from 'react';
import HexAvatar from '../HexAvatar';
import StatusLabel from '../StatusLabel';
import * as fs from '../../firebase/firestore';
import { useCountdown } from '../../utils/useCountdown';
import { BADGE_CATALOG } from '../../data/badges';

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

const BADGE_BY_ID = Object.fromEntries(BADGE_CATALOG.map((b) => [b.id, b]));

export default function ProfileScreen({ currentStatus, onOpenStatusPicker, onOpenHoneypot, onOpenHelp, onOpenEditProfile, onOpenHunniesHistory, onOpenBadges, onOpenSavedPosts, onPhotoUploaded, onReplayTutorial, onShareApp, onLogout, me, currentUser, hunniesBalance }) {
  const [activeGifts, setActiveGifts] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return undefined;
    const unsubscribe = fs.subscribeToActiveGifts(currentUser.uid, setActiveGifts);
    return unsubscribe;
  }, [currentUser]);

  async function handleAvatarTap() {
    fileInputRef.current?.click();
  }

  async function handlePhotoPick(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file later
    if (!file || !currentUser) return;
    setUploadingPhoto(true);
    try {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 20000));
      const url = await Promise.race([fs.uploadProfilePhoto(currentUser.uid, file), timeout]);
      onPhotoUploaded(url);
    } catch (err) {
      console.error('Photo upload failed:', err);
    } finally {
      setUploadingPhoto(false);
    }
  }

  const subtitle = [me.handle, me.grade, me.school].filter(Boolean).join(' · ');
  const counters = me.counters || {};
  const realStats = [
    { num: counters.postsCount || 0, label: 'Posts' },
    { num: counters.upvotesReceivedCount || 0, label: 'Upvotes' },
    { num: counters.streakDays || 0, label: 'Streak' },
    { num: counters.uploadsCount || 0, label: 'Uploads' },
  ];
  const earnedBadges = (me.badges || []).map((id) => BADGE_BY_ID[id]).filter(Boolean);

  return (
    <div className="screen active">
      <div className="profile-hero">
        <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }} onClick={handleAvatarTap}>
          <HexAvatar src={me.avatar} size="xl" status={currentStatus} customEmoji={me.customEmoji} cosmetics={me.activeCosmetics} />
          {uploadingPhoto && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff', textAlign: 'center',
            }}>
              Uploading...
            </div>
          )}
          <div style={{
            position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: '50%',
            background: 'var(--accent)', border: '2px solid var(--bg-base)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
          }}>
            📷
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoPick}
            style={{ display: 'none' }}
          />
        </div>
        <h2 style={me.activeCosmetics?.nameColor > Date.now() ? { color: '#EC4899' } : undefined}>
          {me.activeCosmetics?.crown > Date.now() && '👑 '}{me.name}
        </h2>
        <div className="handle">{subtitle}</div>
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={onOpenStatusPicker}>
          <StatusLabel status={currentStatus} force customEmoji={me.customEmoji} customExpiresAt={me.customExpiresAt} />
        </div>
        <div className="bio" style={!me.bio ? { fontStyle: 'italic', color: 'var(--text-tertiary)' } : undefined}>
          {me.bio || 'Add a bio in Edit Profile to tell people a bit about you.'}
        </div>
        <div className="badge-row" style={{ cursor: earnedBadges.length > 0 ? 'pointer' : 'default' }} onClick={() => earnedBadges.length > 0 && onOpenBadges?.()}>
          {earnedBadges.length === 0 ? (
            <div className="tiny-badge" style={{ opacity: 0.6, fontStyle: 'italic' }}>Badges you earn will show up here</div>
          ) : (
            <>
              {earnedBadges.slice(0, 6).map((b) => (
                <div className="tiny-badge" key={b.id} title={b.desc}>{b.emoji} {b.name}</div>
              ))}
              {earnedBadges.length > 6 && (
                <div className="tiny-badge" style={{ opacity: 0.7 }}>+{earnedBadges.length - 6} more</div>
              )}
            </>
          )}
        </div>

        {activeGifts.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
            {activeGifts.map((g) => <GiftBadge gift={g} key={g.id} />)}
          </div>
        )}
      </div>

      <div className="hunnies-card" data-tutorial="hunnies-card">
        <div>
          <div className="label">Hunnies Balance</div>
          <div className="amount">🍯 {hunniesBalance}</div>
        </div>
        <button className="honeypot-btn" onClick={onOpenHoneypot}>Honeypot</button>
      </div>

      <div className="stats-grid">
        {realStats.map((s) => (
          <div className="stat-cell" key={s.label}>
            <div className="num">{s.num}</div>
            <div className="lbl">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="section-header"><h3>Settings</h3></div>
      <div className="settings-list">
        <SettingsRow icon="📤" label="Share StudyHive" onClick={onShareApp} />
        <SettingsRow icon="🏅" label={`Badges (${earnedBadges.length}/${BADGE_CATALOG.length})`} onClick={onOpenBadges} dataTutorial="badges-row" />
        <SettingsRow icon="🎉" label="Set Status" onClick={onOpenStatusPicker} />
        <SettingsRow icon="✏️" label="Edit Profile" onClick={onOpenEditProfile} />
        <SettingsRow icon="🧾" label="Hunnies History" onClick={onOpenHunniesHistory} />
        <SettingsRow icon="🔖" label="Saved Posts" onClick={onOpenSavedPosts} />
        <SettingsRow icon="🛟" label="Help & Safety" onClick={onOpenHelp} />
        <SettingsRow icon="🎬" label="Replay Tutorial" onClick={onReplayTutorial} />
      </div>

      <div style={{ textAlign: 'center', marginTop: 'var(--space-5)', paddingBottom: 'var(--space-4)' }}>
        <button
          onClick={onLogout}
          style={{
            background: 'none', border: 'none', color: 'var(--text-tertiary)',
            fontSize: 12, cursor: 'pointer', textDecoration: 'underline',
            padding: 8,
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}

function SettingsRow({ icon, label, onClick, dataTutorial }) {
  return (
    <div className="settings-row" onClick={onClick} data-tutorial={dataTutorial}>
      <div className="s-icon">{icon}</div>
      <span>{label}</span>
      <div className="chev">›</div>
    </div>
  );
}
