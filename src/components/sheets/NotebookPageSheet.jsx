import React from 'react';

const NOTEBOOK_CONTENT = {
  'res-1': {
    subject: 'AP Bio · Krebs Cycle',
    lines: [
      "Krebs Cycle (aka Citric Acid Cycle) — happens in the mitochondria matrix!!",
      "",
      "Input: 1 Acetyl-CoA → Output: 3 NADH, 1 FADH2, 1 ATP, 2 CO2",
      "",
      "Steps (don't need exact enzyme names for the quiz, just the gist):",
      "1. Acetyl-CoA + Oxaloacetate → Citrate",
      "2. Citrate rearranges → Isocitrate",
      "3. Isocitrate → α-Ketoglutarate (releases CO2, makes NADH)",
      "4. → Succinyl-CoA (releases CO2, makes NADH)",
      "5. → Succinate (makes ATP)",
      "6. → Fumarate (makes FADH2)",
      "7. → Malate",
      "8. → back to Oxaloacetate (makes NADH) — cycle repeats!",
      "",
      "remember: cycle happens TWICE per glucose bc glycolysis makes 2 pyruvate",
      "",
      "quiz tip — they always ask 'where does this happen' — MITOCHONDRIA MATRIX",
    ],
    doodle: (
      <svg viewBox="0 0 200 100" width="100%" height="90">
        <ellipse cx="100" cy="50" rx="85" ry="38" fill="none" stroke="#2B4C7E" strokeWidth="2" />
        <path d="M40 50 Q60 30 80 50 T120 50 T160 50" fill="none" stroke="#2B4C7E" strokeWidth="1.5" strokeDasharray="4 3" />
        <circle cx="40" cy="50" r="4" fill="#2B4C7E" />
        <circle cx="80" cy="50" r="4" fill="#2B4C7E" />
        <circle cx="120" cy="50" r="4" fill="#2B4C7E" />
        <circle cx="160" cy="50" r="4" fill="#2B4C7E" />
        <text x="100" y="90" fontSize="10" fill="#2B4C7E" textAnchor="middle" fontFamily="Caveat">mitochondria matrix →</text>
      </svg>
    ),
  },
  'res-2': {
    subject: 'Algebra II · Synthetic Division',
    lines: [
      "Synthetic division — way faster than long division for (x - c)",
      "",
      "Example: divide x³ - 4x² + 5x - 2 by (x - 2)",
      "",
      "coefficients:  1   -4    5   -2",
      "c = 2:         ↓   2·1  2·(-2)  2·1",
      "               1   -2    1    0",
      "",
      "bring down first number, multiply by c, add to next column, repeat!",
      "",
      "answer: x² - 2x + 1, remainder 0 (so x-2 IS a factor!! remainder 0 = no remainder)",
      "",
      "if remainder isn't 0, it just means (x-c) isn't a clean factor",
      "write remainder as: remainder/(x-c)",
      "",
      "common mistake — forgetting to use 0 as a placeholder if a term is missing!!",
      "ex: x³ + 2 has NO x² or x term, still gotta write the 0s",
    ],
    doodle: (
      <svg viewBox="0 0 200 90" width="100%" height="80">
        <line x1="30" y1="20" x2="170" y2="20" stroke="#7A4A0C" strokeWidth="1.5" />
        <line x1="30" y1="20" x2="30" y2="70" stroke="#7A4A0C" strokeWidth="1.5" />
        <text x="45" y="35" fontSize="13" fill="#7A4A0C" fontFamily="Caveat">1</text>
        <text x="75" y="35" fontSize="13" fill="#7A4A0C" fontFamily="Caveat">-4</text>
        <text x="110" y="35" fontSize="13" fill="#7A4A0C" fontFamily="Caveat">5</text>
        <text x="145" y="35" fontSize="13" fill="#7A4A0C" fontFamily="Caveat">-2</text>
        <text x="10" y="35" fontSize="13" fill="#7A4A0C" fontFamily="Caveat">2</text>
        <text x="45" y="60" fontSize="13" fill="#B45309" fontFamily="Caveat">1</text>
        <text x="75" y="60" fontSize="13" fill="#B45309" fontFamily="Caveat">-2</text>
        <text x="110" y="60" fontSize="13" fill="#B45309" fontFamily="Caveat">1</text>
        <text x="145" y="60" fontSize="13" fill="#B45309" fontFamily="Caveat">0 ✓</text>
      </svg>
    ),
  },
  'res-3': {
    subject: 'Chemistry · Unit 4 Lab Guide',
    lines: [
      "Lab: Acid-Base Titration — official notes from Mr. Hale",
      "",
      "Goal: find the unknown concentration of an acid using a base of known concentration",
      "",
      "Materials: burette, Erlenmeyer flask, phenolphthalein indicator, unknown HCl, NaOH (known M)",
      "",
      "Procedure:",
      "1. Fill burette with NaOH, record starting volume",
      "2. Add unknown HCl + 2-3 drops phenolphthalein to flask (stays clear)",
      "3. Slowly add NaOH, swirling constantly",
      "4. STOP at first permanent light pink — that's your endpoint!",
      "5. Record final burette volume",
      "",
      "Calculation: M(acid) × V(acid) = M(base) × V(base)",
      "",
      "safety note: goggles on the WHOLE time, rinse any spills immediately",
      "  — Mr. Hale will actually take points off for this lol",
    ],
    doodle: (
      <svg viewBox="0 0 120 140" width="90" height="100" style={{ margin: '0 auto', display: 'block' }}>
        <rect x="45" y="10" width="10" height="70" fill="none" stroke="#2E7D32" strokeWidth="1.5" />
        <rect x="40" y="80" width="20" height="10" fill="none" stroke="#2E7D32" strokeWidth="1.5" />
        <path d="M35 90 L25 130 L75 130 L65 90 Z" fill="none" stroke="#2E7D32" strokeWidth="1.5" />
        <ellipse cx="50" cy="120" rx="18" ry="8" fill="#F8BBD0" opacity="0.6" />
      </svg>
    ),
  },
  'res-4': {
    subject: 'US History · Cold War Timeline',
    lines: [
      "Cold War quick timeline — the stuff that always shows up on tests",
      "",
      "1945 — WWII ends, US + USSR are the only 2 superpowers left standing",
      "1947 — Truman Doctrine (contain communism) + Marshall Plan (rebuild Europe $$)",
      "1949 — NATO forms, USSR gets the atomic bomb too (arms race starts)",
      "1950-53 — Korean War (first 'proxy war')",
      "1961 — Berlin Wall goes up overnight",
      "1962 — Cuban Missile Crisis — closest we got to actual nuclear war!!",
      "1965-73 — Vietnam War (another proxy war, this one drags forever)",
      "1969 — US lands on the moon (Space Race W)",
      "1979 — USSR invades Afghanistan",
      "1989 — Berlin Wall FALLS",
      "1991 — USSR officially collapses, Cold War over",
      "",
      "if you remember NOTHING else: it was never direct US vs USSR combat —",
      "always through 'proxy wars' + the arms/space race. that's the key idea",
    ],
    doodle: (
      <svg viewBox="0 0 200 40" width="100%" height="36">
        <line x1="10" y1="20" x2="190" y2="20" stroke="#8E2318" strokeWidth="2" />
        {[10, 55, 100, 145, 190].map((x, i) => (
          <circle key={i} cx={x} cy={20} r={4} fill="#8E2318" />
        ))}
      </svg>
    ),
  },
};

export default function NotebookPageSheet({ resource, onClose, onAskBuzz }) {
  const demoContent = NOTEBOOK_CONTENT[resource?.id];
  const content = demoContent || (resource && (resource.photoURL || resource.noteText)
    ? {
        subject: (resource.tags && resource.tags[0]) || resource.title,
        photoURL: resource.photoURL,
        lines: resource.noteText ? resource.noteText.split('\n') : [],
      }
    : null);

  return (
    <div className="sheet" style={{ borderRadius: 20, paddingBottom: 0, maxHeight: '85vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="sheet-header" style={{ background: '#FDF8E8' }}>
        <h3 style={{ color: '#3A2B12' }}>{resource?.title || 'Notes'}</h3>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>
      {content && (
        <button
          data-tutorial="ask-buzz-library-btn"
          onClick={() => onAskBuzz(resource)}
          style={{
            position: 'absolute', bottom: 18, right: 18, zIndex: 5,
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
            color: '#1A1300', border: 'none', borderRadius: 999,
            padding: '10px 16px', fontWeight: 800, fontSize: 13,
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)', cursor: 'pointer',
          }}
        >
          🐝 Ask Buzz about this
        </button>
      )}
      <div
        style={{
          flex: 1, overflowY: 'auto',
          background: `
            repeating-linear-gradient(#FDF8E8 0px, #FDF8E8 31px, #B8CDE0 32px, #FDF8E8 33px)
          `,
          backgroundColor: '#FDF8E8',
          position: 'relative',
          padding: '20px 24px 32px 44px',
        }}
      >
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 28, width: 2, background: '#E8A9A9', opacity: 0.6 }} />

        {content ? (
          <>
            <div style={{
              fontFamily: 'Caveat, cursive', fontSize: 22, fontWeight: 700,
              color: '#7A2E2E', marginBottom: 10, borderBottom: '2px solid #7A2E2E33', paddingBottom: 6,
            }}>
              {content.subject}
            </div>
            {content.doodle && (
              <div style={{ marginBottom: 10, opacity: 0.9 }}>{content.doodle}</div>
            )}
            {content.photoURL && (
              <img
                src={content.photoURL}
                alt={content.subject}
                style={{
                  width: '100%', borderRadius: 8, marginBottom: 14,
                  border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                }}
              />
            )}
            {content.lines.map((line, i) => (
              <div
                key={i}
                style={{
                  fontFamily: 'Caveat, cursive',
                  fontSize: line === '' ? 8 : 19,
                  color: '#2B2118',
                  lineHeight: '32px',
                  fontWeight: line.startsWith('quiz tip') || line.includes('remember') || line.includes('safety note') || line.includes('common mistake') ? 700 : 500,
                }}
              >
                {line || '\u00A0'}
              </div>
            ))}
          </>
        ) : (
          <div style={{ fontFamily: 'Caveat, cursive', fontSize: 20, color: '#2B2118' }}>
            (this one doesn't have notes yet — check back soon!)
          </div>
        )}
      </div>
    </div>
  );
}
