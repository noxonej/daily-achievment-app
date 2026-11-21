import { describe, expect, it } from 'vitest';
import { normalizeLook, parseLook } from '../data/avatar';

describe('parseLook (a friend’s look from the cloud)', () => {
  const def = normalizeLook(undefined);
  it('never throws on bad data', () => {
    for (const bad of ['{', 'null', '42', '"x"', '[1,2]', '{"hair":{"x":1}}', 'x'.repeat(5000), undefined, 7, {}]) {
      expect(() => parseLook(bad)).not.toThrow();
      expect(parseLook(bad)).toEqual(def);
    }
  });
  it('keeps a valid look', () => {
    expect(parseLook(JSON.stringify(def))).toEqual(def);
  });
});
