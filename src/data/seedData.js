// Demo/seed data. Only two things live here on purpose now:
// - LIBRARY_RESOURCES: sample notes shown alongside real uploads so the
//   Library never looks empty before real classmates contribute. These
//   are intentionally kept (unlike every other demo dataset that used to
//   live in this file) and are still toast-only when tapped.
// - HONEYPOT_GIFTS: this is NOT demo data — it's the real, actual catalog
//   of purchasable gifts in the Honeypot. Every gift here is really
//   buyable with real Hunnies.

export const LIBRARY_RESOURCES = [
  {
    id: 'res-1',
    icon: '🧬',
    title: 'Krebs Cycle Study Pack',
    tag: 'AP Bio · Unit 4',
    upvotes: 89,
    contributorKey: 'maya',
    official: false,
  },
  {
    id: 'res-2',
    icon: '📐',
    title: 'Synthetic Division Cheat Sheet',
    tag: 'Algebra II',
    upvotes: 41,
    contributorKey: 'devon',
    official: false,
  },
  {
    id: 'res-3',
    icon: '⚗️',
    title: 'Unit 4 Lab Guide',
    tag: 'Chemistry',
    upvotes: 134,
    contributorName: 'Mr. Hale',
    official: true,
  },
  {
    id: 'res-4',
    icon: '📜',
    title: 'Cold War Timeline Notes',
    tag: 'US History',
    upvotes: 23,
    contributorKey: 'sasha',
    official: false,
  },
];

export const HONEYPOT_GIFTS = [
  { id: 'g1', emoji: '🌸', name: 'Flowers', price: 20, sponsor: 'Bloom & Co' },
  { id: 'g2', emoji: '🧋', name: 'Boba', price: 15 },
  { id: 'g3', emoji: '🎈', name: 'Balloon', price: 10 },
  { id: 'g4', emoji: '💌', name: 'Get Well Card', price: 5 },
  { id: 'g5', emoji: '🏆', name: 'Trophy', price: 35 },
  { id: 'g6', emoji: '🐝', name: 'Buzz Plush', price: 50 },
];

// Self-only profile customizations — bigger price tags than gifts on
// purpose (these are a status flex, not a quick treat). Each lasts 24h
// once bought. `cosmetic: true` distinguishes these from real gifts in
// the Honeypot UI and purchase logic.
export const COSMETIC_ITEMS = [
  { id: 'c1', emoji: '🌟', name: 'Halo Ring', price: 150, cosmetic: true, effect: 'frame', desc: 'A pulsing gold ring around your avatar, everywhere, for 24h.' },
  { id: 'c2', emoji: '🎨', name: 'Name Flair', price: 120, cosmetic: true, effect: 'nameColor', desc: 'Your name renders in a bold color everywhere for 24h.' },
  { id: 'c3', emoji: '🧙', name: "Buzz's Wardrobe", price: 140, cosmetic: true, effect: 'buzzOutfit', desc: 'Buzz wears a surprise fit just for you next time you visit Ask Buzz. 24h.' },
  { id: 'c4', emoji: '✨', name: 'Sparkle Trail', price: 130, cosmetic: true, effect: 'sparkle', desc: 'A subtle sparkle trails your avatar in the Feed for 24h.' },
  { id: 'c5', emoji: '🎪', name: 'Rainbow Ring', price: 160, cosmetic: true, effect: 'rainbow', desc: 'Your hex ring cycles colors instead of your status color. 24h.' },
  { id: 'c6', emoji: '👑', name: 'VIP Crown', price: 180, cosmetic: true, effect: 'crown', desc: 'A small crown appears next to your name everywhere for 24h.' },
];
