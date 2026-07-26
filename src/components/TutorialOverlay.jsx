import React, { useState, useEffect } from 'react';

const STEPS = [
  {
    tab: 'feed', title: 'This is your Feed',
    body: "Post a thought, a question, or start a study group. Every real like pays the author Hunnies — helping is the whole point here.",
  },
  {
    tab: 'feed', title: 'Tap your avatar anytime',
    body: "That's your status. Out sick, heads down, having a rough day — set it here, and your hex ring changes color everywhere so friends know at a glance.",
    highlight: '[data-tutorial="composer-avatar"]',
  },
  {
    tab: 'feed', title: 'Share something',
    body: "Tap here to post. You can optionally tag it with one of your classes so classmates taking the same thing can find it.",
    highlight: '[data-tutorial="composer-pill"]',
  },
  {
    tab: 'calendar', title: 'Stay on top of class',
    body: "A week-view calendar built for actual school stuff — tests, homework, study groups — not generic events.",
  },
  {
    tab: 'calendar', title: 'Add a class event',
    body: "Leads with the class first, then a color-coded type. Tap a day in the strip above to jump straight to it.",
    highlight: '[data-tutorial="add-event"]',
  },
  {
    tab: 'buzz', title: "Meet Buzz",
    body: "Real AI, but he won't just hand you the answer — he nudges you toward it. Annoying at first, but you'll actually remember it on the test.",
  },
  {
    tab: 'buzz', title: 'Study together',
    body: "Pull in up to 4 classmates for a shared Buzz session. Everyone sees the same thread — and the whole group waits its turn so nobody talks over Buzz.",
    highlight: '[data-tutorial="study-session-btn"]',
  },
  {
    tab: 'library', title: 'The Library',
    body: "Real notes from real classmates. Upvoting someone's upload pays them Hunnies too — the best notes actually get recognized.",
  },
  {
    tab: 'library', title: 'Upload your own',
    body: "A photo of your handwritten notes, or just type them up — either way it lands on a real page for classmates to actually read.",
    highlight: '[data-tutorial="upload-btn"]',
  },
  {
    tab: 'library', title: 'Stuck on someone\'s notes?',
    body: "Tap a resource to open it, then hit \"Ask Buzz about this\" — he already knows exactly what you're reading and jumps straight into helping, no explaining needed.",
  },
  {
    tab: 'profile', title: 'Your Hunnies',
    body: "You start with 50, free. After that, they only come from helping people — never from spending real money. Spend them here on gifts or yourself.",
    highlight: '[data-tutorial="hunnies-card"]',
  },
  {
    tab: 'profile', title: 'Badges',
    body: "50 of them, all real, all earned by actually doing things — no badge here is just handed to you.",
    highlight: '[data-tutorial="badges-row"]',
  },
  {
    tab: 'profile', title: "That's the tour",
    body: "Everything here is real — no demo data pretending to work. Go be helpful. 🐝",
  },
];

export default function TutorialOverlay({ onFinish, onNavigate, currentTab }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // Navigate the real app to whatever tab this step is about.
  useEffect(() => {
    if (current.tab !== currentTab) {
      onNavigate(current.tab);
    }
  }, [step]);

  // Highlight the real live element this step points at, if any -
  // waits a tick for the tab switch above to actually render first.
  useEffect(() => {
    let el = null;
    const timer = setTimeout(() => {
      if (current.highlight) {
        el = document.querySelector(current.highlight);
        el?.classList.add('tutorial-spotlight');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
    return () => {
      clearTimeout(timer);
      el?.classList.remove('tutorial-spotlight');
      if (current.highlight) {
        document.querySelector(current.highlight)?.classList.remove('tutorial-spotlight');
      }
    };
  }, [step]);

  function next() {
    if (isLast) { onFinish(); return; }
    setStep((s) => s + 1);
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9996,
      background: 'rgba(0,0,0,0.55)',
      pointerEvents: 'auto',
    }}>
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 9998,
        background: 'var(--bg-surface-raised, #1A140E)',
        borderTop: '1px solid rgba(245,158,11,0.3)',
        borderRadius: '20px 20px 0 0',
        padding: '20px 22px 26px',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1, color: 'var(--accent-text)', textTransform: 'uppercase' }}>
            Step {step + 1} of {STEPS.length}
          </span>
          <span onClick={onFinish} style={{ fontSize: 12, color: 'var(--text-tertiary)', cursor: 'pointer', textDecoration: 'underline' }}>
            Skip
          </span>
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 900, color: '#F4F2FA', marginBottom: 6 }}>{current.title}</h3>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>{current.body}</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 16 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 16 : 5, height: 5, borderRadius: 999,
                background: i === step ? '#F59E0B' : 'rgba(245,158,11,0.25)',
                transition: 'all 0.25s ease',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button
              onClick={back}
              style={{
                flex: '0 0 auto', padding: '12px 18px', borderRadius: 999,
                background: 'transparent', border: '1px solid rgba(245,158,11,0.3)',
                color: 'var(--text-secondary)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
              }}
            >
              Back
            </button>
          )}
          <button
            onClick={next}
            style={{
              flex: 1, padding: '12px 18px', borderRadius: 999,
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              border: 'none', color: '#1A1300', fontWeight: 800, fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {isLast ? "Let's go 🐝" : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
