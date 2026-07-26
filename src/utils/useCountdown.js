import { useState, useEffect } from 'react';

function formatRemaining(expiresAt) {
  const ms = expiresAt - Date.now();
  if (ms <= 0) return 'expired';
  const hrs = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hrs > 0) return `${hrs}h ${mins}m left`;
  return `${mins}m left`;
}

/** Live-updating "Xh Ym left" text, ticking every 30s. Pass a millisecond
 * timestamp for when the thing expires. */
export function useCountdown(expiresAt) {
  const [text, setText] = useState(() => formatRemaining(expiresAt));

  useEffect(() => {
    setText(formatRemaining(expiresAt));
    const interval = setInterval(() => setText(formatRemaining(expiresAt)), 30000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return text;
}
