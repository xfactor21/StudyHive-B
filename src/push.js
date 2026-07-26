// Native push notification registration. This deliberately does nothing
// on a plain web browser tab — push notifications only work inside the
// Capacitor-wrapped native app (see ANDROID.md), since browsers can't
// receive them the same way a real installed app can.
//
// Flow: request permission -> register with the OS -> get a device
// token -> save that token to the user's own /users/{uid} doc, so the
// sendPushOnNotification Cloud Function knows where to deliver a push.

import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase/config';

let capacitorCore = null;
let pushPlugin = null;

async function loadCapacitor() {
  if (capacitorCore) return capacitorCore;
  try {
    capacitorCore = await import('@capacitor/core');
    pushPlugin = await import('@capacitor/push-notifications');
    return capacitorCore;
  } catch {
    // Plugin not installed yet (e.g. running npm run dev on plain web,
    // or android/ hasn't been generated) — safe to no-op.
    return null;
  }
}

export async function registerForPushNotifications(uid) {
  const core = await loadCapacitor();
  if (!core || !core.Capacitor.isNativePlatform()) {
    // Running in a normal browser tab — nothing to register for.
    return;
  }
  const { PushNotifications } = pushPlugin;

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== 'granted') return;

  await PushNotifications.register();

  PushNotifications.addListener('registration', async (token) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        pushTokens: arrayUnion(token.value),
      });
    } catch (e) {
      console.error('Failed to save push token:', e);
    }
  });

  PushNotifications.addListener('registrationError', (err) => {
    console.error('Push registration failed:', err);
  });

  // A push that arrives while the app is already open — Android won't
  // auto-show these the way it does when the app is backgrounded, so
  // this is the hook point if you want an in-app toast for it later.
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received in foreground:', notification);
  });
}
