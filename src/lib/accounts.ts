import type { Character } from './types';

/**
 * Accounts saved on this device. Each account has its own saved data, an optional 4-digit PIN,
 * and a "remember me" choice. The PIN is only a lock: it keeps other people using this phone from
 * opening your account. It is not encryption (the saved data itself isn't locked), and 4 digits can
 * be guessed quickly by someone who reads the phone's storage directly.
 */
export interface Account {
  id: string;
  name: string;
  storageKey: string;
  pinHash?: string;
  pinSalt?: string;
  /** Skip the PIN on this device. */
  remember: boolean;
  createdAt: string;
  /** Cached for the account picker, which shows before the account's data is loaded. */
  look?: Character;
  level?: number;
  /** Linked Google account (sign-in + Drive backup). */
  google?: { email: string; name?: string; picture?: string; fileId?: string; lastBackup?: string; auto?: boolean };
}

const REGISTRY = 'dayforge-accounts';
const ACTIVE = 'dayforge-active-account';
const UNLOCKED = 'dayforge-unlocked';

export function listAccounts(): Account[] {
  try {
    const list = JSON.parse(localStorage.getItem(REGISTRY) ?? '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveAccounts(list: Account[]) {
  localStorage.setItem(REGISTRY, JSON.stringify(list));
}

export function getActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE);
  } catch {
    return null;
  }
}

export function setActiveId(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE, id);
    else localStorage.removeItem(ACTIVE);
    sessionStorage.removeItem(UNLOCKED);
  } catch {
    // ignore
  }
}

export function markUnlocked(id: string) {
  try {
    sessionStorage.setItem(UNLOCKED, id);
  } catch {
    // ignore
  }
}

export function isUnlocked(acc: Account): boolean {
  if (!acc.pinHash || acc.remember) return true;
  try {
    return sessionStorage.getItem(UNLOCKED) === acc.id;
  } catch {
    return false;
  }
}

function randomId(): string {
  const a = new Uint8Array(8);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function pinFields(pin: string | null): Promise<Pick<Account, 'pinHash' | 'pinSalt'>> {
  if (!pin) return { pinHash: undefined, pinSalt: undefined };
  const salt = randomId();
  return { pinHash: await hashPin(pin, salt), pinSalt: salt };
}

export async function verifyPin(acc: Account, pin: string): Promise<boolean> {
  if (!acc.pinHash || !acc.pinSalt) return true;
  return (await hashPin(pin, acc.pinSalt)) === acc.pinHash;
}

export async function createAccount(opts: { name: string; pin: string | null; remember: boolean; storageKey?: string }): Promise<Account> {
  const id = randomId();
  const acc: Account = {
    id,
    name: opts.name.trim() || 'Me',
    storageKey: opts.storageKey ?? `dayforge-state-${id}`,
    remember: opts.remember,
    createdAt: new Date().toISOString(),
    ...(await pinFields(opts.pin)),
  };
  saveAccounts([...listAccounts(), acc]);
  return acc;
}

export function updateAccount(id: string, patch: Partial<Account>) {
  saveAccounts(listAccounts().map((a) => (a.id === id ? { ...a, ...patch } : a)));
}

/** Removes the account and its saved data from this device. */
export function deleteAccount(id: string) {
  const acc = listAccounts().find((a) => a.id === id);
  if (acc) {
    try {
      localStorage.removeItem(acc.storageKey);
    } catch {
      // ignore
    }
  }
  saveAccounts(listAccounts().filter((a) => a.id !== id));
  if (getActiveId() === id) setActiveId(null);
}

/**
 * Failed PIN attempts, to slow down guessing: after 3 wrong tries wait 10 seconds, after 6 wait 30,
 * after 9 or more wait a minute each time. Kept in storage so reloading the page doesn't reset it.
 * (A 4-digit PIN is only a lock against people using this phone, not real protection.)
 */
const ATTEMPTS = 'dayforge-pin-attempts';
type Attempt = { count: number; until: number };
function readAttempts(): Record<string, Attempt> {
  try {
    const v = JSON.parse(localStorage.getItem(ATTEMPTS) ?? '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}
function writeAttempts(v: Record<string, Attempt>) {
  try {
    localStorage.setItem(ATTEMPTS, JSON.stringify(v));
  } catch {
    // storage full: the wait still works until the page reloads
  }
}
const memory: Record<string, Attempt> = {};
export function pinLockedFor(id: string): number {
  const a = readAttempts()[id] ?? memory[id];
  return a && a.until > Date.now() ? Math.ceil((a.until - Date.now()) / 1000) : 0;
}
export function recordPinAttempt(id: string, ok: boolean) {
  const all = readAttempts();
  if (ok) {
    delete all[id];
    delete memory[id];
    writeAttempts(all);
    return;
  }
  const a = all[id] ?? memory[id] ?? { count: 0, until: 0 };
  a.count += 1;
  if (a.count % 3 === 0) a.until = Date.now() + (a.count >= 9 ? 60_000 : a.count >= 6 ? 30_000 : 10_000);
  all[id] = a;
  memory[id] = a;
  writeAttempts(all);
}
