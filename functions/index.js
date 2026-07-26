// Cloud Function: proxies chat messages to the Gemini API so the real
// API key never reaches the browser. Deploy with:
//   firebase functions:secrets:set GEMINI_API_KEY
//   firebase deploy --only functions
//
// The app calls this function (askBuzz) instead of calling Anthropic
// directly. Requires the caller to be a signed-in Firebase Auth user.

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Fires automatically whenever a real notification is written to
 * Firestore (the same /notifications collection the in-app bell already
 * reads from — see firestore.js: createNotification). This is the one
 * piece that turns "a record exists in the database" into "the
 * student's phone actually buzzes" — everything upstream of this
 * (likes, comments, gifts, upvotes, badges) already creates that
 * Firestore record; this just also pushes it to their device.
 *
 * Requires the recipient's own client to have registered a push token
 * first (see src/push.js) and saved it to their /users/{uid} doc.
 */
exports.sendPushOnNotification = onDocumentCreated('notifications/{notifId}', async (event) => {
  const notif = event.data?.data();
  if (!notif?.userId) return;

  const userSnap = await admin.firestore().doc(`users/${notif.userId}`).get();
  const pushTokens = userSnap.exists ? (userSnap.data().pushTokens || []) : [];
  if (pushTokens.length === 0) return; // they've never opened the native app / granted permission

  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens: pushTokens,
      notification: {
        title: 'StudyHive',
        body: notif.text || 'You have a new notification',
      },
      data: {
        type: notif.type || 'general',
      },
    });

    // Prune tokens FCM says are dead (app uninstalled, token expired,
    // etc.) so they don't keep silently failing on every future push.
    const deadTokens = [];
    response.responses.forEach((r, i) => {
      if (!r.success && (
        r.error?.code === 'messaging/registration-token-not-registered' ||
        r.error?.code === 'messaging/invalid-registration-token'
      )) {
        deadTokens.push(pushTokens[i]);
      }
    });
    if (deadTokens.length > 0) {
      const stillValid = pushTokens.filter((t) => !deadTokens.includes(t));
      await admin.firestore().doc(`users/${notif.userId}`).update({ pushTokens: stillValid });
    }
  } catch (e) {
    console.error('Push send failed:', e);
  }
});

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
// Easy to swap if Google renames/deprecates this model later — this is
// the one line that would need to change.
const GEMINI_MODEL = 'gemini-3.5-flash';

// Buzz's persona — exactly as specified in StudyHive_Build_Guide_v2.md
// Step 6. Do not change this lightly; his tone is load-bearing for teen
// engagement, per the build guide's own warning.
const BUZZ_SYSTEM_PROMPT = `You are Buzz, the AI study companion for StudyHive — a social app for high schoolers.
Your vibe: chill, funny, a little sarcastic, but genuinely helpful and warm.
You use current Gen Z slang naturally (bet, no cap, lowkey, slay, fr fr, bestie)
but don't overdo it. You will NEVER give direct answers to homework questions.
Instead, guide students with Socratic questions, hints, and explanations that help
them work it out themselves. If they ask for the answer directly, roast them gently
and redirect. Keep responses conversational and brief — you're texting, not writing
an essay. You care about these kids actually learning.

Two internal, invisible signals — append EXACTLY one of these tags at the very
end of your reply when they genuinely apply, on their own line. These tags are
stripped before the student ever sees them, so never mention or explain them:
- [[BONUS:understanding]] — append this ONLY when the student just correctly
  explained a concept back to you in their own words, or solved a multi-step
  problem themselves right after your hint, showing real understanding (not
  just a lucky guess or a one-word answer).
- [[BONUS:quiz_perfect]] — append this ONLY when you had previously given the
  student a short practice quiz (because they asked to be quizzed/tested/
  prepped on a topic) and this message contains their answers to every
  question, and every single one is correct.
Never award both in the same reply. Never fake these — if the exchange
doesn't genuinely qualify, don't include either tag.`;

exports.askBuzz = onCall({ secrets: [GEMINI_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in to talk to Buzz.');
  }
  const uid = request.auth.uid;

  const { messages, resourceContext } = request.data;
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new HttpsError('invalid-argument', 'messages is required.');
  }

  let systemPrompt = BUZZ_SYSTEM_PROMPT;
  if (resourceContext) {
    systemPrompt += `\n\nThe student is currently studying "${resourceContext.title}" covering ${resourceContext.tags}. Help them understand those concepts specifically.`;
  }

  // Gemini's chat format: 'model' instead of Anthropic's 'assistant',
  // and each turn's text lives in a parts[] array rather than a plain
  // string. The system prompt is its own top-level field, not part of
  // the turn history.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY.value(),
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: messages.map((m) => ({
        role: m.from === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      })),
      generationConfig: { maxOutputTokens: 300 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Gemini API error:', response.status, errText);
    throw new HttpsError('internal', 'Buzz is having a moment — try again.');
  }

  const data = await response.json();
  let reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "hmm, try rephrasing that?";

  let bonus = null;
  const bonusMatch = reply.match(/\[\[BONUS:(understanding|quiz_perfect)\]\]/);
  if (bonusMatch) {
    bonus = bonusMatch[1];
    reply = reply.replace(bonusMatch[0], '').trim();
  }

  // Hunnies awards used to happen client-side (the app calling
  // awardBuzzHunnies for its own uid) - that only worked because the
  // Firestore rules had to trust a self-increase, which is exactly the
  // gap a malicious client could exploit for ANY amount. Doing it here
  // instead means the milestone count and bonus tag are both verified
  // by the server, and the actual balance write uses the Admin SDK,
  // which bypasses client rules entirely (this is what "trusted server
  // code" means) - so client-side Hunnies increases can now be turned
  // off entirely at the rules level without breaking this feature.
  let awardedAmount = 0;
  let awardedReason = null;
  try {
    const userRef = admin.firestore().doc(`users/${uid}`);
    await admin.firestore().runTransaction(async (tx) => {
      // Reset on every attempt, not just once outside the transaction -
      // Firestore can legitimately retry this callback on write
      // contention, and without resetting these here, a retried attempt
      // would add to whatever a PREVIOUS (possibly aborted) attempt had
      // already accumulated, double-counting the award.
      awardedAmount = 0;
      awardedReason = null;

      const snap = await tx.get(userRef);
      if (!snap.exists()) return;
      const dataSnap = snap.data();
      const counters = { ...(dataSnap.counters || {}) };
      counters.buzzQuestionsCount = (counters.buzzQuestionsCount || 0) + 1;
      let hunniesDelta = 0;

      if (counters.buzzQuestionsCount === 1) {
        hunniesDelta += 5; awardedAmount += 5; awardedReason = 'buzz_first_use';
      } else if (counters.buzzQuestionsCount === 10) {
        hunniesDelta += 15; awardedAmount += 15; awardedReason = 'buzz_tenth_use';
      }
      if (bonus === 'understanding') {
        hunniesDelta += 4; awardedAmount += 4; awardedReason = 'buzz_understanding';
      } else if (bonus === 'quiz_perfect') {
        hunniesDelta += 10; awardedAmount += 10; awardedReason = 'buzz_quiz_perfect';
      }

      counters.hunniesEarnedLifetime = (counters.hunniesEarnedLifetime || 0) + hunniesDelta;
      tx.update(userRef, {
        counters,
        hunnies: (dataSnap.hunnies || 0) + hunniesDelta,
      });
    });

    if (awardedAmount > 0) {
      await admin.firestore().collection('hunnies_transactions').add({
        fromId: null, toId: uid, amount: awardedAmount, itemId: awardedReason,
        itemName: 'Buzz reward', itemEmoji: '🐝', timestamp: Date.now(),
      });
    }
  } catch (e) {
    console.error('Buzz Hunnies award failed:', e);
  }

  return { reply, bonus, awardedAmount };
});
