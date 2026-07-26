import React, { useState } from 'react';
import { defaultAvatar } from '../data/avatars';
import { STATUS_EMOJI } from './StatusLabel';

/**
 * Hexagon-framed avatar with a small status badge overlapping the
 * bottom-right corner, showing the person's actual status emoji rather
 * than a plain colored dot. The colored ring lives on this badge now,
 * not on the main hex frame itself — the frame stays a constant brand
 * color for everyone, and the badge is what actually signals status.
 *
 * @param {string} src - avatar image src (data URI or URL)
 * @param {'sm'|'md'|'lg'|'xl'} size
 * @param {string} [status] - status key
 * @param {string} [customEmoji] - the specific rolled emoji when status
 *   is 'custom' (falls back to a generic 🎉 if not provided)
 * @param {function} [onClick]
 */
export default function HexAvatar({ src, size = 'md', status, customEmoji, onClick, alt = '', pixelSize, cosmetics }) {
  const [imgFailed, setImgFailed] = useState(false);
  const style = pixelSize ? { width: pixelSize, height: pixelSize, fontSize: pixelSize } : undefined;
  const now = Date.now();
  const cosmeticClasses = [
    cosmetics?.frame > now && 'cosmetic-frame',
    cosmetics?.rainbow > now && 'cosmetic-rainbow',
    cosmetics?.sparkle > now && 'cosmetic-sparkle',
  ].filter(Boolean).join(' ');

  const resolvedStatus = status || 'online';
  const emoji = resolvedStatus === 'custom' && customEmoji ? customEmoji : (STATUS_EMOJI[resolvedStatus] || STATUS_EMOJI.online);

  return (
    <div
      className={`hex-avatar size-${size}${cosmeticClasses ? ' ' + cosmeticClasses : ''}`}
      style={style}
      onClick={onClick}
      data-status={resolvedStatus}
    >
      <img
        className="hex-shape"
        src={imgFailed ? defaultAvatar : src}
        alt={alt}
        onError={() => {
          if (!imgFailed) {
            console.error('HexAvatar: image failed to load (likely a Storage CORS issue):', src);
            setImgFailed(true);
          }
        }}
      />
      {status !== undefined && (
        <div className={`status-badge status-badge--${resolvedStatus}`}>{emoji}</div>
      )}
    </div>
  );
}
