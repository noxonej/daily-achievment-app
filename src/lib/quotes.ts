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
      quotes: [...parse(f.FAMOUS, 'quote', 'Unknown'), ...parse(p.PROVERBS, 'quote', 'Proverb'), ...parse(d.DAYFORGE, 'quote', 'Squzo')],
      // Only the best-known verses, mixed in with the quotes now and then.
      verses: parse(v.VERSES, 'verse', 'Bible').filter((q) => FAMOUS_VERSES.has(q.by)),
    }),
  );
  return cache;
}

const FAMOUS_VERSES = new Set([
  'Philippians 4:13', 'Jeremiah 29:11', 'Joshua 1:9', 'Isaiah 40:31', 'Proverbs 3:5', 'Romans 8:28', 'Psalm 23:1', 'Matthew 6:34', 'Matthew 7:7', 'Matthew 5:14',
  '2 Timothy 1:7', 'Galatians 6:9', 'Proverbs 16:3', 'Psalm 46:10', 'John 3:16', 'Romans 12:2', 'Romans 12:21', '1 Corinthians 13:4',
]);

/** Quotes with a few famous verses mixed in ('verses' and 'both' are old settings and mean the same now). */
export function poolFor(all: { quotes: Quote[]; verses: Quote[] }, kind: DailyKind): Quote[] {
  void kind;
  // Each verse counts 5 times, so about 1 line in 14 is a verse (otherwise you'd almost never see one).
  return [...all.quotes, ...Array.from({ length: 5 }, () => all.verses).flat()];
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
