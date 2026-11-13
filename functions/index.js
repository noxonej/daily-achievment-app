/**
 * Squzo's tiny server: sends reminder push notifications, even when the app is closed.
 *
 * Every 15 minutes it looks at push/{uid} (written by the app: your reminder times, time zone,
 * ready-made messages and push address) and sends the one reminder that is due. It uses the same
 * moments as the app (src/lib/nudges.ts reminderMoments): morning boost, midday, afternoon,
 * evening streak check and last call. Each moment fires at most once a day.
 *
 * The push keys (VAPID) are made automatically on the first run and stored in private/vapid,
 * which no app user can read. The public half goes to config/push for the app.
 */
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const webpush = require('web-push');

initializeApp();
const db = getFirestore();

async function vapidKeys() {
  const ref = db.doc('private/vapid');
  const snap = await ref.get();
  if (snap.exists) return snap.data();
  const keys = webpush.generateVAPIDKeys();
  await ref.set(keys);
  await db.doc('config/push').set({ publicKey: keys.publicKey });
  return keys;
}

/** Local date ("2026-11-12") and minutes after midnight in a time zone. */
function localNow(tz) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

const FALLBACK = {
  morning: { title: 'Good morning ☀', body: 'New day, new quests. Open Squzo and start with one small win.' },
  evening: { title: 'Your quests are waiting', body: 'One quick quest keeps your streak alive.' },
  lastcall: { title: 'Last call 🔥', body: 'Midnight is coming. One tiny quest saves your streak.' },
  comeback: { title: 'We miss you', body: 'Come back for one easy quest. Small steps still count.' },
};

function dueReminder(s, now) {
  const evening = s.eveningAt ?? 19 * 60;
  const morning = s.morningAt ?? 7 * 60 + 30;
  const lastCall = Math.max(21 * 60 + 30, evening + 120);
  const done = s.date === now.date && !!s.doneToday;
  const day = now.date;
  const pick = (map, kind) => (map && map[day]) || FALLBACK[kind];
  const moments = [
    { kind: 'morning', from: morning, to: morning + 180, any: true, msg: pick(s.morning, 'morning') },
    { kind: 'midday', from: 750, to: 870, msg: pick(s.comeback, 'comeback') },
    { kind: 'afternoon', from: 960, to: 1080, msg: pick(s.evening, 'evening') },
    { kind: 'evening', from: evening, to: Math.min(evening + 150, 1430), msg: pick(s.evening, 'evening') },
    { kind: 'lastcall', from: lastCall, to: 1430, msg: pick(s.lastCall, 'lastcall') },
  ].filter((x) => ['morning', 'evening', 'lastcall'].includes(x.kind) || Math.abs(x.from - evening) >= 90);
  return moments.find((x) => now.minutes >= x.from && now.minutes < x.to && (x.any || !done)) || null;
}

exports.sendReminders = onSchedule({ schedule: 'every 15 minutes', timeZone: 'UTC', memory: '256MiB' }, async () => {
  const keys = await vapidKeys();
  webpush.setVapidDetails('https://noxonej.github.io/daily-achievment-app/', keys.publicKey, keys.privateKey);
  const subs = await db.collection('push').where('enabled', '==', true).get();
  await Promise.all(
    subs.docs.map(async (doc) => {
      const s = doc.data();
      if (!s.sub) return;
      const now = localNow(s.tz);
      // Someone who hasn't opened the app for over a week only gets one reminder a day.
      const away = s.date && (Date.parse(now.date) - Date.parse(s.date)) / 86400000;
      const m = dueReminder(s, now);
      if (!m || (away > 7 && m.kind !== 'evening')) return;
      const firedRef = db.doc(`pushFired/${doc.id}`);
      const fired = (await firedRef.get()).data() || {};
      if (fired[m.kind] === now.date) return;
      await firedRef.set({ [m.kind]: now.date }, { merge: true });
      try {
        await webpush.sendNotification(JSON.parse(s.sub), JSON.stringify({ title: m.msg.title, body: m.msg.body, tag: `${m.kind}-${now.date}` }), { TTL: 3 * 3600 });
      } catch (e) {
        // 404/410: the phone removed this push address (app deleted or permission turned off).
        if (e.statusCode === 404 || e.statusCode === 410) await doc.ref.update({ enabled: false, sub: FieldValue.delete() });
      }
    }),
  );
});
