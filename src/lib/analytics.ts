/**
 * Privacy-friendly usage counts (C1, round 2). No name, no account, no IP log of our own, no ads SDK:
 * just a random install id and which of five things happened, so we can see if people come back
 * (day 1 / 7 / 30 retention). Events are batched on the phone and sent as one small document to
 * stats/{day}/events, which nobody can read from the app (write-only rules). Settings → Privacy has
 * an off switch; when it's off nothing is queued or sent.
 */
import { publicDocUrl } from './firebase';
import { fsFetch } from './appCheck';

export const EVENTS = ['open', 'quest_done', 'onboarding_done', 'invite_sent', 'share'] as const;
export type EventName = (typeof EVENTS)[number];

const ID_KEY = 'dayforge-install-id';
const QUEUE_KEY = 'dayforge-analytics-queue';
const OFF_KEY = 'dayforge-analytics-off';
/** At most this many events in one document (the rules allow 50). */
export const MAX_BATCH = 40;
const FLUSH_MS = 2 * 60_000;

const enabledEnv = () => import.meta.env.MODE !== 'test' && typeof window !== 'undefined';

function get(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function put(key: string, v: string | null) {
  try {
    if (v === null) localStorage.removeItem(key);
    else localStorage.setItem(key, v);
  } catch {
    // private mode: nothing is kept
  }
}

export function analyticsOn(): boolean {
  return get(OFF_KEY) !== '1';
}

/** The opt-out switch. Turning it off also drops anything not sent yet. */
export function setAnalyticsOn(on: boolean) {
  put(OFF_KEY, on ? null : '1');
  if (!on) put(QUEUE_KEY, null);
}

/** 20 random lowercase letters/digits, made once per install. Not linked to your account. */
export function installId(): string {
  const have = get(ID_KEY);
  if (have && /^[a-z0-9]{20}$/.test(have)) return have;
  const abc = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  const id = Array.from(bytes, (b) => abc[b % abc.length]).join('');
  put(ID_KEY, id);
  return id;
}

/** UTC day, "2026-11-21". */
export const utcDay = (ms = Date.now()) => new Date(ms).toISOString().slice(0, 10);

function queue(): string[] {
  try {
    const q = JSON.parse(get(QUEUE_KEY) ?? '[]');
    return Array.isArray(q) ? q.filter((e): e is string => (EVENTS as readonly string[]).includes(e)) : [];
  } catch {
    return [];
  }
}

/** Counts an event (only the five names above; extra details are never sent). */
export function logEvent(name: EventName, _props?: Record<string, string | number | boolean>): void {
  void _props;
  if (!enabledEnv() || !analyticsOn() || !(EVENTS as readonly string[]).includes(name)) return;
  // Keep the queue small even if the phone stays offline for weeks.
  put(QUEUE_KEY, JSON.stringify([...queue(), name].slice(-200)));
  schedule();
}

/** The Firestore body for one batch. */
export function batchBody(id: string, events: string[]) {
  return { fields: { id: { stringValue: id }, ev: { arrayValue: { values: events.map((e) => ({ stringValue: e })) } }, v: { integerValue: '1' } } };
}

let sending = false;
export async function flushEvents(keepalive = false): Promise<void> {
  if (sending || !enabledEnv() || !analyticsOn()) return;
  const q = queue();
  if (!q.length) return;
  const batch = q.slice(0, MAX_BATCH);
  sending = true;
  try {
    const res = await fsFetch(publicDocUrl(`stats/${utcDay()}/events`), {
      method: 'POST',
      keepalive,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(batchBody(installId(), batch)),
    });
    // Sent (or refused for good): drop them. Network errors keep them for next time.
    if (res.ok || res.status === 400 || res.status === 403) put(QUEUE_KEY, JSON.stringify(queue().slice(batch.length)));
  } catch {
    // offline: try later
  } finally {
    sending = false;
  }
}

let timer: ReturnType<typeof setTimeout> | null = null;
function schedule() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    void flushEvents();
  }, FLUSH_MS);
}

let started = false;
/** Call once at startup: logs "open" and sends what's queued when the app goes to the background. */
export function startAnalytics() {
  if (started || !enabledEnv()) return;
  started = true;
  logEvent('open');
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flushEvents(true);
  });
}
