import React, { useEffect, useState } from 'react';

const CONFETTI_COLORS = ['#F59E0B', '#22C55E', '#A855F7', '#EC4899', '#3B82F6', '#FBBF24'];
const CONFETTI_COUNT = 60;

function ConfettiPiece({ delay, left, color, rotate, drift }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '-20px',
        left: `${left}%`,
        width: 8,
        height: 14,
        background: color,
        borderRadius: 2,
        opacity: 0,
        animation: `confetti-fall 2.6s ease-in ${delay}s forwards`,
        transform: `rotate(${rotate}deg)`,
        '--drift': `${drift}px`,
        zIndex: 10000,
        pointerEvents: 'none',
      }}
    />
  );
}

export default function WelcomeGiftModal({ onChooseTour, onChooseSpend }) {
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    const pieces = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotate: Math.random() * 360,
      drift: (Math.random() - 0.5) * 200,
    }));
    setConfetti(pieces);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'rgba(0,0,0,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <style>{`
        @keyframes confetti-fall {
          0% { opacity: 1; top: -20px; transform: translateX(0) rotate(0deg); }
          100% { opacity: 0.9; top: 100vh; transform: translateX(var(--drift)) rotate(720deg); }
        }
        @keyframes gift-pop {
          0% { transform: scale(0.85); opacity: 0; }
          60% { transform: scale(1.03); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes jar-wiggle {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }
      `}</style>

      {confetti.map((c) => (
        <ConfettiPiece key={c.id} {...c} />
      ))}

      <div style={{
        background: 'var(--bg-surface-raised, #1A140E)',
        border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: 24,
        padding: '32px 28px',
        maxWidth: 360,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(245,158,11,0.15)',
        animation: 'gift-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <div style={{ fontSize: 56, marginBottom: 8, animation: 'jar-wiggle 1.8s ease-in-out infinite' }}>🍯</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#F4F2FA', marginBottom: 6 }}>
          Welcome to the Hive!
        </h2>
        <p style={{ fontSize: 15, color: '#F59E0B', fontWeight: 800, marginBottom: 4 }}>
          You just earned 50 Hunnies 🎉
        </p>
        <p style={{ fontSize: 13, color: '#A8A3C0', lineHeight: 1.5, marginBottom: 22 }}>
          That's your welcome gift — just for signing up. Spend them, gift them, or see how the
          whole hive works first.
        </p>

        <button
          onClick={onChooseTour}
          style={{
            width: '100%', padding: '13px', borderRadius: 999,
            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
            border: 'none', color: '#1A1300', fontWeight: 800, fontSize: 14.5,
            cursor: 'pointer', marginBottom: 10,
          }}
        >
          Show me around (30 sec)
        </button>
        <button
          onClick={onChooseSpend}
          style={{
            width: '100%', padding: '12px', borderRadius: 999,
            background: 'transparent', border: '1px solid rgba(245,158,11,0.35)',
            color: '#F59E0B', fontWeight: 700, fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Just take me to spend them →
        </button>
      </div>
    </div>
  );
}
