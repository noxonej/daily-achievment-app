/* Dayforge service worker: makes the app open offline and lets Android show notifications.
 * Pages: network first (so updates arrive right away), falling back to the cached copy offline.
 * Built files (hashed names) and icons: cache first, since a given URL never changes. */
const CACHE = 'dayforge-v6';
const STATUS_CACHE = 'dayforge-status';
const SHELL = ['./', './index.html', './manifest.webmanifest', './favicon.svg', './app-icon-192.png', './app-icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== STATUS_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok && (url.pathname.includes('/assets/') || /\.(png|svg|webmanifest)$/.test(url.pathname))) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});

// Tapping a notification brings the app to the front.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => 'focus' in c);
      return open ? open.focus() : self.clients.openWindow('./');
    }),
  );
});

// Motivational notifications with the app closed when the push sender isn't set up (installed app on
// Android: periodic background sync). The app saves the plan (src/lib/motivation.ts) into the cache.
async function readJson(cache, url) {
  const res = await cache.match(url);
  return res ? res.json() : null;
}

function dayBefore(date) {
  return new Date(Date.parse(date + 'T12:00:00Z') - 86400000).toISOString().slice(0, 10);
}

async function maybeNudge() {
  const cache = await caches.open(STATUS_CACHE);
  const status = await readJson(cache, './__dayforge-status.json');
  // The push sender delivers them: nothing to do here (avoids doubles).
  if (!status || !status.enabled || status.pushActive || !Array.isArray(status.plan)) return;
  const now = Date.now();
  const sent = (await readJson(cache, './__dayforge-sent.json')) || {};
  const due = status.plan.find((x) => x.at <= now && now - x.at < 45 * 60 * 1000 && !sent[x.tag]);
  if (!due) return;
  // Don't notify if the app is open and on screen.
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  if (windows.some((w) => w.visibilityState === 'visible')) return;
  sent[due.tag] = true;
  await cache.put('./__dayforge-sent.json', new Response(JSON.stringify(sent), { headers: { 'content-type': 'application/json' } }));
  const line = due.risk && status.lastDone === dayBefore(due.date) ? due.risk : due;
  await self.registration.showNotification(line.title, { body: line.body, tag: due.tag, icon: './app-icon-192.png', badge: './app-icon-192.png' });
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'dayforge-nudge') event.waitUntil(maybeNudge().catch(() => undefined));
});

// Real push from Squzo's server (functions/index.js): shows the reminder unless the app is on screen.
self.addEventListener('push', (event) => {
  let note = {};
  try {
    note = event.data ? event.data.json() : {};
  } catch {
    note = { title: 'Squzo', body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (windows.some((w) => w.visibilityState === 'visible')) return;
      await self.registration.showNotification(note.title || 'Squzo', {
        body: note.body || '',
        tag: note.tag,
        data: { url: './' },
        icon: './app-icon-192.png',
        badge: './app-icon-192.png',
      });
    })(),
  );
});
