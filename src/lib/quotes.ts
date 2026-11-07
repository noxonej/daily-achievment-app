import { hashString } from './hash';
import { todayKey } from './date';

/** Which daily line the Today card (and the morning reminder) shows. */
export type DailyKind = 'quotes' | 'verses' | 'both' | 'off';

export interface Quote {
  text: string;
  by: string;
  kind: 'quote' | 'verse';
}

let cache: Promise<{ quotes: Quote[]; verses: Quote[] }> | null = null;

function parse(src: string, kind: Quote['kind'], fallback: string): Quote[] {
  return src
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.lastIndexOf('|');
      return i > 0 ? { text: l.slice(0, i), by: l.slice(i + 1), kind } : { text: l, by: fallback, kind };
    });
}

/** The 1,000+ quotes and the verses live in their own download, fetched only when needed. */
export function loadQuotes() {
  cache ??= Promise.all([import('../data/quotes-famous'), import('../data/quotes-proverbs'), import('../data/quotes-dayforge'), import('../data/verses')]).then(
    ([f, p, d, v]) => ({
      quotes: [...parse(f.FAMOUS, 'quote', 'Unknown'), ...parse(p.PROVERBS, 'quote', 'Proverb'), ...parse(d.DAYFORGE, 'quote', 'Dayforge')],
      verses: parse(v.VERSES, 'verse', 'Bible'),
    }),
  );
  return cache;
}

export function poolFor(all: { quotes: Quote[]; verses: Quote[] }, kind: DailyKind): Quote[] {
  if (kind === 'verses') return all.verses;
  if (kind === 'both') return [...all.quotes, ...all.verses];
  return all.quotes;
}

/** Today's line: the same all day, a different one tomorrow. */
export function quoteOfDay(pool: Quote[], date: string = todayKey()): Quote | null {
  if (!pool.length) return null;
  return pool[hashString(`quote|${date}`) % pool.length];
}

export function randomQuote(pool: Quote[], not?: Quote | null): Quote | null {
  if (!pool.length) return null;
  for (let i = 0; i < 5; i++) {
    const q = pool[Math.floor(Math.random() * pool.length)];
    if (q !== not) return q;
  }
  return pool[0];
}
