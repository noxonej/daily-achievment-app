import type { AvatarItem } from '../data/avatar';

/** What the daily box can give. Rolled when opened; the reducer re-checks it's allowed. */
export type BoxReward =
  | { kind: 'shards'; amount: number }
  | { kind: 'xpBoost'; multiplier: number }
  | { kind: 'swap' }
  | { kind: 'shield' }
  | { kind: 'skip' }
  | { kind: 'chest' }
  | { kind: 'cosmetic'; itemId: string };

interface Entry {
  weight: number;
  reward: BoxReward;
}

/** Odds out of 100. The box-only cosmetic is deliberately rare (~2%). */
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

export function rollBox(pool: AvatarItem[], rand: () => number = Math.random): BoxReward {
  const total = BOX_TABLE.reduce((s, e) => s + e.weight, 0);
  let r = rand() * total;
  for (const e of BOX_TABLE) {
    r -= e.weight;
    if (r <= 0) {
      if (e.reward.kind === 'cosmetic') {
        // Everything already collected: fall back to a big shard prize.
        if (pool.length === 0) return { kind: 'shards', amount: 150 };
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
      return { title: `+${r.amount} shards`, text: 'Spend them in the wardrobe.', icon: '💎', tone: 'text-amber-300' };
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
  }
}
