import { listAccounts } from './accounts';

/**
 * One-off coin gifts for a specific linked Google account. The email is stored only as a SHA-256
 * hash. The reducer records each gift id in state.gifts, so a gift is paid out once per account.
 */
const GIFTS: { id: string; emailSha256: string; amount: number }[] = [
  { id: 'owner-2026-11-16', emailSha256: '20a234f767828302d6e075e500701bc142284e68a46ae66206d8600cd849f142', amount: 10000 },
];

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function giftFor(storageKey: string): Promise<{ id: string; amount: number } | null> {
  try {
    const email = listAccounts().find((a) => a.storageKey === storageKey)?.google?.email;
    if (!email || !crypto?.subtle) return null;
    const h = await sha256(email.trim().toLowerCase());
    const g = GIFTS.find((x) => x.emailSha256 === h);
    return g ? { id: g.id, amount: g.amount } : null;
  } catch {
    return null;
  }
}
