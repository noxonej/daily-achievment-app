import { describe, expect, it } from 'vitest';
import { chartMax } from './radarGeometry';
import { STAT_IDS, type IrlStats } from '../../lib/irlStats';

const at = (lv: number) => Object.fromEntries(STAT_IDS.map((id) => [id, { level: lv, progress: 0 }])) as unknown as IrlStats;

describe('chartMax', () => {
  it('keeps a small ring for beginners and rounds to 10 later', () => {
    expect(chartMax(at(1))).toBe(4);
    expect(chartMax(at(2))).toBe(4);
    expect(chartMax(at(7))).toBe(9);
    expect(chartMax(at(8))).toBe(10);
    expect(chartMax(at(25))).toBe(30);
    expect(chartMax(at(100))).toBe(100);
  });
});
