import { db } from './firebase';
import { connectedAccountId } from './friends';
import type { NudgeStatus } from './nudges';

/**
 * Real push notifications (they arrive even when Squzo is closed, also on iPhone once Squzo is on
 * the home screen). The app saves your reminder plan and a push "address" to push/{uid}; a small
 * server (functions/index.js) checks every 15 minutes and sends the reminder that is due.
 */
let lastSent = '';

function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function subscription(publicKey: string): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker?.ready;
  if (!reg?.pushManager) return null;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) });
}

export async function syncPush(status: NudgeStatus): Promise<void> {
  try {
    const accountId = connectedAccountId();
    if (!accountId || typeof Notification === 'undefined' || !('serviceWorker' in navigator)) return;
    const api = db(accountId);
    const uid = api.uid();
    if (!uid) return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!status.enabled || Notification.permission !== 'granted') {
      if (lastSent !== 'off') await api.set(`push/${uid}`, { enabled: false, tz, updatedAt: Date.now() });
      lastSent = 'off';
      return;
    }
    const config = await api.get<{ publicKey?: string }>('config/push');
    if (!config?.publicKey) return; // the server isn't set up yet
    const sub = await subscription(config.publicKey);
    if (!sub) return;
    const body = { ...status, tz, sub: JSON.stringify(sub.toJSON()) };
    const key = JSON.stringify(body);
    if (key === lastSent) return;
    await api.set(`push/${uid}`, { ...body, updatedAt: Date.now() } as never);
    lastSent = key;
  } catch {
    // push is a bonus: the in-app reminders still work
  }
}
