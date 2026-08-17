import type { Character, CosmeticSlot } from '../lib/types';

export interface CosmeticItem {
  id: string;
  slot: CosmeticSlot;
  name: string;
  /** In Shards. 0 = free/default, always owned. */
  cost: number;
  /** Hex color for outfit/aura slots, an emoji for hat/accessory slots, '' for "None". */
  value: string;
}

export const COSMETICS: CosmeticItem[] = [
  // Outfits — body color
  { id: 'outfit-violet', slot: 'outfit', name: 'Violet', cost: 0, value: '#8b5cf6' },
  { id: 'outfit-crimson', slot: 'outfit', name: 'Crimson', cost: 50, value: '#ef4444' },
  { id: 'outfit-emerald', slot: 'outfit', name: 'Emerald', cost: 50, value: '#10b981' },
  { id: 'outfit-azure', slot: 'outfit', name: 'Azure', cost: 50, value: '#3b82f6' },
  { id: 'outfit-rose', slot: 'outfit', name: 'Rose', cost: 90, value: '#f472b6' },
  { id: 'outfit-gold', slot: 'outfit', name: 'Gold', cost: 150, value: '#f59e0b' },
  { id: 'outfit-obsidian', slot: 'outfit', name: 'Obsidian', cost: 180, value: '#1e1b2e' },

  // Hats
  { id: 'hat-none', slot: 'hat', name: 'None', cost: 0, value: '' },
  { id: 'hat-cap', slot: 'hat', name: 'Cap', cost: 40, value: '🧢' },
  { id: 'hat-sunhat', slot: 'hat', name: 'Sun Hat', cost: 40, value: '👒' },
  { id: 'hat-tophat', slot: 'hat', name: 'Top Hat', cost: 80, value: '🎩' },
  { id: 'hat-helmet', slot: 'hat', name: 'Helmet', cost: 80, value: '🪖' },
  { id: 'hat-gradcap', slot: 'hat', name: 'Grad Cap', cost: 110, value: '🎓' },
  { id: 'hat-halo', slot: 'hat', name: 'Halo', cost: 160, value: '😇' },
  { id: 'hat-crown', slot: 'hat', name: 'Crown', cost: 250, value: '👑' },

  // Accessories
  { id: 'acc-none', slot: 'accessory', name: 'None', cost: 0, value: '' },
  { id: 'acc-glasses', slot: 'accessory', name: 'Sunglasses', cost: 40, value: '🕶️' },
  { id: 'acc-scarf', slot: 'accessory', name: 'Scarf', cost: 40, value: '🧣' },
  { id: 'acc-backpack', slot: 'accessory', name: 'Backpack', cost: 60, value: '🎒' },
  { id: 'acc-sword', slot: 'accessory', name: 'Sword', cost: 110, value: '⚔️' },
  { id: 'acc-shield', slot: 'accessory', name: 'Shield', cost: 110, value: '🛡️' },
  { id: 'acc-wings', slot: 'accessory', name: 'Wings', cost: 200, value: '🦋' },
  { id: 'acc-sparkle', slot: 'accessory', name: 'Sparkle', cost: 250, value: '✨' },

  // Auras — glow behind the character
  { id: 'aura-none', slot: 'aura', name: 'None', cost: 0, value: '' },
  { id: 'aura-ember', slot: 'aura', name: 'Ember', cost: 60, value: '#f97316' },
  { id: 'aura-aqua', slot: 'aura', name: 'Aqua', cost: 60, value: '#22d3ee' },
  { id: 'aura-nature', slot: 'aura', name: 'Nature', cost: 60, value: '#4ade80' },
  { id: 'aura-royal', slot: 'aura', name: 'Royal', cost: 130, value: '#818cf8' },
  { id: 'aura-cosmic', slot: 'aura', name: 'Cosmic', cost: 220, value: '#e879f9' },
];

export const DEFAULT_CHARACTER: Character = {
  outfit: 'outfit-violet',
  hat: 'hat-none',
  accessory: 'acc-none',
  aura: 'aura-none',
};

export function findCosmetic(id: string): CosmeticItem | undefined {
  return COSMETICS.find((c) => c.id === id);
}
