import React, { useEffect, useState } from 'react';
import BuzzMascot from './BuzzMascot';

const SPLASH_DURATION = 1500; // total time splash is shown, ms
const TAGLINES = ['Bee Yourself. Study With the Swarm.', 'Bee You. Swarm Up!'];
const PHRASE_DURATION = SPLASH_DURATION / TAGLINES.length;
const CROSSFADE_MS = 250;

export default function Splash({ onDone }) {
  const [visible, setVisible] = useState(true);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [taglineVisible, setTaglineVisible] = useState(true);

  useEffect(() => {
    // Crossfade: fade out near the end of each phrase's slot, swap text,
    // fade back in — repeating for each tagline in the list.
    const swapTimers = [];
    TAGLINES.forEach((_, i) => {
      if (i === 0) return; // first tagline is already showing
      const swapAt = i * PHRASE_DURATION;
      swapTimers.push(setTimeout(() => setTaglineVisible(false), swapAt - CROSSFADE_MS));
      swapTimers.push(setTimeout(() => {
        setTaglineIndex(i);
        setTaglineVisible(true);
      }, swapAt));
    });

    const fadeTimer = setTimeout(() => setVisible(false), SPLASH_DURATION);
    const doneTimer = setTimeout(() => onDone(), SPLASH_DURATION + 400);

    return () => {
      swapTimers.forEach(clearTimeout);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      id="splash"
      style={{
        transition: 'opacity 400ms ease',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div className="splash-hex">
        <BuzzMascot size={130} />
      </div>
      <h1>StudyHive</h1>
      <p
        style={{
          transition: `opacity ${CROSSFADE_MS}ms ease`,
          opacity: taglineVisible ? 1 : 0,
          maxWidth: 260,
          textAlign: 'center',
          padding: '0 16px',
        }}
      >
        {TAGLINES[taglineIndex]}
      </p>
    </div>
  );
}
