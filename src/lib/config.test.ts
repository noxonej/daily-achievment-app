import { describe, expect, it } from 'vitest';
import { normalizeAppUrl, APP_URL, SITE_ORIGIN, APP_BASE } from './config';

describe('app URL', () => {
  it('derives origin and base from one value', () => {
    expect(APP_URL).toBe('https://noxonej.github.io/daily-achievment-app/');
    expect(SITE_ORIGIN).toBe('https://noxonej.github.io');
    expect(APP_BASE).toBe('/daily-achievment-app/');
  });
  it('normalises an own domain', () => {
    expect(normalizeAppUrl('https://squzo.app')).toBe('https://squzo.app/');
    expect(() => normalizeAppUrl('http://squzo.app/')).toThrow();
  });
});
