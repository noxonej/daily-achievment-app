import type { AvatarItem } from '../data/avatar';
import { DECOR, PROPERTIES, VEHICLES, ownsDecor, owns, type WorldState } from '../world/catalog';

/** What the daily box can give. Rolled when opened; the reducer re-checks it's allowed. */
export type BoxReward =
  | { kind: 'shards'; amount: number }
  | { kind: 'xpBoost'; multiplier: number }
  | { kind: 'swap' }
  | { kind: 'shield' }
  | { kind: 'skip' }
  | { kind: 'chest' }
  | { kind: 'cosmetic'; itemId: string }
  | { kind: 'jackpot'; id: string; name: string; what: JackpotKind };

export type JackpotKind = 'home' | 'vehicle' | 'decor';

/** The daily box jackpot: 1 in 100 boxes gives a World item for free (a home, a vehicle or furniture). */
export const JACKPOT_CHANCE = 0.01;

/** How far above your level a jackpot can reach: lucky, but a level-90 penthouse on day 2 would spoil the game. */
const JACKPOT_LEVEL_REACH = 20;

export interface JackpotPrize {
  id: string;
  name: string;
  what: JackpotKind;
}

/**
 * World items a jackpot can give: things you don't own yet, not legendary (those stay special),
 * at most JACKPOT_LEVEL_REACH levels above you. Walls and floors are left out (not exciting enough).
 */
export function jackpotPool(world: WorldState, level: number): JackpotPrize[] {
  const reach = level + JACKPOT_LEVEL_REACH;
  const out: JackpotPrize[] = [];
  for (const p of PROPERTIES) if (!owns(world, p.id) && !p.unlock.legendary && p.unlock.level <= reach) out.push({ id: p.id, name: p.name, what: 'home' });
  for (const v of VEHICLES) if (v.cls !== 'legendary' && !v.unlock.legendary && !owns(world, v.id) && v.unlock.level <= reach) out.push({ id: v.id, name: v.name, what: 'vehicle' });
  for (const d of DECOR) if (d.slot !== 'wall' && d.slot !== 'floor' && !d.unlock.legendary && !ownsDecor(world, d) && d.unlock.level <= reach) out.push({ id: d.id, name: d.name, what: 'decor' });
  return out;
}

/** Homes are the rarest jackpot, then vehicles, then furniture. */
export function rollJackpot(pool: JackpotPrize[], rand: () => number = Math.random): JackpotPrize | null {
  if (!pool.length) return null;
  const weight = (p: JackpotPrize) => (p.what === 'home' ? 2 : p.what === 'vehicle' ? 3 : 1);
  const total = pool.reduce((s, p) => s + weight(p), 0);
  let r = rand() * total;
  for (const p of pool) {
    r -= weight(p);
    if (r <= 0) return p;
  }
  return pool[pool.length - 1];
}

interface Entry {
  weight: number;
  reward: BoxReward;
}

/** Odds out of 100 (after the 1% jackpot roll). The box-only cosmetic is deliberately rare (~2%). */
export const BOX_TABLE: Entry[] = [
  { weight: 27, reward: { kind: 'shards', amount: 25 } },
  { weight: 18, reward: { kind: 'shards', amount: 50 } },
  { weight: 7, reward: { kind: 'shards', amount: 100 } },
  { weight: 14, reward: { kind: 'xpBoost', multiplier: 1.5 } },
  { weight: 5, reward: { kind: 'xpBoost', multiplier: 2 } },
  { weight: 12, reward: { kind: 'swap' } },
  { weight: 8, reward: { kind: 'shield' } },
  { weight: 3, reward: { kind: 'skip' } },
  { weight: 4, reward: { kind: 'chest' } },
  { weight: 2, reward: { kind: 'cosmetic', itemId: '' } },
];

export function rollBox(pool: AvatarItem[], rand: () => number = Math.random, jackpots: JackpotPrize[] = [], wardrobe: AvatarItem[] = []): BoxReward {
  // The jackpot is rolled first: 1 in 100 boxes.
  if (jackpots.length && rand() < JACKPOT_CHANCE) {
    const j = rollJackpot(jackpots, rand);
    if (j) return { kind: 'jackpot', id: j.id, name: j.name, what: j.what };
  }
  const total = BOX_TABLE.reduce((s, e) => s + e.weight, 0);
  let r = rand() * total;
  for (const e of BOX_TABLE) {
    r -= e.weight;
    if (r <= 0) {
      if (e.reward.kind === 'cosmetic') {
        // All mythics collected: any wardrobe item you don't have yet, else a big coin prize.
        if (pool.length === 0) {
          if (wardrobe.length === 0) return { kind: 'shards', amount: 150 };
          return { kind: 'cosmetic', itemId: wardrobe[Math.floor(rand() * wardrobe.length)].id };
        }
        return { kind: 'cosmetic', itemId: pool[Math.floor(rand() * pool.length)].id };
      }
      return e.reward;
    }
  }
  return { kind: 'shards', amount: 25 };
}

export function rewardInfo(r: BoxReward): { title: string; text: string; icon: string; tone: string } {
  switch (r.kind) {
    case 'shards':
      return { title: `+${r.amount} coins`, text: 'Spend them in the wardrobe.', icon: '💎', tone: 'text-amber-300' };
    case 'xpBoost':
      return {
        title: r.multiplier >= 2 ? 'Double XP today' : '+50% XP today',
        text: `Every quest you complete today gives ${r.multiplier >= 2 ? 'twice the' : '50% more'} XP, including the ones you already did.`,
        icon: '⚡',
        tone: 'text-yellow-300',
      };
    case 'swap':
      return { title: 'Quest Swap', text: "Trade one of today's daily quests for a different one.", icon: '🔁', tone: 'text-sky-300' };
    case 'shield':
      return { title: 'Streak Shield', text: 'If you miss a day, it saves your streak automatically.', icon: '🛡', tone: 'text-emerald-300' };
    case 'skip':
      return { title: 'Skip Pass', text: 'Skip one daily quest on a busy day. Your streak stays safe (no XP for it).', icon: '⏭', tone: 'text-teal-300' };
    case 'chest':
      return { title: 'Bonus reward chest', text: 'Open it in the wardrobe.', icon: '🎁', tone: 'text-violet-300' };
    case 'cosmetic':
      return { title: 'Mythic item!', text: 'A daily-box exclusive. Almost nobody gets one.', icon: '✨', tone: 'text-fuchsia-300' };
    case 'jackpot':
      return {
        title: r.name,
        text: r.what === 'home' ? 'A whole new home, free. Move in from the World tab.' : r.what === 'vehicle' ? 'A new ride for your garage, free. Find it in the World tab.' : 'New furniture for your room, free. Place it from the World tab.',
        icon: r.what === 'home' ? '🏠' : r.what === 'vehicle' ? '🚗' : '🛋',
        tone: 'text-yellow-300',
      };
  }
}

/** What the box can give, for the "What's inside" list. Percent of all boxes. */
export const BOX_ODDS: Array<{ label: string; pct: string; tone: string }> = [
  { label: 'World jackpot: a home, car or furniture', pct: '1%', tone: 'text-yellow-300' },
  { label: 'Mythic outfit item', pct: '2%', tone: 'text-fuchsia-300' },
  { label: 'Bonus reward chest', pct: '4%', tone: 'text-violet-300' },
  { label: 'Double XP or +50% XP today', pct: '19%', tone: 'text-sky-300' },
  { label: 'Swap, Shield or Skip pass', pct: '23%', tone: 'text-emerald-300' },
  { label: '25 to 100 coins', pct: '51%', tone: 'text-amber-300' },
];
