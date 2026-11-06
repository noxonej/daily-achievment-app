import type { AvatarSlot, Character } from '../lib/types';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

/** How an item is obtained. Chest items are the best ones: they can only be won. */
export type Unlock =
  | { kind: 'free' }
  | { kind: 'shop'; cost: number }
  | { kind: 'level'; level: number }
  | { kind: 'streak'; days: number }
  | { kind: 'chest' };

export interface AvatarItem {
  id: string;
  slot: AvatarSlot;
  name: string;
  rarity: Rarity;
  unlock: Unlock;
  /** Drawing style for the renderer (e.g. 'hoodie', 'crown'). */
  style: string;
  /** Main / accent colours used by the drawing. */
  c1?: string;
  c2?: string;
}

const free = { kind: 'free' } as const;
const shop = (cost: number) => ({ kind: 'shop', cost }) as const;
const level = (l: number) => ({ kind: 'level', level: l }) as const;
const streak = (days: number) => ({ kind: 'streak', days }) as const;
const chest = { kind: 'chest' } as const;

export const AVATAR_ITEMS: AvatarItem[] = [
  // Skin
  { id: 'skin-1', slot: 'skin', name: 'Porcelain', rarity: 'common', unlock: free, style: 'skin', c1: '#fde2cc' },
  { id: 'skin-2', slot: 'skin', name: 'Peach', rarity: 'common', unlock: free, style: 'skin', c1: '#f6c9a0' },
  { id: 'skin-3', slot: 'skin', name: 'Honey', rarity: 'common', unlock: free, style: 'skin', c1: '#e3a873' },
  { id: 'skin-4', slot: 'skin', name: 'Caramel', rarity: 'common', unlock: free, style: 'skin', c1: '#c68652' },
  { id: 'skin-5', slot: 'skin', name: 'Mocha', rarity: 'common', unlock: free, style: 'skin', c1: '#94613a' },
  { id: 'skin-6', slot: 'skin', name: 'Espresso', rarity: 'common', unlock: free, style: 'skin', c1: '#5e3b24' },
  { id: 'skin-frost', slot: 'skin', name: 'Frost', rarity: 'rare', unlock: shop(350), style: 'skin', c1: '#bfe3ff' },
  { id: 'skin-alien', slot: 'skin', name: 'Alien', rarity: 'epic', unlock: chest, style: 'skin', c1: '#9be59b' },
  { id: 'skin-gold', slot: 'skin', name: 'Golden', rarity: 'legendary', unlock: chest, style: 'skin', c1: '#f5c542' },

  // Hair styles
  { id: 'hair-short', slot: 'hair', name: 'Classic', rarity: 'common', unlock: free, style: 'short' },
  { id: 'hair-buzz', slot: 'hair', name: 'Buzz cut', rarity: 'common', unlock: free, style: 'buzz' },
  { id: 'hair-long', slot: 'hair', name: 'Long', rarity: 'common', unlock: free, style: 'long' },
  { id: 'hair-curly', slot: 'hair', name: 'Curls', rarity: 'common', unlock: free, style: 'curly' },
  { id: 'hair-ponytail', slot: 'hair', name: 'Ponytail', rarity: 'common', unlock: free, style: 'ponytail' },
  { id: 'hair-bald', slot: 'hair', name: 'Clean', rarity: 'common', unlock: free, style: 'bald' },
  { id: 'hair-bun', slot: 'hair', name: 'Top bun', rarity: 'common', unlock: shop(120), style: 'bun' },
  { id: 'hair-spiky', slot: 'hair', name: 'Spiky', rarity: 'rare', unlock: shop(200), style: 'spiky' },
  { id: 'hair-afro', slot: 'hair', name: 'Afro', rarity: 'rare', unlock: shop(200), style: 'afro' },
  { id: 'hair-mohawk', slot: 'hair', name: 'Mohawk', rarity: 'epic', unlock: chest, style: 'mohawk' },

  // Hair colours
  { id: 'hc-black', slot: 'hairColor', name: 'Black', rarity: 'common', unlock: free, style: 'color', c1: '#2a211c' },
  { id: 'hc-brown', slot: 'hairColor', name: 'Brown', rarity: 'common', unlock: free, style: 'color', c1: '#6b4429' },
  { id: 'hc-blonde', slot: 'hairColor', name: 'Blonde', rarity: 'common', unlock: free, style: 'color', c1: '#e6c27a' },
  { id: 'hc-ginger', slot: 'hairColor', name: 'Ginger', rarity: 'common', unlock: free, style: 'color', c1: '#c2552b' },
  { id: 'hc-silver', slot: 'hairColor', name: 'Silver', rarity: 'rare', unlock: shop(150), style: 'color', c1: '#d6dbe3' },
  { id: 'hc-blue', slot: 'hairColor', name: 'Electric blue', rarity: 'rare', unlock: chest, style: 'color', c1: '#3b82f6' },
  { id: 'hc-pink', slot: 'hairColor', name: 'Bubblegum', rarity: 'rare', unlock: chest, style: 'color', c1: '#f472b6' },
  { id: 'hc-mint', slot: 'hairColor', name: 'Mint', rarity: 'epic', unlock: chest, style: 'color', c1: '#5eead4' },

  // Outfits
  { id: 'out-tee', slot: 'outfit', name: 'White tee', rarity: 'common', unlock: free, style: 'tee', c1: '#f1f5f9', c2: '#cbd5e1' },
  { id: 'out-hoodie-gray', slot: 'outfit', name: 'Gray hoodie', rarity: 'common', unlock: free, style: 'hoodie', c1: '#64748b', c2: '#475569' },
  { id: 'out-hoodie-violet', slot: 'outfit', name: 'Violet hoodie', rarity: 'common', unlock: shop(100), style: 'hoodie', c1: '#7c3aed', c2: '#5b21b6' },
  { id: 'out-bomber', slot: 'outfit', name: 'Bomber jacket', rarity: 'common', unlock: shop(150), style: 'bomber', c1: '#3f6212', c2: '#f97316' },
  { id: 'out-track', slot: 'outfit', name: 'Tracksuit', rarity: 'rare', unlock: shop(220), style: 'track', c1: '#dc2626', c2: '#ffffff' },
  { id: 'out-jersey', slot: 'outfit', name: 'Champion jersey', rarity: 'rare', unlock: level(5), style: 'jersey', c1: '#facc15', c2: '#1e3a8a' },
  { id: 'out-ninja', slot: 'outfit', name: 'Shadow gi', rarity: 'rare', unlock: chest, style: 'ninja', c1: '#1f2937', c2: '#b91c1c' },
  { id: 'out-suit', slot: 'outfit', name: 'Sharp suit', rarity: 'epic', unlock: shop(450), style: 'suit', c1: '#1e293b', c2: '#e11d48' },
  { id: 'out-space', slot: 'outfit', name: 'Astronaut', rarity: 'epic', unlock: chest, style: 'space', c1: '#f8fafc', c2: '#94a3b8' },
  { id: 'out-armor', slot: 'outfit', name: 'Knight armor', rarity: 'epic', unlock: streak(14), style: 'armor', c1: '#cbd5e1', c2: '#64748b' },
  { id: 'out-flame', slot: 'outfit', name: 'Inferno hoodie', rarity: 'legendary', unlock: chest, style: 'flame', c1: '#ea580c', c2: '#7f1d1d' },
  { id: 'out-robe', slot: 'outfit', name: 'Royal robe', rarity: 'legendary', unlock: level(20), style: 'robe', c1: '#b91c1c', c2: '#facc15' },

  // Headwear
  { id: 'hw-none', slot: 'headwear', name: 'None', rarity: 'common', unlock: free, style: 'none' },
  { id: 'hw-headband', slot: 'headwear', name: 'Sweatband', rarity: 'common', unlock: free, style: 'headband', c1: '#ef4444' },
  { id: 'hw-cap', slot: 'headwear', name: 'Cap', rarity: 'common', unlock: shop(80), style: 'cap', c1: '#2563eb', c2: '#1e40af' },
  { id: 'hw-beanie', slot: 'headwear', name: 'Beanie', rarity: 'common', unlock: shop(100), style: 'beanie', c1: '#f59e0b', c2: '#b45309' },
  { id: 'hw-headphones', slot: 'headwear', name: 'Headphones', rarity: 'rare', unlock: shop(220), style: 'headphones', c1: '#111827', c2: '#22d3ee' },
  { id: 'hw-flowers', slot: 'headwear', name: 'Flower crown', rarity: 'rare', unlock: shop(260), style: 'flowers' },
  { id: 'hw-catears', slot: 'headwear', name: 'Cat ears', rarity: 'rare', unlock: chest, style: 'catears', c1: '#334155' },
  { id: 'hw-viking', slot: 'headwear', name: 'Viking helm', rarity: 'epic', unlock: level(10), style: 'viking' },
  { id: 'hw-wizard', slot: 'headwear', name: 'Wizard hat', rarity: 'epic', unlock: chest, style: 'wizard', c1: '#4c1d95', c2: '#fde047' },
  { id: 'hw-crown', slot: 'headwear', name: 'Crown', rarity: 'legendary', unlock: streak(30), style: 'crown' },
  { id: 'hw-halo', slot: 'headwear', name: 'Halo', rarity: 'legendary', unlock: chest, style: 'halo' },

  // Eyewear
  { id: 'face-none', slot: 'face', name: 'None', rarity: 'common', unlock: free, style: 'none' },
  { id: 'face-round', slot: 'face', name: 'Round glasses', rarity: 'common', unlock: free, style: 'round', c1: '#1f2937' },
  { id: 'face-shades', slot: 'face', name: 'Aviators', rarity: 'common', unlock: shop(120), style: 'shades' },
  { id: 'face-stars', slot: 'face', name: 'Star glasses', rarity: 'rare', unlock: chest, style: 'stars' },
  { id: 'face-monocle', slot: 'face', name: 'Monocle', rarity: 'epic', unlock: level(15), style: 'monocle' },
  { id: 'face-pixel', slot: 'face', name: 'Pixel shades', rarity: 'epic', unlock: shop(400), style: 'pixel' },
  { id: 'face-visor', slot: 'face', name: 'Cyber visor', rarity: 'legendary', unlock: chest, style: 'visor' },

  // Backdrops
  { id: 'bg-midnight', slot: 'backdrop', name: 'Midnight', rarity: 'common', unlock: free, style: 'gradient', c1: '#334155', c2: '#0f172a' },
  { id: 'bg-sunset', slot: 'backdrop', name: 'Sunset', rarity: 'common', unlock: shop(100), style: 'sunset' },
  { id: 'bg-ocean', slot: 'backdrop', name: 'Ocean', rarity: 'common', unlock: shop(100), style: 'ocean' },
  { id: 'bg-forest', slot: 'backdrop', name: 'Forest', rarity: 'common', unlock: shop(100), style: 'forest' },
  { id: 'bg-sakura', slot: 'backdrop', name: 'Sakura', rarity: 'rare', unlock: chest, style: 'sakura' },
  { id: 'bg-galaxy', slot: 'backdrop', name: 'Galaxy', rarity: 'epic', unlock: level(8), style: 'galaxy' },
  { id: 'bg-neon', slot: 'backdrop', name: 'Neon grid', rarity: 'epic', unlock: chest, style: 'neon' },
  { id: 'bg-gold', slot: 'backdrop', name: 'Hall of fame', rarity: 'legendary', unlock: level(25), style: 'gold' },

  // Pets (sit on your shoulder)
  { id: 'pet-none', slot: 'pet', name: 'None', rarity: 'common', unlock: free, style: 'none' },
  { id: 'pet-cat', slot: 'pet', name: 'Ginger cat', rarity: 'rare', unlock: shop(300), style: 'cat', c1: '#f59e0b' },
  { id: 'pet-puppy', slot: 'pet', name: 'Puppy', rarity: 'rare', unlock: shop(300), style: 'puppy', c1: '#d6a16b' },
  { id: 'pet-bird', slot: 'pet', name: 'Bluebird', rarity: 'rare', unlock: chest, style: 'bird', c1: '#38bdf8' },
  { id: 'pet-robot', slot: 'pet', name: 'Robo buddy', rarity: 'epic', unlock: level(12), style: 'robot' },
  { id: 'pet-slime', slot: 'pet', name: 'Slime', rarity: 'epic', unlock: chest, style: 'slime', c1: '#4ade80' },
  { id: 'pet-dragon', slot: 'pet', name: 'Baby dragon', rarity: 'legendary', unlock: chest, style: 'dragon', c1: '#8b5cf6' },
];

export const AVATAR_SLOTS: Array<{ id: AvatarSlot; label: string; icon: string }> = [
  { id: 'outfit', label: 'Outfit', icon: '👕' },
  { id: 'hair', label: 'Hair', icon: '✂' },
  { id: 'hairColor', label: 'Color', icon: '🎨' },
  { id: 'headwear', label: 'Hats', icon: '👑' },
  { id: 'face', label: 'Eyewear', icon: '🕶' },
  { id: 'pet', label: 'Pets', icon: '🐶' },
  { id: 'backdrop', label: 'Scene', icon: '🌅' },
  { id: 'skin', label: 'Skin', icon: '😊' },
];

export const DEFAULT_LOOK: Character = {
  skin: 'skin-2',
  hair: 'hair-short',
  hairColor: 'hc-brown',
  outfit: 'out-hoodie-gray',
  headwear: 'hw-none',
  face: 'face-none',
  backdrop: 'bg-midnight',
  pet: 'pet-none',
};

export const RARITY: Record<Rarity, { label: string; text: string; border: string; glow: string; bg: string; hex: string; weight: number }> = {
  common: { label: 'Common', text: 'text-slate-300', border: 'border-slate-500/40', glow: '', bg: 'bg-slate-500/10', hex: '#94a3b8', weight: 50 },
  rare: { label: 'Rare', text: 'text-sky-300', border: 'border-sky-400/60', glow: 'shadow-[0_0_18px_-4px_rgba(56,189,248,0.6)]', bg: 'bg-sky-500/10', hex: '#38bdf8', weight: 30 },
  epic: { label: 'Epic', text: 'text-violet-300', border: 'border-violet-400/70', glow: 'shadow-[0_0_20px_-4px_rgba(167,139,250,0.7)]', bg: 'bg-violet-500/10', hex: '#a78bfa', weight: 15 },
  legendary: { label: 'Legendary', text: 'text-amber-300', border: 'border-amber-400/80', glow: 'shadow-[0_0_24px_-4px_rgba(251,191,36,0.8)]', bg: 'bg-amber-500/10', hex: '#fbbf24', weight: 5 },
};

const BY_ID = new Map(AVATAR_ITEMS.map((i) => [i.id, i]));

export function findItem(id: string | undefined): AvatarItem | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function itemCost(item: AvatarItem | undefined): number {
  return item?.unlock.kind === 'shop' ? item.unlock.cost : 0;
}

/** Fills any missing or unknown slot (e.g. a save from the old character system) with the default. */
export function normalizeLook(look: Partial<Character> | undefined | null): Character {
  const out = { ...DEFAULT_LOOK };
  if (!look || typeof look !== 'object') return out;
  for (const slot of Object.keys(DEFAULT_LOOK) as Array<keyof Character>) {
    const item = findItem(look[slot]);
    if (item && item.slot === slot) out[slot] = item.id;
  }
  return out;
}

export interface OwnershipContext {
  bought: string[];
  won: string[];
  level: number;
  longestStreak: number;
}

export function isOwned(item: AvatarItem, ctx: OwnershipContext): boolean {
  switch (item.unlock.kind) {
    case 'free':
      return true;
    case 'level':
      return ctx.level >= item.unlock.level || ctx.won.includes(item.id);
    case 'streak':
      return ctx.longestStreak >= item.unlock.days || ctx.won.includes(item.id);
    default:
      return ctx.bought.includes(item.id) || ctx.won.includes(item.id);
  }
}

/** Items a chest can drop: anything you'd otherwise have to buy or win that you don't own yet. */
export function chestPool(ctx: OwnershipContext): AvatarItem[] {
  return AVATAR_ITEMS.filter((i) => (i.unlock.kind === 'shop' || i.unlock.kind === 'chest') && !isOwned(i, ctx));
}

/** Weighted random pick by rarity; returns null when everything has been collected. */
export function rollChest(ctx: OwnershipContext, rand: () => number = Math.random): AvatarItem | null {
  const pool = chestPool(ctx);
  if (pool.length === 0) return null;
  const total = pool.reduce((s, i) => s + RARITY[i.rarity].weight, 0);
  let r = rand() * total;
  for (const i of pool) {
    r -= RARITY[i.rarity].weight;
    if (r <= 0) return i;
  }
  return pool[pool.length - 1];
}

export const CHEST_DUPLICATE_SHARDS = 150;
