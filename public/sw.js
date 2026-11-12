/* Dayforge service worker: makes the app open offline and lets Android show notifications.
 * Pages: network first (so updates arrive right away), falling back to the cached copy offline.
 * Built files (hashed names) and icons: cache first, since a given URL never changes. */
const CACHE = 'dayforge-v5';
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
  // Same moments as the app (src/lib/nudges.ts reminderMoments): morning boost, midday, afternoon, evening, last call.
  const lastCall = Math.max(21 * 60 + 30, status.eveningAt + 120);
  const moments = [
    { kind: 'morning', from: status.morningAt, to: status.morningAt + 180, any: true, msg: status.morning[today] },
    { kind: 'midday', from: 750, to: 870, msg: status.comeback && status.comeback[today] },
    { kind: 'afternoon', from: 960, to: 1080, msg: status.evening[today] || (status.comeback && status.comeback[today]) },
    { kind: 'evening', from: status.eveningAt, to: Math.min(status.eveningAt + 150, 1430), msg: status.evening[today] },
    { kind: 'lastcall', from: lastCall, to: 1430, msg: status.lastCall && status.lastCall[today] },
  ].filter((x) => x.kind === 'evening' || x.kind === 'morning' || x.kind === 'lastcall' || Math.abs(x.from - status.eveningAt) >= 90);
  const m = moments.find((x) => x.msg && minutes >= x.from && minutes < x.to && fired[x.kind] !== today && (x.any || !done));
  if (m) note = { kind: m.kind, tag: `${m.kind}-${today}`, ...m.msg };
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
