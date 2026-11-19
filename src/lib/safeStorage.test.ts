import { describe, expect, it } from 'vitest';
import { listSnapshots, moveOldCopies, readSnapshot, snapshotDaily, writeSave } from './safeStorage';

const wait = () => new Promise((r) => setTimeout(r, 30));

describe('safety copies in IndexedDB', () => {
  it('moves old localStorage snapshots over, keeps 3 days', async () => {
    localStorage.setItem('dayforge-snapshot|acc|2026-11-15', '{"quests":[],"d":15}');
    await moveOldCopies();
    expect(localStorage.getItem('dayforge-snapshot|acc|2026-11-15')).toBeNull();
    for (const d of ['2026-11-16', '2026-11-17', '2026-11-18']) {
      snapshotDaily('acc', `{"quests":[],"d":"${d}"}`, d);
      await wait();
    }
    const list = await listSnapshots('acc');
    expect(list.map((s) => s.date)).toEqual(['2026-11-18', '2026-11-17', '2026-11-16']);
    expect(await readSnapshot(list[0].key)).toEqual({ quests: [], d: '2026-11-18' });
  });

  it('writes the main save and reports failure instead of failing silently', () => {
    expect(writeSave('main', '{}')).toBe(true);
    const orig = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    try {
      expect(writeSave('main', '{"x":1}')).toBe(false);
    } finally {
      localStorage.setItem = orig;
    }
  });
});
