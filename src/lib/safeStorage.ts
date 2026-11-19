import { todayKey } from './date';

/**
 * Keeps user data safe on the device:
 * - a save that can't be read is copied aside ("rescued") before anything new is written over it;
 * - one automatic snapshot per day is kept for the last few days, so a bad change can be undone
 *   from Settings → Data even without a manual backup file.
 *
 * Since 2026-11-19 the snapshots and rescued copies live in IndexedDB (much more room than
 * localStorage's ~5 MB), so they can never crowd out the main save. Older copies found in
 * localStorage are moved over on start. The main save itself stays in localStorage, unchanged.
 */
const SNAP_PREFIX = 'dayforge-snapshot';
const RESCUE_PREFIX = 'dayforge-rescued';
const KEEP = 3;
const KEEP_RESCUED = 2;

export interface Snapshot {
  key: string;
  date: string;
  bytes: number;
}

interface Copy {
  key: string;
  raw: string;
}

/* ---------------------------------------------------------------- a tiny IndexedDB store */

const DB_NAME = 'squzo-safety';
const STORE = 'copies';
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('no IndexedDB'));
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'key' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('blocked'));
  }).catch((e) => {
    dbPromise = null;
    throw e;
  });
  return dbPromise;
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await openDb();
  return new Promise<T | undefined>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

const idbPut = (c: Copy) => tx('readwrite', (s) => void s.put(c));
const idbGet = (key: string) => tx<Copy | undefined>('readonly', (s) => s.get(key) as IDBRequest<Copy | undefined>);
const idbDelete = (key: string) => tx('readwrite', (s) => void s.delete(key));
const idbKeys = async (prefix: string): Promise<string[]> =>
  ((await tx<IDBValidKey[]>('readonly', (s) => s.getAllKeys())) ?? []).map(String).filter((k) => k.startsWith(prefix));

/* ---------------------------------------------------------------- moving old copies out of localStorage */

let moved: Promise<void> | null = null;

/** Moves snapshots and rescued copies saved by older versions from localStorage into IndexedDB. */
export function moveOldCopies(): Promise<void> {
  moved ??= (async () => {
    let keys: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith(`${SNAP_PREFIX}|`) || k.startsWith(`${RESCUE_PREFIX}|`))) keys.push(k);
      }
    } catch {
      keys = [];
    }
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null) await idbPut({ key, raw });
        // Only removed once it's safely in IndexedDB.
        localStorage.removeItem(key);
      } catch {
        // IndexedDB not available: leave it where it is
      }
    }
  })();
  return moved;
}

/* ---------------------------------------------------------------- rescued copies */

/** Copies an unreadable save aside so it is never lost (it can still be recovered by hand or support). */
export function rescueUnreadable(storageKey: string, raw: string) {
  const key = `${RESCUE_PREFIX}|${storageKey}|${new Date().toISOString()}`;
  void (async () => {
    try {
      await idbPut({ key, raw });
      // Keep only the newest two for this account.
      const old = (await idbKeys(`${RESCUE_PREFIX}|${storageKey}|`)).sort().reverse().slice(KEEP_RESCUED);
      for (const k of old) await idbDelete(k);
    } catch {
      // No IndexedDB (some private windows): fall back to localStorage, never lose it.
      try {
        localStorage.setItem(key, raw);
      } catch {
        // no room: nothing more we can do on this device
      }
    }
  })();
}

/* ---------------------------------------------------------------- daily snapshots */

function snapKey(storageKey: string, date: string) {
  return `${SNAP_PREFIX}|${storageKey}|${date}`;
}

export async function listSnapshots(storageKey: string): Promise<Snapshot[]> {
  await moveOldCopies();
  try {
    const keys = (await idbKeys(`${SNAP_PREFIX}|${storageKey}|`)).sort().reverse();
    const out: Snapshot[] = [];
    for (const key of keys) {
      const c = await idbGet(key);
      out.push({ key, date: key.split('|')[2], bytes: c?.raw.length ?? 0 });
    }
    return out;
  } catch {
    return [];
  }
}

/** Saves today's snapshot once (taken from what was stored before today's first change) and keeps the newest few. */
export function snapshotDaily(storageKey: string, raw: string | null, today: string = todayKey()) {
  if (!raw) return;
  void (async () => {
    try {
      await moveOldCopies();
      const keys = await idbKeys(`${SNAP_PREFIX}|${storageKey}|`);
      const key = snapKey(storageKey, today);
      if (keys.includes(key)) return;
      await idbPut({ key, raw });
      for (const old of [...keys, key].sort().reverse().slice(KEEP)) await idbDelete(old);
    } catch {
      // Snapshots are extra safety; they must never block or break the real save.
    }
  })();
}

export async function readSnapshot(key: string): Promise<unknown | null> {
  try {
    const c = await idbGet(key);
    return c ? JSON.parse(c.raw) : null;
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------- the main save */

/**
 * Writes the save. If storage is full, first moves any old copies out of localStorage and tries
 * again. Returns false when it still failed, so the app can show the "storage full" banner.
 */
export function writeSave(storageKey: string, json: string): boolean {
  try {
    localStorage.setItem(storageKey, json);
    return true;
  } catch {
    try {
      // Old snapshots left in localStorage by earlier versions are copies of older saves: drop them
      // (they're also moved to IndexedDB on start). Rescued copies are never dropped.
      const stale: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(`${SNAP_PREFIX}|`)) stale.push(k);
      }
      stale.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(storageKey, json);
      return true;
    } catch {
      return false;
    }
  }
}
