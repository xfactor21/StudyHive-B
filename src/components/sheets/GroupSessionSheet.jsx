import React, { useState, useEffect } from 'react';
import HexAvatar from '../HexAvatar';
import ConfirmDialog from '../ConfirmDialog';
import * as fs from '../../firebase/firestore';

export default function GroupSessionSheet({ session, onClose, currentUser, usersById, showToast, me }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  useEffect(() => {
    if (!session) return undefined;
    const unsubscribe = fs.subscribeToBuzzSessionMessages(session.id, setMessages);
    return unsubscribe;
  }, [session?.id]);

  if (!session) return null;

  const isLocked = session.isBuzzThinking;
  const memberList = session.memberIds.map((uid) => ({
    uid,
    name: uid === currentUser.uid ? 'You' : (session.memberNames?.[uid] || usersById?.[uid]?.displayName || 'Classmate'),
  }));
  const canInviteMore = session.memberIds.length + (session.pendingInviteIds?.length || 0) < 5;

  async function handleSend() {
    const text = input.trim();
    if (!text || isLocked) return;
    setInput('');
    setSendError(null);
    try {
      await fs.sendGroupBuzzMessage(
        session.id, currentUser.uid, memberList.find((m) => m.uid === currentUser.uid)?.name || 'You',
        text, messages
      );
    } catch (e) {
      setInput(text); // don't lose what they typed just because the send failed
      setSendError(e.message === 'session-locked' ? "Buzz is still replying — hang tight." : "Couldn't send — try again.");
    }
  }

  async function handleInvite(inviteeUid, inviteeName) {
    try {
      await fs.inviteToBuzzSession(session.id, memberList.find((m) => m.uid === currentUser.uid)?.name || 'You', inviteeUid);
      showToast?.(`Invited ${inviteeName}`);
    } catch (e) {
      showToast?.(e.message === 'session-full' ? 'Session is full (5 max).' : 'Could not invite — try again.');
    }
  }

  async function handleLeave() {
    await fs.leaveBuzzSession(session.id, currentUser.uid);
    onClose();
  }

  const invitableUsers = Object.values(usersById || {}).filter(
    (u) => u.uid !== currentUser.uid && !session.memberIds.includes(u.uid) && !session.pendingInviteIds?.includes(u.uid)
  );

  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 0, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
      <div className="sheet-handle" />
      <div className="sheet-header">
        <h3>🐝 Study Session ({session.memberIds.length}/5)</h3>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '0 var(--space-4) var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
        {memberList.map((m) => (
          <div
            key={m.uid}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg-surface)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)', padding: '4px 10px 4px 4px',
            }}
          >
            <HexAvatar
              src={m.uid === currentUser.uid ? me?.avatar : usersById?.[m.uid]?.photoURL}
              size="sm"
              pixelSize={20}
            />
            <span style={{ fontSize: 11.5, fontWeight: 600 }}>{m.name}</span>
          </div>
        ))}
        {canInviteMore && (
          <button
            onClick={() => setShowInvite((v) => !v)}
            style={{
              background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent-text)',
              borderRadius: 'var(--radius-pill)', padding: '5px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
            }}
          >
            + Invite
          </button>
        )}
      </div>

      {showInvite && (
        <div style={{ padding: '0 var(--space-4) var(--space-3)', maxHeight: 140, overflowY: 'auto' }}>
          {invitableUsers.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No one else to invite right now.</p>
          ) : (
            invitableUsers.map((u) => (
              <div
                key={u.uid}
                onClick={() => handleInvite(u.uid, u.displayName)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 4px', cursor: 'pointer',
                  borderBottom: '1px solid var(--divider)',
                }}
              >
                <HexAvatar src={u.photoURL} size="sm" pixelSize={26} />
                <span style={{ fontSize: 13 }}>{u.displayName || 'Classmate'}</span>
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--space-4)' }}>
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="e-icon">🐝</div>
            <p>Say hey — everyone in this session sees the same thread.</p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`bubble ${m.from === 'user' ? 'user' : 'buzz'}`}
            style={{ maxWidth: '82%', marginLeft: m.from === 'user' ? 'auto' : 0 }}
          >
            {m.from === 'user' && (
              <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.7, marginBottom: 2 }}>
                {m.authorId === currentUser.uid ? 'You' : m.authorName}
              </div>
            )}
            {m.text}
          </div>
        ))}
        {isLocked && <div className="bubble buzz"><span className="typing-dots"><span></span><span></span><span></span></span></div>}
      </div>

      <div style={{ padding: 'var(--space-3) var(--space-4)' }}>
        {isLocked && (
          <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 6, textAlign: 'center' }}>
            🔒 Buzz is replying — the group can send again once he's done.
          </p>
        )}
        {sendError && <p style={{ fontSize: 11.5, color: 'var(--alert)', marginBottom: 6 }}>{sendError}</p>}
        <div className="chat-input-bar" style={{ position: 'static' }}>
          <input
            placeholder={isLocked ? "Waiting on Buzz..." : "Ask Buzz anything..."}
            value={input}
            disabled={isLocked}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          />
          <button className="send-btn" onClick={handleSend} disabled={isLocked}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg>
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 10, paddingBottom: 14 }}>
          <span onClick={() => setConfirmingLeave(true)} style={{ fontSize: 11.5, color: 'var(--text-tertiary)', cursor: 'pointer', textDecoration: 'underline' }}>
            Leave session
          </span>
        </div>
      </div>
      {confirmingLeave && (
        <ConfirmDialog
          title="Leave this study session?"
          message="You can rejoin later only if someone invites you again."
          confirmLabel="Leave"
          onConfirm={handleLeave}
          onCancel={() => setConfirmingLeave(false)}
        />
      )}
    </div>
  );
}
