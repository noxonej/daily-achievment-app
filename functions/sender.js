/**
 * Squzo's push sender: delivers the motivational notifications the app planned (src/lib/motivation.ts).
 *
 * Every phone with notifications on saves pushQueue/{token}: its push address and the next 14 days
 * of messages with their exact times. This runs every 15 minutes, sends whatever is due (at most 45
 * minutes late, so nothing ever arrives in the middle of the night), and remembers what it sent in
 * pushSent/{token}.
 *
 * Used by scripts/push/run.cjs (GitHub Actions, free) and functions/index.js (Firebase, Blaze plan).
 */
const { validSubscription, endpointHost } = require('./pushSafety');

const LATE_MS = 45 * 60 * 1000;
const DAY = 86400000;
/** At most this many phones per run, so a flood of fake docs can't make a run take forever. */
const MAX_DOCS = 2000;
/** A phone that hasn't saved its plan for 30 days has stopped using Squzo: forget it. */
const STALE_MS = 30 * DAY;

/** Local date ("2026-11-14") and minutes after midnight in a time zone. */
function localNow(tz, now) {
  let parts;
  try {
    parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(now));
  } catch {
    return localNow('UTC', now);
  }
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

function dayBefore(date) {
  return new Date(Date.parse(`${date}T12:00:00Z`) - DAY).toISOString().slice(0, 10);
}

/** For someone who hasn't opened Squzo for 14+ days: one gentle message a day, near the end of their window. */
const COMEBACK = [
  { title: 'Your World misses you.', body: 'Come back for one easy quest. Small steps still count.' },
  { title: 'It’s you vs. you.', body: 'Open Squzo and start again with one small win.' },
  { title: 'Fresh start?', body: 'Yesterday doesn’t matter. One quest today and you’re back.' },
  { title: 'Small steps today.', body: 'Big results tomorrow. Open Squzo.' },
];

/** What to send for this person right now, or null. */
function pick(s, sent, now) {
  const plan = Array.isArray(s.plan) ? s.plan : [];
  const due = plan.find((x) => typeof x.at === 'number' && x.at <= now && now - x.at < LATE_MS && !sent[x.tag]);
  if (due) {
    const atRisk = due.risk && s.lastDone === dayBefore(due.date);
    // Tough love: the 3rd message turns cheeky when the app wasn't opened yet that day.
    const line = atRisk ? due.risk : due.tough && s.lastOpen !== due.date ? due.tough : due;
    return { tag: due.tag, title: line.title, body: line.body };
  }
  // Plan used up (app not opened for two weeks): one message a day, respecting quiet hours.
  const lastPlanned = plan.reduce((m, x) => Math.max(m, x.at || 0), 0);
  if (lastPlanned > now || !s.prefs) return null;
  const local = localNow(s.prefs.tz, now);
  const at = Math.max(s.prefs.from || 540, (s.prefs.to || 1260) - 120);
  if (local.minutes < at || local.minutes >= at + 45) return null;
  const tag = `squzo-${local.date}-back`;
  if (sent[tag]) return null;
  const n = Math.floor(Date.parse(`${local.date}T00:00:00Z`) / DAY);
  return { tag, ...COMEBACK[n % COMEBACK.length] };
}

async function vapidKeys(db, webpush) {
  const ref = db.doc('private/vapid');
  const snap = await ref.get();
  if (snap.exists) return snap.data();
  const keys = webpush.generateVAPIDKeys();
  await ref.set(keys);
  await db.doc('config/push').set({ publicKey: keys.publicKey });
  return keys;
}

/** One round: send everything that's due. Returns counts for the log. */
async function runOnce(db, webpush, now = Date.now(), opts = {}) {
  const keys = await vapidKeys(db, webpush);
  // The public key must always be readable by the app (it may have been deleted by hand).
  const cfg = await db.doc('config/push').get();
  if (!cfg.exists || cfg.data().publicKey !== keys.publicKey) await db.doc('config/push').set({ publicKey: keys.publicKey });
  webpush.setVapidDetails('https://noxonej.github.io/daily-achievment-app/', keys.publicKey, keys.privateKey);

  // Oldest first, so stale docs are always seen (and removed) even when there are more than MAX_DOCS.
  const docs = await db.collection('pushQueue').orderBy('updatedAt').limit(MAX_DOCS).get();
  const stats = { phones: docs.size, sent: 0, gone: 0, failed: 0, skipped: 0, stale: 0, capped: docs.size >= MAX_DOCS };
  const forget = async (doc) => {
    await doc.ref.delete();
    await db.doc(`pushSent/${doc.id}`).delete();
  };
  await Promise.all(
    docs.docs.map(async (doc) => {
      const raw = doc.data();
      if (typeof raw.updatedAt !== 'number' || now - raw.updatedAt > STALE_MS) {
        await forget(doc);
        stats.stale++;
        return;
      }
      let s;
      try {
        s = JSON.parse(raw.data || '{}');
      } catch {
        await forget(doc);
        stats.skipped++;
        return;
      }
      if (!s || !s.on) return;
      // Only real push services, and the host the app declared must match the address (A1).
      if (!validSubscription(s.sub) || (raw.host && raw.host !== endpointHost(s.sub.endpoint))) {
        await forget(doc);
        stats.skipped++;
        return;
      }
      const sentRef = db.doc(`pushSent/${doc.id}`);
      const sentDoc = await sentRef.get();
      const sent = (sentDoc.exists && sentDoc.data().tags) || {};
      // A test message (started by hand) goes to every phone right away.
      const msg = opts.test ? { tag: `test-${now}`, title: 'Squzo is connected ✅', body: 'Notifications work. Your daily nudges will show up here.' } : pick(s, sent, now);
      if (!msg) return;
      // Mark first, so a slow or repeated run can never send the same message twice.
      const keep = Object.keys(sent).sort().slice(-40);
      const tags = Object.fromEntries(keep.map((k) => [k, true]));
      tags[msg.tag] = true;
      await sentRef.set({ tags });
      // Only the fields web-push needs, so nothing else from the doc reaches the request.
      const sub = { endpoint: s.sub.endpoint, keys: { p256dh: s.sub.keys.p256dh, auth: s.sub.keys.auth } };
      try {
        await webpush.sendNotification(sub, JSON.stringify(msg), { TTL: 45 * 60, urgency: 'normal', topic: msg.tag.replace(/[^A-Za-z0-9_-]/g, '').slice(-32), timeout: 10000 });
        stats.sent++;
      } catch (e) {
        // 404/410: the phone removed this push address (app deleted or notifications turned off).
        if (e.statusCode === 404 || e.statusCode === 410) {
          await forget(doc);
          stats.gone++;
        } else {
          stats.failed++;
          console.error('push failed', doc.id.slice(0, 6), e.statusCode || '', e.body || e.message);
        }
      }
    }),
  );
  if (stats.capped) console.warn(`pushQueue has ${MAX_DOCS}+ docs: only the oldest ${MAX_DOCS} were handled this run.`);
  return stats;
}

module.exports = { runOnce, pick, localNow, MAX_DOCS, STALE_MS };
