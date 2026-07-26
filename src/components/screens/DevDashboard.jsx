import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where, orderBy, limit, getCountFromServer } from 'firebase/firestore';
import { adminGrantHunnies } from '../../firebase/firestore';

// The one screen only xFactor can reach.
// Access: tap the StudyHive logo/name in the header 5 times.
// Aesthetic: neon cyberpunk — this is a command center, not a profile page.

const NEON = {
  green:  '#00FF9C',
  cyan:   '#00E5FF',
  purple: '#BF00FF',
  amber:  '#FFB800',
  red:    '#FF3860',
  dim:    'rgba(0,229,255,0.08)',
  border: 'rgba(0,229,255,0.18)',
};

function Stat({ label, value, color = NEON.cyan, sub }) {
  return (
    <div style={{
      background: NEON.dim, border: `1px solid ${color}33`,
      borderRadius: 12, padding: '14px 16px', flex: '1 1 130px', minWidth: 0,
    }}>
      <div style={{ fontSize: 11, color: NEON.border.replace('0.18', '0.6'), textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 10, color: NEON.border.replace('0.18', '0.4'), marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function NeonBar({ label, value, max, color = NEON.cyan }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: NEON.border.replace('0.18','0.55'), marginBottom: 4, letterSpacing: 0.5 }}>
        <span>{label}</span>
        <span style={{ fontFamily: 'monospace', color }}>{value}</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 999, transition: 'width 0.6s ease', boxShadow: `0 0 8px ${color}` }} />
      </div>
    </div>
  );
}

function SectionHead({ label, color = NEON.cyan }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 10px' }}>
      <div style={{ width: 3, height: 14, background: color, borderRadius: 2, boxShadow: `0 0 6px ${color}` }} />
      <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, color }}>{label}</span>
    </div>
  );
}

function GrantHunniesPanel({ allUsers, currentUser, onGranted }) {
  const [targetUid, setTargetUid] = useState(currentUser?.uid || '');
  const [amount, setAmount] = useState(100);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState(null);

  const sorted = [...(allUsers || [])].sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));

  async function handleGrant() {
    const numericAmount = Number(amount);
    if (!targetUid || !Number.isFinite(numericAmount) || numericAmount <= 0) return;
    setSending(true);
    setMsg(null);
    try {
      await adminGrantHunnies(targetUid, numericAmount);
      const target = allUsers.find((u) => u.uid === targetUid);
      setMsg(`✅ Granted 🍯${numericAmount} to ${target?.displayName || targetUid}`);
      onGranted?.();
    } catch (e) {
      setMsg(`❌ Failed: ${e.message}`);
    } finally {
      setSending(false);
    }
  }

  const inputStyle = {
    background: 'rgba(0,0,0,0.4)', border: `1px solid ${NEON.border}`, borderRadius: 8,
    padding: '9px 10px', color: NEON.green, fontFamily: 'monospace', fontSize: 13,
  };

  return (
    <div style={{ background: NEON.dim, border: `1px solid ${NEON.amber}55`, borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <select
          value={targetUid}
          onChange={(e) => setTargetUid(e.target.value)}
          style={{ ...inputStyle, flex: '1 1 180px' }}
        >
          {currentUser && (
            <option value={currentUser.uid}>👤 Yourself ({currentUser.email || currentUser.uid})</option>
          )}
          {sorted.filter((u) => u.uid !== currentUser?.uid).map((u) => (
            <option key={u.uid} value={u.uid}>{u.displayName || u.uid} — 🍯{u.hunnies ?? 0}</option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ ...inputStyle, width: 90 }}
        />
        <button
          onClick={handleGrant}
          disabled={sending || !targetUid}
          style={{
            background: NEON.amber, color: '#1A1300', fontWeight: 800, fontSize: 12.5,
            border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', flexShrink: 0,
          }}
        >
          {sending ? 'Granting...' : '🍯 Grant'}
        </button>
      </div>
      {msg && <div style={{ fontSize: 12, color: msg.startsWith('✅') ? NEON.green : NEON.red, fontFamily: 'monospace' }}>{msg}</div>}
      <div style={{ fontSize: 10, color: NEON.border.replace('0.18', '0.45'), marginTop: 6 }}>
        Increase-only (matches what the security rules actually permit for a non-owner). Logged as a real, clearly-tagged transaction — never silent.
      </div>
    </div>
  );
}

export default function DevDashboard({ onClose, currentUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshed, setRefreshed] = useState(null);

  async function fetchAll() {
    setLoading(true);
    const safeCount = async (name) => {
      try {
        const snap = await getCountFromServer(collection(db, name));
        return snap.data().count;
      } catch (e) {
        console.error(`DevDashboard: failed to count ${name}:`, e.message);
        return null;
      }
    };

    try {
      const [users, posts, dms, events, library, transactions, activeGifts] = await Promise.all([
        safeCount('users'), safeCount('posts'), safeCount('dms'),
        safeCount('calendar'), safeCount('library'),
        safeCount('hunnies_transactions'), safeCount('active_gifts'),
      ]);

      // Recent users
      let recentUsers = [];
      try {
        const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5)));
        recentUsers = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      } catch (e) {
        try {
          const snap = await getDocs(collection(db, 'users'));
          recentUsers = snap.docs.map((d) => ({ uid: d.id, ...d.data() })).slice(0, 5);
        } catch (_) { /* leave empty */ }
      }

      // Recent posts
      let recentPosts = [];
      try {
        const snap = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(5)));
        recentPosts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (_) { /* leave empty */ }

      // Status distribution + hunnies aggregate
      let statuses = {};
      let hunniesTotal = { sum: 0, count: 0 };
      let allUsers = [];
      try {
        const allUsersSnap = await getDocs(collection(db, 'users'));
        allUsers = allUsersSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));
        allUsers.forEach((u) => {
          const s = u.status || 'online';
          statuses[s] = (statuses[s] || 0) + 1;
          if (typeof u.hunnies === 'number') { hunniesTotal.sum += u.hunnies; hunniesTotal.count++; }
        });
      } catch (e) {
        console.error('DevDashboard: failed to read users for status/hunnies:', e.message);
      }

      setData({
        users, posts, dms, events, library, transactions, activeGifts,
        recentUsers, recentPosts, statuses, allUsers,
        hunniesInCirculation: hunniesTotal.sum,
        avgHunnies: hunniesTotal.count > 0 ? Math.round(hunniesTotal.sum / hunniesTotal.count) : 0,
      });
      setRefreshed(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('DevDashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const statusColors = {
    online: NEON.green, 'out-sick': NEON.red, 'heads-down': NEON.amber,
    'rough-day': '#9D6EFF', birthday: '#FF61D8', custom: NEON.purple,
  };

  const totalStatuses = data ? Object.values(data.statuses).reduce((a, b) => a + b, 0) : 1;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#050810',
      backgroundImage: `
        radial-gradient(ellipse at 20% 20%, ${NEON.purple}11 0%, transparent 60%),
        radial-gradient(ellipse at 80% 80%, ${NEON.cyan}0D 0%, transparent 60%)
      `,
      overflowY: 'auto', overflowX: 'hidden',
      fontFamily: 'var(--font)',
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(5,8,16,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${NEON.border}`,
        padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: NEON.purple, textTransform: 'uppercase', fontWeight: 700 }}>
            ◈ STUDYHIVE — OPERATOR CONSOLE
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: NEON.cyan, marginTop: 2, fontFamily: 'monospace' }}>
            DEV DASHBOARD
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {refreshed && (
            <span style={{ fontSize: 9, color: NEON.green, fontFamily: 'monospace', opacity: 0.7 }}>
              SYNC {refreshed}
            </span>
          )}
          <button
            onClick={fetchAll}
            style={{
              background: 'transparent', border: `1px solid ${NEON.cyan}44`,
              color: NEON.cyan, borderRadius: 8, padding: '6px 12px',
              fontSize: 11, cursor: 'pointer', fontWeight: 700, letterSpacing: 1,
            }}
          >
            {loading ? '...' : '⟳ REFRESH'}
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: `1px solid ${NEON.red}44`,
              color: NEON.red, borderRadius: 8, padding: '6px 12px',
              fontSize: 11, cursor: 'pointer', fontWeight: 700,
            }}
          >
            ✕ EXIT
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px 40px', maxWidth: 480, margin: '0 auto' }}>

        {loading && !data ? (
          <div style={{ textAlign: 'center', padding: 60, color: NEON.cyan, fontFamily: 'monospace', fontSize: 13, opacity: 0.6 }}>
            LOADING TELEMETRY...
          </div>
        ) : data ? (<>

          {/* Core stats */}
          <SectionHead label="Platform Overview" color={NEON.cyan} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Stat label="Users" value={data.users} color={NEON.cyan} />
            <Stat label="Posts" value={data.posts} color={NEON.green} />
            <Stat label="DM Threads" value={data.dms} color={NEON.purple} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            <Stat label="Events" value={data.events} color={NEON.amber} />
            <Stat label="Library" value={data.library} color={NEON.amber} />
            <Stat label="Transactions" value={data.transactions} color={NEON.green} />
          </div>

          {/* Hunnies economy */}
          <SectionHead label="Hunnies Economy" color={NEON.amber} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Stat label="In Circulation" value={`🍯 ${data.hunniesInCirculation}`} color={NEON.amber} />
            <Stat label="Avg / User" value={`🍯 ${data.avgHunnies}`} color={NEON.amber} />
            <Stat label="Active Gifts" value={data.activeGifts} color={NEON.purple} sub="last 12h" />
          </div>

          <SectionHead label="Grant Hunnies (Testing)" color={NEON.amber} />
          <GrantHunniesPanel allUsers={data.allUsers} currentUser={currentUser} onGranted={fetchAll} />

          {/* Status distribution */}
          <SectionHead label="User Status Distribution" color={NEON.green} />
          <div style={{ background: NEON.dim, border: `1px solid ${NEON.border}`, borderRadius: 12, padding: '14px 16px' }}>
            {Object.entries(data.statuses).map(([status, count]) => (
              <NeonBar
                key={status}
                label={status}
                value={count}
                max={totalStatuses}
                color={statusColors[status] || NEON.cyan}
              />
            ))}
          </div>

          {/* Recent users */}
          <SectionHead label="Recent Signups" color={NEON.purple} />
          <div style={{ background: NEON.dim, border: `1px solid ${NEON.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {data.recentUsers.length === 0 ? (
              <div style={{ padding: 16, color: NEON.border, fontSize: 12, fontFamily: 'monospace' }}>NO DATA</div>
            ) : data.recentUsers.map((u, i) => (
              <div key={u.uid} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                borderBottom: i < data.recentUsers.length - 1 ? `1px solid ${NEON.border}` : 'none',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: `${statusColors[u.status] || NEON.cyan}22`,
                  border: `1px solid ${statusColors[u.status] || NEON.cyan}66`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: statusColors[u.status] || NEON.cyan, fontWeight: 900,
                }}>
                  {(u.displayName || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F4F2FA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.displayName || 'Unnamed'}
                  </div>
                  <div style={{ fontSize: 10, color: NEON.border.replace('0.18','0.5'), fontFamily: 'monospace' }}>
                    @{u.handle || '—'} · {u.grade || '?'}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: statusColors[u.status] || NEON.cyan, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {u.status || 'online'}
                </div>
              </div>
            ))}
          </div>

          {/* Recent posts */}
          <SectionHead label="Recent Posts" color={NEON.green} />
          <div style={{ background: NEON.dim, border: `1px solid ${NEON.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {data.recentPosts.length === 0 ? (
              <div style={{ padding: 16, color: NEON.border, fontSize: 12, fontFamily: 'monospace' }}>NO DATA</div>
            ) : data.recentPosts.map((p, i) => (
              <div key={p.id} style={{
                padding: '10px 14px',
                borderBottom: i < data.recentPosts.length - 1 ? `1px solid ${NEON.border}` : 'none',
              }}>
                <div style={{ fontSize: 11, color: NEON.green, fontFamily: 'monospace', marginBottom: 3 }}>
                  {p.type?.toUpperCase() || 'POST'} · {p.likes?.length || 0} ❤
                </div>
                <div style={{ fontSize: 13, color: '#D4D0EA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.text || p.body || '—'}
                </div>
              </div>
            ))}
          </div>

          {/* Operator ID */}
          <SectionHead label="Operator" color={NEON.purple} />
          <div style={{
            background: NEON.dim, border: `1px solid ${NEON.purple}44`,
            borderRadius: 12, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${NEON.purple}22`, border: `1px solid ${NEON.purple}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              👑
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: NEON.purple }}>
                {currentUser?.displayName || 'xFactor'}
              </div>
              <div style={{ fontSize: 10, color: NEON.border.replace('0.18','0.5'), fontFamily: 'monospace' }}>
                {currentUser?.email}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 10, color: NEON.green, fontFamily: 'monospace', fontWeight: 700 }}>
              ● AUTHORIZED
            </div>
          </div>

        </>) : (
          <div style={{ textAlign: 'center', padding: 60, color: NEON.red, fontFamily: 'monospace', fontSize: 13 }}>
            TELEMETRY UNAVAILABLE
          </div>
        )}
      </div>
    </div>
  );
}
