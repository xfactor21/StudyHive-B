import React from 'react';

/**
 * Buzz's "teacher" scene for the top of Ask Buzz — grad cap, a pointer,
 * a chalkboard behind him. Two animation states:
 *  - isThinking (true while waiting on Buzz's real API response): he
 *    "writes" a scribbled line on the chalkboard, looping.
 *  - idle (waiting on the student to type): he floats gently side to side.
 * Same body/face language as BuzzMascot so he's recognizably the same bee.
 */
export default function BuzzTeacherScene({ isThinking = false, size = 150, outfit = 'grad' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      {/* Chalkboard */}
      <rect x="18" y="14" width="164" height="108" rx="6" fill="#2E4034" stroke="#6B4A2A" strokeWidth="7" />
      <rect x="18" y="14" width="164" height="108" rx="6" fill="none" stroke="#000" strokeOpacity="0.15" strokeWidth="1" />
      {/* chalk tray */}
      <rect x="22" y="122" width="156" height="6" rx="2" fill="#8A6238" />

      {/* Scribbled "writing" line — only animates while thinking */}
      <path
        d="M35 45 Q55 30 75 48 T115 44 Q130 55 148 42"
        fill="none"
        stroke="#F4F2EA"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity={isThinking ? 0.85 : 0.25}
        strokeDasharray="220"
        strokeDashoffset={isThinking ? 0 : 220}
        style={{
          transition: isThinking ? 'none' : 'opacity 0.4s ease',
          animation: isThinking ? 'buzz-chalk-write 2.2s ease-in-out infinite' : 'none',
        }}
      />
      <path
        d="M40 78 Q60 68 82 80 T140 76"
        fill="none"
        stroke="#F4F2EA"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={isThinking ? 0.6 : 0.15}
        strokeDasharray="180"
        strokeDashoffset={isThinking ? 0 : 180}
        style={{
          animation: isThinking ? 'buzz-chalk-write 2.2s ease-in-out 0.3s infinite' : 'none',
        }}
      />

      {/* Buzz himself — floats side to side only when idle */}
      <g style={{ animation: isThinking ? 'none' : 'buzz-idle-float 3.6s ease-in-out infinite', transformOrigin: '100px 150px' }}>
        {/* pointer stick */}
        <line
          x1="148" y1="168" x2="118" y2="96"
          stroke="#8A6238" strokeWidth="4" strokeLinecap="round"
          style={{
            transformOrigin: '148px 168px',
            animation: isThinking ? 'buzz-point-tap 2.2s ease-in-out infinite' : 'none',
          }}
        />

        {/* wings */}
        <g className="buzz-wing-left">
          <ellipse cx="72" cy="150" rx="17" ry="12" fill="#F4F1FB" opacity="0.9" transform="rotate(-18 72 150)" />
        </g>
        <g className="buzz-wing-right">
          <ellipse cx="128" cy="150" rx="17" ry="12" fill="#F4F1FB" opacity="0.9" transform="rotate(18 128 150)" />
        </g>

        {/* body */}
        <circle cx="100" cy="150" r="24" fill="#FBBF24" />
        <path d="M76 163 a24 27 0 0 0 48 0 L124 195 a24 22 0 0 1 -48 0 Z" fill="#FBBF24" />
        <rect x="76" y="161" width="48" height="9" fill="#3A2B12" />
        <rect x="77" y="177" width="46" height="8" fill="#3A2B12" />

        {/* face */}
        <circle cx="91" cy="147" r="5" fill="#2B2118" />
        <circle cx="109" cy="147" r="5" fill="#2B2118" />
        <circle cx="93" cy="144.8" r="1.7" fill="#FFFFFF" />
        <circle cx="111" cy="144.8" r="1.7" fill="#FFFFFF" />
        <path d="M90 158 Q100 164 110 158" stroke="#2B2118" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* graduation cap (default) OR sunglasses + bowtie (Buzz's Wardrobe cosmetic) */}
        {outfit === 'cool' ? (
          <g>
            <rect x="82" y="140" width="16" height="10" rx="3" fill="#111827" />
            <rect x="102" y="140" width="16" height="10" rx="3" fill="#111827" />
            <rect x="98" y="143" width="4" height="3" fill="#111827" />
            <path d="M93 175 L100 180 L107 175 L100 172 Z" fill="#EC4899" />
          </g>
        ) : (
          <g>
            <rect x="88" y="118" width="24" height="7" rx="1.5" fill="#1F2937" />
            <path d="M70 116 L100 104 L130 116 L100 128 Z" fill="#1F2937" />
            <circle cx="130" cy="116" r="2.6" fill="#1F2937" />
            <line x1="130" y1="116" x2="133" y2="132" stroke="#F59E0B" strokeWidth="2" />
            <circle cx="133" cy="134" r="3" fill="#F59E0B" />
          </g>
        )}
      </g>

      <style>{`
        @keyframes buzz-chalk-write {
          0% { stroke-dashoffset: 220; }
          45%, 100% { stroke-dashoffset: 0; }
        }
        @keyframes buzz-idle-float {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          50% { transform: translateX(6px) rotate(1.5deg); }
        }
        @keyframes buzz-point-tap {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-6deg); }
        }
      `}</style>
    </svg>
  );
}
