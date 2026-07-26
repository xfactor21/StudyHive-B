import React, { useState, useEffect } from 'react';
import BuzzTeacherScene from '../BuzzTeacherScene';
import { askBuzzFn, bumpCounterAndCheckBadges } from '../../firebase/firestore';

const SUBJECTS = [
  { label: '📐 Math', prompt: "I need help with a math problem" },
  { label: '🧪 Science', prompt: "I'm stuck on a science concept" },
  { label: '📖 English', prompt: "I need help understanding something I read" },
  { label: '🌍 History', prompt: "I'm trying to make sense of a history topic" },
  { label: '🗣️ Languages', prompt: "I need help with a language I'm learning" },
];

const SEED_MESSAGES = [
  { from: 'buzz', text: "yo 🐝 what's got you stuck?" },
];

export default function AskBuzzScreen({ currentUser, showToast, me, mySessions = [], myInvites = [], usersById, onOpenSession, onCreateSession, onAcceptInvite, onDeclineInvite, pendingResource, onResourceConsumed }) {
  const [messages, setMessages] = useState(SEED_MESSAGES);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [activeResourceContext, setActiveResourceContext] = useState(null);

  // Arriving here from "Ask Buzz about this" on a Library resource:
  // greet with the resource already in mind, and keep that context
  // attached to every message for the rest of this session — not just
  // the first one.
  useEffect(() => {
    if (!pendingResource) return;
    setActiveResourceContext(pendingResource);
    setMessages([
      { from: 'buzz', text: `oh, "${pendingResource.title}"? bet 🐝 let's get into it — what part's giving you trouble?` },
    ]);
    onResourceConsumed?.();
  }, [pendingResource]);

  async function sendText(text) {
    if (!text.trim() || sending) return;
    const nextMessages = [...messages, { from: 'user', text }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);
    setError(null);
    try {
      // Strip Buzz's opening greeting before calling the API — it's
      // just a UI seed, not a real turn, and Gemini (like most chat
      // APIs) expects the conversation to start with a real user turn.
      const firstUserIndex = nextMessages.findIndex((m) => m.from === 'user');
      const apiMessages = firstUserIndex >= 0 ? nextMessages.slice(firstUserIndex) : nextMessages;
      const payload = { messages: apiMessages };
      if (activeResourceContext) payload.resourceContext = activeResourceContext;
      const result = await askBuzzFn(payload);
      setMessages((prev) => [...prev, { from: 'buzz', text: result.data.reply }]);

      if (currentUser) {
        // Hunnies for Buzz milestones/bonuses are now awarded server-side
        // (functions/index.js), using the Admin SDK - a client-side self-
        // award was a real exploit surface (anyone could call it with any
        // amount). The server already incremented buzzQuestionsCount too,
        // so this call passes empty deltas - it only checks/awards any
        // newly-qualified badges and runs streak tracking against the
        // counter the server just updated, without double-counting it.
        bumpCounterAndCheckBadges(currentUser.uid, {}).catch((e) => console.error('Badge check failed:', e));

        if (result.data.awardedAmount > 0) {
          showToast?.(`🐝 +${result.data.awardedAmount} Hunnies from Buzz!`);
        }
      }
    } catch (e) {
      console.error(e);
      setError("Couldn't reach Buzz — check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="screen active">
      <div className="screen-title"><span className="wave-text" style={{ '--wave-delay': '0.2s' }}>Ask Buzz</span></div>
      <div className="buzz-hero">
        <div className="buzz-mascot">
          <BuzzTeacherScene
            isThinking={sending}
            size={150}
            outfit={me?.activeCosmetics?.buzzOutfit > Date.now() ? 'cool' : 'grad'}
          />
        </div>
        <h2>What are we figuring out?</h2>
        <p>I guide. You solve. That's the deal.</p>
      </div>

      {myInvites.length > 0 && myInvites.map((inv) => (
        <div
          key={inv.id}
          style={{
            margin: '0 var(--space-4) var(--space-3)', padding: '10px 14px', borderRadius: 14,
            background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          }}
        >
          <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>🐝 You're invited to a study session</span>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => onAcceptInvite(inv)}
              style={{ background: '#A855F7', color: '#fff', border: 'none', borderRadius: 999, padding: '5px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
            >
              Join
            </button>
            <button
              onClick={() => onDeclineInvite(inv.id)}
              style={{ background: 'none', color: 'var(--text-tertiary)', border: '1px solid var(--border)', borderRadius: 999, padding: '5px 12px', fontSize: 11.5, cursor: 'pointer' }}
            >
              No thanks
            </button>
          </div>
        </div>
      ))}

      {mySessions.length > 0 ? (
        <div style={{ margin: '0 var(--space-4) var(--space-3)' }}>
          <button
            onClick={() => onOpenSession(mySessions[0])}
            style={{
              width: '100%', padding: 12, borderRadius: 14, background: 'var(--accent-dim)',
              border: '1px solid var(--accent)', color: 'var(--accent-text)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
            }}
          >
            🐝 Rejoin your study session ({mySessions[0].memberIds.length}/5)
          </button>
        </div>
      ) : (
        <div style={{ margin: '0 var(--space-4) var(--space-3)' }}>
          <button
            onClick={onCreateSession}
            data-tutorial="study-session-btn"
            style={{
              width: '100%', padding: 12, borderRadius: 14, background: 'var(--bg-surface)',
              border: '1px dashed var(--border-strong)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
            }}
          >
            👥 Start a Study Session (up to 5 people)
          </button>
        </div>
      )}

      <div className="subject-chips" style={sending ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
        {SUBJECTS.map((s) => (
          <div className="chip" key={s.label} onClick={() => sendText(s.prompt)}>
            {s.label}
          </div>
        ))}
      </div>

      <div className="chat-thread">
        {messages.map((m, i) => (
          <div className={`bubble ${m.from === 'user' ? 'user' : 'buzz'}`} key={i}>
            {m.text}
          </div>
        ))}
        {sending && <div className="bubble buzz"><span className="typing-dots"><span></span><span></span><span></span></span></div>}
        {error && <p style={{ color: 'var(--alert)', fontSize: 'var(--text-sm)', padding: '0 var(--space-2)' }}>{error}</p>}
      </div>
      <div style={{ height: 76 }} />

      <div className="chat-input-bar">
        <input
          placeholder="Ask Buzz anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') sendText(input); }}
        />
        <button className="send-btn" onClick={() => sendText(input)} disabled={sending} style={sending ? { opacity: 0.5, cursor: 'default' } : undefined}>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg>
        </button>
      </div>
    </div>
  );
}
