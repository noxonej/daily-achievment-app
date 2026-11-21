import { describe, expect, it } from 'vitest';
import { batchBody, utcDay, EVENTS } from './analytics';

describe('analytics', () => {
  it('sends only the install id and event names', () => {
    const b = batchBody('abcdefghij0123456789', ['open', 'share']);
    expect(Object.keys(b.fields).sort()).toEqual(['ev', 'id', 'v']);
    expect(b.fields.ev.arrayValue.values).toEqual([{ stringValue: 'open' }, { stringValue: 'share' }]);
  });
  it('uses UTC days and five events', () => {
    expect(utcDay(Date.UTC(2026, 10, 21, 23, 30))).toBe('2026-11-21');
    expect(EVENTS).toHaveLength(5);
  });
});
