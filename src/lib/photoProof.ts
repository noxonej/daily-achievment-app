/**
 * Optional photo proof for challenges (B8, round 2). The photo is shrunk and re-saved as a JPEG on the
 * phone (≤ ~200 KB; re-saving also drops hidden data such as GPS location), then stored in
 * challenges/{code}/proofs/{uid}_{day}. Only players on that challenge's board can see it, and the
 * push sender deletes it after 7 days (functions/cleanup.js).
 */
import { db } from './firebase';
import { friendsSession } from './friends';
import { submitScore } from './challenges';
import { challengeDay } from './social';
import { todayKey } from './date';
import type { JoinedChallenge } from './types';

/** Max length of the data URL (base64 of ~200 KB). The rules allow 275,000. */
export const PROOF_MAX_CHARS = 270_000;
export const PROOF_TTL_DAYS = 7;

/** Sizes and qualities tried in order until the photo fits. */
const STEPS: Array<[number, number]> = [
  [960, 0.8],
  [800, 0.7],
  [640, 0.6],
  [480, 0.55],
  [360, 0.5],
];

/** Width × height that fit inside `max` and keep the shape. */
export function fitSize(w: number, h: number, max: number): [number, number] {
  const k = Math.min(1, max / Math.max(w, h));
  return [Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))];
}

/** Shrinks a photo to a small JPEG data URL. Throws if it can't get small enough. */
export async function compressPhoto(file: Blob): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Pick a photo.');
  const bmp = await createImageBitmap(file);
  try {
    for (const [max, q] of STEPS) {
      const [w, h] = fitSize(bmp.width, bmp.height, max);
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
      const url = c.toDataURL('image/jpeg', q);
      if (url.startsWith('data:image/jpeg;base64,') && url.length <= PROOF_MAX_CHARS) return url;
    }
  } finally {
    bmp.close();
  }
  throw new Error('That photo is too big. Try another one.');
}

export interface Proof {
  uid: string;
  name: string;
  day: number;
  img: string;
  at: number;
}

function session() {
  const s = friendsSession();
  if (!s) throw new Error('Connect with Google first (You → Friends).');
  return s;
}

/** Posts (or replaces) today's photo for a challenge. */
export async function postProof(ch: JoinedChallenge, img: string): Promise<void> {
  const s = session();
  const day = challengeDay(ch, todayKey());
  if (day < 1 || day > ch.days) throw new Error('This challenge isn’t running today.');
  // You must be on the board to post (the rules check it): make sure your row is there.
  submitScore(ch);
  const write = () =>
    db(s.accountId).setStamped(`challenges/${ch.code}/proofs/${s.me.uid}_${day}`, { uid: s.me.uid, name: s.me.name.split(/\s+/)[0].slice(0, 20), day, img }, 'at');
  try {
    await write();
  } catch {
    // Your board row may still be on its way (it's sent a moment later): try once more.
    await new Promise((r) => setTimeout(r, 36_000));
    await write();
  }
}

/** The latest proofs of a challenge (players only), newest first, at most 7 days old. */
export async function loadProofs(code: string, now = Date.now()): Promise<Proof[]> {
  const s = session();
  const rows = await db(s.accountId).query<Record<string, unknown>>(`challenges/${code}`, 'proofs', { orderBy: 'at', limit: 12 });
  return rows.flatMap((r) => {
    const d = r.data;
    const at = typeof d.at === 'string' ? Date.parse(d.at) : NaN;
    if (typeof d.img !== 'string' || !d.img.startsWith('data:image/jpeg;base64,') || !(now - at < PROOF_TTL_DAYS * 86400000)) return [];
    return [{ uid: String(d.uid ?? ''), name: String(d.name ?? '').slice(0, 20), day: Number(d.day) || 0, img: d.img, at }];
  });
}

export async function deleteProof(code: string, day: number): Promise<void> {
  const s = session();
  await db(s.accountId).remove(`challenges/${code}/proofs/${s.me.uid}_${day}`);
}
