# StudyHive — React Build

Fresh React port of the HTML mockup. Same design system, same demo data, real components + Firestore-backed state for the core features.

## Setup — read this fully before running anything

This checklist comes from real problems hit while building and deploying this project. Most setup failures trace back to one of these.

### 1. Create your environment file

Copy `.env.example` to a new file named **exactly** `.env.local` (no `.txt`, no other suffix). **Windows hides file extensions by default** — if you create this via "New Text File" or rename in File Explorer, you can easily end up with `.env.local.txt` without realizing it. To check from a terminal:
```
dir .env*
```
This must show `.env.local` with nothing after it. If you see `.env.local.txt`, fix it with:
```
mv .env.local.txt .env.local
```
Then fill in your 6 real Firebase values (Firebase Console → Project Settings → General → Your apps → SDK setup and config).

If any of the 6 variables are missing, the app itself will now tell you — it shows a setup screen listing exactly which ones are absent, instead of a blank screen or a cryptic `auth/invalid-api-key` error.

### 2. Install dependencies

```
npm install
```
This project uses `vite ^8.x` with `@vitejs/plugin-react ^6.x` — these two versions are compatible with each other (confirmed against the real npm registry). If you ever see an `ERESOLVE` peer dependency error mentioning `vite`, do **not** downgrade vite — check that `@vitejs/plugin-react` in `package.json` is still on a `6.x` version that declares `vite: ^8.0.0` as its peer. Mismatches between these two specifically caused most of this project's early deploy failures.

The Cloud Function has its own separate dependencies:
```
cd functions
npm install
cd ..
```

### 3. Run it locally

```
npm run dev
```
Opens at `http://localhost:5173`. **Keep this terminal window open** — closing it stops the server, and the page will show connection-refused errors in the browser console (not a bug, just the server being gone).

If you edit `.env.local` while the server is running, **stop it (Ctrl+C) and restart `npm run dev`** — Vite only reads env files at startup, not live.

### 4. Deploying (Netlify or similar)

- `netlify.toml` is included and does three things: sets the publish directory to `dist`, adds the single-page-app redirect rule (without it: `Failed to load module script... MIME type "application/octet-stream"` errors), and tells Netlify to ignore the `functions/` folder (without it: `Cannot find module 'firebase-functions'` build failures — Netlify auto-detects that folder and tries to bundle it as a Netlify Function, which isn't what it's for here).
- Environment variables must **also** be added in your host's dashboard (Netlify: Site configuration → Environment variables) — `.env.local` is gitignored and never reaches your host. Use the exact same 6 variable names.
- Environment variables are read at **build time**. If you add/change them after a deploy already ran, you must trigger a **new** deploy for them to take effect.
- If you see `Firebase: Error (auth/invalid-api-key)` on a live deployed site, it's almost always: variables not set on the host, variables set but no new deploy triggered since, or a typo in a variable name.
- If Firestore calls fail with "client is offline" but your internet is fine, suspect a browser extension (ad blocker, privacy tool, VPN extension) intercepting requests to Google's APIs. Try Incognito mode to confirm.

### 5. Before going live for real

```
firebase deploy --only firestore:rules
firebase deploy --only storage
```
`firebase.json` is included so these commands know where to find the rules files.

If profile or Library photo uploads silently never appear (no error, just never shows), the cause is almost always Firebase Storage's CORS policy blocking the browser from loading the image after upload. `cors.json` is included at the project root with the fix — apply it once with:
```
gsutil cors set cors.json gs://your-bucket-name.firebasestorage.app
```
(find your real bucket name in `.env.local` under `VITE_FIREBASE_STORAGE_BUCKET`)

### 6. Ask Buzz (real AI responses)

```
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy --only functions
```
The Cloud Function proxies to the Gemini API server-side, so your key never reaches the browser. Get a key at https://aistudio.google.com/apikey.

---

## What's real (Firestore-backed) vs. demo

**Real:**
- Google Sign-In, account creation, and Firestore profile documents
- Feed posts — create, like, bookmark, comment, delete (own posts/comments, or as operator)
- Profile edits (name, handle, bio, classes) and photo upload via Firebase Storage
- Calendar events — create, view, delete
- Library uploads — a photo of real notes and/or typed text, not just a text description; tapping a resource opens it as a real lined-notebook page
- Hunnies economy — real balance, earned (never bought) via likes, uploads, upvotes, and Buzz milestones/bonuses; gifting via atomic transaction with a 12-hour "active gift" display on the receiver's profile; a public "Chris sent Gigi flowers!" banner on Feed, since visible generosity is the whole point of the reputation system; full transaction history
- A 50-badge achievement catalog, all genuinely earned by real actions (see `src/data/badges.js`)
- Daily activity streaks (calendar-day based, not a rolling 24h window)
- A 6-item cosmetics store (Halo Ring, Name Flair, Buzz's Wardrobe, Sparkle Trail, Rainbow Ring, VIP Crown) — real purchases, real 24h effects
- Real notifications (likes, comments, gifts, upvotes, badges) with swipe-to-dismiss and read state
- Saved Posts — a real view for what you've bookmarked
- Group Study Sessions in Ask Buzz — up to 5 people sharing one Buzz thread, with a real lock so the group can't talk over each other or over Buzz mid-reply
- Ask Buzz — real Gemini API responses via a Cloud Function proxy; can be given resource context directly from a Library page ("Ask Buzz about this")
- Status picker (Online, Out Sick, Heads Down, Rough Day, Free Period, Hive Roulette) — saves to Firestore; Hive Roulette randomly rolls one of 25 rare emoji and locks it in for 12 hours
- Class-tagging on posts and a real "My Classes" Feed filter
- Miss Me? — posts a real question to your feed and notifies every classmate who has that class listed
- Installable as a PWA (manifest + service worker), with a real back-button handling for sheets/modals
- Share — native share sheet on mobile, clipboard fallback on desktop

**Still demo/seed data, on purpose:**
- A handful of sample Library resources — kept intentionally so the Library never looks empty before real classmates contribute; toast-only when tapped, never faked as real
- "Following" feed filter — no follow-graph data model exists yet, so this one doesn't actually filter

## Security

Firestore rules restrict DM message reads and Hunnies transaction reads to actual participants only. Post/comment/event deletion is restricted to the original author or the app's two operator accounts. Hunnies specifically: the owner of an account may only *decrease* their own balance directly (spending), never increase it — all increases happen either through a narrow "someone else's action rewards me" exception, or server-side via the Admin SDK inside the Cloud Function (Buzz rewards), which bypasses client rules entirely as trusted server code. This closes off the most direct way a user could otherwise self-grant Hunnies via browser dev tools.

**Known residual risk:** badges and per-user counters (streak days, post counts, etc.) are still writable by their owner for the many self-tracked actions that award them (posting, uploading, commenting...) — badges can only ever grow, never be removed, but a technically inclined user could still inject a badge ID they haven't legitimately earned. Fully closing this would mean moving every self-tracked action's eligibility check into a Cloud Function, which is a larger change than this pass covers.

## Structure

```
src/
  data/          PEOPLE (demo), badges (50-item catalog), seedData (kept Library samples + real gift catalog)
  components/    Reusable pieces (HexAvatar, BuzzMascot, BuzzTeacherScene, StatusLabel, PostCard, TutorialOverlay...)
    screens/     Feed, Calendar, AskBuzz, Library, Profile, DevDashboard (hidden operator console)
    sheets/      All modals/sheets (DMs, Notifs, Badges, Honeypot, GroupSession, SavedPosts...)
  firebase/      config.js (init + env guard), useAuth.js, firestore.js (all reads/writes)
  utils/         calendarGrid.js, useCountdown.js
  assets/tour/   Real screenshots used in the onboarding tutorial cards
  push.js        Native push notification registration (no-ops entirely on web)
  App.jsx        Top-level state: active tab, open sheet, posts, current status, back-button history handling
  styles/global.css   Full design system as CSS custom properties — change tokens here
public/          PWA manifest, service worker, app icons (installable to home screen)
functions/       Cloud Function proxying Ask Buzz to the Gemini API + push notification delivery
android/         Capacitor-wrapped native Android project (see ANDROID.md)
```
