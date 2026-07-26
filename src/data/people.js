// PEOPLE — single source of truth for demo user data.
// Shape intentionally mirrors the planned Firestore /users/{userId} document
// (see StudyHive_Build_Guide_v2.md Step 2) so swapping this for a real
// data source later is a substitution, not a rewrite.

import { mayaAvatar, devonAvatar, sashaAvatar, jordanAvatar } from './avatars';

export const PEOPLE = {
  maya: {
    key: 'maya',
    name: 'Maya R.',
    handle: '@mayar',
    avatar: mayaAvatar,
    status: 'online',
    statusLabel: '',
    bio: 'AP Bio 3rd period. I make the study packs everyone steals 😌',
    badges: ['🏆 Top 1%', '🔥 9 day streak'],
    stats: [
      { num: '47', label: 'Posts' },
      { num: '312', label: 'Upvotes' },
      { num: '9', label: 'Streak' },
      { num: '14', label: 'Uploads' },
    ],
  },
  devon: {
    key: 'devon',
    name: 'Devon K.',
    handle: '@devonk',
    avatar: devonAvatar,
    status: 'rough-day',
    statusLabel: '😤 Rough Day',
    bio: "Algebra II is not my villain origin story but it's close",
    badges: ['📈 Most Improved'],
    stats: [
      { num: '22', label: 'Posts' },
      { num: '98', label: 'Upvotes' },
      { num: '3', label: 'Streak' },
      { num: '5', label: 'Uploads' },
    ],
  },
  sasha: {
    key: 'sasha',
    name: 'Sasha L.',
    handle: '@sashal',
    avatar: sashaAvatar,
    status: 'free-period',
    statusLabel: '😎 Free Period',
    bio: 'history nerd, chronic over-explainer, free period = library time',
    badges: ['🍯 412 Hunnies', '🎂 Birthday Today'],
    stats: [
      { num: '31', label: 'Posts' },
      { num: '201', label: 'Upvotes' },
      { num: '6', label: 'Streak' },
      { num: '8', label: 'Uploads' },
    ],
  },
  jordan: {
    key: 'jordan',
    name: 'Jordan M.',
    handle: '@jordanm',
    avatar: jordanAvatar,
    status: 'heads-down',
    statusLabel: '📚 Heads Down',
    bio: 'probably in the library. ask me about chem before you ask the internet',
    badges: ['🏆 Top Contributor', '🔥 14 day streak', "🐝 Buzz's Favorite"],
    stats: [
      { num: '47', label: 'Posts' },
      { num: '312', label: 'Upvotes' },
      { num: '14', label: 'Streak' },
      { num: '19', label: 'Uploads' },
    ],
  },
};

// The logged-in user for this demo build.
export const CURRENT_USER_KEY = 'jordan';

export const STATUS_TYPES = [
  { key: 'online', emoji: '🟢', label: 'Online' },
  { key: 'out-sick', emoji: '🤒', label: 'Out Sick' },
  { key: 'heads-down', emoji: '📚', label: 'Heads Down' },
  { key: 'rough-day', emoji: '😤', label: 'Rough Day' },
  { key: 'free-period', emoji: '😎', label: 'Free Period' },
  { key: 'custom', emoji: '🎉', label: 'Hive Roulette' },
];

// Rare/unusual emoji pool for the "Custom" status roulette. Picking
// Custom spins one of these at random — whatever lands, you're stuck
// with for 12 hours. Deliberately obscure, not the common favorites.
export const RARE_CUSTOM_EMOJI = [
  '🫠', '🦦', '🪼', '🫧', '🐌', '🦥', '🫏', '🦫', '🪸', '🫑',
  '🦩', '🪺', '🦣', '🫘', '🐡', '🦤', '🪷', '🦭', '🫎', '🦔',
  '🪹', '🦨', '🫚', '🦟', '🪳',
];
