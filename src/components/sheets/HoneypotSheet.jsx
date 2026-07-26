import React, { useState, useEffect } from 'react';
import { HONEYPOT_GIFTS, COSMETIC_ITEMS } from '../../data/seedData';
import * as fs from '../../firebase/firestore';

export default function HoneypotSheet({ onClose, currentUser, hunniesBalance, onGiftSent, onSelfTreatBought }) {
  const [tab, setTab] = useState('gift');
  const [pickedGift, setPickedGift] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (pickedGift && tab === 'gift') {
      setRecipientsLoading(true);
      fs.fetchOtherUsers(currentUser.uid)
        .then(setRecipients)
        .finally(() => setRecipientsLoading(false));
    }
  }, [pickedGift, tab]);

  function selectGift(gift) {
    setError(null);
    if (gift.price > hunniesBalance) {
      setError(`You need ${gift.price} 🍯 but only have ${hunniesBalance}.`);
      return;
    }
    setPickedGift(gift);
  }

  async function sendToRecipient(recipient) {
    setSending(true);
    setError(null);
    try {
      await fs.sendGift({
        fromId: currentUser.uid,
        toId: recipient.uid,
        amount: pickedGift.price,
        itemId: pickedGift.id,
        itemName: pickedGift.name,
        itemEmoji: pickedGift.emoji,
      });
      onGiftSent(pickedGift, recipient);
    } catch (e) {
      setError(e.message === 'insufficient-hunnies' ? 'Not enough Hunnies anymore — balance changed.' : 'Could not send gift — try again.');
    } finally {
      setSending(false);
    }
  }

  async function buySelf(item) {
    setSending(true);
    setError(null);
    try {
      if (item.cosmetic) {
        await fs.buyCosmetic({
          uid: currentUser.uid,
          amount: item.price,
          itemId: item.id,
          itemName: item.name,
          itemEmoji: item.emoji,
          effect: item.effect,
        });
      } else {
        await fs.buyForSelf({
          uid: currentUser.uid,
          amount: item.price,
          itemId: item.id,
          itemName: item.name,
          itemEmoji: item.emoji,
        });
      }
      onSelfTreatBought(item);
    } catch (e) {
      setError(e.message === 'insufficient-hunnies' ? 'Not enough Hunnies anymore — balance changed.' : 'Could not complete purchase.');
    } finally {
      setSending(false);
    }
  }

  // ---- Recipient picker (after choosing a gift, "Gift Someone" tab) ----
  if (pickedGift && tab === 'gift') {
    return (
      <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)' }}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h3>Send {pickedGift.emoji} {pickedGift.name}</h3>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '0 var(--space-4)' }}>
          <button className="modal-btn secondary" style={{ marginBottom: 'var(--space-3)' }} onClick={() => setPickedGift(null)}>
            ‹ Pick a different gift
          </button>
          {error && <p style={{ color: 'var(--alert)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>{error}</p>}
          {recipientsLoading ? (
            <p style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              Loading classmates <span className="typing-dots"><span></span><span></span><span></span></span>
            </p>
          ) : recipients.length === 0 ? (
            <div className="empty-state">
              <div className="e-icon">🐝</div>
              <p>No one else has signed up yet — invite a friend!</p>
            </div>
          ) : (
            recipients.map((r) => (
              <div
                key={r.uid}
                className="settings-row"
                style={{ opacity: sending ? 0.5 : 1, pointerEvents: sending ? 'none' : 'auto' }}
                onClick={() => sendToRecipient(r)}
              >
                <div className="s-icon">🧑‍🎓</div>
                <span>{r.displayName || r.handle || 'Unnamed student'}</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 'var(--space-5)' }}>
      <div className="sheet-handle" />
      <div className="sheet-header">
        <h3>🍯 The Honeypot</h3>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>
      <div style={{ padding: '0 var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
        Your balance: <b style={{ color: 'var(--accent-text)' }}>{hunniesBalance} 🍯</b>
      </div>
      <div className="tab-row">
        <button className={`tab-btn${tab === 'gift' ? ' active' : ''}`} onClick={() => { setTab('gift'); setError(null); }}>Gift Someone</button>
        <button className={`tab-btn${tab === 'self' ? ' active' : ''}`} onClick={() => { setTab('self'); setError(null); }}>Treat Yourself</button>
      </div>
      {error && <p style={{ color: 'var(--alert)', fontSize: 'var(--text-sm)', padding: '0 var(--space-4)' }}>{error}</p>}
      <div className="gift-grid" style={{ opacity: sending ? 0.5 : 1, pointerEvents: sending ? 'none' : 'auto', transition: 'opacity var(--fast) var(--ease)' }}>
        {(tab === 'self' ? COSMETIC_ITEMS : HONEYPOT_GIFTS).map((g) => (
          <div
            className="gift-item"
            key={g.id}
            title={g.desc}
            onClick={() => {
              if (g.price > hunniesBalance) {
                setError(`You need ${g.price} 🍯 but only have ${hunniesBalance}.`);
                return;
              }
              if (tab === 'self') {
                buySelf(g);
              } else {
                selectGift(g);
              }
            }}
          >
            <div className="g-emoji">{g.emoji}</div>
            <div className="g-name">{g.name}</div>
            <div className="g-price">{g.price} 🍯</div>
            {g.sponsor && <div className="sponsor-tag">{g.sponsor}</div>}
          </div>
        ))}
      </div>
      {tab === 'self' && (
        <p style={{ padding: '10px var(--space-4) 0', fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>
          All customizations last 24 hours from purchase.
        </p>
      )}
    </div>
  );
}
