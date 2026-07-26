import React, { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Splash from './components/Splash';
import SignInScreen from './components/SignInScreen';
import AccountSetupScreen from './components/AccountSetupScreen';

import FeedScreen from './components/screens/FeedScreen';
import CalendarScreen from './components/screens/CalendarScreen';
import AskBuzzScreen from './components/screens/AskBuzzScreen';
import LibraryScreen from './components/screens/LibraryScreen';
import UploadResourceSheet from './components/sheets/UploadResourceSheet';
import ProfileScreen from './components/screens/ProfileScreen';
import DevDashboard from './components/screens/DevDashboard';
import WelcomeGiftModal from './components/WelcomeGiftModal';
import TutorialOverlay from './components/TutorialOverlay';
import ConfirmDialog from './components/ConfirmDialog';

import DMSheet from './components/sheets/DMSheet';
import NotifsSheet from './components/sheets/NotifsSheet';
import HelpSheet from './components/sheets/HelpSheet';
import StatusSheet from './components/sheets/StatusSheet';
import UserProfileSheet from './components/sheets/UserProfileSheet';
import ExpandedPostSheet from './components/sheets/ExpandedPostSheet';
import CommentSheet from './components/sheets/CommentSheet';
import NewPostSheet from './components/sheets/NewPostSheet';
import HoneypotSheet from './components/sheets/HoneypotSheet';
import EditProfileSheet from './components/sheets/EditProfileSheet';
import HunniesHistorySheet from './components/sheets/HunniesHistorySheet';
import EventDetailSheet from './components/sheets/EventDetailSheet';
import NotebookPageSheet from './components/sheets/NotebookPageSheet';
import MissMeSheet from './components/sheets/MissMeSheet';
import SavedPostsSheet from './components/sheets/SavedPostsSheet';
import GroupSessionSheet from './components/sheets/GroupSessionSheet';
import CreateEventSheet from './components/sheets/CreateEventSheet';
import ReportSheet from './components/sheets/ReportSheet';
import CrisisResourcesSheet from './components/sheets/CrisisResourcesSheet';
import StaffDirectorySheet from './components/sheets/StaffDirectorySheet';
import PeopleSheet from './components/sheets/PeopleSheet';
import BadgesSheet from './components/sheets/BadgesSheet';

import { PEOPLE, CURRENT_USER_KEY, RARE_CUSTOM_EMOJI } from './data/people';
import { defaultAvatar } from './data/avatars';
import { useAuth } from './firebase/useAuth';
import * as fs from './firebase/firestore';
import { db, FIREBASE_READY, missingFirebaseEnv } from './firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { registerForPushNotifications } from './push';

const CENTERED_SHEETS = new Set(['status', 'comment', 'newpost', 'editprofile', 'eventdetail', 'report', 'createevent', 'uploadresource']);

// Same two accounts as isOperator() in firestore.rules. Client-side check
// is only used to decide whether to SHOW an operator-only control (like
// a delete button on someone else's post) — the rules are still what
// actually enforce it server-side, this just avoids showing a button
// that would fail anyway.
const OPERATOR_EMAILS = ['xfactorxai@gmail.com', 'chrisfrerking21@gmail.com'];

const EMPTY_STATS = [
  { num: '0', label: 'Posts' },
  { num: '0', label: 'Upvotes' },
  { num: '0', label: 'Streak' },
  { num: '0', label: 'Uploads' },
];

function getDefaultMe() {
  const demoMe = PEOPLE[CURRENT_USER_KEY];
  return {
    avatar: demoMe.avatar,
    name: demoMe.name,
    handle: demoMe.handle,
    bio: '',
    status: 'online',
    grade: '',
    school: '',
    badges: [],
    counters: {},
    activeCosmetics: {},
    classes: [],
    stats: EMPTY_STATS,
  };
}

export default function App() {
  const { user, profile, loading: authLoading, isNewUser, profileError, signIn, signOut, createProfile } = useAuth();
  const [authError, setAuthError] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('feed');
  const [openSheet, setOpenSheetRaw] = useState(null);

  // Back-button support for PWA/standalone installs. Deliberately never
  // calls history.back() from application code — that's async and racy
  // against an immediate pushState (e.g. closeSheet() then opening a
  // different sheet right after, which happens all over this file).
  // Only ever push/replace (both synchronous), and let popstate handle
  // real hardware/gesture back-presses exclusively.
  function setOpenSheetState(key) {
    if (openSheet && key) {
      // Switching directly from one sheet to another: replace rather
      // than push, so the stack depth stays put and a single back-press
      // from the new sheet correctly returns to "no sheet", not to the
      // one that got swapped out.
      window.history.replaceState({ sheet: key }, '');
    } else if (key) {
      window.history.pushState({ sheet: key }, '');
    }
    setOpenSheetRaw(key);
  }

  useEffect(() => {
    function handlePopState(event) {
      setOpenSheetRaw(event.state?.sheet || null);
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [realPosts, setRealPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [libraryResources, setLibraryResources] = useState([]);
  const [liveProfile, setLiveProfile] = useState(null);
  const [usersById, setUsersById] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [myConversations, setMyConversations] = useState([]);
  const [mySessions, setMySessions] = useState([]);
  const [myBuzzInvites, setMyBuzzInvites] = useState([]);
  const [viewingSession, setViewingSession] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [showDevDashboard, setShowDevDashboard] = useState(false);
  const [justOnboarded, setJustOnboarded] = useState(false);
  const [showWelcomeGift, setShowWelcomeGift] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [pendingConversationWith, setPendingConversationWith] = useState(null);
  const [me, setMe] = useState(getDefaultMe);
  const [myStatus, setMyStatus] = useState('online');
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [commentingPostId, setCommentingPostId] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [viewingResource, setViewingResource] = useState(null);
  const [pendingBuzzResource, setPendingBuzzResource] = useState(null);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    if (!user) return undefined;
    const unsubscribe = fs.subscribeToPosts((firestorePosts) => {
      setRealPosts(firestorePosts);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    const unsubscribe = fs.subscribeToAllUsers(setUsersById);
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    const unsubscribe = fs.subscribeToNotifications(user.uid, setNotifications);
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    const unsubscribe = fs.subscribeToMyConversations(user.uid, setMyConversations);
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    const unsubscribe = fs.subscribeToMyBuzzSessions(user.uid, setMySessions);
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    const unsubscribe = fs.subscribeToMyBuzzInvites(user.uid, setMyBuzzInvites);
    return unsubscribe;
  }, [user]);

  // Push notification registration. Safe to call unconditionally on
  // web - registerForPushNotifications checks Capacitor.isNativePlatform()
  // internally and does nothing at all outside the native Android app.
  // (This was previously removed entirely after an unrelated crash and
  // never reconnected, which meant push notifications never worked even
  // in the native app - the token was never being saved.)
  useEffect(() => {
    if (!user) return;
    registerForPushNotifications(user.uid).catch((e) => console.error('Push registration failed:', e));
  }, [user]);

  const posts = realPosts;

  useEffect(() => {
    if (!user) return undefined;
    const unsubscribe = fs.subscribeToCalendarEvents(setEvents);
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    const unsubscribe = fs.subscribeToLibraryResources(setLibraryResources);
    return unsubscribe;
  }, [user]);

  // Welcome gift: 5s after a brand-new user lands on the main app for the
  // first time, celebrate the 50 starting Hunnies. Only fires once, only
  // for the session where onboarding just happened — never on a later
  // sign-in, even the same day.
  useEffect(() => {
    if (!justOnboarded) return undefined;
    const timer = setTimeout(() => setShowWelcomeGift(true), 5000);
    return () => clearTimeout(timer);
  }, [justOnboarded]);

  useEffect(() => {
    if (!user || !db) return undefined;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) setLiveProfile(snap.data());
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const source = liveProfile || profile;
    if (!source) return;

    setMe((prev) => ({
      ...prev,
      avatar: source.photoURL || prev.avatar || PEOPLE[CURRENT_USER_KEY].avatar,
      name: source.displayName || prev.name,
      handle: source.handle || prev.handle,
      bio: source.bio || '',
      status: source.status || 'online',
      customEmoji: source.customEmoji || null,
      customExpiresAt: source.customExpiresAt || null,
      grade: source.grade || '',
      school: source.school || '',
      badges: source.badges || [],
      counters: source.counters || {},
      activeCosmetics: source.activeCosmetics || {},
      classes: source.classes || [],
    }));
    setMyStatus(source.status || 'online');
  }, [profile, liveProfile]);

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  const hunniesBalance = liveProfile?.hunnies ?? profile?.hunnies ?? 0;
  const isOperator = OPERATOR_EMAILS.includes(user?.email);
  const notifUnreadCount = notifications.filter((n) => !n.read).length;
  const dmUnreadCount = myConversations.filter((c) => {
    if (!user || !c.lastMessageAt || c.lastSenderId === user.uid) return false;
    const lastViewed = c.lastViewed?.[user.uid] || 0;
    return fs.toMillis(c.lastMessageAt) > lastViewed;
  }).length;

  function showToast(msg) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 2200);
  }

  async function handleShareApp() {
    const shareData = {
      title: 'StudyHive',
      text: "Join me on StudyHive — help classmates, earn Hunnies, and build real reputation. No ads, no algorithm, just helping each other out.",
      url: window.location.origin,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        showToast('Link copied — go paste it somewhere!');
      }
    } catch (err) {
      // AbortError just means they closed the native share sheet without
      // picking anything - not a real failure, don't show an error for it.
      if (err.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
          showToast('Link copied — go paste it somewhere!');
        } catch {
          showToast('Could not share — try copying the URL from your browser.');
        }
      }
    }
  }

  function closeSheet() {
    if (openSheet) {
      // Synchronous, same reasoning as setOpenSheetState above - a
      // hardware back-press after this correctly exits (nothing left
      // open), rather than racing against whatever opens next.
      window.history.replaceState({ sheet: null }, '');
      setOpenSheetRaw(null);
    }
  }

  function toggleLike(post) {
    const liked = post.likes?.includes(user.uid);
    fs.toggleLike(post.id, user.uid, liked, post.authorId).catch(() => showToast('Could not update like'));
  }

  function toggleBookmark(post) {
    const bookmarked = post.bookmarks?.includes(user.uid);
    fs.toggleBookmark(post.id, user.uid, bookmarked).catch(() => showToast('Could not update save'));
  }

  function statsFromCounters(counters) {
    const c = counters || {};
    return [
      { num: c.postsCount || 0, label: 'Posts' },
      { num: c.upvotesReceivedCount || 0, label: 'Upvotes' },
      { num: c.streakDays || 0, label: 'Streak' },
      { num: c.uploadsCount || 0, label: 'Uploads' },
    ];
  }

  function openProfile(personKey) {
    if (personKey === 'me') {
      // Don't rely on me.stats - it's a hardcoded placeholder default
      // that's never actually updated, always showing zeros regardless
      // of real activity. Compute it fresh from the real counters
      // instead, same as ProfileScreen.jsx already correctly does.
      setViewingProfile({ ...me, uid: user.uid, isMe: true, stats: statsFromCounters(me.counters) });
      setOpenSheetState('userprofile');
      return;
    }
    // A real other user's uid.
    const other = usersById[personKey];
    if (!other) {
      showToast("Couldn't load that profile — try again in a moment.");
      return;
    }
    setViewingProfile({
      uid: other.uid,
      name: other.displayName || 'A classmate',
      handle: other.handle || '',
      avatar: other.photoURL || defaultAvatar,
      status: other.status || 'online',
      bio: other.bio || '',
      badges: other.badges || [],
      customEmoji: other.customEmoji || null,
      customExpiresAt: other.customExpiresAt || null,
      activeCosmetics: other.activeCosmetics || {},
      stats: statsFromCounters(other.counters),
      isMe: false,
    });
    setOpenSheetState('userprofile');
  }

  function expandPost(post) {
    setExpandedPostId(post.id);
    setOpenSheetState('expandedpost');
  }

  async function handleDeletePost(postId) {
    try {
      await fs.deletePost(postId);
      closeSheet();
      showToast('Post deleted');
    } catch (e) {
      showToast('Could not delete post — try again');
      throw e; // let the caller (ExpandedPostSheet) know it failed, so it can reset its own "Deleting..." state instead of getting stuck
    }
  }

  async function handleDeleteReply(postId, replyId) {
    try {
      await fs.deleteReply(postId, replyId);
      showToast('Comment deleted');
    } catch {
      showToast('Could not delete comment — try again');
    }
  }

  async function handleDeleteEvent(eventId) {
    try {
      await fs.deleteCalendarEvent(eventId);
      closeSheet();
      showToast('Event deleted');
    } catch (e) {
      showToast('Could not delete event — try again');
      throw e; // let EventDetailSheet know it failed, so it can reset its "Deleting..." state
    }
  }

  function openComment(post) {
    setCommentingPostId(post.id);
    setOpenSheetState('comment');
  }

  function submitComment(text) {
    fs.addReply(commentingPostId, { authorId: user.uid, text })
      .then(() => showToast('Comment posted'))
      .catch(() => showToast('Could not post comment'));
    closeSheet();
  }

  function submitNewPost(text, type, classTag) {
    fs.createPost({ authorId: user.uid, type, text, classTag })
      .then(() => showToast('Posted to your feed'))
      .catch(() => showToast('Could not post — check your connection'));
    closeSheet();
  }

  function handleChooseSpend() {
    setShowWelcomeGift(false);
    setActiveTab('profile');
    setOpenSheetState('honeypot');
  }

  function handleChooseTour() {
    setShowWelcomeGift(false);
    setShowTour(true);
  }

  function handleFinishTour() {
    setShowTour(false);
  }

  function handleReplayTutorial() {
    closeSheet();
    setActiveTab('feed');
    setShowTour(true);
  }

  function handleAskBuzzAboutResource(resource) {
    closeSheet();
    setPendingBuzzResource({
      title: resource.title,
      tags: (resource.tags && resource.tags.join(', ')) || resource.tag || 'general studying',
    });
    setActiveTab('buzz');
  }

  async function selectStatus(statusKey) {
    const isLocked = myStatus === 'custom' && me.customExpiresAt && me.customExpiresAt > Date.now();
    if (isLocked) {
      // Blocks every attempt while locked, including re-rolling custom
      // itself - re-selecting it used to reset the 12h timer with a
      // fresh emoji, completely defeating the "stuck with it" design.
      showToast("You rolled the dice — you're locked in until it expires!");
      return;
    }

    const previousStatus = myStatus;
    const previousMe = me;

    let payload = { status: statusKey };
    if (statusKey === 'custom') {
      const emoji = RARE_CUSTOM_EMOJI[Math.floor(Math.random() * RARE_CUSTOM_EMOJI.length)];
      const expiresAt = Date.now() + 12 * 60 * 60 * 1000;
      payload = { status: statusKey, customEmoji: emoji, customExpiresAt: expiresAt };
    }

    setMyStatus(statusKey);
    setMe((prev) => ({ ...prev, ...payload }));
    closeSheet();

    try {
      await fs.updateUserProfile(user.uid, payload);
      await fs.updatePresence(user.uid, statusKey, statusKey);
      fs.trackStatusChange(user.uid, statusKey, payload.customEmoji).catch((e) => console.error('Badge check failed:', e));
      if (statusKey === 'custom') {
        showToast(`You rolled ${payload.customEmoji} — stuck with it for 12h!`);
      } else {
        showToast('Status updated');
      }
    } catch {
      setMyStatus(previousStatus);
      setMe(previousMe);
      showToast('Could not update status');
    }
  }

  function dismissNotification(id) {
    fs.deleteNotification(id).catch(() => showToast('Could not remove notification'));
  }

  function markNotifRead(id) {
    fs.markNotificationRead(id).catch(() => {});
  }

  function markAllNotifsRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    fs.markAllNotificationsRead(unreadIds).catch(() => showToast('Could not mark all read'));
  }

  function handleMissMe() {
    setOpenSheetState('missme');
  }

  async function confirmMissMe(classTag) {
    try {
      const notifiedCount = await fs.sendMissMeRequest(user.uid, classTag);
      closeSheet();
      showToast(
        notifiedCount > 0
          ? `Posted! ${notifiedCount} classmate${notifiedCount === 1 ? '' : 's'} in ${classTag} notified.`
          : `Posted to your feed — no one else has ${classTag} listed yet.`
      );
    } catch {
      showToast('Could not send Miss Me? request — try again.');
    }
  }

  async function handleCreateSession() {
    try {
      const sessionId = await fs.createBuzzSession(user.uid, me.name);
      setViewingSession({ id: sessionId, hostId: user.uid, memberIds: [user.uid], memberNames: { [user.uid]: me.name }, pendingInviteIds: [], isBuzzThinking: false });
      setOpenSheetState('groupsession');
    } catch {
      showToast('Could not start a session — try again.');
    }
  }

  function handleOpenSession(session) {
    setViewingSession(session);
    setOpenSheetState('groupsession');
  }

  async function handleAcceptInvite(session) {
    try {
      await fs.acceptBuzzSessionInvite(session.id, user.uid, me.name);
      setViewingSession(session);
      setOpenSheetState('groupsession');
    } catch (e) {
      showToast(e.message === 'session-full' ? 'That session filled up already.' : 'Could not join — try again.');
    }
  }

  async function handleDeclineInvite(sessionId) {
    try {
      await fs.declineBuzzSessionInvite(sessionId, user.uid);
    } catch {
      showToast('Could not decline — try again.');
    }
  }

  function handleGiftSent(gift, recipient) {
    closeSheet();
    showToast(`Sent ${gift.emoji} ${gift.name} to ${recipient.displayName || 'them'}!`);
  }

  function handleSelfTreatBought(gift) {
    closeSheet();
    showToast(`${gift.emoji} ${gift.name} added to your profile`);
  }

  async function saveProfileEdits(updates) {
    const payload = {
      displayName: updates.name,
      handle: updates.handle,
      bio: updates.bio,
      classes: updates.classes || [],
    };
    await fs.updateUserProfile(user.uid, payload);
    setMe((prev) => ({
      ...prev,
      name: payload.displayName,
      handle: payload.handle,
      bio: payload.bio,
      classes: payload.classes,
    }));
    showToast('Profile updated');
  }

  function handlePhotoUploaded(url) {
    setMe((prev) => ({ ...prev, avatar: url }));
    showToast('Profile photo updated');
  }

  function openResource(resource) {
    setViewingResource(resource);
    setOpenSheetState('notebookpage');
  }

  async function createResource({ title, tag, photoURL, noteText }) {
    try {
      await fs.createLibraryResource({ uploaderId: user.uid, title, tag, photoURL, noteText });
      closeSheet();
      showToast('Added to the Library — +5 🍯');
    } catch {
      showToast('Could not upload — try again');
    }
  }

  function openEvent(event) {
    setViewingEvent(event);
    setOpenSheetState('eventdetail');
  }

  function createEvent({ title, date, subject, type }) {
    fs.createCalendarEvent({ creatorId: user.uid, title, type, date, subject })
      .then(() => showToast('Event added to calendar'))
      .catch(() => showToast('Could not add event'));
    closeSheet();
  }

  function submitReport(text) {
    fs.createReport(text).catch((e) => console.error('Report submission failed:', e));
    showToast('Report submitted anonymously');
  }

  const expandedPost = posts.find((p) => p.id === expandedPostId);

  if (showSplash) {
    return <Splash onDone={() => setShowSplash(false)} />;
  }

  if (!FIREBASE_READY) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-5)' }}>
        <div style={{ maxWidth: 560, width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 'var(--space-5)' }}>
          <h2 style={{ marginBottom: 'var(--space-2)' }}>Firebase setup needed</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
            This build is healthy, but it will not run until the Firebase environment variables are added to <code>.env.local</code> and your hosting platform.
          </p>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Missing variables</div>
            <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)' }}>
              {missingFirebaseEnv.map((key) => <li key={key}>{key}</li>)}
            </ul>
          </div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', margin: 0 }}>
            After adding them, restart the dev server or trigger a fresh production deploy.
          </p>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return null;
  }

  if (profileError) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: 24, background: '#1E1B4B',
        color: '#F4F2FA', fontFamily: 'sans-serif',
      }}>
        <h2 style={{ marginBottom: 12 }}>Couldn't load your profile</h2>
        <p style={{ color: '#A8A3C0', marginBottom: 16, fontSize: 14 }}>
          This is almost always a Firestore permissions issue — the security
          rules may not be deployed yet. Run this from the project folder:
        </p>
        <pre style={{
          background: '#12102B', padding: 12, borderRadius: 8,
          fontSize: 13, overflowX: 'auto',
        }}>
          firebase deploy --only firestore:rules
        </pre>
        <p style={{ color: '#A8A3C0', marginTop: 16, marginBottom: 4, fontSize: 12 }}>
          Actual error:
        </p>
        <pre style={{
          background: '#12102B', padding: 12, borderRadius: 8,
          fontSize: 12, overflowX: 'auto', whiteSpace: 'pre-wrap',
        }}>
          {profileError}
        </pre>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 20, padding: '10px 20px', borderRadius: 999,
            background: '#F59E0B', color: '#1A1300', border: 'none',
            fontWeight: 700, cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <SignInScreen
        error={authError}
        onSignIn={async () => {
          setAuthError(null);
          try {
            await signIn();
          } catch (err) {
            setAuthError('Sign-in failed — try again.');
            console.error(err);
          }
        }}
      />
    );
  }

  if (isNewUser) {
    return (
      <AccountSetupScreen
        onCreateProfile={async (data) => {
          await createProfile(data);
          setJustOnboarded(true);
        }}
      />
    );
  }

  return (
    <div id="app">
      {showDevDashboard && (
        <DevDashboard
          onClose={() => setShowDevDashboard(false)}
          currentUser={user}
        />
      )}
      {showWelcomeGift && (
        <WelcomeGiftModal
          onChooseTour={handleChooseTour}
          onChooseSpend={handleChooseSpend}
        />
      )}
      {showTour && (
        <TutorialOverlay
          onFinish={handleFinishTour}
          onNavigate={setActiveTab}
          currentTab={activeTab}
        />
      )}
      {confirmingLogout && (
        <ConfirmDialog
          title="Log out of StudyHive?"
          message="You'll need to sign in again to get back in."
          confirmLabel="Log out"
          onConfirm={() => { setConfirmingLogout(false); signOut(); }}
          onCancel={() => setConfirmingLogout(false)}
        />
      )}
      <Header
        onOpenSheet={setOpenSheetState}
        dmUnreadCount={dmUnreadCount}
        notifUnreadCount={notifUnreadCount}
        onOpenDev={() => setShowDevDashboard(true)}
        onShare={handleShareApp}
      />

      {activeTab === 'feed' && (
        <FeedScreen
          posts={posts}
          onToggleLike={toggleLike}
          onToggleBookmark={toggleBookmark}
          onOpenProfile={openProfile}
          onExpandPost={expandPost}
          onOpenComment={openComment}
          onOpenComposer={() => setOpenSheetState('newpost')}
          onOpenStatusPicker={() => setOpenSheetState('status')}
          me={me}
          currentUser={user}
          usersById={usersById}
        />
      )}
      {activeTab === 'calendar' && (
        <CalendarScreen events={events} onOpenEvent={openEvent} onCreateEvent={() => setOpenSheetState('createevent')} />
      )}
      {activeTab === 'buzz' && (
        <AskBuzzScreen
          currentUser={user}
          showToast={showToast}
          me={me}
          mySessions={mySessions}
          myInvites={myBuzzInvites}
          usersById={usersById}
          onOpenSession={handleOpenSession}
          onCreateSession={handleCreateSession}
          onAcceptInvite={handleAcceptInvite}
          onDeclineInvite={handleDeclineInvite}
          pendingResource={pendingBuzzResource}
          onResourceConsumed={() => setPendingBuzzResource(null)}
        />
      )}
      {activeTab === 'library' && (
        <LibraryScreen
          resources={libraryResources}
          onOpenResource={openResource}
          onMissMe={handleMissMe}
          onAddResource={() => setOpenSheetState('uploadresource')}
          currentUser={user}
          usersById={usersById}
        />
      )}
      {activeTab === 'profile' && (
        <ProfileScreen
          me={me}
          currentUser={user}
          hunniesBalance={hunniesBalance}
          currentStatus={myStatus}
          onOpenStatusPicker={() => setOpenSheetState('status')}
          onOpenHoneypot={() => setOpenSheetState('honeypot')}
          onOpenHelp={() => setOpenSheetState('help')}
          onOpenEditProfile={() => setOpenSheetState('editprofile')}
          onOpenHunniesHistory={() => setOpenSheetState('hunnieshistory')}
          onOpenBadges={() => setOpenSheetState('badges')}
          onOpenSavedPosts={() => setOpenSheetState('savedposts')}
          onPhotoUploaded={handlePhotoUploaded}
          onReplayTutorial={handleReplayTutorial}
          onShareApp={handleShareApp}
          onLogout={() => setConfirmingLogout(true)}
        />
      )}

      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

      {toastMsg && (
        <div className="toast show">{toastMsg}</div>
      )}

      {openSheet && (
        <div
          className={`overlay open${CENTERED_SHEETS.has(openSheet) ? ' center' : ''}`}
          onClick={(e) => { if (e.target === e.currentTarget) closeSheet(); }}
        >
          {openSheet === 'dms' && (
            <DMSheet
              onClose={closeSheet}
              currentUser={user}
              usersById={usersById}
              openConversationWith={pendingConversationWith}
              onOpened={() => setPendingConversationWith(null)}
            />
          )}
          {openSheet === 'notifs' && (
            <NotifsSheet
              onClose={closeSheet}
              notifications={notifications}
              onDismiss={dismissNotification}
              onMarkRead={markNotifRead}
              onMarkAllRead={markAllNotifsRead}
            />
          )}
          {openSheet === 'help' && (
            <HelpSheet
              onClose={closeSheet}
              onOpenReport={() => setOpenSheetState('report')}
              onOpenCrisis={() => setOpenSheetState('crisis')}
              onOpenStaff={() => setOpenSheetState('staffdirectory')}
            />
          )}
          {openSheet === 'status' && (
            <StatusSheet currentStatus={myStatus} customExpiresAt={me.customExpiresAt} onSelectStatus={selectStatus} onClose={closeSheet} />
          )}
          {openSheet === 'userprofile' && (
            <UserProfileSheet
              open={true}
              onClose={closeSheet}
              profile={viewingProfile}
              isMe={viewingProfile?.isMe}
              onMessage={(p) => {
                setPendingConversationWith({ uid: p.uid });
                setOpenSheetState('dms');
              }}
            />
          )}
          {openSheet === 'expandedpost' && (
            <ExpandedPostSheet
              post={expandedPost}
              onClose={closeSheet}
              onToggleLike={toggleLike}
              onToggleBookmark={toggleBookmark}
              onOpenProfile={openProfile}
              onOpenComment={openComment}
              onDeletePost={handleDeletePost}
              onDeleteReply={handleDeleteReply}
              isOperator={isOperator}
              me={me}
              currentUser={user}
              usersById={usersById}
            />
          )}
          {openSheet === 'comment' && (
            <CommentSheet open={true} onClose={closeSheet} onSubmit={submitComment} />
          )}
          {openSheet === 'newpost' && (
            <NewPostSheet open={true} onClose={closeSheet} onSubmit={submitNewPost} myClasses={me.classes || []} />
          )}
          {openSheet === 'honeypot' && (
            <HoneypotSheet
              onClose={closeSheet}
              currentUser={user}
              hunniesBalance={hunniesBalance}
              onGiftSent={handleGiftSent}
              onSelfTreatBought={handleSelfTreatBought}
            />
          )}
          {openSheet === 'editprofile' && (
            <EditProfileSheet me={me} currentUser={user} onClose={closeSheet} onSave={saveProfileEdits} onPhotoUploaded={handlePhotoUploaded} />
          )}
          {openSheet === 'hunnieshistory' && (
            <HunniesHistorySheet onClose={closeSheet} currentUser={user} />
          )}
          {openSheet === 'uploadresource' && (
            <UploadResourceSheet onClose={closeSheet} onSubmit={createResource} currentUser={user} />
          )}
          {openSheet === 'eventdetail' && (
            <EventDetailSheet event={viewingEvent} onClose={closeSheet} onDelete={handleDeleteEvent} currentUser={user} isOperator={isOperator} />
          )}
          {openSheet === 'notebookpage' && (
            <NotebookPageSheet resource={viewingResource} onClose={closeSheet} onAskBuzz={handleAskBuzzAboutResource} />
          )}
          {openSheet === 'missme' && (
            <MissMeSheet myClasses={me.classes || []} onClose={closeSheet} onConfirm={confirmMissMe} />
          )}
          {openSheet === 'savedposts' && (
            <SavedPostsSheet
              onClose={closeSheet}
              onToggleLike={toggleLike}
              onToggleBookmark={toggleBookmark}
              onOpenProfile={openProfile}
              onExpandPost={expandPost}
              onOpenComment={openComment}
              me={me}
              currentUser={user}
              usersById={usersById}
            />
          )}
          {openSheet === 'groupsession' && (
            <GroupSessionSheet
              session={mySessions.find((s) => s.id === viewingSession?.id) || viewingSession}
              onClose={closeSheet}
              currentUser={user}
              usersById={usersById}
              showToast={showToast}
              me={me}
            />
          )}
          {openSheet === 'createevent' && (
            <CreateEventSheet onClose={closeSheet} onSubmit={createEvent} />
          )}
          {openSheet === 'report' && (
            <ReportSheet onClose={closeSheet} onSubmit={submitReport} />
          )}
          {openSheet === 'crisis' && (
            <CrisisResourcesSheet onClose={closeSheet} />
          )}
          {openSheet === 'staffdirectory' && (
            <StaffDirectorySheet onClose={closeSheet} />
          )}
          {openSheet === 'people' && (
            <PeopleSheet
              onClose={closeSheet}
              usersById={usersById}
              currentUser={user}
              onOpenProfile={(uid) => { closeSheet(); openProfile(uid); }}
              onMessage={(p) => {
                setPendingConversationWith({ uid: p.uid });
                setOpenSheetState('dms');
              }}
            />
          )}
          {openSheet === 'badges' && (
            <BadgesSheet onClose={closeSheet} earnedIds={me.badges} />
          )}
        </div>
      )}
    </div>
  );
}
