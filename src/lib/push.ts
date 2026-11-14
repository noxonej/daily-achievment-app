import { publicDocUrl } from './firebase';
import type { NudgeStatus } from './nudges';

/**
 * Real push notifications: they arrive even when Squzo is fully closed (on iPhone once Squzo is on
 * the home screen, on Android in Chrome or the installed app).
 *
 * How it works:
 * 1. The phone gives us a push "address" (a subscription) for this app.
 * 2. We save that address plus the plan of upcoming messages (src/lib/motivation.ts) to
 *    pushQueue/{token} in Squzo's database. The token is a long random secret made on this phone, so
 *    no sign-in is needed and nobody can guess anyone else's.
 * 3. Squzo's push sender (scripts/push, run every 15 minutes by GitHub Actions) sends each message
 *    when it's due.
 *
 * If the sender isn't set up yet (no public key in config/push), syncPush returns false and the app
 * falls back to showing messages itself while it's open or in the background.
 */
const TOKEN_KEY = 'dayforge-push-token';
let lastSent = '';
let cachedKey: string | null | undefined;

/** This phone's random push token (made once, kept on the device). */
export function pushToken(): string {
  try {
    const have = localStorage.getItem(TOKEN_KEY);
    if (have && have.length >= 32) return have;
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(TOKEN_KEY, token);
    return token;
  } catch {
    return 'no-storage';
  }
}

function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** The sender's public key, or null when the sender isn't set up yet. */
async function publicKey(): Promise<string | null> {
  if (cachedKey !== undefined) return cachedKey;
  try {
    const res = await fetch(publicDocUrl('config/push'), { cache: 'no-store' });
    if (!res.ok) return (cachedKey = null);
    const doc = (await res.json()) as { fields?: { publicKey?: { stringValue?: string } } };
    return (cachedKey = doc.fields?.publicKey?.stringValue ?? null);
  } catch {
    return null;
  }
}

async function subscription(key: string): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker?.ready;
  if (!reg?.pushManager) return null;
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    // A subscription made with an old key can't receive from the new one: replace it.
    const k = existing.options?.applicationServerKey;
    const same = !k || btoa(String.fromCharCode(...new Uint8Array(k))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') === key.replace(/=+$/, '');
    if (same) return existing;
    await existing.unsubscribe().catch(() => undefined);
  }
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) });
}

async function save(token: string, data: object): Promise<boolean> {
  const body = { fields: { data: { stringValue: JSON.stringify(data) }, updatedAt: { integerValue: String(Date.now()) } } };
  const res = await fetch(publicDocUrl(`pushQueue/${token}`), { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return res.ok;
}

/**
 * Hands the plan to the push sender. Returns true when the sender will deliver the messages (so the
 * app doesn't show them a second time).
 */
export async function syncPush(status: NudgeStatus): Promise<boolean> {
  try {
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) return false;
    const token = pushToken();
    if (token === 'no-storage') return false;
    const key = await publicKey();
    if (!key) return false; // the sender isn't set up yet
    if (!status.enabled || Notification.permission !== 'granted') {
      if (lastSent !== 'off') await save(token, { on: false });
      lastSent = 'off';
      return false;
    }
    const sub = await subscription(key);
    if (!sub) return false;
    const data = { on: true, sub: sub.toJSON(), plan: status.plan, lastDone: status.lastDone, prefs: status.prefs };
    const json = JSON.stringify(data);
    if (json === lastSent) return true;
    const ok = await save(token, data);
    if (ok) lastSent = json;
    return ok;
  } catch {
    return false;
  }
}
