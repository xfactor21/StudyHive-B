// Minimal service worker for StudyHive's PWA install support.
//
// Deliberately simple: it only ever caches the static app shell (the
// built JS/CSS/HTML), never anything from Firestore, Storage, or the
// Buzz Cloud Function. Caching live data here would mean stale
// Hunnies balances, stale posts, stale everything — so any request
// that isn't a same-origin static file just passes straight through
// to the network, uncached, every time.

const CACHE_NAME = 'studyhive-shell-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin GET requests for the static shell. Everything
  // else (Firestore, Storage, Cloud Functions, Google auth, any
  // cross-origin request) passes straight through untouched.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Navigation requests (index.html) get network-first, not cache-first.
  // Unlike the JS/CSS bundles (which Vite gives hashed, deploy-unique
  // filenames - safe to cache forever, since a new deploy is a genuinely
  // new URL), index.html always has the same URL. Cache-first for it
  // would mean a PWA-installed user could keep getting served an old
  // index.html referencing old hashed asset names indefinitely after a
  // new deploy, with no way to naturally pick up the update.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request)) // offline fallback only
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached); // offline: fall back to whatever's cached

      return cached || networkFetch;
    })
  );
});
