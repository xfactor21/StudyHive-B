import React from 'react';
import { useCountdown } from '../utils/useCountdown';

export const STATUS_EMOJI = {
  'online': '🟢',
  'out-sick': '🤒',
  'heads-down': '📚',
  'rough-day': '😤',
  'free-period': '😎',
  'custom': '🎉',
};

const STATUS_TEXT = {
  'online': 'Online',
  'out-sick': 'Out Sick',
  'heads-down': 'Heads Down',
  'rough-day': 'Rough Day',
  'free-period': 'Free Period',
  'custom': 'Hive Roulette',
};

/**
 * Small colored pill showing a presence status, e.g. "😤 Rough Day".
 * Renders nothing for 'online' by default since that's the baseline
 * state and showing it everywhere would be visual noise (see build
 * guide addendum — this was a deliberate design call, not an oversight).
 *
 * "Custom" status is a random roulette (see RARE_CUSTOM_EMOJI) locked
 * for 12 hours — pass customEmoji + customExpiresAt to show the actual
 * rolled emoji and a live countdown instead of the generic 🎉.
 */
export default function StatusLabel({ status, style, force = false, customEmoji, customExpiresAt }) {
  const isCustom = status === 'custom' && customEmoji && customExpiresAt;
  const expired = isCustom && customExpiresAt < Date.now();

  if (!status || ((status === 'online' || expired) && !force)) return null;
  if (expired) return null;

  const emoji = isCustom ? customEmoji : (STATUS_EMOJI[status] || '');
  const label = `${emoji} ${STATUS_TEXT[status] || status}`;

  return (
    <span className={`status-label ${status}`} style={style}>
      {label}
      {isCustom && <CustomCountdown expiresAt={customExpiresAt} />}
    </span>
  );
}

function CustomCountdown({ expiresAt }) {
  const remaining = useCountdown(expiresAt);
  return <span style={{ opacity: 0.7, fontWeight: 500 }}> · {remaining}</span>;
}

