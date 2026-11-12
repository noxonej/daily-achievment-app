import type { AppState, DecorSlot, DerivedStats, NumericStat, WorldState } from '../lib/types';

export type { DecorSlot, WorldState };

/**
 * Everything you can own in your World: homes, things for your home, vehicles, paint and garage
 * spots. Each one unlocks with a level, a coin price and sometimes a real-life milestone, so effort
 * always shows and coins alone never buy the top.
 */
export interface Milestone {
  stat: NumericStat;
  target: number;
  /** Shown as a requirement, e.g. "Reach a 7-day streak". */
  label: string;
}

export interface Unlock {
  level: number;
  coins: number;
  milestone?: Milestone;
}

export type View = 'city' | 'park' | 'skyline' | 'garden' | 'hills' | 'sea' | 'cliffs';

export interface Property {
  id: string;
  name: string;
  blurb: string;
  unlock: Unlock;
  /** What you see through the window. */
  view: View;
  /** Wall and floor the place comes with. */
  wall: string;
  floor: string;
  /** 1–7: bigger windows, higher ceilings, nicer light. */
  tier: number;
}


export interface DecorItem {
  id: string;
  slot: DecorSlot;
  name: string;
  /** How the scene draws it. */
  style: string;
  color?: string;
  unlock: Unlock;
}

export interface Vehicle {
  id: string;
  name: string;
  kind: 'bike' | 'scooter' | 'moto' | 'hatch' | 'coupe' | 'classic' | 'super' | 'racebike';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  blurb: string;
  unlock: Unlock;
  /** Paint it comes in. */
  paint: string;
}

export interface Paint {
  id: string;
  name: string;
  hex: string;
  unlock: Unlock;
}

const free: Unlock = { level: 1, coins: 0 };
const at = (level: number, coins: number, milestone?: Milestone): Unlock => ({ level, coins, milestone });
const streak = (days: number): Milestone => ({ stat: 'longestStreak', target: days, label: `Reach a ${days}-day streak` });
const quests = (n: number): Milestone => ({ stat: 'totalQuestsCompleted', target: n, label: `Finish ${n} quests` });
const goals = (n: number): Milestone => ({ stat: 'goalsCompleted', target: n, label: n === 1 ? 'Finish a long-term goal' : `Finish ${n} long-term goals` });
const perfect = (n: number): Milestone => ({ stat: 'totalPerfectDays', target: n, label: `Have ${n} perfect days` });
const km = (n: number): Milestone => ({ stat: 'kmRun', target: n, label: `Run ${n} km in total` });
const saved = (n: number): Milestone => ({ stat: 'savingsReached', target: n, label: n === 1 ? 'Reach a savings goal' : `Reach ${n} savings goals` });
const focus = (min: number): Milestone => ({ stat: 'focusTotal', target: min, label: `Focus for ${Math.round(min / 60)} hours in total` });

export const PROPERTIES: Property[] = [
  { id: 'room', name: 'Rented room', blurb: 'Small, but it is yours. Everyone starts somewhere.', unlock: free, view: 'city', wall: 'wall-cream', floor: 'floor-oak', tier: 1 },
  { id: 'studio', name: 'Studio apartment', blurb: 'Your own front door and a bigger window.', unlock: at(5, 600), view: 'park', wall: 'wall-sage', floor: 'floor-oak', tier: 2 },
  { id: 'city', name: 'City apartment', blurb: 'High up, with the lights of the city outside.', unlock: at(10, 1500, streak(7)), view: 'skyline', wall: 'wall-stone', floor: 'floor-walnut', tier: 3 },
  { id: 'loft', name: 'Industrial loft', blurb: 'Brick, tall windows and room to think.', unlock: at(18, 3000, quests(250)), view: 'skyline', wall: 'wall-brick', floor: 'floor-concrete', tier: 4 },
  { id: 'house', name: 'Small house', blurb: 'A garden of your own, and quiet mornings.', unlock: at(25, 5000, streak(30)), view: 'garden', wall: 'wall-cream', floor: 'floor-walnut', tier: 5 },
  { id: 'villa', name: 'Modern villa', blurb: 'Glass walls, open hills, pure calm.', unlock: at(40, 9000, goals(3)), view: 'hills', wall: 'wall-white', floor: 'floor-marble', tier: 6 },
  { id: 'mansion', name: 'Seaside mansion', blurb: 'The ocean from every room. You built this.', unlock: at(60, 16000, streak(100)), view: 'sea', wall: 'wall-white', floor: 'floor-marble', tier: 7 },
];

export const DECOR: DecorItem[] = [
  // walls
  { id: 'wall-cream', slot: 'wall', name: 'Cream', style: 'paint', color: '#e9dcc9', unlock: free },
  { id: 'wall-sage', slot: 'wall', name: 'Sage', style: 'paint', color: '#b9c4a7', unlock: free },
  { id: 'wall-stone', slot: 'wall', name: 'Stone grey', style: 'paint', color: '#a9a39b', unlock: free },
  { id: 'wall-white', slot: 'wall', name: 'Gallery white', style: 'paint', color: '#f1eee9', unlock: at(3, 100) },
  { id: 'wall-terracotta', slot: 'wall', name: 'Terracotta', style: 'paint', color: '#c9805d', unlock: at(6, 250) },
  { id: 'wall-midnight', slot: 'wall', name: 'Midnight blue', style: 'paint', color: '#2d3a55', unlock: at(9, 400) },
  { id: 'wall-brick', slot: 'wall', name: 'Red brick', style: 'brick', color: '#9a5a44', unlock: at(14, 800) },
  { id: 'wall-panels', slot: 'wall', name: 'Wood panels', style: 'panels', color: '#8b6446', unlock: at(20, 1500, focus(600)) },
  // floors
  { id: 'floor-oak', slot: 'floor', name: 'Light oak', style: 'planks', color: '#c9a479', unlock: free },
  { id: 'floor-walnut', slot: 'floor', name: 'Walnut', style: 'planks', color: '#7a5236', unlock: at(4, 200) },
  { id: 'floor-concrete', slot: 'floor', name: 'Polished concrete', style: 'flat', color: '#8f8b86', unlock: at(8, 400) },
  { id: 'floor-marble', slot: 'floor', name: 'White marble', style: 'tiles', color: '#e7e3dc', unlock: at(22, 1800, perfect(30)) },
  // wall art
  { id: 'art-none', slot: 'art', name: 'Nothing', style: 'none', unlock: free },
  { id: 'art-poster', slot: 'art', name: 'Mountain poster', style: 'poster', color: '#f08a4b', unlock: free },
  { id: 'art-abstract', slot: 'art', name: 'Abstract canvas', style: 'abstract', color: '#c86b4e', unlock: at(4, 300) },
  { id: 'art-neon', slot: 'art', name: 'Squzo neon sign', style: 'neon', color: '#22d3ee', unlock: at(10, 900, streak(14)) },
  { id: 'art-gold', slot: 'art', name: 'Gold-frame portrait', style: 'gold', color: '#d4a63a', unlock: at(30, 3500, goals(2)) },
  // seating
  { id: 'seat-beanbag', slot: 'seat', name: 'Bean bag', style: 'beanbag', color: '#7c8aa5', unlock: free },
  { id: 'seat-sofa', slot: 'seat', name: 'Linen sofa', style: 'sofa', color: '#cfc3b2', unlock: at(5, 500) },
  { id: 'seat-velvet', slot: 'seat', name: 'Velvet sofa', style: 'sofa', color: '#2f6b5f', unlock: at(12, 1300) },
  { id: 'seat-leather', slot: 'seat', name: 'Leather chesterfield', style: 'chesterfield', color: '#6b3a22', unlock: at(28, 3200, saved(1)) },
  // desk
  { id: 'desk-none', slot: 'desk', name: 'No desk', style: 'none', unlock: free },
  { id: 'desk-simple', slot: 'desk', name: 'Simple desk', style: 'desk', color: '#c9a479', unlock: free },
  { id: 'desk-gaming', slot: 'desk', name: 'Gaming setup', style: 'gaming', color: '#22252c', unlock: at(7, 700) },
  { id: 'desk-studio', slot: 'desk', name: 'Creator studio', style: 'studio', color: '#efe9e1', unlock: at(16, 1800, focus(1200)) },
  { id: 'desk-exec', slot: 'desk', name: 'Executive desk', style: 'exec', color: '#5a3a24', unlock: at(35, 4500, goals(3)) },
  // lamps
  { id: 'lamp-none', slot: 'lamp', name: 'No lamp', style: 'none', unlock: free },
  { id: 'lamp-floor', slot: 'lamp', name: 'Floor lamp', style: 'floor', color: '#e8d9c2', unlock: free },
  { id: 'lamp-arc', slot: 'lamp', name: 'Arc lamp', style: 'arc', color: '#c9a24a', unlock: at(9, 600) },
  { id: 'lamp-neon', slot: 'lamp', name: 'Neon tube', style: 'tube', color: '#f472b6', unlock: at(15, 1100) },
  // plants
  { id: 'plant-none', slot: 'plant', name: 'No plant', style: 'none', unlock: free },
  { id: 'plant-small', slot: 'plant', name: 'Little succulent', style: 'small', unlock: free },
  { id: 'plant-monstera', slot: 'plant', name: 'Monstera', style: 'monstera', unlock: at(6, 350) },
  { id: 'plant-olive', slot: 'plant', name: 'Olive tree', style: 'olive', unlock: at(20, 1600, perfect(14)) },
  // rugs
  { id: 'rug-none', slot: 'rug', name: 'No rug', style: 'none', unlock: free },
  { id: 'rug-round', slot: 'rug', name: 'Round rug', style: 'round', color: '#b98a6a', unlock: free },
  { id: 'rug-stripe', slot: 'rug', name: 'Striped rug', style: 'stripe', color: '#3f5a73', unlock: at(8, 450) },
  { id: 'rug-persian', slot: 'rug', name: 'Persian rug', style: 'persian', color: '#8a2f2f', unlock: at(24, 2200, quests(500)) },
  // shelf: shows your real badges and the books you logged
  { id: 'shelf-none', slot: 'shelf', name: 'No shelf', style: 'none', unlock: free },
  { id: 'shelf-trophy', slot: 'shelf', name: 'Trophy shelf', style: 'trophy', color: '#7a5236', unlock: free },
  { id: 'shelf-glass', slot: 'shelf', name: 'Lit glass cabinet', style: 'glass', color: '#d9e7ee', unlock: at(26, 2600, streak(30)) },
];

export const DECOR_SLOTS: Array<{ id: DecorSlot; label: string; icon: string }> = [
  { id: 'wall', label: 'Walls', icon: '🎨' },
  { id: 'floor', label: 'Floor', icon: '🧱' },
  { id: 'seat', label: 'Seat', icon: '🛋' },
  { id: 'desk', label: 'Desk', icon: '💻' },
  { id: 'art', label: 'Art', icon: '🖼' },
  { id: 'shelf', label: 'Shelf', icon: '🏆' },
  { id: 'lamp', label: 'Lamp', icon: '🕯' },
  { id: 'plant', label: 'Plant', icon: '🪴' },
  { id: 'rug', label: 'Rug', icon: '🟫' },
];

export const DEFAULT_DECOR: Record<DecorSlot, string> = {
  wall: 'wall-cream',
  floor: 'floor-oak',
  art: 'art-poster',
  seat: 'seat-beanbag',
  desk: 'desk-simple',
  lamp: 'lamp-floor',
  plant: 'plant-small',
  rug: 'rug-round',
  shelf: 'shelf-trophy',
};

export const VEHICLES: Vehicle[] = [
  { id: 'v-bike', name: 'City bike', kind: 'bike', rarity: 'common', blurb: 'Free, healthy, and always parks right outside.', unlock: free, paint: 'p-mint' },
  { id: 'v-scooter', name: 'E-scooter', kind: 'scooter', rarity: 'common', blurb: 'Zip through the city in silence.', unlock: at(4, 400), paint: 'p-white' },
  { id: 'v-racebike', name: 'Carbon race bike', kind: 'racebike', rarity: 'rare', blurb: 'Earned with your own legs.', unlock: at(8, 1000, km(100)), paint: 'p-flame' },
  { id: 'v-moto', name: 'Street motorbike', kind: 'moto', rarity: 'rare', blurb: 'Two wheels, a lot of fun.', unlock: at(12, 1800, streak(14)), paint: 'p-black' },
  { id: 'v-hatch', name: 'City hatchback', kind: 'hatch', rarity: 'rare', blurb: 'Your first car. Paid with a savings goal you reached.', unlock: at(18, 3500, saved(1)), paint: 'p-sky' },
  { id: 'v-coupe', name: 'Sports coupe', kind: 'coupe', rarity: 'epic', blurb: 'Low, fast and gleaming.', unlock: at(30, 7000, streak(30)), paint: 'p-red' },
  { id: 'v-classic', name: 'Classic convertible', kind: 'classic', rarity: 'epic', blurb: 'Chrome, curves and summer drives.', unlock: at(45, 10000, goals(5)), paint: 'p-cream' },
  { id: 'v-super', name: 'Apex supercar', kind: 'super', rarity: 'legendary', blurb: 'For people who never gave up.', unlock: at(60, 18000, streak(100)), paint: 'p-gold' },
];

export const PAINTS: Paint[] = [
  { id: 'p-mint', name: 'Mint', hex: '#5fd3a8', unlock: free },
  { id: 'p-white', name: 'Pearl white', hex: '#f1eee9', unlock: free },
  { id: 'p-black', name: 'Gloss black', hex: '#1d1e22', unlock: free },
  { id: 'p-sky', name: 'Sky blue', hex: '#5aa9e6', unlock: free },
  { id: 'p-red', name: 'Racing red', hex: '#d7263d', unlock: at(6, 300) },
  { id: 'p-flame', name: 'Flame orange', hex: '#ff7a2e', unlock: at(10, 500) },
  { id: 'p-cream', name: 'Vintage cream', hex: '#efe3c8', unlock: at(14, 700) },
  { id: 'p-teal', name: 'Squzo teal', hex: '#22d3ee', unlock: at(20, 1200, streak(21)) },
  { id: 'p-violet', name: 'Midnight violet', hex: '#5b3fd6', unlock: at(25, 1500) },
  { id: 'p-gold', name: 'Liquid gold', hex: '#d4a63a', unlock: at(40, 4000, perfect(50)) },
];

/** Extra garage spots: you can own one vehicle per spot. */
export const GARAGE_SPOTS: Array<{ id: string; unlock: Unlock }> = [
  { id: 'g-spot-3', unlock: at(10, 900) },
  { id: 'g-spot-4', unlock: at(22, 2500) },
  { id: 'g-spot-5', unlock: at(38, 6000, quests(750)) },
];

export const RARITY_COLOR: Record<Vehicle['rarity'], string> = {
  common: '#a59a8f',
  rare: '#5aa9e6',
  epic: '#a78bfa',
  legendary: '#f0b93a',
};

/* ---------------------------------------------------------------- state helpers */

export const DEFAULT_WORLD: WorldState = { property: 'room', decor: {}, paid: {} };

export function worldOf(state: AppState): WorldState {
  return state.world ?? DEFAULT_WORLD;
}

export function unlockOf(id: string): Unlock | undefined {
  return (
    PROPERTIES.find((p) => p.id === id)?.unlock ??
    DECOR.find((d) => d.id === id)?.unlock ??
    VEHICLES.find((v) => v.id === id)?.unlock ??
    PAINTS.find((p) => p.id === id)?.unlock ??
    GARAGE_SPOTS.find((g) => g.id === id)?.unlock
  );
}

/** Free things are owned from the start; everything else once paid for. */
export function owns(world: WorldState, id: string): boolean {
  const u = unlockOf(id);
  if (!u) return false;
  return (u.coins === 0 && u.level <= 1 && !u.milestone) || id in world.paid;
}

export type Gate = { ok: true } | { ok: false; reason: 'level' | 'milestone' | 'coins' | 'space'; text: string };

/** Can this be bought right now? Level and milestone first, then coins. */
export function canUnlock(unlock: Unlock, stats: DerivedStats): Gate {
  if (stats.level < unlock.level) return { ok: false, reason: 'level', text: `Reach level ${unlock.level}` };
  if (unlock.milestone && stats[unlock.milestone.stat] < unlock.milestone.target) {
    return { ok: false, reason: 'milestone', text: unlock.milestone.label };
  }
  if (stats.availableShards < unlock.coins) return { ok: false, reason: 'coins', text: `${unlock.coins - stats.availableShards} more coins` };
  return { ok: true };
}

export function worldSpent(state: AppState): number {
  return Object.values(state.world?.paid ?? {}).reduce((a, n) => a + (Number.isFinite(n) ? n : 0), 0);
}

export function garageSpots(world: WorldState): number {
  // Two spots to start (the free bike takes one), more as you build.
  return 2 + GARAGE_SPOTS.filter((g) => g.id in world.paid).length;
}

export function ownedVehicles(world: WorldState): Vehicle[] {
  return VEHICLES.filter((v) => owns(world, v.id));
}

export function decorFor(world: WorldState, slot: DecorSlot): DecorItem {
  const property = PROPERTIES.find((p) => p.id === world.property) ?? PROPERTIES[0];
  const fallback = slot === 'wall' ? property.wall : slot === 'floor' ? property.floor : DEFAULT_DECOR[slot];
  const id = world.decor[slot] ?? fallback;
  return DECOR.find((d) => d.id === id && d.slot === slot) ?? DECOR.find((d) => d.id === DEFAULT_DECOR[slot])!;
}

/** Owning a home means you can always use its own wall and floor. */
export function ownsDecor(world: WorldState, item: DecorItem): boolean {
  if (owns(world, item.id)) return true;
  return PROPERTIES.some((p) => (p.wall === item.id || p.floor === item.id) && owns(world, p.id));
}
