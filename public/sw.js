/* Dayforge service worker: makes the app open offline and lets Android show notifications.
 * Pages: network first (so updates arrive right away), falling back to the cached copy offline.
 * Built files (hashed names) and icons: cache first, since a given URL never changes. */
const CACHE = 'dayforge-v2';
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

// Motivational reminders with the app closed (installed app on Android: periodic background sync).
// The app writes today's status and ready-made messages into the cache; here we only decide whether to show one.
function localDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function readJson(cache, url) {
  const res = await cache.match(url);
  return res ? res.json() : null;
}

async function maybeNudge() {
  const cache = await caches.open(STATUS_CACHE);
  const status = await readJson(cache, './__dayforge-status.json');
  if (!status || !status.enabled) return;
  const now = new Date();
  const today = localDate(now);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const fired = (await readJson(cache, './__dayforge-fired.json')) || {};
  // If the app wasn't opened today, no quest is done yet.
  const done = status.date === today && status.doneToday;
  let note = null;
  if (minutes >= status.eveningAt && minutes < 23 * 60 + 50 && !done && fired.evening !== today && status.evening[today]) {
    note = { kind: 'evening', tag: `nudge-${today}`, ...status.evening[today] };
  } else if (minutes >= status.morningAt && minutes < status.morningAt + 180 && fired.morning !== today && status.morning[today]) {
    note = { kind: 'morning', tag: `boost-${today}`, ...status.morning[today] };
  }
  if (!note) return;
  // Don't notify if the app is open and on screen.
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  if (windows.some((w) => w.visibilityState === 'visible')) return;
  fired[note.kind] = today;
  await cache.put('./__dayforge-fired.json', new Response(JSON.stringify(fired), { headers: { 'content-type': 'application/json' } }));
  await self.registration.showNotification(note.title, { body: note.body, tag: note.tag, icon: './app-icon-192.png', badge: './app-icon-192.png' });
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'dayforge-nudge') event.waitUntil(maybeNudge().catch(() => undefined));
});
