import type { AvatarSlot, Character } from '../lib/types';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

/** How an item is obtained. Chest items are the best ones: they can only be won. */
export type Unlock =
  | { kind: 'free' }
  | { kind: 'shop'; cost: number }
  | { kind: 'level'; level: number }
  | { kind: 'streak'; days: number }
  | { kind: 'chest' }
  /** Only from the daily box, at a very small chance. */
  | { kind: 'box' };

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
const box = { kind: 'box' } as const;

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

  // Faces & expressions
  { id: 'exp-happy', slot: 'expression', name: 'Happy', rarity: 'common', unlock: free, style: 'happy' },
  { id: 'exp-mood', slot: 'expression', name: 'Match my mood', rarity: 'common', unlock: free, style: 'mood' },
  { id: 'exp-grin', slot: 'expression', name: 'Big grin', rarity: 'common', unlock: free, style: 'grin' },
  { id: 'exp-calm', slot: 'expression', name: 'Calm', rarity: 'common', unlock: free, style: 'calm' },
  { id: 'exp-sad', slot: 'expression', name: 'Sad', rarity: 'common', unlock: free, style: 'sad' },
  { id: 'exp-angry', slot: 'expression', name: 'Angry', rarity: 'common', unlock: free, style: 'angry' },
  { id: 'exp-surprised', slot: 'expression', name: 'Surprised', rarity: 'common', unlock: free, style: 'surprised' },
  { id: 'exp-sleepy', slot: 'expression', name: 'Sleepy', rarity: 'common', unlock: free, style: 'sleepy' },
  { id: 'exp-wink', slot: 'expression', name: 'Wink', rarity: 'common', unlock: free, style: 'wink' },
  { id: 'exp-laugh', slot: 'expression', name: 'Laughing', rarity: 'common', unlock: shop(120), style: 'laugh' },
  { id: 'exp-smirk', slot: 'expression', name: 'Cool smirk', rarity: 'rare', unlock: shop(180), style: 'smirk' },
  { id: 'exp-determined', slot: 'expression', name: 'Determined', rarity: 'rare', unlock: level(4), style: 'determined' },
  { id: 'exp-starstruck', slot: 'expression', name: 'Star-struck', rarity: 'rare', unlock: chest, style: 'starstruck' },
  { id: 'exp-love', slot: 'expression', name: 'Heart eyes', rarity: 'rare', unlock: chest, style: 'love' },
  { id: 'exp-dizzy', slot: 'expression', name: 'Dizzy', rarity: 'rare', unlock: chest, style: 'dizzy' },
  { id: 'exp-cat', slot: 'expression', name: 'Cat face', rarity: 'epic', unlock: chest, style: 'cat' },
  { id: 'exp-robot', slot: 'expression', name: 'Robot eyes', rarity: 'epic', unlock: chest, style: 'robot' },
  { id: 'exp-fire', slot: 'expression', name: 'Fire eyes', rarity: 'legendary', unlock: streak(21), style: 'fire' },
  { id: 'exp-sideeye', slot: 'expression', name: 'Side-eye', rarity: 'common', unlock: free, style: 'sideeye' },
  { id: 'exp-bruh', slot: 'expression', name: 'Bruh', rarity: 'common', unlock: free, style: 'bruh' },
  { id: 'exp-nerd', slot: 'expression', name: 'Nerd', rarity: 'common', unlock: shop(100), style: 'nerd' },
  { id: 'exp-unbothered', slot: 'expression', name: 'Unbothered', rarity: 'common', unlock: shop(120), style: 'unbothered' },
  { id: 'exp-sigma', slot: 'expression', name: 'Sigma', rarity: 'rare', unlock: shop(250), style: 'sigma' },
  { id: 'exp-pleading', slot: 'expression', name: 'Pleading', rarity: 'rare', unlock: shop(220), style: 'pleading' },
  { id: 'exp-rizz', slot: 'expression', name: 'Rizz', rarity: 'rare', unlock: chest, style: 'rizz' },
  { id: 'exp-crylaugh', slot: 'expression', name: 'Crying laughing', rarity: 'rare', unlock: chest, style: 'crylaugh' },
  { id: 'exp-dead', slot: 'expression', name: "I'm dead", rarity: 'epic', unlock: chest, style: 'dead' },
  { id: 'exp-main', slot: 'expression', name: 'Main character', rarity: 'epic', unlock: level(15), style: 'maincharacter' },

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
  { id: 'hair-quiff', slot: 'hair', name: 'Quiff', rarity: 'common', unlock: free, style: 'quiff' },
  { id: 'hair-bob', slot: 'hair', name: 'Bob', rarity: 'common', unlock: free, style: 'bob' },
  { id: 'hair-pigtails', slot: 'hair', name: 'Pigtails', rarity: 'common', unlock: shop(120), style: 'pigtails' },
  { id: 'hair-braids', slot: 'hair', name: 'Braids', rarity: 'rare', unlock: shop(220), style: 'braids' },
  { id: 'hair-messy', slot: 'hair', name: 'Messy', rarity: 'rare', unlock: chest, style: 'messy' },

  // Hair colours
  { id: 'hc-black', slot: 'hairColor', name: 'Black', rarity: 'common', unlock: free, style: 'color', c1: '#2a211c' },
  { id: 'hc-brown', slot: 'hairColor', name: 'Brown', rarity: 'common', unlock: free, style: 'color', c1: '#6b4429' },
  { id: 'hc-blonde', slot: 'hairColor', name: 'Blonde', rarity: 'common', unlock: free, style: 'color', c1: '#e6c27a' },
  { id: 'hc-ginger', slot: 'hairColor', name: 'Ginger', rarity: 'common', unlock: free, style: 'color', c1: '#c2552b' },
  { id: 'hc-silver', slot: 'hairColor', name: 'Silver', rarity: 'rare', unlock: shop(150), style: 'color', c1: '#d6dbe3' },
  { id: 'hc-blue', slot: 'hairColor', name: 'Electric blue', rarity: 'rare', unlock: chest, style: 'color', c1: '#3b82f6' },
  { id: 'hc-pink', slot: 'hairColor', name: 'Bubblegum', rarity: 'rare', unlock: chest, style: 'color', c1: '#f472b6' },
  { id: 'hc-mint', slot: 'hairColor', name: 'Mint', rarity: 'epic', unlock: chest, style: 'color', c1: '#5eead4' },
  { id: 'hc-red', slot: 'hairColor', name: 'Cherry red', rarity: 'rare', unlock: shop(150), style: 'color', c1: '#dc2626' },
  { id: 'hc-purple', slot: 'hairColor', name: 'Purple', rarity: 'rare', unlock: chest, style: 'color', c1: '#8b5cf6' },
  { id: 'hc-snow', slot: 'hairColor', name: 'Snow', rarity: 'epic', unlock: chest, style: 'color', c1: '#f8fafc' },

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
  { id: 'out-denim', slot: 'outfit', name: 'Denim jacket', rarity: 'common', unlock: free, style: 'denim', c1: '#3b6ea8', c2: '#f1f5f9' },
  { id: 'out-stripes', slot: 'outfit', name: 'Striped sweater', rarity: 'common', unlock: free, style: 'stripes', c1: '#1e3a8a', c2: '#f8fafc' },
  { id: 'out-flannel', slot: 'outfit', name: 'Flannel shirt', rarity: 'common', unlock: shop(120), style: 'flannel', c1: '#b91c1c', c2: '#1f2937' },
  { id: 'out-overalls', slot: 'outfit', name: 'Overalls', rarity: 'common', unlock: shop(140), style: 'overalls', c1: '#2563eb', c2: '#facc15' },
  { id: 'out-chef', slot: 'outfit', name: 'Chef jacket', rarity: 'common', unlock: shop(140), style: 'chef', c1: '#f8fafc', c2: '#dc2626' },
  { id: 'out-puffer', slot: 'outfit', name: 'Puffer jacket', rarity: 'rare', unlock: shop(240), style: 'puffer', c1: '#0f766e', c2: '#134e4a' },
  { id: 'out-varsity', slot: 'outfit', name: 'Varsity jacket', rarity: 'rare', unlock: level(3), style: 'varsity', c1: '#7f1d1d', c2: '#f8fafc' },
  { id: 'out-leather', slot: 'outfit', name: 'Leather jacket', rarity: 'rare', unlock: shop(320), style: 'leather', c1: '#18181b', c2: '#a1a1aa' },
  { id: 'out-lab', slot: 'outfit', name: 'Lab coat', rarity: 'rare', unlock: level(7), style: 'lab', c1: '#f8fafc', c2: '#60a5fa' },
  { id: 'out-hawaii', slot: 'outfit', name: 'Hawaiian shirt', rarity: 'rare', unlock: chest, style: 'hawaii', c1: '#0d9488', c2: '#fde047' },
  { id: 'out-hero', slot: 'outfit', name: 'Superhero suit', rarity: 'epic', unlock: chest, style: 'hero', c1: '#1d4ed8', c2: '#dc2626' },
  { id: 'out-pirate', slot: 'outfit', name: 'Pirate coat', rarity: 'epic', unlock: chest, style: 'pirate', c1: '#7f1d1d', c2: '#facc15' },
  { id: 'out-galaxy', slot: 'outfit', name: 'Galaxy hoodie', rarity: 'legendary', unlock: chest, style: 'galaxyhoodie', c1: '#312e81', c2: '#a855f7' },
  { id: 'out-dragon', slot: 'outfit', name: 'Dragon scale armor', rarity: 'legendary', unlock: streak(60), style: 'dragonarmor', c1: '#7f1d1d', c2: '#facc15' },

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
  { id: 'hw-party', slot: 'headwear', name: 'Party hat', rarity: 'common', unlock: free, style: 'party', c1: '#ec4899', c2: '#facc15' },
  { id: 'hw-bucket', slot: 'headwear', name: 'Bucket hat', rarity: 'common', unlock: shop(90), style: 'bucket', c1: '#a3e635', c2: '#65a30d' },
  { id: 'hw-beret', slot: 'headwear', name: 'Beret', rarity: 'common', unlock: shop(90), style: 'beret', c1: '#be123c' },
  { id: 'hw-chef', slot: 'headwear', name: 'Chef hat', rarity: 'common', unlock: shop(100), style: 'chefhat' },
  { id: 'hw-cowboy', slot: 'headwear', name: 'Cowboy hat', rarity: 'rare', unlock: shop(240), style: 'cowboy', c1: '#a16207', c2: '#713f12' },
  { id: 'hw-tophat', slot: 'headwear', name: 'Top hat', rarity: 'rare', unlock: level(6), style: 'tophat', c1: '#111827', c2: '#dc2626' },
  { id: 'hw-propeller', slot: 'headwear', name: 'Propeller cap', rarity: 'rare', unlock: chest, style: 'propeller' },
  { id: 'hw-bunny', slot: 'headwear', name: 'Bunny ears', rarity: 'rare', unlock: chest, style: 'bunny', c1: '#f8fafc' },
  { id: 'hw-pirate', slot: 'headwear', name: 'Pirate hat', rarity: 'epic', unlock: chest, style: 'piratehat' },
  { id: 'hw-devil', slot: 'headwear', name: 'Devil horns', rarity: 'epic', unlock: chest, style: 'devil' },

  // Eyewear
  { id: 'face-none', slot: 'face', name: 'None', rarity: 'common', unlock: free, style: 'none' },
  { id: 'face-round', slot: 'face', name: 'Round glasses', rarity: 'common', unlock: free, style: 'round', c1: '#1f2937' },
  { id: 'face-shades', slot: 'face', name: 'Aviators', rarity: 'common', unlock: shop(120), style: 'shades' },
  { id: 'face-stars', slot: 'face', name: 'Star glasses', rarity: 'rare', unlock: chest, style: 'stars' },
  { id: 'face-monocle', slot: 'face', name: 'Monocle', rarity: 'epic', unlock: level(15), style: 'monocle' },
  { id: 'face-pixel', slot: 'face', name: 'Pixel shades', rarity: 'epic', unlock: shop(400), style: 'pixel' },
  { id: 'face-visor', slot: 'face', name: 'Cyber visor', rarity: 'legendary', unlock: chest, style: 'visor' },
  { id: 'face-nerd', slot: 'face', name: 'Thick frames', rarity: 'common', unlock: free, style: 'nerd' },
  { id: 'face-3d', slot: 'face', name: '3D glasses', rarity: 'common', unlock: shop(90), style: '3d' },
  { id: 'face-goggles', slot: 'face', name: 'Ski goggles', rarity: 'rare', unlock: shop(220), style: 'goggles' },
  { id: 'face-hearts', slot: 'face', name: 'Heart glasses', rarity: 'rare', unlock: chest, style: 'hearts' },
  { id: 'face-patch', slot: 'face', name: 'Eye patch', rarity: 'rare', unlock: chest, style: 'patch' },

  // Backdrops
  { id: 'bg-midnight', slot: 'backdrop', name: 'Midnight', rarity: 'common', unlock: free, style: 'gradient', c1: '#334155', c2: '#0f172a' },
  { id: 'bg-sunset', slot: 'backdrop', name: 'Sunset', rarity: 'common', unlock: shop(100), style: 'sunset' },
  { id: 'bg-ocean', slot: 'backdrop', name: 'Ocean', rarity: 'common', unlock: shop(100), style: 'ocean' },
  { id: 'bg-forest', slot: 'backdrop', name: 'Forest', rarity: 'common', unlock: shop(100), style: 'forest' },
  { id: 'bg-sakura', slot: 'backdrop', name: 'Sakura', rarity: 'rare', unlock: chest, style: 'sakura' },
  { id: 'bg-galaxy', slot: 'backdrop', name: 'Galaxy', rarity: 'epic', unlock: level(8), style: 'galaxy' },
  { id: 'bg-neon', slot: 'backdrop', name: 'Neon grid', rarity: 'epic', unlock: chest, style: 'neon' },
  { id: 'bg-gold', slot: 'backdrop', name: 'Hall of fame', rarity: 'legendary', unlock: level(25), style: 'gold' },
  { id: 'bg-sky', slot: 'backdrop', name: 'Blue sky', rarity: 'common', unlock: free, style: 'sky' },
  { id: 'bg-beach', slot: 'backdrop', name: 'Beach', rarity: 'common', unlock: shop(100), style: 'beach' },
  { id: 'bg-mountains', slot: 'backdrop', name: 'Mountains', rarity: 'common', unlock: shop(100), style: 'mountains' },
  { id: 'bg-city', slot: 'backdrop', name: 'City lights', rarity: 'rare', unlock: shop(220), style: 'city' },
  { id: 'bg-lava', slot: 'backdrop', name: 'Lava', rarity: 'epic', unlock: level(18), style: 'lava' },
  { id: 'bg-aurora', slot: 'backdrop', name: 'Aurora', rarity: 'legendary', unlock: chest, style: 'aurora' },

  // Pets (sit on your shoulder)
  { id: 'pet-none', slot: 'pet', name: 'None', rarity: 'common', unlock: free, style: 'none' },
  { id: 'pet-cat', slot: 'pet', name: 'Ginger cat', rarity: 'rare', unlock: shop(300), style: 'cat', c1: '#f59e0b' },
  { id: 'pet-puppy', slot: 'pet', name: 'Puppy', rarity: 'rare', unlock: shop(300), style: 'puppy', c1: '#d6a16b' },
  { id: 'pet-bird', slot: 'pet', name: 'Bluebird', rarity: 'rare', unlock: chest, style: 'bird', c1: '#38bdf8' },
  { id: 'pet-robot', slot: 'pet', name: 'Robo buddy', rarity: 'epic', unlock: level(12), style: 'robot' },
  { id: 'pet-slime', slot: 'pet', name: 'Slime', rarity: 'epic', unlock: chest, style: 'slime', c1: '#4ade80' },
  { id: 'pet-dragon', slot: 'pet', name: 'Baby dragon', rarity: 'legendary', unlock: chest, style: 'dragon', c1: '#8b5cf6' },
  { id: 'pet-frog', slot: 'pet', name: 'Frog', rarity: 'common', unlock: shop(200), style: 'frog', c1: '#4ade80' },
  { id: 'pet-bunny', slot: 'pet', name: 'Bunny', rarity: 'rare', unlock: shop(300), style: 'bunnypet', c1: '#f1f5f9' },
  { id: 'pet-penguin', slot: 'pet', name: 'Penguin', rarity: 'rare', unlock: shop(300), style: 'penguin' },
  { id: 'pet-fox', slot: 'pet', name: 'Fox', rarity: 'rare', unlock: chest, style: 'fox', c1: '#f97316' },
  { id: 'pet-ghost', slot: 'pet', name: 'Ghost', rarity: 'epic', unlock: chest, style: 'ghost' },
  { id: 'pet-phoenix', slot: 'pet', name: 'Phoenix', rarity: 'legendary', unlock: chest, style: 'phoenix', c1: '#f97316' },

  // Mythic: daily-box exclusives
  { id: 'out-holo', slot: 'outfit', name: 'Holo hoodie', rarity: 'mythic', unlock: box, style: 'holo' },
  { id: 'hw-crystal', slot: 'headwear', name: 'Crystal crown', rarity: 'mythic', unlock: box, style: 'crystalcrown' },
  { id: 'bg-blackhole', slot: 'backdrop', name: 'Black hole', rarity: 'mythic', unlock: box, style: 'blackhole' },
  { id: 'pet-goldphoenix', slot: 'pet', name: 'Golden phoenix', rarity: 'mythic', unlock: box, style: 'phoenix', c1: '#facc15' },
  { id: 'exp-cosmic', slot: 'expression', name: 'Cosmic eyes', rarity: 'mythic', unlock: box, style: 'cosmic' },
  { id: 'skin-prism', slot: 'skin', name: 'Prism', rarity: 'mythic', unlock: box, style: 'skin', c1: '#d8b4fe' },
];

export const AVATAR_SLOTS: Array<{ id: AvatarSlot; label: string; icon: string }> = [
  { id: 'outfit', label: 'Outfit', icon: '👕' },
  { id: 'expression', label: 'Face', icon: '😊' },
  { id: 'hair', label: 'Hair', icon: '✂' },
  { id: 'hairColor', label: 'Color', icon: '🎨' },
  { id: 'headwear', label: 'Hats', icon: '👑' },
  { id: 'face', label: 'Eyewear', icon: '🕶' },
  { id: 'pet', label: 'Pets', icon: '🐶' },
  { id: 'backdrop', label: 'Scene', icon: '🌅' },
  { id: 'skin', label: 'Skin', icon: '🙌' },
];

export const DEFAULT_LOOK: Character = {
  skin: 'skin-2',
  expression: 'exp-happy',
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
  mythic: { label: 'Mythic', text: 'text-fuchsia-300', border: 'border-fuchsia-400/80', glow: 'shadow-[0_0_28px_-4px_rgba(232,121,249,0.85)]', bg: 'bg-fuchsia-500/10', hex: '#e879f9', weight: 0 },
  legendary: { label: 'Legendary', text: 'text-yellow-300', border: 'border-yellow-400/80', glow: 'shadow-[0_0_24px_-4px_rgba(251,191,36,0.8)]', bg: 'bg-yellow-500/10', hex: '#fbbf24', weight: 5 },
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

/** Daily-box exclusives the player doesn't own yet. */
export function boxPool(ctx: OwnershipContext): AvatarItem[] {
  return AVATAR_ITEMS.filter((i) => i.unlock.kind === 'box' && !isOwned(i, ctx));
}
