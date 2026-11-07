import { todayKey } from './date';

/**
 * Keeps user data safe on the device:
 * - a save that can't be read is copied aside ("rescued") before anything new is written over it;
 * - one automatic snapshot per day is kept for the last few days, so a bad change can be undone
 *   from Settings → Data even without a manual backup file.
 * Nothing here changes the format of the main save.
 */
const SNAP_PREFIX = 'dayforge-snapshot';
const RESCUE_PREFIX = 'dayforge-rescued';
const KEEP = 3;

export interface Snapshot {
  key: string;
  date: string;
  bytes: number;
}

function snapKey(storageKey: string, date: string) {
  return `${SNAP_PREFIX}|${storageKey}|${date}`;
}

/** Copies an unreadable save aside so it is never lost (it can still be recovered by hand or support). */
export function rescueUnreadable(storageKey: string, raw: string) {
  try {
    localStorage.setItem(`${RESCUE_PREFIX}|${storageKey}|${new Date().toISOString()}`, raw);
  } catch {
    // no room: nothing more we can do on this device
  }
}

export function listSnapshots(storageKey: string): Snapshot[] {
  const out: Snapshot[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(`${SNAP_PREFIX}|${storageKey}|`)) continue;
      out.push({ key: k, date: k.split('|')[2], bytes: (localStorage.getItem(k) ?? '').length });
    }
  } catch {
    // storage unavailable
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

/** Saves today's snapshot once (taken from what was stored before today's first change) and keeps the newest few. */
export function snapshotDaily(storageKey: string, raw: string | null, today: string = todayKey()) {
  if (!raw) return;
  try {
    const list = listSnapshots(storageKey);
    if (list.some((s) => s.date === today)) return;
    localStorage.setItem(snapKey(storageKey, today), raw);
    for (const old of listSnapshots(storageKey).slice(KEEP)) localStorage.removeItem(old.key);
  } catch {
    // Storage full: drop the oldest snapshot and try once more; snapshots must never block the real save.
    try {
      const list = listSnapshots(storageKey);
      if (list.length) localStorage.removeItem(list[list.length - 1].key);
      localStorage.setItem(snapKey(storageKey, today), raw);
    } catch {
      // give up quietly
    }
  }
}

export function readSnapshot(key: string): unknown | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Writes the save; if storage is full, frees space by removing old snapshots first. Returns false if it still failed. */
export function writeSave(storageKey: string, json: string): boolean {
  try {
    localStorage.setItem(storageKey, json);
    return true;
  } catch {
    try {
      for (const s of listSnapshots(storageKey).slice(1)) localStorage.removeItem(s.key);
      localStorage.setItem(storageKey, json);
      return true;
    } catch {
      return false;
    }
  }
}
