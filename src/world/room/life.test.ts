import { describe, expect, it } from 'vitest';
import { restSpots, spotAt } from './life';
import { DECOR } from '../catalog';

const item = (id: string) => DECOR.find((d) => d.id === id);

describe('room rest spots', () => {
  it('finds the bed, sofa and chair with the duvet colour', () => {
    const spots = restSpots((slot) => item({ bed: 'bed-single', seat: 'seat-sofa', chair: 'chair-office' }[slot]));
    expect(spots.map((s) => s.kind)).toEqual(['bed', 'seat', 'chair']);
    expect(spots[0].blanket).toBe(item('bed-single')!.color);
  });
  it('offers the right spot for where you stand, and nothing in between', () => {
    const spots = restSpots((slot) => item({ bed: 'bed-mattress', seat: 'seat-beanbag', chair: 'chair-stool' }[slot]));
    expect(spotAt(spots, 150)?.kind).toBe('bed');
    expect(spotAt(spots, 500)?.kind).toBe('seat');
    expect(spotAt(spots, 1000)?.kind).toBe('chair');
    expect(spotAt(spots, 800)).toBeNull();
  });
});
