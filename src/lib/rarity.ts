import type { Quest } from './types';

/**
 * "Only ~8% of people do this every day." Estimates from public habit surveys and common sense
 * (e.g. about a quarter of adults read daily, a small share meditate, few take cold showers),
 * then scaled by how big the target is. Not live data from other users: the app says "about".
 */
const RULES: Array<{ re: RegExp; pct: number }> = [
  { re: /cold shower/, pct: 4 },
  { re: /before 6|wake up before|5 ?am/, pct: 6 },
  { re: /pull-?ups?/, pct: 3 },
  { re: /push-?ups?/, pct: 8 },
  { re: /squats?|sit-?ups?|plank|jumping jacks/, pct: 10 },
  { re: /\brun\b|\bkm\b|jog/, pct: 7 },
  { re: /steps/, pct: 20 },
  { re: /work ?out|gym|train|sport|exercise|yoga|mobility|stretch/, pct: 18 },
  { re: /meditat|silence|breath/, pct: 12 },
  { re: /read|pages|book|article/, pct: 22 },
  { re: /journal|write|gratitude|diary|summari/, pct: 10 },
  { re: /language|words/, pct: 7 },
  { re: /study|course|lesson|learn|skill|code|coding/, pct: 14 },
  { re: /deep work|focus|single-task/, pct: 9 },
  { re: /no phone|phone|screen time|social media|digital/, pct: 9 },
  { re: /sale|sell|offer|pitch|business|earn|ship|content|post one/, pct: 4 },
  { re: /sav(e|ing)|budget|spend|invest|money|balance|costs/, pct: 15 },
  { re: /sugar|junk|vegetable|protein|fruit|healthy|cook/, pct: 20 },
  { re: /water|glasses/, pct: 30 },
  { re: /sleep|bed before|7\+ hours/, pct: 30 },
  { re: /make (your|the) bed|tidy|clean|laundry|dishes/, pct: 40 },
  { re: /floss|skincare|teeth/, pct: 30 },
  { re: /scar|speak up|stranger|new person|someone new|eye contact|record yourself|ask for/, pct: 6 },
  { re: /message|call|friend|family|compliment|thank|kind|laugh|listen/, pct: 25 },
];

const BY_DIFFICULTY: Record<string, number> = { easy: 40, medium: 20, hard: 9, epic: 4 };

/** About what percent of people manage this quest on a given day (or week, for weekly quests). */
export function questRarity(q: Pick<Quest, 'title' | 'description' | 'difficulty' | 'frequency' | 'measure'>): number {
  const text = `${q.title} ${q.description ?? ''}`.toLowerCase();
  let pct = RULES.find((r) => r.re.test(text))?.pct ?? BY_DIFFICULTY[q.difficulty] ?? 20;
  // Bigger targets are rarer: scale against a "normal" amount per unit.
  const m = q.measure;
  if (m) {
    const normal: Record<string, number> = { pages: 10, steps: 6000, km: 2, reps: 30, minutes: 30, glasses: 6 };
    const ratio = m.target / (normal[m.unit] ?? m.target);
    const weekly = q.frequency === 'weekly' ? 5 : 1;
    pct = pct / Math.max(0.5, Math.pow(ratio / weekly, 0.9));
  }
  // Harder versions of the same habit are rarer too.
  if (q.difficulty === 'epic') pct *= 0.6;
  else if (q.difficulty === 'hard') pct *= 0.8;
  return Math.max(0.5, Math.min(60, pct));
}

/** "~8%" for the card, rounded so it never looks falsely precise. */
export function rarityText(p: number): string {
  if (p < 1) return '<1%';
  if (p < 10) return `${Math.round(p)}%`;
  return `${Math.round(p / 5) * 5}%`;
}
