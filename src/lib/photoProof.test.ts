import { describe, expect, it } from 'vitest';
import { fitSize, PROOF_MAX_CHARS } from './photoProof';

describe('photo proof', () => {
  it('keeps the shape and never upscales', () => {
    expect(fitSize(4000, 3000, 960)).toEqual([960, 720]);
    expect(fitSize(3000, 4000, 960)).toEqual([720, 960]);
    expect(fitSize(300, 200, 960)).toEqual([300, 200]);
  });
  it('stays under the rules limit (275,000 chars)', () => {
    expect(PROOF_MAX_CHARS).toBeLessThanOrEqual(275_000);
  });
});
