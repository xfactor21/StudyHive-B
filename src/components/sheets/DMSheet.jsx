import React, { useState, useEffect } from 'react';
import HexAvatar from '../HexAvatar';
import StatusLabel from '../StatusLabel';
import { defaultAvatar } from '../../data/avatars';
import * as fs from '../../firebase/firestore';

function timeAgo(ms) {
  if (!ms) return '';
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function DMSheet({ onClose, currentUser, usersById, openConversationWith, onOpened }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null); // { id, otherUid }
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState(null);

  useEffect(() => {
    if (!currentUser) return undefined;
    const unsubscribe = fs.subscribeToMyConversations(currentUser.uid, setConversations);
    return unsubscribe;
  }, [currentUser]);

  // If App.jsx asked us to jump straight into a thread with someone
  // (e.g. tapping "Message" from their profile), do that once on open.
  useEffect(() => {
    if (!openConversationWith || !currentUser) return;
    (async () => {
      try {
        const conversationId = await fs.ensureConversation(currentUser.uid, openConversationWith.uid);
        setActiveConvo({ id: conversationId, otherUid: openConversationWith.uid });
        fs.markConversationViewed(conversationId, currentUser.uid).catch(() => {});
      } catch (e) {
        console.error('Failed to open conversation:', e);
      } finally {
        onOpened?.();
      }
    })();
  }, [openConversationWith, currentUser]);

  useEffect(() => {
    if (!activeConvo) return undefined;
    const unsubscribe = fs.subscribeToConversation(activeConvo.id, setMessages);
    return unsubscribe;
  }, [activeConvo]);

  async function openReal(convo) {
    const otherUid = convo.participants.find((p) => p !== currentUser.uid);
    setActiveConvo({ id: convo.id, otherUid });
    fs.markConversationViewed(convo.id, currentUser.uid).catch(() => {});
  }

  async function send() {
    const text = draft.trim();
    if (!text || !activeConvo) return;
    setDraft('');
    setSendError(null);
    try {
      await fs.sendMessage(activeConvo.id, { senderId: currentUser.uid, text });
    } catch (e) {
      console.error('Failed to send message:', e);
      setDraft(text); // don't lose what they typed just because the send failed
      setSendError("Couldn't send — try again.");
    }
  }

  // ---- Thread view ----
  if (activeConvo) {
    const other = usersById?.[activeConvo.otherUid];
    const otherName = other?.displayName || 'A classmate';
    const otherAvatar = other?.photoURL || defaultAvatar;
    const otherStatus = other?.status || 'online';
    const otherCustomEmoji = other?.customEmoji;
    const otherCustomExpiresAt = other?.customExpiresAt;

    return (
      <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)' }}>
        <div className="chat-thread-header">
          <button className="back-btn" onClick={() => setActiveConvo(null)}>‹</button>
          <HexAvatar src={otherAvatar} status={otherStatus} customEmoji={otherCustomEmoji} size="sm" />
          <div>
            <h3>{otherName}</h3>
            <div className="sub"><StatusLabel status={otherStatus} force customEmoji={otherCustomEmoji} customExpiresAt={otherCustomExpiresAt} /></div>
          </div>
          <button className="close-x" style={{ marginLeft: 'auto' }} onClick={onClose}>✕</button>
        </div>

        <div className="chat-thread-body">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="e-icon">💬</div>
              <p>Say hey — no messages yet.</p>
            </div>
          ) : (
            messages.map((m) => (
              <div className={`dm-bubble ${m.senderId === currentUser.uid ? 'me' : 'them'}`} key={m.id}>
                {m.text}
              </div>
            ))
          )}
        </div>

        {sendError && (
          <p style={{ color: 'var(--alert)', fontSize: 12, textAlign: 'center', padding: '0 var(--space-4)', marginBottom: 4 }}>
            {sendError}
          </p>
        )}
        <div className="chat-thread-input-bar">
          <input
            placeholder={`Message ${otherName.split(' ')[0]}...`}
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setSendError(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          />
          <button className="send-btn" onClick={send}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg>
          </button>
        </div>
      </div>
    );
  }

  // ---- Conversation list ----
  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)' }}>
      <div className="sheet-handle" />
      <div className="sheet-header">
        <h3>Messages</h3>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>

      {conversations.length === 0 ? (
        <div className="empty-state">
          <div className="e-icon">💬</div>
          <p>No messages yet — visit The Hive to say hi to a classmate.</p>
        </div>
      ) : (
        conversations.map((convo) => {
          const otherUid = convo.participants.find((p) => p !== currentUser.uid);
          const other = usersById?.[otherUid];
          const otherName = other?.displayName || 'A classmate';
          const otherAvatar = other?.photoURL || defaultAvatar;
          const otherStatus = other?.status || 'online';
          const otherCustomEmoji = other?.customEmoji;
          const otherCustomExpiresAt = other?.customExpiresAt;
          return (
            <div className="dm-row" key={convo.id} onClick={() => openReal(convo)}>
              <HexAvatar src={otherAvatar} status={otherStatus} customEmoji={otherCustomEmoji} size="md" />
              <div className="dm-info">
                <div className="dm-top-row">
                  <span className="dm-name">
                    {otherName}{' '}
                    <StatusLabel status={otherStatus} customEmoji={otherCustomEmoji} customExpiresAt={otherCustomExpiresAt} style={{ fontSize: 9, padding: '1px 6px' }} />
                  </span>
                  <span className="dm-time">{timeAgo(fs.toMillis(convo.lastMessageAt))}</span>
                </div>
                <div className="dm-preview">{convo.lastMessageText || 'Say hey!'}</div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
