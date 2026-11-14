import { useEffect, useMemo, useRef } from 'react';
import type { AppState, DerivedStats } from './types';
import { addDaysToKey, todayKey } from './date';
import { hashString } from './hash';
import { fullPrefs } from './prefs';
import { showSystemNotification } from './notify';
import { pushToken, syncPush } from './push';
import { dueNow, hhmmToMinutes, lineToShow, planMotivation, type MotivationPrefs, type Planned } from './motivation';

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

const SENT_KEY = 'dayforge-motivation-sent';
const STATUS_CACHE = 'dayforge-status';
const STATUS_URL = './__dayforge-status.json';
const SENT_URL = './__dayforge-sent.json';

/**
 * What the service worker and the push sender need: the plan for the next 14 days, and the last day
 * you finished a quest (so the day's last message can become a streak warning).
 */
export interface NudgeStatus {
  enabled: boolean;
  plan: Planned[];
  lastDone?: string;
  /** Your settings, so the push sender can still send one gentle message a day if you stop opening the app. */
  prefs: MotivationPrefs & { tz: string };
}

/** Tags already shown, shared with the service worker so a message never shows twice. */
async function readSent(): Promise<Record<string, true>> {
  let out: Record<string, true> = {};
  try {
    out = JSON.parse(localStorage.getItem(SENT_KEY) || '{}');
  } catch {
    // ignore
  }
  try {
    const res = await (await caches.open(STATUS_CACHE)).match(SENT_URL);
    if (res) Object.assign(out, (await res.json()) as Record<string, true>);
  } catch {
    // ignore
  }
  return out;
}

async function markSent(tag: string) {
  const all = { ...(await readSent()), [tag]: true as const };
  // Keep only the last 60 tags.
  const keys = Object.keys(all).sort().slice(-60);
  const trimmed = Object.fromEntries(keys.map((k) => [k, true as const]));
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
  try {
    await (await caches.open(STATUS_CACHE)).put(SENT_URL, new Response(JSON.stringify(trimmed), { headers: { 'content-type': 'application/json' } }));
  } catch {
    // ignore
  }
}

async function writeStatus(status: NudgeStatus & { pushActive: boolean }) {
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
    await ps.register('dayforge-nudge', { minInterval: 30 * 60 * 1000 });
    return true;
  } catch {
    return false;
  }
}

/** True when reminders can arrive even with the app closed without the push server (installed on Android Chrome). */
export async function backgroundRemindersSupported(): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker?.ready;
    return !!(reg && 'periodicSync' in reg);
  } catch {
    return false;
  }
}

/** Your notification settings, with sensible defaults (09:00–21:00, three a day). */
export function motivationPrefs(state: AppState): MotivationPrefs {
  const prefs = fullPrefs(state.prefs);
  const wake = hhmmToMinutes(state.profile?.wakeTime, 7 * 60);
  // Never before you're awake: at least 30 minutes after your wake-up time.
  const from = Math.max(hhmmToMinutes(prefs.nudgeFrom, 9 * 60), wake + 30);
  const to = Math.max(from + 60, hhmmToMinutes(prefs.nudgeTo, 21 * 60));
  return { on: prefs.nudges, perDay: prefs.nudgesPerDay ?? 3, from, to };
}

/** The most recent day you finished (or skipped) a quest. */
function lastDoneDay(state: AppState): string | undefined {
  let best: string | undefined;
  for (const [day, log] of Object.entries(state.dayLogs)) {
    if ((log.completedQuestIds.length || log.skipped?.length) && (!best || day > best)) best = day;
  }
  return best;
}

let pushActive = false;
/** True once Squzo's push server has this phone's plan (messages then arrive with the app closed). */
export const pushIsActive = () => pushActive;

/** Plans the day's three messages and keeps every sender (app, service worker, push server) in sync. */
export function useNudges(state: AppState, stats: DerivedStats) {
  const today = todayKey();
  const mp = motivationPrefs(state);
  const lastDone = lastDoneDay(state);
  const streak = stats.currentStreak;
  const salt = pushToken();
  const plan = useMemo(
    () => planMotivation(mp, today, { streak, salt }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mp.on, mp.perDay, mp.from, mp.to, today, streak, salt],
  );
  const live = useRef({ plan, lastDone });
  live.current = { plan, lastDone };

  useEffect(() => {
    const status: NudgeStatus = { enabled: mp.on, plan, lastDone, prefs: { ...mp, tz: Intl.DateTimeFormat().resolvedOptions().timeZone } };
    let alive = true;
    void (async () => {
      const ok = await syncPush(status);
      if (!alive) return;
      pushActive = ok;
      await writeStatus({ ...status, pushActive: ok });
      if (mp.on && !ok) void registerPeriodic();
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, lastDone, mp.on]);

  // While the app is open or in the background: show the message that is due (unless the push server does it).
  useEffect(() => {
    if (!mp.on) return;
    async function check() {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      if (pushActive || document.visibilityState !== 'hidden') return;
      const { plan: p, lastDone: ld } = live.current;
      const due = dueNow(p, await readSent());
      if (!due) return;
      await markSent(due.tag);
      const line = lineToShow(due, ld);
      showSystemNotification(line.title, line.body, due.tag);
    }
    const t = setInterval(() => void check(), 60_000);
    const onVis = () => void check();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [mp.on]);
}

/** Today's planned times, for Settings ("Next: 13:42"). */
export function todaysMoments(state: AppState): number[] {
  const mp = motivationPrefs(state);
  return planMotivation(mp, todayKey(), { days: 2, salt: pushToken(), now: 0 })
    .filter((x) => x.date === todayKey())
    .map((x) => x.at);
}
