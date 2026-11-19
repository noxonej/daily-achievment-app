import { describe, expect, it } from 'vitest';
import { parseQuickAdd } from './quickAdd';
import { createInitialState } from '../store/reducer';

const state = createInitialState();
const today = '2026-11-19'; // a Thursday
const parse = (s: string) => parseQuickAdd(s, state, today);

describe('quick add', () => {
  it('"Dentist tomorrow 15:00" is an event tomorrow at 15:00', () => {
    expect(parse('Dentist tomorrow 15:00')).toEqual({ kind: 'event', text: 'Dentist', date: '2026-11-20', time: '15:00' });
  });

  it('"spent 4.50 on lunch" is a food expense of 4.50', () => {
    expect(parse('spent 4.50 on lunch')).toEqual({ kind: 'expense', amount: 450, note: 'Lunch', categoryId: 'food' });
  });

  it('"every day: read 10 pages" is a new daily quest', () => {
    expect(parse('every day: read 10 pages')).toEqual({ kind: 'quest', title: 'Read 10 pages' });
  });

  it('understands other everyday phrasings', () => {
    expect(parse('4,5 € coffee')).toMatchObject({ kind: 'expense', amount: 450 });
    expect(parse('bus ticket 2€')).toMatchObject({ kind: 'expense', amount: 200, categoryId: 'transport' });
    expect(parse('gym every monday 17:30')).toEqual({ kind: 'weekly', text: 'Gym', days: ['mon'], time: '17:30' });
    expect(parse('party on saturday at 8pm')).toEqual({ kind: 'event', text: 'Party', date: '2026-11-21', time: '20:00' });
    expect(parse('exam 24.12')).toEqual({ kind: 'event', text: 'Exam', date: '2026-12-24', time: undefined });
    expect(parse('trip 5/1')).toMatchObject({ kind: 'event', date: '2027-01-05' });
  });

  it('keeps plain to-dos as to-dos', () => {
    expect(parse('10 push-ups')).toEqual({ kind: 'task', text: '10 push-ups' });
    expect(parse('call grandma')).toEqual({ kind: 'task', text: 'Call grandma' });
    expect(parse('   ')).toBeNull();
  });
});
