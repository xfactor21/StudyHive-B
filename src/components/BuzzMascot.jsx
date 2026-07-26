import React from 'react';

/**
 * Buzz, the StudyHive mascot and AI tutor persona.
 * One consistent design used everywhere Buzz appears — splash screen,
 * header brand mark, Ask Buzz hero, and the bottom nav FAB — rather than
 * three different mascot treatments (see build guide addendum on the
 * mascot redesign history).
 *
 * @param {number} size - rendered pixel size (square)
 * @param {boolean} face - whether to render full face detail (eyes, brows,
 *   smile, antennae). Skip for very small renders (e.g. nav FAB ~34px)
 *   where detail wouldn't read anyway.
 * @param {boolean} animated - whether wings should flap via CSS animation
 *   (the buzz-wing-left/right classes are defined in global.css)
 */
export default function BuzzMascot({ size = 88, face = true, animated = true, shadow = true }) {
  const wingLeftClass = animated ? 'buzz-wing-left' : '';
  const wingRightClass = animated ? 'buzz-wing-right' : '';

  return (
    <svg width={size} height={size} viewBox="0 0 130 130">
      {shadow && <ellipse cx="65" cy="116" rx="26" ry="5" fill="#000" opacity="0.18" />}
      <g className={wingLeftClass}>
        <ellipse cx="39" cy="50" rx="19" ry="13.5" fill="#F4F1FB" opacity="0.95" transform="rotate(-18 39 50)" />
      </g>
      <g className={wingRightClass}>
        <ellipse cx="91" cy="50" rx="19" ry="13.5" fill="#F4F1FB" opacity="0.95" transform="rotate(18 91 50)" />
      </g>
      <circle cx="65" cy="50" r="26" fill="#FBBF24" />
      <path d="M39 64 a26 30 0 0 0 52 0 L91 99 a26 24 0 0 1 -52 0 Z" fill="#FBBF24" />
      <rect x="39" y="62" width="52" height="10" fill="#3A2B12" />
      <rect x="40" y="80" width="50" height="9" fill="#3A2B12" />
      <ellipse cx="65" cy="95" rx="19" ry="10" fill="#FCD34D" opacity="0.5" />

      {face && (
        <>
          <path d="M57 28 Q54 19 49 15" stroke="#3A2B12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M73 28 Q76 19 81 15" stroke="#3A2B12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="49" cy="15" r="3" fill="#3A2B12" />
          <circle cx="81" cy="15" r="3" fill="#3A2B12" />
          <circle cx="56" cy="46" r="5.5" fill="#2B2118" />
          <circle cx="74" cy="46" r="5.5" fill="#2B2118" />
          <circle cx="58" cy="43.5" r="1.9" fill="#FFFFFF" />
          <circle cx="76" cy="43.5" r="1.9" fill="#FFFFFF" />
          <circle cx="54" cy="48" r="0.9" fill="#FFFFFF" opacity="0.6" />
          <circle cx="72" cy="48" r="0.9" fill="#FFFFFF" opacity="0.6" />
          <path d="M49 37 Q56 34.5 62 37.5" stroke="#3A2B12" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.5" />
          <path d="M68 37.5 Q74 34.5 81 37" stroke="#3A2B12" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.5" />
          <circle cx="49" cy="54" r="3.5" fill="#F97316" opacity="0.22" />
          <circle cx="81" cy="54" r="3.5" fill="#F97316" opacity="0.22" />
          <path d="M55 55 Q65 62 75 55" stroke="#2B2118" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}

      {!face && (
        <>
          <circle cx="56" cy="46" r="5.5" fill="#3A2B12" />
          <circle cx="74" cy="46" r="5.5" fill="#3A2B12" />
        </>
      )}
    </svg>
  );
}

/** Tiny variant used inside the nav FAB — Buzz peeking out of a dark hive opening. */
export function BuzzNavIcon({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 130 130">
      <g className="buzz-wing-left">
        <ellipse cx="41" cy="52" rx="15" ry="10.5" fill="#F4F1FB" opacity="0.9" transform="rotate(-18 41 52)" />
      </g>
      <g className="buzz-wing-right">
        <ellipse cx="89" cy="52" rx="15" ry="10.5" fill="#F4F1FB" opacity="0.9" transform="rotate(18 89 52)" />
      </g>
      <circle cx="65" cy="50" r="26" fill="#FBBF24" />
      <path d="M39 65 a26 24 0 0 0 52 0 L91 88 a26 24 0 0 1 -52 0 Z" fill="#FBBF24" />
      <rect x="39" y="62" width="52" height="10" fill="#3A2B12" />
      <rect x="39" y="78" width="52" height="9" fill="#3A2B12" />
      <ellipse cx="56" cy="44" rx="5.5" ry="7" fill="#2B2118" />
      <ellipse cx="74" cy="44" rx="5.5" ry="7" fill="#2B2118" />
      <circle cx="58" cy="41.5" r="1.6" fill="#FFFFFF" opacity="0.85" />
      <circle cx="76" cy="41.5" r="1.6" fill="#FFFFFF" opacity="0.85" />
    </svg>
  );
}
