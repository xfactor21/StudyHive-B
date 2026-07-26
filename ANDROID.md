# Building the Android App

**Read this first:** I cannot produce a compiled `.apk` file for you directly — building one requires the Android SDK, Gradle, and a full build+sign process, none of which exist in the environment I work in, and downloading them requires internet access I don't have. Everything below is genuinely one command after another on your own machine, though — not a huge undertaking.

## One-time setup

1. **Install Android Studio** from [developer.android.com/studio](https://developer.android.com/studio) if you don't have it. This gives you the Android SDK, an emulator, and everything else needed.

2. In your project folder:
```
npm install
```
(This now also installs Capacitor, since it's in `package.json`.)

3. Build the web app and add the Android platform:
```
npm run build
npx cap add android
```
This creates a new `android/` folder — a full native Android project wrapping your app.

4. Before your first sync, open `capacitor.config.json` and consider changing `"appId": "com.studyhive.app"` to something unique to you (e.g. `com.yourname.studyhive`) — this is your app's permanent package identifier, harder to change later once published.

## Every time you make changes and want a new build

```
npm run android:sync
```
This rebuilds the web app and copies it into the Android project.

## Opening and building in Android Studio

```
npm run android:open
```
This launches Android Studio with the project loaded. From there:

- **For a quick test build:** Build → Build Bundle(s) / APK(s) → Build APK(s). Android Studio will produce a `.apk` file you can install directly on a phone (enable "Install unknown apps" in Android settings first) or run on an emulator.
- **For a real Play Store release:** Build → Generate Signed Bundle / APK — this walks you through creating a signing key (one-time setup, keep it safe — you need the same key for every future update) and produces a proper release build.

## If something goes wrong

- **Gradle sync fails / SDK not found:** Android Studio should prompt you to install missing SDK components automatically on first open — let it.
- **Blank/white screen in the app:** same root cause as the website — check that your Firebase environment variables were included in the build. Capacitor apps bundle whatever was in `dist/` at the time you ran `npm run android:sync`, so if you changed `.env.local`, rebuild first: `npm run build` then `npm run android:sync` again.
- **App works but Google Sign-In fails:** Google Sign-In on a real installed Android app (not a browser) typically needs a SHA-1 fingerprint registered in your Firebase project (Firebase Console → Project Settings → Your apps → Add fingerprint). Android Studio can show you this fingerprint under Gradle → Tasks → android → signingReport.

## Push Notifications — what's already built vs. what's left

The code side of this is already fully built and doesn't need more programming:
- `src/push.js` requests permission, registers the device, and saves the token to Firestore
- `functions/index.js` has `sendPushOnNotification`, which fires automatically the instant any real notification is created (likes, comments, gifts, upvotes, badges — all five, since it triggers generically on the whole `/notifications` collection, not per-type)
- `capacitor.config.json` now has the notification icon/color config it needs

What's left is genuinely all native-build and console setup, not code:

1. **Confirm Cloud Messaging is enabled** — Firebase Console → your project → Build → Messaging. If it says to enable the API, do that first.
2. **Add a notification icon.** Android requires a small, monochrome (white-on-transparent) icon for the status bar — it can't reuse your full-color app icon. Once you've run `npx cap add android`, drop a white silhouette PNG named `ic_stat_studyhive.png` into `android/app/src/main/res/drawable/` (a bee silhouette or hex outline works well). Without this, Android will show a fallback icon or fail to display the notification depending on OS version.
3. **Deploy the updated function:**
   ```
   firebase deploy --only functions
   ```
4. **Build and install the native app on a real device** (an emulator can receive pushes too, but a real phone is the honest test). Push registration only activates on `Capacitor.isNativePlatform()` — a browser tab, even on mobile Chrome, will never trigger it. This is why testing this specific feature on Netlify's web version won't work; it has to be the installed app.
5. **Grant notification permission** when the app asks on first launch. If you accidentally deny it, you'll need to re-enable it from the phone's own Settings → Apps → StudyHive → Notifications, since the in-app prompt won't ask twice.
6. **Trigger a real notification** from a second account (like someone's post, upvote their resource, etc.) and confirm the phone buzzes even with the app closed — that's the actual end-to-end test.

If it doesn't fire after all that, the most useful next debugging step is checking the Cloud Function logs (`firebase functions:log` or the Firebase Console → Functions → Logs) for `sendPushOnNotification` — it'll show exactly whether it ran, whether it found a token, and what FCM said back.
