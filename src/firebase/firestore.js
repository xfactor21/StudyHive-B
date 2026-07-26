// Firestore read/write functions for StudyHive.

import { db, app, storage, FIREBASE_READY } from './config';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getNewlyEarnedBadges } from '../data/badges';
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, setDoc, deleteDoc, increment,
  query, where, orderBy, limit, onSnapshot, arrayUnion, arrayRemove,
  runTransaction, serverTimestamp, Timestamp,
} from 'firebase/firestore';

const TYPE_PILL_LABEL = {
  'study-group': 'Study Group',
  question: 'Question',
  thought: 'Thought',
};

function assertFirebaseReady() {
  if (!FIREBASE_READY || !db) {
    throw new Error('Firebase is not configured. Add your Vite Firebase environment variables first.');
  }
}

function emptyUnsubscribe() {
  return () => {};
}

export function toMillis(value) {
  if (typeof value === 'number') return value;
  if (value instanceof Timestamp) return value.toMillis();
  if (value && typeof value.toMillis === 'function') return value.toMillis();
  if (value && typeof value.seconds === 'number') return value.seconds * 1000;
  return Date.now();
}

/** Day-boundary streak logic, shared by every function that writes to a
 * user's counters. Mutates `counters` in place using calendar days (not
 * rolling 24h windows) so "yesterday" and "today" mean what a student
 * would expect, regardless of what time of day they're active.
 *   - Same day as last activity → no change, already counted today.
 *   - Exactly one day later → streak continues, +1.
 *   - Any bigger gap (or first time ever) → streak resets to 1.
 */
function localDateKey(date) {
  // Local calendar date as YYYY-MM-DD - deliberately NOT toISOString(),
  // which returns UTC and would put "today" hours ahead of a student's
  // actual local day for anyone west of Greenwich (most of the US).
  // That mismatch could break a streak hours before the student's real
  // local midnight, or double-count around it.
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function applyStreakLogic(counters) {
  const todayStr = localDateKey(new Date());
  const lastStr = counters.lastActiveDate;

  if (lastStr === todayStr) return; // already active today, don't double-count

  if (lastStr) {
    const msPerDay = 24 * 60 * 60 * 1000;
    const last = new Date(lastStr + 'T00:00:00');
    const today = new Date(todayStr + 'T00:00:00');
    const dayGap = Math.round((today - last) / msPerDay);
    counters.streakDays = dayGap === 1 ? (counters.streakDays || 0) + 1 : 1;
  } else {
    counters.streakDays = 1;
  }
  counters.lastActiveDate = todayStr;
}

/**
 * The one function every earning action calls. Atomically applies the
 * given counter deltas to the user's own doc, checks the full badge
 * catalog against the resulting totals, and awards any newly-qualified
 * badges in the same write. Returns the list of badges just earned (for
 * the caller to celebrate with a toast) — empty array if none.
 *
 * `deltas` is a plain object of { fieldName: amountToAdd } for numeric
 * counters. `setFields` (optional) is for booleans/array-append fields
 * that don't simply add — e.g. { usedBirthdayStatus: true } or a fresh
 * customEmojisRolled array already including the new roll.
 */
export async function bumpCounterAndCheckBadges(uid, deltas = {}, setFields = {}) {
  assertFirebaseReady();
  const userRef = doc(db, 'users', uid);
  let newlyEarned = [];
  let finalCounters = {};

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const counters = { ...(data.counters || {}) };

    Object.entries(deltas).forEach(([key, amount]) => {
      counters[key] = (counters[key] || 0) + amount;
    });
    Object.entries(setFields).forEach(([key, value]) => {
      counters[key] = value;
    });
    applyStreakLogic(counters);

    const resolvedForCheck = {
      ...counters,
      hasPhoto: !!data.photoURL,
      hasBio: !!(data.bio && data.bio.trim()),
    };

    newlyEarned = getNewlyEarnedBadges(resolvedForCheck, data.badges || []);
    finalCounters = counters;

    const finalUpdate = { counters };
    if (newlyEarned.length > 0) {
      finalUpdate.badges = [...(data.badges || []), ...newlyEarned.map((b) => b.id)];
    }
    tx.update(userRef, finalUpdate);
  });

  for (const badge of newlyEarned) {
    createNotification(uid, {
      type: 'badge', icon: badge.emoji, iconBg: 'rgba(168,85,247,0.18)',
      text: `Badge earned: ${badge.name}`,
    }).catch((e) => console.error('Badge notification failed:', e));
  }

  return { newlyEarned, counters: finalCounters };
}

/** Operator-only tool: grant Hunnies to any real user (including
 * yourself) for testing the store, correcting a balance, or whatever
 * else. Same increase-only pattern the rules already permit for
 * non-owners (see firestore.rules) — logged as a real, clearly-labeled
 * transaction so it's never mistaken for an organic earning. */
export async function adminGrantHunnies(uid, amount) {
  assertFirebaseReady();
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('grant-amount-must-be-positive');
  const userRef = doc(db, 'users', uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    const current = snap.exists() ? (snap.data().hunnies || 0) : 0;
    tx.update(userRef, { hunnies: current + amount });
  });
  await addDoc(collection(db, 'hunnies_transactions'), {
    fromId: null, toId: uid, amount, itemId: 'admin_grant',
    itemName: 'Granted by operator', itemEmoji: '🛠️', timestamp: Date.now(),
  });
}

/** Genuinely anonymous - no uid, no authorId, nothing linking this back
 * to whoever submitted it, matching the rules (create: if true, read:
 * if false - not even the writer can read it back afterward). */
export async function createReport(text) {
  assertFirebaseReady();
  return addDoc(collection(db, 'reports'), {
    text: text.trim(),
    timestamp: Date.now(),
  });
}

/** Creates a real notification for a user. Fire-and-forget from the
 * caller's perspective — never blocks the action that triggered it. */
export async function createNotification(userId, { type, icon, iconBg, text }) {
  assertFirebaseReady();
  return addDoc(collection(db, 'notifications'), {
    userId, type, icon, iconBg, text,
    read: false,
    createdAt: serverTimestamp(),
    timestamp: Date.now(),
  });
}

export function subscribeToNotifications(userId, onUpdate) {
  if (!FIREBASE_READY || !db || !userId) return emptyUnsubscribe();
  const q = query(collection(db, 'notifications'), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => toMillis(b.createdAt || b.timestamp) - toMillis(a.createdAt || a.timestamp));
    onUpdate(list);
  });
}

export async function markNotificationRead(notifId) {
  assertFirebaseReady();
  return updateDoc(doc(db, 'notifications', notifId), { read: true });
}

export async function deleteNotification(notifId) {
  assertFirebaseReady();
  return deleteDoc(doc(db, 'notifications', notifId));
}

export async function markConversationViewed(conversationId, uid) {
  assertFirebaseReady();
  return updateDoc(doc(db, 'dms', conversationId), {
    [`lastViewed.${uid}`]: Date.now(),
  });
}

export async function markAllNotificationsRead(notifIds) {
  assertFirebaseReady();
  await Promise.all(notifIds.map((id) => updateDoc(doc(db, 'notifications', id), { read: true })));
}

function timeAgo(value) {
  const diffMs = Math.max(0, Date.now() - toMillis(value));
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(toMillis(value)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function resourceIconFor(tags = []) {
  const label = Array.isArray(tags) ? tags.join(' ').toLowerCase() : String(tags || '').toLowerCase();
  if (label.includes('bio')) return '🧬';
  if (label.includes('chem')) return '⚗️';
  if (label.includes('math') || label.includes('algebra') || label.includes('calc')) return '📐';
  if (label.includes('history')) return '📜';
  if (label.includes('english') || label.includes('literature')) return '📖';
  return '📄';
}

function mapPostDoc(docSnap) {
  const data = docSnap.data();
  const createdAt = data.createdAt || data.timestamp;
  return {
    id: docSnap.id,
    ...data,
    body: data.text || '',
    meta: timeAgo(createdAt),
    timestamp: toMillis(createdAt),
    typeLabel: TYPE_PILL_LABEL[data.type] || null,
    likes: Array.isArray(data.likes) ? data.likes : [],
    bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [],
  };
}

export async function fetchOtherUsers(excludeUid) {
  assertFirebaseReady();
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs
    .map((d) => ({ uid: d.id, ...d.data() }))
    .filter((u) => u.uid !== excludeUid);
}

/**
 * Live subscription to every registered user, keyed by uid. This is the
 * single source of truth for "who is this post/comment/DM actually from" —
 * PostCard and anywhere else that needs to show someone other than the
 * current viewer should look up authors here, never assume "it's me."
 * Also the foundation for a registered-users directory (online/offline,
 * message anyone) without needing a separate presence system yet.
 */
export function subscribeToAllUsers(onUpdate) {
  if (!FIREBASE_READY || !db) return emptyUnsubscribe();
  return onSnapshot(collection(db, 'users'), (snap) => {
    const byId = {};
    snap.docs.forEach((d) => {
      byId[d.id] = { uid: d.id, ...d.data() };
    });
    onUpdate(byId);
  });
}

export function subscribeToPosts(onUpdate) {
  if (!FIREBASE_READY || !db) return emptyUnsubscribe();
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map(mapPostDoc));
  });
}

/** Real posts the given user has bookmarked. Powers the Saved Posts
 * view — Save previously had nowhere for the result to actually go. */
export function subscribeToSavedPosts(uid, onUpdate) {
  if (!FIREBASE_READY || !db || !uid) return emptyUnsubscribe();
  const q = query(collection(db, 'posts'), where('bookmarks', 'array-contains', uid));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(mapPostDoc);
    list.sort((a, b) => b.timestamp - a.timestamp);
    onUpdate(list);
  });
}

export async function createPost({ authorId, type, text, classTag = null }) {
  assertFirebaseReady();
  const result = await addDoc(collection(db, 'posts'), {
    authorId,
    type,
    text: text.trim(),
    classTag,
    createdAt: serverTimestamp(),
    timestamp: Date.now(),
    likes: [],
    bookmarks: [],
    commentCount: 0,
  });

  const hour = new Date().getHours();
  const setFields = {};
  if (hour >= 0 && hour < 5) setFields.postedLateNight = true;
  if (hour >= 5 && hour < 7) setFields.postedEarlyMorning = true;
  bumpCounterAndCheckBadges(authorId, { postsCount: 1 }, setFields).catch((e) => console.error('Badge check failed:', e));

  return result;
}

export async function toggleLike(postId, uid, currentlyLiked, authorId) {
  assertFirebaseReady();
  await updateDoc(doc(db, 'posts', postId), {
    likes: currentlyLiked ? arrayRemove(uid) : arrayUnion(uid),
  });
  // Earning Hunnies: the post's author gets rewarded when someone else
  // likes their post. No reward for liking your own post (avoids the
  // most obvious self-farming loop), and no reward for unliking.
  if (!currentlyLiked && authorId && authorId !== uid) {
    const authorRef = doc(db, 'users', authorId);
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(authorRef);
        const current = snap.exists() ? (snap.data().hunnies || 0) : 0;
        tx.update(authorRef, { hunnies: current + 2 });
      });
      await addDoc(collection(db, 'hunnies_transactions'), {
        fromId: null, toId: authorId, amount: 2, itemId: 'like_earned',
        itemName: 'Post liked', itemEmoji: '❤️', timestamp: Date.now(),
      });
    } catch (e) {
      console.error('Failed to award like Hunnies:', e);
    }
    try {
      await bumpCounterAndCheckBadges(authorId, { likesReceivedCount: 1, hunniesEarnedLifetime: 2 });
    } catch (e) {
      console.error('Badge check failed:', e);
    }
    try {
      const likerSnap = await getDoc(doc(db, 'users', uid));
      const likerName = likerSnap.exists() ? (likerSnap.data().displayName || 'Someone') : 'Someone';
      await createNotification(authorId, {
        type: 'like', icon: '❤️', iconBg: 'rgba(239,68,68,0.18)',
        text: `${likerName} liked your post — +2 Hunnies`,
      });
    } catch (e) {
      console.error('Like notification failed:', e);
    }
  }
}

export async function toggleBookmark(postId, uid, currentlyBookmarked) {
  assertFirebaseReady();
  return updateDoc(doc(db, 'posts', postId), {
    bookmarks: currentlyBookmarked ? arrayRemove(uid) : arrayUnion(uid),
  });
}

export async function addReply(postId, { authorId, text }) {
  assertFirebaseReady();
  const result = await addDoc(collection(db, 'posts', postId, 'replies'), {
    authorId,
    text: text.trim(),
    createdAt: serverTimestamp(),
    timestamp: Date.now(),
  });
  bumpCounterAndCheckBadges(authorId, { commentsMadeCount: 1 }).catch((e) => console.error('Badge check failed:', e));

  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, { commentCount: increment(1) });
    const postSnap = await getDoc(postRef);
    const postAuthorId = postSnap.exists() ? postSnap.data().authorId : null;
    if (postAuthorId && postAuthorId !== authorId) {
      const commenterSnap = await getDoc(doc(db, 'users', authorId));
      const commenterName = commenterSnap.exists() ? (commenterSnap.data().displayName || 'Someone') : 'Someone';
      await createNotification(postAuthorId, {
        type: 'comment', icon: '💬', iconBg: 'rgba(59,130,246,0.18)',
        text: `${commenterName} commented on your post`,
      });
    }
  } catch (e) {
    console.error('Comment notification failed:', e);
  }

  return result;
}

/** Deletes a post and its whole replies subcollection. Firestore
 * doesn't cascade-delete subcollections automatically, so replies are
 * cleaned up explicitly first. */
export async function deletePost(postId) {
  assertFirebaseReady();
  const repliesSnap = await getDocs(collection(db, 'posts', postId, 'replies'));
  await Promise.all(repliesSnap.docs.map((d) => deleteDoc(d.ref)));
  return deleteDoc(doc(db, 'posts', postId));
}

export async function deleteReply(postId, replyId) {
  assertFirebaseReady();
  await deleteDoc(doc(db, 'posts', postId, 'replies', replyId));
  return updateDoc(doc(db, 'posts', postId), { commentCount: increment(-1) });
}

export function subscribeToReplies(postId, onUpdate) {
  if (!FIREBASE_READY || !db || !postId) return emptyUnsubscribe();
  const q = query(collection(db, 'posts', postId, 'replies'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data(), timestamp: toMillis(d.data().createdAt || d.data().timestamp) })));
  });
}

export function subscribeToLibraryResources(onUpdate) {
  if (!FIREBASE_READY || !db) return emptyUnsubscribe();
  const q = query(collection(db, 'library'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => {
      const data = d.data();
      const tags = Array.isArray(data.tags) ? data.tags : [];
      return {
        id: d.id,
        ...data,
        icon: resourceIconFor(tags),
        tag: tags.join(' · '),
        upvotes: Number(data.upvotes || 0),
        createdAt: toMillis(data.createdAt || data.timestamp),
      };
    }));
  });
}

/** Real Miss Me? — posts a real question to the feed tagged with the
 * missed class, and notifies every OTHER real user who has that same
 * class listed on their own profile. Returns how many classmates got
 * notified, so the caller can give honest feedback (including zero). */
export async function sendMissMeRequest(uid, classTag) {
  assertFirebaseReady();

  await createPost({
    authorId: uid,
    type: 'question',
    text: `Missed ${classTag} today — anyone have notes or catch me up? 🙏`,
    classTag,
  });

  const classmatesSnap = await getDocs(
    query(collection(db, 'users'), where('classes', 'array-contains', classTag))
  );

  const notifyTargets = classmatesSnap.docs.filter((d) => d.id !== uid);
  const askerSnap = await getDoc(doc(db, 'users', uid));
  const askerName = askerSnap.exists() ? (askerSnap.data().displayName || 'A classmate') : 'A classmate';

  await Promise.all(notifyTargets.map((d) =>
    createNotification(d.id, {
      type: 'missme', icon: '🤒', iconBg: 'rgba(245,158,11,0.18)',
      text: `${askerName} missed ${classTag} — got notes to share?`,
    })
  ));

  return notifyTargets.length;
}

export async function createLibraryResource({ uploaderId, title, tag, photoURL = null, noteText = '' }) {
  assertFirebaseReady();
  const result = await addDoc(collection(db, 'library'), {
    uploaderId,
    title: title.trim(),
    tags: tag ? [tag.trim()] : [],
    photoURL,
    noteText: noteText.trim(),
    upvotes: 0,
    official: false,
    schoolYear: new Date().getFullYear(),
    createdAt: serverTimestamp(),
    timestamp: Date.now(),
  });

  // Earning Hunnies: uploading a resource to help classmates pays 5.
  const uploaderRef = doc(db, 'users', uploaderId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(uploaderRef);
      const current = snap.exists() ? (snap.data().hunnies || 0) : 0;
      tx.update(uploaderRef, { hunnies: current + 5 });
    });
    await addDoc(collection(db, 'hunnies_transactions'), {
      fromId: null, toId: uploaderId, amount: 5, itemId: 'upload_earned',
      itemName: 'Uploaded a resource', itemEmoji: '📤', timestamp: Date.now(),
    });
  } catch (e) {
    console.error('Failed to award upload Hunnies:', e);
  }
  bumpCounterAndCheckBadges(uploaderId, { uploadsCount: 1, hunniesEarnedLifetime: 5 }).catch((e) => console.error('Badge check failed:', e));

  return result;
}

/** Upvoting a classmate's resource: they earn 3 Hunnies, their upvote
 * count on the resource goes up, and both people get counter credit
 * (uploader for upvotesReceived, upvoter for upvotesGiven). One upvote
 * per person per resource, enforced by checking the upvoters array. */
export async function upvoteLibraryResource(resourceId, uploaderId, upvoterUid) {
  assertFirebaseReady();
  if (uploaderId === upvoterUid) throw new Error('cannot-upvote-own-resource');

  const resourceRef = doc(db, 'library', resourceId);
  let alreadyUpvoted = false;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(resourceRef);
    const data = snap.data() || {};
    const upvoters = data.upvoters || [];
    if (upvoters.includes(upvoterUid)) {
      alreadyUpvoted = true;
      return;
    }
    tx.update(resourceRef, {
      upvotes: (data.upvotes || 0) + 1,
      upvoters: [...upvoters, upvoterUid],
    });
  });

  if (alreadyUpvoted) return { alreadyUpvoted: true };

  const uploaderRef = doc(db, 'users', uploaderId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(uploaderRef);
      const current = snap.exists() ? (snap.data().hunnies || 0) : 0;
      tx.update(uploaderRef, { hunnies: current + 3 });
    });
    await addDoc(collection(db, 'hunnies_transactions'), {
      fromId: null, toId: uploaderId, amount: 3, itemId: 'upvote_earned',
      itemName: 'Resource upvoted', itemEmoji: '👍', timestamp: Date.now(),
    });
  } catch (e) {
    console.error('Failed to award upvote Hunnies:', e);
  }
  bumpCounterAndCheckBadges(uploaderId, { upvotesReceivedCount: 1 }).catch((e) => console.error('Badge check failed:', e));
  bumpCounterAndCheckBadges(upvoterUid, { upvotesGivenCount: 1 }).catch((e) => console.error('Badge check failed:', e));

  try {
    const upvoterSnap = await getDoc(doc(db, 'users', upvoterUid));
    const upvoterName = upvoterSnap.exists() ? (upvoterSnap.data().displayName || 'A classmate') : 'A classmate';
    await createNotification(uploaderId, {
      type: 'upvote', icon: '👍', iconBg: 'rgba(34,197,94,0.18)',
      text: `${upvoterName} upvoted your resource — +3 Hunnies`,
    });
  } catch (e) {
    console.error('Upvote notification failed:', e);
  }

  return { alreadyUpvoted: false };
}

export function subscribeToCalendarEvents(onUpdate) {
  if (!FIREBASE_READY || !db) return emptyUnsubscribe();
  const q = query(collection(db, 'calendar'), orderBy('date', 'asc'));
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function createCalendarEvent({ creatorId, title, type, date, subject }) {
  assertFirebaseReady();
  const result = await addDoc(collection(db, 'calendar'), {
    creatorId,
    title: title.trim(),
    type,
    date,
    subject: subject.trim(),
    shared: false,
    sharedBy: null,
    createdAt: serverTimestamp(),
  });
  bumpCounterAndCheckBadges(creatorId, { eventsCreatedCount: 1 }).catch((e) => console.error('Badge check failed:', e));
  return result;
}

export async function deleteCalendarEvent(eventId) {
  assertFirebaseReady();
  return deleteDoc(doc(db, 'calendar', eventId));
}

export function subscribeToConversation(conversationId, onUpdate) {
  if (!FIREBASE_READY || !db || !conversationId) return emptyUnsubscribe();
  const q = query(
    collection(db, 'dms', conversationId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data(), timestamp: toMillis(d.data().createdAt || d.data().timestamp) })));
  });
}

/** Deterministic conversation ID for any two users, regardless of who
 * opens the thread first — both sides always converge on the same doc. */
export function getConversationId(uidA, uidB) {
  return [uidA, uidB].sort().join('_');
}

/** Creates the parent /dms/{conversationId} doc if it doesn't exist yet.
 * Required before any message can be sent or read — the security rules
 * check this doc's `participants` field for every message operation. */
export async function ensureConversation(uidA, uidB) {
  assertFirebaseReady();
  const conversationId = getConversationId(uidA, uidB);
  const ref = doc(db, 'dms', conversationId);

  let isNewConversation = true;
  try {
    const existing = await getDoc(ref);
    isNewConversation = !existing.exists();
  } catch (e) {
    // If this pre-check read fails for any reason, don't let it block
    // starting the actual conversation - worst case we double-count a
    // "first DM" badge, which is harmless compared to messaging being
    // broken entirely.
    console.error('ensureConversation pre-check failed, proceeding anyway:', e);
  }

  await setDoc(ref, {
    participants: [uidA, uidB].sort(),
  }, { merge: true });

  if (isNewConversation) {
    addDmPartner(uidA, uidB).catch((e) => console.error('Badge check failed:', e));
    addDmPartner(uidB, uidA).catch((e) => console.error('Badge check failed:', e));
  }

  return conversationId;
}

async function addDmPartner(uid, partnerUid) {
  const userRef = doc(db, 'users', uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const counters = { ...(data.counters || {}) };
    const existingPartners = counters.dmPartnerIds || [];
    if (existingPartners.includes(partnerUid)) return;
    counters.dmPartnerIds = [...existingPartners, partnerUid];
    counters.dmsStartedCount = (counters.dmsStartedCount || 0) + 1;

    const resolvedForCheck = { ...counters, hasPhoto: !!data.photoURL, hasBio: !!(data.bio && data.bio.trim()) };
    const newlyEarned = getNewlyEarnedBadges(resolvedForCheck, data.badges || []);
    const update = { counters };
    if (newlyEarned.length > 0) {
      update.badges = [...(data.badges || []), ...newlyEarned.map((b) => b.id)];
    }
    tx.update(userRef, update);
  });
}

/** Live list of every real conversation the given user is part of,
 * newest activity first. */
export function subscribeToMyConversations(uid, onUpdate) {
  if (!FIREBASE_READY || !db || !uid) return emptyUnsubscribe();
  const q = query(collection(db, 'dms'), where('participants', 'array-contains', uid));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => toMillis(b.lastMessageAt) - toMillis(a.lastMessageAt));
    onUpdate(list);
  });
}

export async function sendMessage(conversationId, { senderId, text }) {
  assertFirebaseReady();
  const trimmed = text.trim();
  await updateDoc(doc(db, 'dms', conversationId), {
    lastMessageAt: serverTimestamp(),
    lastMessageText: trimmed,
    lastSenderId: senderId,
  });
  return addDoc(collection(db, 'dms', conversationId, 'messages'), {
    senderId,
    text: trimmed,
    createdAt: serverTimestamp(),
    timestamp: Date.now(),
  });
}

export async function sendGift({ fromId, toId, amount, itemId, itemName, itemEmoji }) {
  assertFirebaseReady();
  const fromRef = doc(db, 'users', fromId);

  await runTransaction(db, async (tx) => {
    const fromSnap = await tx.get(fromRef);
    const currentBalance = fromSnap.exists() ? (fromSnap.data().hunnies || 0) : 0;
    if (currentBalance < amount) {
      throw new Error('insufficient-hunnies');
    }
    tx.update(fromRef, { hunnies: currentBalance - amount });
  });

  await addDoc(collection(db, 'hunnies_transactions'), {
    fromId,
    toId,
    amount: -amount,
    itemId,
    itemName,
    itemEmoji,
    createdAt: serverTimestamp(),
    timestamp: Date.now(),
  });

  const expiresAt = Date.now() + 12 * 60 * 60 * 1000;
  await addDoc(collection(db, 'active_gifts'), {
    fromId,
    toId,
    itemId,
    itemName,
    itemEmoji,
    sentAt: Date.now(),
    expiresAt,
    createdAt: serverTimestamp(),
  });

  bumpCounterAndCheckBadges(fromId, { giftsSentCount: 1 }).catch((e) => console.error('Badge check failed:', e));

  // If the receiver's current status is Rough Day, this gift lands the
  // "There For You" badge for them.
  try {
    const toSnap = await getDoc(doc(db, 'users', toId));
    const setFields = toSnap.exists() && toSnap.data().status === 'rough-day' ? { roughDayGifted: true } : {};
    await bumpCounterAndCheckBadges(toId, { giftsReceivedCount: 1 }, setFields);
  } catch (e) {
    console.error('Badge check failed:', e);
  }

  try {
    const fromSnap = await getDoc(doc(db, 'users', fromId));
    const senderName = fromSnap.exists() ? (fromSnap.data().displayName || 'Someone') : 'Someone';
    await createNotification(toId, {
      type: 'gift', icon: itemEmoji || '🎁', iconBg: 'rgba(245,158,11,0.18)',
      text: `${senderName} sent you ${itemEmoji || ''} ${itemName}`,
    });
  } catch (e) {
    console.error('Gift notification failed:', e);
  }
}

export async function buyForSelf({ uid, amount, itemId, itemName, itemEmoji }) {
  assertFirebaseReady();
  const userRef = doc(db, 'users', uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    const currentBalance = snap.exists() ? (snap.data().hunnies || 0) : 0;
    if (currentBalance < amount) throw new Error('insufficient-hunnies');
    tx.update(userRef, { hunnies: currentBalance - amount });
  });
  await addDoc(collection(db, 'hunnies_transactions'), {
    fromId: uid,
    toId: uid,
    amount: -amount,
    itemId,
    itemName,
    itemEmoji,
    createdAt: serverTimestamp(),
    timestamp: Date.now(),
  });
}

/** Profile customization purchases from the Honeypot (Halo Ring, Name
 * Flair, etc). Same atomic-deduction pattern as everything else, but
 * sets a 24h-expiring effect flag on the buyer's own profile instead of
 * creating a gift for someone else. */
export async function buyCosmetic({ uid, amount, itemId, itemName, itemEmoji, effect }) {
  assertFirebaseReady();
  const userRef = doc(db, 'users', uid);
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    const currentBalance = snap.exists() ? (snap.data().hunnies || 0) : 0;
    if (currentBalance < amount) throw new Error('insufficient-hunnies');
    const activeCosmetics = { ...(snap.data().activeCosmetics || {}) };
    activeCosmetics[effect] = expiresAt;
    tx.update(userRef, { hunnies: currentBalance - amount, activeCosmetics });
  });

  await addDoc(collection(db, 'hunnies_transactions'), {
    fromId: uid, toId: uid, amount: -amount, itemId,
    itemName, itemEmoji, createdAt: serverTimestamp(), timestamp: Date.now(),
  });

  return expiresAt;
}

export function subscribeToActiveGifts(uid, onUpdate) {
  if (!FIREBASE_READY || !db || !uid) return emptyUnsubscribe();
  const q = query(collection(db, 'active_gifts'), where('toId', '==', uid));
  return onSnapshot(q, (snap) => {
    const now = Date.now();
    const active = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((g) => g.expiresAt > now)
      .sort((a, b) => (b.sentAt || 0) - (a.sentAt || 0));
    onUpdate(active);
  });
}

/** Live list of the most recent gifts sent, platform-wide — powers the
 * "Chris sent Gigi flowers!" banner on Feed. Gifts are intentionally
 * public (see firestore.rules) since visible generosity is the whole
 * point of this app's reputation system. */
export function subscribeToRecentGifts(onUpdate, max = 5) {
  if (!FIREBASE_READY || !db) return emptyUnsubscribe();
  const q = query(collection(db, 'active_gifts'), orderBy('sentAt', 'desc'), limit(max));
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function subscribeToTransactions(uid, onUpdate) {
  if (!FIREBASE_READY || !db || !uid) return emptyUnsubscribe();
  const sentQ = query(collection(db, 'hunnies_transactions'), where('fromId', '==', uid));
  const receivedQ = query(collection(db, 'hunnies_transactions'), where('toId', '==', uid));

  let sent = [];
  let received = [];
  function emit() {
    const merged = [...sent, ...received];
    // A self-purchase (Treat Yourself) has fromId === toId === uid, which
    // would otherwise appear twice — dedupe by doc id.
    const seen = new Set();
    const deduped = merged.filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));
    deduped.sort((a, b) => b.timestamp - a.timestamp);
    onUpdate(deduped);
  }

  const unsub1 = onSnapshot(sentQ, (snap) => {
    sent = snap.docs.map((d) => ({ id: d.id, ...d.data(), timestamp: toMillis(d.data().createdAt || d.data().timestamp) }));
    emit();
  });
  const unsub2 = onSnapshot(receivedQ, (snap) => {
    received = snap.docs.map((d) => ({ id: d.id, ...d.data(), timestamp: toMillis(d.data().createdAt || d.data().timestamp) }));
    emit();
  });

  return () => { unsub1(); unsub2(); };
}

/** Tracks badge-relevant counters whenever a status changes: bumps
 * statusChangesCount always, appends to the custom-emoji collection when
 * relevant, and flags the one-time Free Period/Out Sick badges. */
export async function trackStatusChange(uid, statusKey, customEmoji) {
  const userRef = doc(db, 'users', uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const counters = { ...(data.counters || {}) };
    counters.statusChangesCount = (counters.statusChangesCount || 0) + 1;

    if (statusKey === 'custom' && customEmoji) {
      const existing = counters.customEmojisRolled || [];
      counters.customEmojisRolled = [...existing, customEmoji];
    }
    if (statusKey === 'free-period') counters.usedFreePeriodStatus = true;
    if (statusKey === 'out-sick') counters.usedSickStatus = true;

    const resolvedForCheck = { ...counters, hasPhoto: !!data.photoURL, hasBio: !!(data.bio && data.bio.trim()) };
    const newlyEarned = getNewlyEarnedBadges(resolvedForCheck, data.badges || []);
    const update = { counters };
    if (newlyEarned.length > 0) {
      update.badges = [...(data.badges || []), ...newlyEarned.map((b) => b.id)];
    }
    tx.update(userRef, update);
  });
}

export async function updatePresence(uid, status, statusText = '') {
  assertFirebaseReady();
  return setDoc(doc(db, 'presence', uid), {
    online: true,
    lastSeen: Date.now(),
    status,
    statusText,
  }, { merge: true });
}

export async function updateUserProfile(uid, updates) {
  assertFirebaseReady();
  return setDoc(doc(db, 'users', uid), updates, { merge: true });
}

const functions = app ? getFunctions(app) : null;
// ===================================================================
// GROUP STUDY SESSIONS — shared Ask Buzz chat, up to 5 people (host +
// 4 invitees). The anti-chaos safeguard: `isBuzzThinking` locks the
// whole group's input the instant ANY member sends a message, and
// unlocks once Buzz's reply lands. Nobody can talk over anybody else
// or over Buzz — enforced both client-side (disabled input) and at
// the rules level (a message write is rejected while locked).
// ===================================================================

const MAX_SESSION_MEMBERS = 5;

export async function createBuzzSession(hostId, hostName) {
  assertFirebaseReady();
  const result = await addDoc(collection(db, 'buzz_sessions'), {
    hostId,
    memberIds: [hostId],
    memberNames: { [hostId]: hostName },
    pendingInviteIds: [],
    isBuzzThinking: false,
    createdAt: serverTimestamp(),
    lastMessageAt: Date.now(),
  });
  return result.id;
}

export async function inviteToBuzzSession(sessionId, inviterName, inviteeUid) {
  assertFirebaseReady();
  const sessionRef = doc(db, 'buzz_sessions', sessionId);
  const snap = await getDoc(sessionRef);
  if (!snap.exists()) throw new Error('session-not-found');
  const data = snap.data();
  if (data.memberIds.length + data.pendingInviteIds.length >= MAX_SESSION_MEMBERS) {
    throw new Error('session-full');
  }
  if (data.memberIds.includes(inviteeUid) || data.pendingInviteIds.includes(inviteeUid)) {
    return; // already in or already invited
  }
  await updateDoc(sessionRef, { pendingInviteIds: [...data.pendingInviteIds, inviteeUid] });
  await createNotification(inviteeUid, {
    type: 'buzz_invite', icon: '🐝', iconBg: 'rgba(245,158,11,0.18)',
    text: `${inviterName} invited you to a Buzz study session`,
  });
}

export async function acceptBuzzSessionInvite(sessionId, uid, displayName) {
  assertFirebaseReady();
  const sessionRef = doc(db, 'buzz_sessions', sessionId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(sessionRef);
    if (!snap.exists()) throw new Error('session-not-found');
    const data = snap.data();
    if (data.memberIds.length >= MAX_SESSION_MEMBERS) throw new Error('session-full');
    tx.update(sessionRef, {
      memberIds: [...data.memberIds, uid],
      pendingInviteIds: data.pendingInviteIds.filter((id) => id !== uid),
      [`memberNames.${uid}`]: displayName,
    });
  });
}

export async function declineBuzzSessionInvite(sessionId, uid) {
  assertFirebaseReady();
  const sessionRef = doc(db, 'buzz_sessions', sessionId);
  const snap = await getDoc(sessionRef);
  if (!snap.exists()) return;
  await updateDoc(sessionRef, {
    pendingInviteIds: snap.data().pendingInviteIds.filter((id) => id !== uid),
  });
}

export async function leaveBuzzSession(sessionId, uid) {
  assertFirebaseReady();
  const sessionRef = doc(db, 'buzz_sessions', sessionId);
  const snap = await getDoc(sessionRef);
  if (!snap.exists()) return;
  const remaining = snap.data().memberIds.filter((id) => id !== uid);
  if (remaining.length === 0) {
    await deleteDoc(sessionRef);
  } else {
    await updateDoc(sessionRef, { memberIds: remaining });
  }
}

export function subscribeToMyBuzzSessions(uid, onUpdate) {
  if (!FIREBASE_READY || !db || !uid) return emptyUnsubscribe();
  const q = query(collection(db, 'buzz_sessions'), where('memberIds', 'array-contains', uid));
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function subscribeToMyBuzzInvites(uid, onUpdate) {
  if (!FIREBASE_READY || !db || !uid) return emptyUnsubscribe();
  const q = query(collection(db, 'buzz_sessions'), where('pendingInviteIds', 'array-contains', uid));
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function subscribeToBuzzSessionMessages(sessionId, onUpdate) {
  if (!FIREBASE_READY || !db || !sessionId) return emptyUnsubscribe();
  const q = query(collection(db, 'buzz_sessions', sessionId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/** Sends one member's message to the shared session, locks the group
 * (isBuzzThinking) so nobody else can send while Buzz is replying,
 * calls the real Buzz API with the session's history, writes his
 * reply, then unlocks. Throws if the group is already locked — the
 * caller (UI) should already be preventing this via disabled input,
 * this is the server-side backstop. */
export async function sendGroupBuzzMessage(sessionId, authorId, authorName, text, priorMessages) {
  assertFirebaseReady();
  const sessionRef = doc(db, 'buzz_sessions', sessionId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(sessionRef);
    if (!snap.exists()) throw new Error('session-not-found');
    if (snap.data().isBuzzThinking) throw new Error('session-locked');
    tx.update(sessionRef, { isBuzzThinking: true, lastMessageAt: Date.now() });
  });

  await addDoc(collection(db, 'buzz_sessions', sessionId, 'messages'), {
    from: 'user', authorId, authorName, text,
    createdAt: serverTimestamp(), timestamp: Date.now(),
  });

  try {
    const conversationForBuzz = [...priorMessages, { from: 'user', text: `${authorName}: ${text}` }]
      .map((m) => ({ from: m.from, text: m.text }));
    const result = await askBuzzFn({ messages: conversationForBuzz });
    let reply = result.data.reply;
    const bonusMatch = reply.match(/\[\[BONUS:(understanding|quiz_perfect)\]\]/);
    if (bonusMatch) reply = reply.replace(bonusMatch[0], '').trim();

    await addDoc(collection(db, 'buzz_sessions', sessionId, 'messages'), {
      from: 'buzz', text: reply, createdAt: serverTimestamp(), timestamp: Date.now(),
    });
    bumpCounterAndCheckBadges(authorId, { buzzQuestionsCount: 1 }).catch(() => {});
  } finally {
    await updateDoc(sessionRef, { isBuzzThinking: false });
  }
}

export const askBuzzFn = async (payload) => {
  if (!functions) {
    throw new Error('Firebase is not configured.');
  }
  return httpsCallable(functions, 'askBuzz')(payload);
};

export async function uploadProfilePhoto(uid, file) {
  assertFirebaseReady();
  const storageRef = ref(storage, `profile-photos/${uid}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  await updateUserProfile(uid, { photoURL: url });
  return url;
}

/** Uploads a photo of real handwritten/printed notes for the Library.
 * Returns the download URL — the caller passes this into
 * createLibraryResource as photoURL. Stored under a unique path per
 * upload (not per-user) since one person can upload many resources. */
export async function uploadLibraryResourcePhoto(uid, file) {
  assertFirebaseReady();
  const path = `library-photos/${uid}-${Date.now()}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
