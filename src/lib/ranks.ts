/**
 * Ranks: a competitive-style ladder on top of levels. Seven tiers with three divisions each
 * (Bronze I, II, III), then Squzo Legend. Worked out from your level, so nothing is stored
 * and a rank can never drop.
 */
export interface Tier {
  id: string;
  name: string;
  /** Main badge colour, light highlight, dark edge. */
  c1: string;
  c2: string;
  c3: string;
}

export const TIERS: Tier[] = [
  { id: 'hustler', name: 'Bronze', c1: '#c57b3f', c2: '#f3c193', c3: '#6b3a17' },
  { id: 'challenger', name: 'Silver', c1: '#b9c6d6', c2: '#f4f8fc', c3: '#56657a' },
  { id: 'elite', name: 'Gold', c1: '#f0b93a', c2: '#ffe9a6', c3: '#8a5d07' },
  { id: 'vanguard', name: 'Platinum', c1: '#5fd4d0', c2: '#e2fffd', c3: '#1f6b72' },
  { id: 'titan', name: 'Diamond', c1: '#38bdf8', c2: '#e0f7ff', c3: '#1e40af' },
  { id: 'mythic', name: 'Master', c1: '#8b5cf6', c2: '#ddd0ff', c3: '#40238f' },
  { id: 'apex', name: 'Grandmaster', c1: '#ef4444', c2: '#ffc2c2', c3: '#7a1414' },
  { id: 'legend', name: 'Squzo Legend', c1: '#22d3ee', c2: '#f5d0fe', c3: '#4c1d95' },
];

/** The level each rank starts at: 24 ranked steps, then Squzo Legend at level 100. */
const STARTS = [1, 2, 4, 6, 8, 10, 13, 16, 19, 22, 26, 30, 34, 38, 43, 48, 53, 59, 65, 71, 78, 85, 90, 95, 100];
const DIVISIONS = ['I', 'II', 'III'];

export interface Rank {
  /** 0 = Bronze I … 24 = Squzo Legend. */
  index: number;
  tier: Tier;
  tierIndex: number;
  /** 1–3, or 0 for Squzo Legend (no divisions). */
  division: number;
  name: string;
  startLevel: number;
  /** The level the next rank starts at, or null at the top. */
  nextLevel: number | null;
}

export function rankAt(index: number): Rank {
  const i = Math.max(0, Math.min(STARTS.length - 1, index));
  const top = i === STARTS.length - 1;
  const tierIndex = top ? TIERS.length - 1 : Math.floor(i / 3);
  const division = top ? 0 : (i % 3) + 1;
  const tier = TIERS[tierIndex];
  return {
    index: i,
    tier,
    tierIndex,
    division,
    name: top ? tier.name : `${tier.name} ${DIVISIONS[division - 1]}`,
    startLevel: STARTS[i],
    nextLevel: top ? null : STARTS[i + 1],
  };
}

export function rankForLevel(level: number): Rank {
  let i = 0;
  while (i + 1 < STARTS.length && level >= STARTS[i + 1]) i++;
  return rankAt(i);
}

export const RANK_COUNT = STARTS.length;

/**
 * Roughly what share of players ever reach this rank or higher, in percent. An estimate from how
 * habit apps usually go (most people stop in the first weeks), not live data: it falls smoothly
 * from 100% at Bronze I to 0.01% at Squzo Legend.
 */
export function rankRarity(index: number): number {
  const i = Math.max(0, Math.min(STARTS.length - 1, index));
  return 100 * Math.exp(-(Math.log(10000) / (STARTS.length - 1)) * i);
}

/** "Top 4.6%", "Top 0.21%", "Everyone starts here". */
export function rarityLabel(index: number): string {
  if (index === 0) return 'Everyone starts here';
  return `Top ${formatPct(rankRarity(index))}`;
}

export function formatPct(p: number): string {
  if (p >= 10) return `${Math.round(p)}%`;
  if (p >= 1) return `${p.toFixed(1).replace(/\.0$/, '')}%`;
  if (p >= 0.1) return `${p.toFixed(1)}%`;
  return `${p.toFixed(2)}%`;
}
