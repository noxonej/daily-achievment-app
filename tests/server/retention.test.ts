import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { retention } = require('../../functions/retention.js') as {
  retention: (rows: Array<{ day: string; id: string; ev: string[] }>, today: string) => Record<string, unknown> & { installs: number; d1: { pct: number; eligible: number } | null; d7: { pct: number } | null; d30: unknown };
};

describe('retention', () => {
  it('counts D1 and D7 from first-seen day', () => {
    const rows = [
      { day: '2026-11-01', id: 'a', ev: ['open'] },
      { day: '2026-11-02', id: 'a', ev: ['open', 'quest_done'] },
      { day: '2026-11-08', id: 'a', ev: ['open'] },
      { day: '2026-11-01', id: 'b', ev: ['open'] },
      { day: '2026-11-20', id: 'c', ev: ['open'] },
    ];
    const r = retention(rows, '2026-11-21');
    expect(r.installs).toBe(3);
    expect(r.d1).toEqual({ eligible: 3, back: 1, pct: 33.3 });
    expect(r.d7).toEqual({ eligible: 2, back: 1, pct: 50 });
    expect(r.d30).toBeNull();
    expect(r.events).toEqual({ open: 5, quest_done: 1 });
  });
});
