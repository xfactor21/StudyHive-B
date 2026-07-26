// StudyHive Badge Catalog — 50 realistically achievable badges.
// Each badge has a check(counters) function that returns true once earned.
// `counters` is a plain object of running totals kept on the user's own
// /users/{uid} document (see firestore.js: checkAndAwardBadges).
//
// Categories, roughly in order below:
//   Onboarding (1-10) · Posting (11-18) · Library (19-24)
//   Hunnies/Generosity (25-32) · Social (33-37) · Streaks (38-41)
//   Fun/Special (42-50)

export const BADGE_CATALOG = [
  // ---- Onboarding ----
  { id: 'welcome', emoji: '🐝', name: 'Welcome to the Hive', desc: 'Joined StudyHive', check: (c) => true },
  { id: 'first_post', emoji: '🎈', name: 'First Post', desc: 'Made your first post', check: (c) => c.postsCount >= 1 },
  { id: 'first_reply', emoji: '💬', name: 'First Reply', desc: 'Left your first comment', check: (c) => c.commentsMadeCount >= 1 },
  { id: 'first_upload', emoji: '📤', name: 'First Upload', desc: 'Shared your first resource', check: (c) => c.uploadsCount >= 1 },
  { id: 'first_gift', emoji: '🎁', name: 'First Gift', desc: 'Sent your first gift', check: (c) => c.giftsSentCount >= 1 },
  { id: 'first_dm', emoji: '💌', name: 'First DM', desc: 'Sent your first message', check: (c) => c.dmsStartedCount >= 1 },
  { id: 'status_set', emoji: '🎭', name: 'Status Set', desc: 'Changed your status for the first time', check: (c) => c.statusChangesCount >= 1 },
  { id: 'roll_dice', emoji: '🎲', name: 'Roll the Dice', desc: 'Tried the Custom status roulette', check: (c) => (c.customEmojisRolled || []).length >= 1 },
  { id: 'first_event', emoji: '📅', name: 'Planner', desc: 'Created your first calendar event', check: (c) => c.eventsCreatedCount >= 1 },
  { id: 'first_like', emoji: '🤝', name: 'Helper', desc: 'Got your first like on a post', check: (c) => c.likesReceivedCount >= 1 },

  // ---- Posting & Engagement ----
  { id: 'posts_5', emoji: '📝', name: 'Getting Started', desc: '5 posts made', check: (c) => c.postsCount >= 5 },
  { id: 'posts_25', emoji: '📝', name: 'Feed Regular', desc: '25 posts made', check: (c) => c.postsCount >= 25 },
  { id: 'posts_100', emoji: '📝', name: 'Feed Legend', desc: '100 posts made', check: (c) => c.postsCount >= 100 },
  { id: 'likes_10', emoji: '❤️', name: 'Liked', desc: '10 likes received', check: (c) => c.likesReceivedCount >= 10 },
  { id: 'likes_50', emoji: '❤️', name: 'Popular Post-er', desc: '50 likes received', check: (c) => c.likesReceivedCount >= 50 },
  { id: 'likes_250', emoji: '❤️', name: 'Crowd Favorite', desc: '250 likes received', check: (c) => c.likesReceivedCount >= 250 },
  { id: 'comments_25', emoji: '💬', name: 'Conversationalist', desc: '25 comments made', check: (c) => c.commentsMadeCount >= 25 },
  { id: 'comments_100', emoji: '💬', name: 'Conversation Starter', desc: '100 comments made', check: (c) => c.commentsMadeCount >= 100 },

  // ---- Library & Reputation ----
  { id: 'uploads_5', emoji: '📤', name: 'Note Sharer', desc: '5 resources uploaded', check: (c) => c.uploadsCount >= 5 },
  { id: 'uploads_15', emoji: '📤', name: 'Notes Machine', desc: '15 resources uploaded', check: (c) => c.uploadsCount >= 15 },
  { id: 'uploads_30', emoji: '📤', name: 'Library Legend', desc: '30 resources uploaded', check: (c) => c.uploadsCount >= 30 },
  { id: 'upvotes_50', emoji: '👍', name: 'Trusted Notes', desc: '50 upvotes on your uploads', check: (c) => c.upvotesReceivedCount >= 50 },
  { id: 'upvotes_200', emoji: '🏆', name: 'Top Contributor', desc: '200 upvotes on your uploads', check: (c) => c.upvotesReceivedCount >= 200 },
  { id: 'first_upvote_given', emoji: '👍', name: 'Appreciator', desc: "Upvoted a classmate's resource", check: (c) => c.upvotesGivenCount >= 1 },

  // ---- Hunnies & Generosity ----
  { id: 'hunnies_100', emoji: '🍯', name: 'Honey Jar', desc: '100 lifetime Hunnies earned', check: (c) => c.hunniesEarnedLifetime >= 100 },
  { id: 'hunnies_500', emoji: '🍯', name: 'Full Hive', desc: '500 lifetime Hunnies earned', check: (c) => c.hunniesEarnedLifetime >= 500 },
  { id: 'hunnies_1000', emoji: '👑', name: 'Hunnies Hoarder', desc: '1000 lifetime Hunnies earned', check: (c) => c.hunniesEarnedLifetime >= 1000 },
  { id: 'gifts_5', emoji: '🎁', name: 'Thoughtful', desc: '5 gifts sent', check: (c) => c.giftsSentCount >= 5 },
  { id: 'gifts_25', emoji: '🎁', name: 'Generous Soul', desc: '25 gifts sent', check: (c) => c.giftsSentCount >= 25 },
  { id: 'gifts_50', emoji: '💝', name: "Honeypot's Favorite", desc: '50 gifts sent', check: (c) => c.giftsSentCount >= 50 },
  { id: 'gifted_5', emoji: '🥰', name: 'Well Liked', desc: '5 gifts received', check: (c) => c.giftsReceivedCount >= 5 },
  { id: 'gifted_25', emoji: '🥰', name: 'Beloved', desc: '25 gifts received', check: (c) => c.giftsReceivedCount >= 25 },

  // ---- Social ----
  { id: 'friends_5', emoji: '👥', name: 'Making Friends', desc: 'DM\'d with 5 different classmates', check: (c) => (c.dmPartnerIds || []).length >= 5 },
  { id: 'friends_15', emoji: '👥', name: 'Well Connected', desc: 'DM\'d with 15 different classmates', check: (c) => (c.dmPartnerIds || []).length >= 15 },
  { id: 'profile_complete', emoji: '🌟', name: 'All Set Up', desc: 'Added a photo and a bio', check: (c) => c.hasPhoto && c.hasBio },
  { id: 'emoji_collector_5', emoji: '🎨', name: 'Emoji Collector', desc: '5 different Custom emoji rolled', check: (c) => new Set(c.customEmojisRolled || []).size >= 5 },
  { id: 'emoji_collector_15', emoji: '🎨', name: 'Emoji Whisperer', desc: '15 different Custom emoji rolled', check: (c) => new Set(c.customEmojisRolled || []).size >= 15 },

  // ---- Streaks ----
  { id: 'streak_3', emoji: '🔥', name: 'Warming Up', desc: '3-day activity streak', check: (c) => c.streakDays >= 3 },
  { id: 'streak_7', emoji: '🔥', name: 'Committed', desc: '7-day activity streak', check: (c) => c.streakDays >= 7 },
  { id: 'streak_30', emoji: '🔥', name: 'Hive Mind', desc: '30-day activity streak', check: (c) => c.streakDays >= 30 },
  { id: 'events_10', emoji: '📆', name: 'Calendar Regular', desc: '10 events created', check: (c) => c.eventsCreatedCount >= 10 },

  // ---- Fun & Special ----
  { id: 'free_period_status', emoji: '😎', name: 'Living the Life', desc: 'Used the Free Period status', check: (c) => c.usedFreePeriodStatus },
  { id: 'sick_status', emoji: '🤒', name: 'Get Well Soon', desc: 'Used the Out Sick status', check: (c) => c.usedSickStatus },
  { id: 'rough_day_gifted', emoji: '🫂', name: 'There For You', desc: 'Got gifted on a Rough Day', check: (c) => c.roughDayGifted },
  { id: 'night_owl', emoji: '🌙', name: 'Night Owl', desc: 'Posted between midnight and 5am', check: (c) => c.postedLateNight },
  { id: 'early_bird', emoji: '☀️', name: 'Early Bird', desc: 'Posted between 5am and 7am', check: (c) => c.postedEarlyMorning },
  { id: 'buzz_10', emoji: '🐝', name: 'Buzz Regular', desc: 'Asked Buzz 10 questions', check: (c) => c.buzzQuestionsCount >= 10 },
  { id: 'buzz_50', emoji: '🧠', name: "Buzz's Star Pupil", desc: 'Asked Buzz 50 questions', check: (c) => c.buzzQuestionsCount >= 50 },
  { id: 'well_rounded', emoji: '🏅', name: 'Well-Rounded', desc: 'Posted, uploaded, gifted, DM\'d, and planned an event', check: (c) =>
      c.postsCount >= 1 && c.uploadsCount >= 1 && c.giftsSentCount >= 1 && c.dmsStartedCount >= 1 && c.eventsCreatedCount >= 1 },
  { id: 'founding_bee', emoji: '👑', name: 'Founding Bee', desc: 'One of the first 10 to join', check: (c) => c.isFoundingUser },
];

/** Given a user's current counters and their already-earned badge id list,
 * returns the badge objects newly qualified for that haven't been awarded
 * yet. Does not mutate anything — the caller writes the result. */
export function getNewlyEarnedBadges(counters, alreadyEarnedIds) {
  const earnedSet = new Set(alreadyEarnedIds || []);
  return BADGE_CATALOG.filter((b) => !earnedSet.has(b.id) && b.check(counters));
}
