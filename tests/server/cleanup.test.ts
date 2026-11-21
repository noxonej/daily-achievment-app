import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { cleanProofs, PROOF_TTL_MS } = require('../../functions/cleanup.js') as {
  cleanProofs: (db: unknown, now: number) => Promise<{ challenges: number; deleted: number }>;
  PROOF_TTL_MS: number;
};

const now = Date.UTC(2026, 10, 21, 12);

/** In-memory stand-in: challenges with proofs, filtered by the same fields the real queries use. */
function fakeDb(proofs: Record<string, number>) {
  const left = { ...proofs };
  const query = <T>(rows: T[]) => ({ limit: (n: number) => ({ get: async () => ({ size: Math.min(n, rows.length), docs: rows.slice(0, n) }) }) });
  return {
    left,
    collection: () => ({
      where: () =>
        query([
          {
            ref: {
              collection: () => ({
                where: (_f: string, _op: string, before: Date) =>
                  query(Object.entries(left).filter(([, at]) => at < before.getTime()).map(([id]) => ({ ref: { delete: async () => void delete left[id] } }))),
              }),
            },
          },
        ]),
    }),
  };
}

describe('proof cleanup', () => {
  it('deletes proofs older than 7 days and keeps newer ones', async () => {
    const db = fakeDb({ old: now - PROOF_TTL_MS - 1000, fresh: now - 3600000 });
    const stats = await cleanProofs(db, now);
    expect(stats.deleted).toBe(1);
    expect(Object.keys(db.left)).toEqual(['fresh']);
  });
});
