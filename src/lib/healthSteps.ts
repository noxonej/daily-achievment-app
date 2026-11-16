/**
 * Apple Health → Squzo steps, even when the app is closed.
 *
 * A website can't read Apple Health. An iPhone Shortcut can: it reads today's steps from Health and
 * sends the number to a small "inbox" in Squzo's database (stepsInbox/{token}). The app reads the
 * inbox when you open it and every few minutes while it's open. A personal automation in the Shortcuts
 * app can run it every hour, so the number is fresh before you even open Squzo.
 *
 * The token is a long random secret saved in your Squzo data (so it moves with your backup).
 */
import { publicDocUrl } from './firebase';
import { todayKey } from './date';

export function newStepsToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** The web address the Shortcut sends the number to (with the PATCH method). */
export const inboxUrl = (token: string) => publicDocUrl(`stepsInbox/${token}`);

/** Today's step total from the inbox, or null when there's nothing from today (or we're offline). */
export async function readInbox(token: string): Promise<number | null> {
  try {
    const res = await fetch(inboxUrl(token), { cache: 'no-store' });
    if (!res.ok) return null;
    const doc = (await res.json()) as { fields?: { steps?: { doubleValue?: number; integerValue?: string } }; updateTime?: string };
    const raw = doc.fields?.steps;
    const steps = Number(raw?.doubleValue ?? raw?.integerValue);
    if (!doc.updateTime || !(steps > 0)) return null;
    // Only today's number counts: yesterday's total must never land on today.
    return todayKey(new Date(doc.updateTime)) === todayKey() ? Math.round(steps) : null;
  } catch {
    return null;
  }
}
