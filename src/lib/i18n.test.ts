import { describe, expect, it } from 'vitest';
import { KEYS, SHOWN_LANGUAGES, coverage, shownLanguage, tn, translate, translationCounts } from './i18n';
import { MORE, MORE_EN } from './i18n-more';
import { setLocale } from './locale';

describe('translations', () => {
  it('Lithuanian has every string', () => {
    expect(translationCounts().lt).toBe(KEYS.length);
    const missing = Object.keys(MORE_EN).filter((k) => !MORE.lt[k]);
    expect(missing).toEqual([]);
    expect(coverage('lt')).toBe(1);
  });

  it('only shows languages that are at least 90% done', () => {
    expect(SHOWN_LANGUAGES.map((l) => l.code)).toEqual(['en', 'lt']);
    for (const l of SHOWN_LANGUAGES) expect(coverage(l.code)).toBeGreaterThanOrEqual(0.9);
  });

  it('a hidden language falls back to English but keeps the saved choice', () => {
    expect(shownLanguage('de')).toBe('en');
    expect(shownLanguage('lt-LT')).toBe('lt');
    expect(shownLanguage(undefined)).toBe('en');
  });

  it('fills in values and uses Lithuanian plurals', () => {
    expect(translate('lt', 'hero.questsToday', { done: 1, total: 4 })).toBe('Šiandien 1 iš 4 užduočių');
    setLocale('lt');
    expect(tn('goals.daysLeft', 1)).toBe('liko 1 diena');
    expect(tn('goals.daysLeft', 3)).toBe('liko 3 dienos');
    expect(tn('goals.daysLeft', 12)).toBe('liko 12 dienų');
    setLocale('en');
    expect(tn('goals.daysLeft', 1)).toBe('1 day left');
    expect(tn('goals.daysLeft', 5)).toBe('5 days left');
  });
});
