import { useEffect, useRef } from 'react';
import type { AppState, DerivedStats } from './types';
import { addDaysToKey, todayKey } from './date';
import { hashString } from './hash';
import { fullPrefs } from './prefs';
import { showSystemNotification } from './notify';
import { loadQuotes, poolFor, quoteOfDay } from './quotes';

/**
 * Motivational reminders. Tough love, never mean: they push you out of your comfort zone and
 * remind you of your streak, but they never insult you. {n} is the streak, {name} your name.
 */
type Line = { title: string; body: string };

/** You have a streak and haven't done a quest today. */
const STREAK: Line[] = [
  { title: '🔥 {n} days. Don’t let it die.', body: 'One quest keeps the fire alive. It takes two minutes.' },
  { title: 'Your streak is getting cold', body: '{n} days of work are waiting on one small quest today.' },
  { title: '{n} days strong… or 0 tomorrow?', body: 'Your choice. Open the app and do the easiest quest.' },
  { title: 'Future you is watching', body: 'They really want that {n}-day streak to survive tonight.' },
  { title: 'Not today, excuses', body: 'You didn’t build {n} days to stop now. One quest.' },
  { title: 'The fire needs wood', body: 'Your {n}-day streak ends at midnight. Feed it.' },
  { title: 'Champions show up on boring days too', body: 'Today is one of those days. Keep the {n}-day streak.' },
  { title: 'Quick check-in', body: 'Did you forget something? Your {n}-day streak didn’t.' },
  { title: 'Discipline > motivation', body: 'You don’t have to feel like it. Just do one quest for your {n}-day streak.' },
  { title: '{name}, your streak called', body: 'It said it misses you. {n} days, one quest left to keep it.' },
  { title: 'Still time. Not much.', body: 'Your {n}-day streak is safe if you finish one quest before midnight.' },
  { title: 'Remember why you started', body: '{n} days ago you decided to change. Keep that promise today.' },
  { title: 'Don’t break the chain', body: '{n} links so far. Add today’s.' },
  { title: 'Two minutes. That’s it.', body: 'Drink a glass of water, tick it off, streak saved. 🔥 {n}' },
  { title: 'You’re better than “I’ll do it tomorrow”', body: 'Tomorrow your streak is 0. Today it can be {next}.' },
];

/** No streak right now. */
const START: Line[] = [
  { title: 'Day 1 starts with one quest', body: 'Every long streak began exactly like this. Go.' },
  { title: 'Nobody is coming to do it for you', body: 'Good news: that means you can. Open one quest.' },
  { title: 'Fresh start, {name}', body: 'Yesterday doesn’t matter. One quest today and you’re back.' },
  { title: 'Comfort is nice. Growth is better.', body: 'Do one thing today your future self will thank you for.' },
  { title: 'The couch will still be there', body: 'Do one quest first. Then relax, you earned it.' },
  { title: 'Small step, big difference', body: 'Two minutes of effort beats two hours of thinking about it.' },
  { title: 'Ready is a myth', body: 'You will never feel 100% ready. Start anyway.' },
  { title: 'Light the fire 🔥', body: 'One quest today starts a new streak.' },
  { title: 'Phone in hand anyway?', body: 'Use it to tick off one quest instead of scrolling.' },
  { title: 'Today counts', body: 'You won’t get this day back. Make one thing happen.' },
  { title: '🎁 Your daily reward is waiting', body: 'Open the app to claim it. Tomorrow’s is even better.' },
  { title: 'Free coins, today only', body: 'Today’s daily reward disappears at midnight. Grab it and do one quest.' },
  { title: 'Day 7 has a prize chest', body: 'Keep claiming your daily reward to reach it.' },
];

/** Comfort-zone pushes and general fire, used any day. */
const PUSH: Line[] = [
  { title: 'Do the hard thing first', body: 'The quest you’re avoiding is the one that changes you.' },
  { title: 'Get uncomfortable', body: 'Talk to someone new, take the cold shower, raise your hand. Growth lives there.' },
  { title: 'Scroll less, live more', body: 'Put the phone down for 30 minutes. See what happens.' },
  { title: 'Somebody busier than you is doing it', body: 'Right now. What’s your excuse?' },
  { title: 'Average is easy', body: 'You didn’t download this app to be average. One quest.' },
  { title: 'Earn your rest', body: 'Finish one quest, then enjoy your evening guilt-free.' },
  { title: 'Hey {name} 👋', body: 'Quick reminder that you can do hard things. Prove it today.' },
  { title: 'Be 1% better than yesterday', body: 'That’s all. One small win today.' },
  { title: 'Your goals don’t care how you feel', body: 'Feelings follow actions. Move first.' },
  { title: 'Make your future self proud', body: 'They’re built from what you do today.' },
  { title: 'No zero days', body: 'Even a tiny quest is infinitely more than nothing.' },
  { title: 'Win the evening', body: 'Plan tomorrow, tidy one thing, tick a quest. Sleep proud.' },
  { title: 'Drink some water 💧', body: 'Your brain is thirsty. Then go crush a quest.' },
  { title: 'The best time was yesterday', body: 'The second best time is right now.' },
  { title: 'You vs. you', body: 'Not your friends, not the internet. Just beat yesterday’s you.' },
  { title: 'Keep the promise you made yourself', body: 'Confidence is built from kept promises.' },
  { title: 'Lazy day? Fine.', body: 'Do the smallest quest you have. Then be lazy.' },
  { title: 'Your excuses are lying to you', body: 'You have two minutes. You always do.' },
  { title: 'Champions are made when nobody watches', body: 'Nobody is watching right now. Perfect time.' },
  { title: 'Step out of the comfort zone', body: 'Do one thing today that scares you a tiny bit.' },
  { title: 'Hard choices, easy life', body: 'Easy choices, hard life. Pick the quest.' },
  { title: 'Progress, not perfection', body: 'It doesn’t have to be great. It has to be done.' },
  { title: 'Don’t wait for Monday', body: 'Today is a perfectly good day to start.' },
  { title: 'You’ve got this', body: 'Seriously. One quest, then tell me I was wrong.' },
  { title: 'Small wins add up', body: 'Ten minutes a day is sixty hours a year.' },
];

/** All the lines (for the Settings "send a test" and the count shown there). */
export const NUDGE_COUNT = STREAK.length + START.length + PUSH.length;

function fill(line: Line, vars: Record<string, string | number>): Line {
  const f = (s: string) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
  const title = f(line.title);
  return { title: title.charAt(0).toUpperCase() + title.slice(1), body: f(line.body) };
}

/** Picks today's reminder: a different one every day, matching your situation. */
export function pickNudge(streak: number, name: string, date: string = todayKey(), salt = ''): Line {
  const pool = streak > 0 ? [...STREAK, ...STREAK, ...PUSH] : [...START, ...PUSH];
  // Never the same message two days in a row.
  let i = hashString(`nudge|${date}|${salt}`) % pool.length;
  const prev = hashString(`nudge|${addDaysToKey(date, -1)}|${salt}`) % pool.length;
  if (pool[i] === pool[prev]) i = (i + 1) % pool.length;
  const line = pool[i];
  const safeName = name.trim() || 'friend';
  return fill(line, { n: streak, next: streak + 1, name: safeName });
}

export function randomNudge(streak: number, name: string): Line {
  return pickNudge(streak, name, todayKey(), String(Math.random()));
}

// ---- Scheduling ----

const FIRED_KEY = 'dayforge-nudge-fired';
const STATUS_CACHE = 'dayforge-status';
const STATUS_URL = './__dayforge-status.json';

const FIRED_URL = './__dayforge-fired.json';

/** Which reminders already went out today, shared with the service worker so you never get one twice. */
async function readFired(): Promise<Record<string, string>> {
  let out: Record<string, string> = {};
  try {
    out = JSON.parse(localStorage.getItem(FIRED_KEY) || '{}');
  } catch {
    // ignore
  }
  try {
    const res = await (await caches.open(STATUS_CACHE)).match(FIRED_URL);
    if (res) {
      const sw = (await res.json()) as Record<string, string>;
      for (const k of Object.keys(sw)) if (!out[k] || sw[k] > out[k]) out[k] = sw[k];
    }
  } catch {
    // ignore
  }
  return out;
}
async function markFired(kind: string, date: string) {
  const all = { ...(await readFired()), [kind]: date };
  try {
    localStorage.setItem(FIRED_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
  try {
    await (await caches.open(STATUS_CACHE)).put(FIRED_URL, new Response(JSON.stringify(all), { headers: { 'content-type': 'application/json' } }));
  } catch {
    // ignore
  }
}

function nowMinutes(d = new Date()) {
  return d.getHours() * 60 + d.getMinutes();
}
function toMinutes(hhmm: string | undefined, fallback: number) {
  if (!hhmm || !/^\d\d:\d\d$/.test(hhmm)) return fallback;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export interface NudgeStatus {
  enabled: boolean;
  date: string;
  doneToday: boolean;
  eveningAt: number;
  morningAt: number;
  /** Ready-made messages for the next days, so the service worker can show them with the app closed. */
  evening: Record<string, Line>;
  morning: Record<string, Line>;
  /** Extra reminders (midday and afternoon) for days no quest is done yet. */
  comeback?: Record<string, Line>;
  /** The last call before midnight when a streak is at risk. */
  lastCall?: Record<string, Line>;
  lastCallAt?: number;
}

/** Reminder moments through the day, in minutes after midnight. Each one fires at most once a day. */
export const MIDDAY = 12 * 60 + 30;
export const AFTERNOON = 16 * 60;
const LAST_CALL = 21 * 60 + 30;

type Moment = { kind: string; from: number; to: number; onlyIfNotDone: boolean };

/** Morning boost, midday + afternoon pushes, the evening streak check and a last call. */
export function reminderMoments(morningAt: number, eveningAt: number): Moment[] {
  const lastCall = Math.max(LAST_CALL, eveningAt + 120);
  const list: Moment[] = [
    { kind: 'morning', from: morningAt, to: morningAt + 180, onlyIfNotDone: false },
    { kind: 'midday', from: MIDDAY, to: MIDDAY + 120, onlyIfNotDone: true },
    { kind: 'afternoon', from: AFTERNOON, to: AFTERNOON + 120, onlyIfNotDone: true },
    { kind: 'evening', from: eveningAt, to: Math.min(eveningAt + 150, 23 * 60 + 50), onlyIfNotDone: true },
  ];
  if (lastCall < 23 * 60 + 30) list.push({ kind: 'lastcall', from: lastCall, to: 23 * 60 + 50, onlyIfNotDone: true });
  // A moment that would overlap the evening check is dropped so you never get two at once.
  return list.filter((m) => m.kind === 'evening' || m.kind === 'morning' || m.kind === 'lastcall' || Math.abs(m.from - eveningAt) >= 90);
}

const LAST: Line[] = [
  { title: 'Last call 🔥', body: 'Your {n}-day streak ends at midnight. One tiny quest saves it.' },
  { title: '{name}, it’s now or never', body: 'Two minutes before bed keeps {n} days alive.' },
  { title: 'Don’t sleep on your streak', body: 'Literally. Tick one quest, then sleep proud.' },
  { title: 'Midnight is coming', body: '{n} days of work. Protect them with one quest.' },
];

export function pickLastCall(streak: number, name: string, date: string): Line {
  if (streak <= 0) return pickNudge(0, name, date, 'l');
  const line = LAST[hashString(`last|${date}`) % LAST.length];
  return fill(line, { n: streak, next: streak + 1, name: name.trim() || 'friend' });
}

/**
 * Writes what the service worker needs into the Cache API. On Android (installed app), the
 * worker wakes up a few times a day ("periodic background sync") and can then remind you even if
 * the app is closed. Elsewhere the reminders only fire while the app is open or in the background.
 */
async function writeStatus(status: NudgeStatus) {
  try {
    if (!('caches' in window)) return;
    const c = await caches.open(STATUS_CACHE);
    await c.put(STATUS_URL, new Response(JSON.stringify(status), { headers: { 'content-type': 'application/json' } }));
  } catch {
    // optional
  }
}

async function registerPeriodic() {
  try {
    const reg = await navigator.serviceWorker?.ready;
    const ps = (reg as ServiceWorkerRegistration & { periodicSync?: { register(tag: string, o: { minInterval: number }): Promise<void> } })?.periodicSync;
    if (!ps) return false;
    const perm = await navigator.permissions?.query({ name: 'periodic-background-sync' as PermissionName }).catch(() => null);
    if (perm && perm.state !== 'granted') return false;
    await ps.register('dayforge-nudge', { minInterval: 60 * 60 * 1000 });
    return true;
  } catch {
    return false;
  }
}

/** True when reminders can arrive even with the app closed (installed on Android Chrome). */
export async function backgroundRemindersSupported(): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker?.ready;
    return !!(reg && 'periodicSync' in reg);
  } catch {
    return false;
  }
}

/** Runs in the app: fires the evening "streak at risk" nudge and a morning boost at the right time. */
export function useNudges(state: AppState, stats: DerivedStats) {
  const prefs = fullPrefs(state.prefs);
  const today = todayKey();
  const doneToday = (state.dayLogs[today]?.completedQuestIds.length ?? 0) > 0 || (state.dayLogs[today]?.skipped?.length ?? 0) > 0;
  const name = state.profile?.name ?? '';
  const streak = stats.currentStreak;
  const eveningAt = toMinutes(prefs.nudgeTime, 19 * 60);
  const morningAt = toMinutes(state.profile?.wakeTime, 7 * 60) + 30;
  const live = useRef({ doneToday, streak, name, daily: prefs.daily });
  live.current = { doneToday, streak, name, daily: prefs.daily };

  // Keep the service worker's copy up to date.
  useEffect(() => {
    let alive = true;
    (async () => {
      const evening: Record<string, Line> = {};
      const morning: Record<string, Line> = {};
      const comeback: Record<string, Line> = {};
      const lastCall: Record<string, Line> = {};
      let quotes: Awaited<ReturnType<typeof loadQuotes>> | null = null;
      if (prefs.nudges && prefs.daily !== 'off') quotes = await loadQuotes().catch(() => null);
      for (let i = 0; i < 7; i++) {
        const d = addDaysToKey(today, i);
        // A day the app wasn't opened means no quest yet, so the streak is at risk.
        evening[d] = pickNudge(i === 0 ? streak : i === 1 && doneToday ? streak : 0, name, d);
        const q = quotes ? quoteOfDay(poolFor(quotes, prefs.daily), d) : null;
        comeback[d] = pickNudge(0, name, d, 'c');
        lastCall[d] = pickLastCall(i === 0 ? streak : i === 1 && doneToday ? streak : 0, name, d);
        morning[d] = q ? { title: q.kind === 'verse' ? 'Verse of the day' : 'Your daily boost', body: `“${q.text}” — ${q.by}` } : pickNudge(0, name, d, 'm');
      }
      if (!alive) return;
      await writeStatus({ enabled: prefs.nudges, date: today, doneToday, eveningAt, morningAt, evening, morning, comeback, lastCall });
      if (prefs.nudges) void registerPeriodic();
    })();
    return () => {
      alive = false;
    };
  }, [prefs.nudges, prefs.daily, today, doneToday, streak, name, eveningAt, morningAt]);

  // While the app is open (or in the background), check every minute.
  useEffect(() => {
    if (!prefs.nudges) return;
    async function check() {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      const d = todayKey();
      const m = nowMinutes();
      const s = live.current;
      const fired = await readFired();
      if (document.visibilityState !== 'hidden') return;
      const moment = reminderMoments(morningAt, eveningAt).find((x) => m >= x.from && m < x.to && fired[x.kind] !== d && !(x.onlyIfNotDone && s.doneToday));
      if (!moment) return;
      await markFired(moment.kind, d);
      let line: Line;
      if (moment.kind === 'morning') {
        line = pickNudge(0, s.name, d, 'm');
        if (s.daily !== 'off') {
          const q = quoteOfDay(poolFor(await loadQuotes(), s.daily), d);
          if (q) line = { title: q.kind === 'verse' ? 'Verse of the day' : 'Your daily boost', body: `“${q.text}” — ${q.by}` };
        }
      } else if (moment.kind === 'lastcall') line = pickLastCall(s.streak, s.name, d);
      else if (moment.kind === 'evening') line = pickNudge(s.streak, s.name, d);
      else line = pickNudge(s.streak, s.name, d, moment.kind);
      showSystemNotification(line.title, line.body, `${moment.kind}-${d}`);
    }
    void check();
    const t = setInterval(() => void check(), 60_000);
    const onVis = () => void check();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [prefs.nudges, eveningAt, morningAt]);
}
