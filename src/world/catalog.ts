import type { AppState, CarMods, DecorSlot, DerivedStats, NumericStat, WorldState } from '../lib/types';
import { LEGACY_BODIES, carCollection, type CarModel } from './cars/spec';

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
  /** Can't be bought: only drops from reward chests. */
  chest?: boolean;
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
  /** Which drawing (src/world/room/*): each model has its own shape, not just a colour. */
  model: string;
  /** Main material colour. */
  color?: string;
  /** Accent: legs, stitching, LEDs, trim. */
  accent?: string;
  unlock: Unlock;
  /** One line for the shop card. */
  blurb?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  kind: 'bike' | 'scooter' | 'moto' | 'hatch' | 'coupe' | 'classic' | 'super' | 'racebike' | 'car';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  blurb: string;
  unlock: Unlock;
  /** Paint it comes in: a paint id, or a factory colour (hex) for collection cars. */
  paint: string;
  /** Cars: the body plan and numbers the car designer draws from (src/world/cars). */
  car?: Pick<CarModel, 'maker' | 'model' | 'cls' | 'body' | 'hp' | 'zeroTo100' | 'top'>;
}

export interface Paint {
  id: string;
  name: string;
  hex: string;
  unlock: Unlock;
}

const free: Unlock = { level: 1, coins: 0 };
/** Chest-only: a rare drop from reward chests, never in the shop. */
const chest: Unlock = { level: 1, coins: 0, chest: true };
const at = (level: number, coins: number, milestone?: Milestone): Unlock => ({ level, coins, milestone });
const streak = (days: number): Milestone => ({ stat: 'longestStreak', target: days, label: `Reach a ${days}-day streak` });
const quests = (n: number): Milestone => ({ stat: 'totalQuestsCompleted', target: n, label: `Finish ${n} quests` });
const goals = (n: number): Milestone => ({ stat: 'goalsCompleted', target: n, label: n === 1 ? 'Finish a long-term goal' : `Finish ${n} long-term goals` });
const perfect = (n: number): Milestone => ({ stat: 'totalPerfectDays', target: n, label: `Have ${n} perfect days` });
const km = (n: number): Milestone => ({ stat: 'kmRun', target: n, label: `Run ${n} km in total` });
const saved = (n: number): Milestone => ({ stat: 'savingsReached', target: n, label: n === 1 ? 'Reach a savings goal' : `Reach ${n} savings goals` });
const focus = (min: number): Milestone => ({ stat: 'focusTotal', target: min, label: `Focus for ${Math.round(min / 60)} hours in total` });

export const PROPERTIES: Property[] = [
  { id: 'room', name: 'The Launchpad', blurb: 'A small rented room in Old Town. Everyone starts somewhere.', unlock: free, view: 'city', wall: 'wall-cream', floor: 'floor-oak', tier: 1 },
  { id: 'studio', name: 'Parkside Studio', blurb: 'Your own front door, with the park right outside.', unlock: at(5, 600), view: 'park', wall: 'wall-sage', floor: 'floor-oak', tier: 2 },
  { id: 'city', name: 'Skyline Apartment', blurb: 'Twelve floors up. At night the city lights are yours.', unlock: at(10, 1500, streak(7)), view: 'skyline', wall: 'wall-stone', floor: 'floor-walnut', tier: 3 },
  { id: 'loft', name: 'Brickworks Loft', blurb: 'Old factory brick, tall windows and room to think.', unlock: at(18, 3000, quests(250)), view: 'skyline', wall: 'wall-brick', floor: 'floor-concrete', tier: 4 },
  { id: 'house', name: 'Willow Lane House', blurb: 'A garden of your own, and quiet mornings.', unlock: at(25, 5000, streak(30)), view: 'garden', wall: 'wall-cream', floor: 'floor-walnut', tier: 5 },
  { id: 'villa', name: 'Hillcrest Villa', blurb: 'Glass walls, open hills, pure calm.', unlock: at(40, 9000, goals(3)), view: 'hills', wall: 'wall-white', floor: 'floor-marble', tier: 6 },
  { id: 'mansion', name: 'Seacliff Estate', blurb: 'The ocean from every room. You built this.', unlock: at(60, 16000, streak(100)), view: 'sea', wall: 'wall-white', floor: 'floor-marble', tier: 7 },
];

const d = (id: string, slot: DecorSlot, name: string, model: string, color: string | undefined, unlock: Unlock, accent?: string, blurb?: string): DecorItem => ({ id, slot, name, model, color, accent, unlock, blurb });

/**
 * Every item has its own model (shape). Colour variants exist only where the same object really comes
 * in different finishes, and there are never more of those than different models in a category.
 * Old ids from before 2026-11-14 are kept (people own them), they now point at proper models.
 */
export const DECOR: DecorItem[] = [
  // walls
  d('wall-cream', 'wall', 'Cream', 'paint', '#e9dcc9', free),
  d('wall-sage', 'wall', 'Sage', 'paint', '#b9c4a7', free),
  d('wall-stone', 'wall', 'Stone grey', 'paint', '#a9a39b', free),
  d('wall-white', 'wall', 'Gallery white', 'paint', '#f1eee9', at(3, 100)),
  d('wall-ocean', 'wall', 'Squzo blue', 'paint', '#7fa6c4', at(5, 300)),
  d('wall-terracotta', 'wall', 'Terracotta', 'paint', '#c9805d', at(6, 250)),
  d('wall-blush', 'wall', 'Blush pink', 'paint', '#e2b3ad', at(7, 350)),
  d('wall-midnight', 'wall', 'Midnight blue', 'paint', '#2d3a55', at(9, 400)),
  d('wall-forest', 'wall', 'Forest green', 'paint', '#3f5e4a', at(11, 600)),
  d('wall-brick', 'wall', 'Red brick', 'brick', '#9a5a44', at(14, 800)),
  d('wall-concrete', 'wall', 'Raw concrete', 'concrete', '#9a9a96', at(16, 1100)),
  d('wall-panels', 'wall', 'Wood panels', 'panels', '#8b6446', at(20, 1500, focus(600))),
  d('wall-acoustic', 'wall', 'Studio foam panels', 'acoustic', '#2b2f38', at(18, 1400)),
  d('wall-night', 'wall', 'Night navy', 'paint', '#16213e', chest),
  d('wall-whitebrick', 'wall', 'White brick', 'brick', '#d9d4cc', chest),
  // floors
  d('floor-oak', 'floor', 'Light oak', 'planks', '#c9a479', free),
  d('floor-walnut', 'floor', 'Walnut', 'planks', '#7a5236', at(4, 200)),
  d('floor-ash', 'floor', 'Grey ash', 'planks', '#a39b92', at(6, 300)),
  d('floor-concrete', 'floor', 'Polished concrete', 'flat', '#8f8b86', at(8, 400)),
  d('floor-herring', 'floor', 'Herringbone oak', 'herring', '#b88b5e', at(12, 900)),
  d('floor-cherry', 'floor', 'Cherry wood', 'planks', '#8e3f2c', at(13, 750)),
  d('floor-carpet', 'floor', 'Soft grey carpet', 'carpet', '#7d8189', at(9, 500)),
  d('floor-blacktile', 'floor', 'Black tiles', 'tiles', '#2c2f36', chest),
  d('floor-marble', 'floor', 'White marble', 'tiles', '#e7e3dc', at(22, 1800, perfect(30))),
  // window
  d('win-plain', 'window', 'Bare window', 'plain', undefined, free),
  d('win-curtains', 'window', 'Linen curtains', 'curtains', '#d8cbb6', at(3, 150)),
  d('win-curtains-navy', 'window', 'Navy curtains', 'curtains', '#2c3e66', at(7, 300)),
  d('win-blinds', 'window', 'Wooden blinds', 'blinds', '#b98d5f', at(6, 280)),
  d('win-sheer', 'window', 'Sheer drapes', 'sheer', '#ffffff', at(10, 450)),
  d('win-velvet', 'window', 'Velvet drapes', 'velvet', '#6b1f2e', at(24, 2000, streak(21)), '#d4a63a'),
  // ceiling light
  d('light-bulb', 'light', 'Bare bulb', 'bulb', undefined, free),
  d('light-pendant', 'light', 'Dome pendant', 'pendant', '#2f3a3a', at(5, 300)),
  d('light-fairy', 'light', 'Fairy lights', 'fairy', '#ffd27a', at(7, 380)),
  d('light-led', 'light', 'LED strip (warm)', 'led', '#ffb36b', at(9, 550)),
  d('light-led-blue', 'light', 'LED strip (ice)', 'led', '#7cc7ff', chest),
  d('light-track', 'light', 'Track spotlights', 'track', '#1f2228', at(15, 1100)),
  d('light-chandelier', 'light', 'Crystal chandelier', 'chandelier', '#d4a63a', at(32, 4200, goals(2))),
  // posters (above the bed)
  d('poster-none', 'poster', 'Nothing', 'none', undefined, free),
  d('poster-mountain', 'poster', 'Mountain print', 'mountain', '#f08a4b', free),
  d('poster-quote', 'poster', '"You vs. you" poster', 'quote', '#2563eb', at(2, 80)),
  d('poster-space', 'poster', 'Space mission poster', 'space', undefined, at(4, 220)),
  d('poster-game', 'poster', 'Pixel hero poster', 'game', undefined, at(5, 260)),
  d('poster-city', 'poster', 'City at night print', 'city', '#4c5a8a', at(7, 380)),
  d('poster-car', 'poster', 'Supercar poster', 'car', undefined, at(9, 500)),
  d('poster-vinyl', 'poster', 'Framed vinyl', 'vinyl', undefined, at(12, 800)),
  d('poster-trio', 'poster', 'Gallery trio', 'trio', '#c86b4e', at(16, 1200)),
  // wall art (between window and desk)
  d('art-none', 'art', 'Nothing', 'none', undefined, free),
  d('art-poster', 'art', 'Mountain poster', 'poster', '#f08a4b', free),
  d('art-wave', 'art', 'Ocean print', 'poster', '#3b82f6', at(6, 400)),
  d('art-abstract', 'art', 'Abstract canvas', 'abstract', '#c86b4e', at(4, 300)),
  d('art-sunset', 'art', 'Sunset canvas', 'abstract', '#e0703c', at(12, 900)),
  d('art-clock', 'art', 'Wall clock', 'clock', '#1f2937', at(5, 320)),
  d('art-map', 'art', 'World map', 'map', '#4a7c6a', at(8, 520)),
  d('art-guitar', 'art', 'Wall-mounted guitar', 'guitar', '#b91c1c', at(14, 1100)),
  d('art-neon', 'art', 'Squzo neon sign', 'neon', '#7cc7ff', at(10, 900, streak(14))),
  d('art-neon-pink', 'art', 'Pink neon sign', 'neon', '#f9a8d4', chest),
  d('art-neon-lime', 'art', 'Lime neon sign', 'neon', '#bef264', chest),
  d('art-gold', 'art', 'Gold-frame portrait', 'gold', '#d4a63a', at(30, 3500, goals(2))),
  // shelf above the desk
  d('shelf-none', 'shelf', 'No shelf', 'none', undefined, free),
  d('shelf-trophy', 'shelf', 'Trophy shelf', 'trophy', '#7a5236', free),
  d('shelf-dark', 'shelf', 'Dark oak shelf', 'trophy', '#3b2a1d', at(8, 500)),
  d('shelf-floating', 'shelf', 'Floating shelves', 'floating', '#c9a479', at(6, 400)),
  d('shelf-pegboard', 'shelf', 'Creator pegboard', 'pegboard', '#e7dccb', at(11, 750)),
  d('shelf-sneakers', 'shelf', 'Sneaker wall', 'sneakers', '#e5e7eb', at(17, 1500)),
  d('shelf-glass', 'shelf', 'Lit glass cabinet', 'glass', '#d9e7ee', at(26, 2600, streak(30))),
  d('shelf-glass-gold', 'shelf', 'Golden glass cabinet', 'glass', '#d4a63a', chest),
  // bed
  d('bed-mattress', 'bed', 'Floor mattress', 'mattress', '#8fa3c0', free, undefined, 'Everyone starts somewhere.'),
  d('bed-single', 'bed', 'Metal single bed', 'single', '#5b7fa8', at(3, 250)),
  d('bed-platform', 'bed', 'Oak platform bed', 'platform', '#d6c3a5', at(6, 600), '#b88b5e'),
  d('bed-bunk', 'bed', 'Bunk bed', 'bunk', '#c0443c', at(8, 700), '#8b6446'),
  d('bed-captain', 'bed', 'Storage bed', 'captain', '#6f8f7a', at(11, 1100), '#e8e2d8'),
  d('bed-platform-dark', 'bed', 'Walnut platform bed', 'platform', '#3d4a5c', at(14, 1400), '#5a3a24'),
  d('bed-canopy', 'bed', 'Canopy bed', 'canopy', '#c9b8a6', at(22, 2600, perfect(14)), '#3b2a1d'),
  d('bed-royal', 'bed', 'Tufted king bed', 'royal', '#3f4a6b', at(34, 4800, streak(60)), '#2a2a2e'),
  d('bed-royal-ivory', 'bed', 'Ivory king bed', 'royal', '#e8e0d2', chest, '#d4a63a'),
  // floor lamp
  d('lamp-none', 'lamp', 'No lamp', 'none', undefined, free),
  d('lamp-floor', 'lamp', 'Floor lamp', 'floor', '#e8d9c2', free),
  d('lamp-lantern', 'lamp', 'Paper lantern', 'lantern', undefined, at(4, 220)),
  d('lamp-tripod', 'lamp', 'Tripod lamp', 'tripod', '#8b6446', at(7, 450)),
  d('lamp-mushroom', 'lamp', 'Mushroom lamp', 'mushroom', '#e07a3c', at(8, 520)),
  d('lamp-arc', 'lamp', 'Brass arc lamp', 'arc', '#c9a24a', at(9, 600)),
  d('lamp-arc-black', 'lamp', 'Black arc lamp', 'arc', '#2a2a2e', at(12, 800)),
  d('lamp-neon', 'lamp', 'Light tube (rose)', 'tube', '#f9a8d4', at(15, 1100)),
  d('lamp-neon-blue', 'lamp', 'Light tube (ice)', 'tube', '#7cc7ff', chest),
  // seating
  d('seat-beanbag', 'seat', 'Bean bag', 'beanbag', '#7c8aa5', free),
  d('seat-beanbag-red', 'seat', 'Red bean bag', 'beanbag', '#c0443c', at(3, 150)),
  d('seat-sofa', 'seat', 'Linen sofa', 'sofa', '#cfc3b2', at(5, 500), '#5a3a24'),
  d('seat-navy', 'seat', 'Navy sofa', 'sofa', '#2c3e66', at(9, 900), '#2a2a2e'),
  d('seat-velvet', 'seat', 'Mid-century loveseat', 'loveseat', '#2f6b5f', at(12, 1300), '#c9a24a'),
  d('seat-gamer', 'seat', 'Gaming sofa', 'gamer', '#23252b', at(14, 1600), '#7cc7ff'),
  d('seat-sectional', 'seat', 'Corner sectional', 'sectional', '#8d8f94', at(18, 2200)),
  d('seat-cloud', 'seat', 'Cloud sofa', 'cloud', '#ebe5db', at(24, 3000, perfect(20))),
  d('seat-royal', 'seat', 'Royal velvet cloud', 'cloud', '#5b3fd6', chest),
  d('seat-leather', 'seat', 'Leather chesterfield', 'chesterfield', '#6b3a22', at(28, 3200, saved(1)), '#c9a24a'),
  d('seat-white-leather', 'seat', 'White chesterfield', 'chesterfield', '#ece7df', chest, '#c9a24a'),
  // coffee table
  d('table-none', 'table', 'No table', 'none', undefined, free),
  d('table-crate', 'table', 'Wooden crate', 'crate', '#b88b5e', free),
  d('table-round', 'table', 'Round coffee table', 'round', '#a0714a', at(6, 350)),
  d('table-glass', 'table', 'Glass coffee table', 'glass', '#bcd7e6', at(10, 700)),
  d('table-slab', 'table', 'Live-edge slab', 'slab', '#8b5a34', at(16, 1300)),
  d('table-marble', 'table', 'Marble drum table', 'marble', '#efebe5', at(26, 2800, quests(400))),
  // desk
  d('desk-none', 'desk', 'No desk', 'none', undefined, free),
  d('desk-simple', 'desk', 'Simple desk', 'simple', '#c9a479', free),
  d('desk-trestle', 'desk', 'Trestle desk', 'trestle', '#d8c3a2', at(4, 300), '#2d2f35'),
  d('desk-gaming', 'desk', 'Gaming desk', 'gaming', '#22252c', at(7, 700), '#7cc7ff'),
  d('desk-gaming-white', 'desk', 'White gaming desk', 'gaming', '#e5e7eb', chest, '#f9a8d4'),
  d('desk-standing', 'desk', 'Standing desk', 'standing', '#efe9e1', at(10, 1000)),
  d('desk-lshape', 'desk', 'L-shaped corner desk', 'lshape', '#3b3f47', at(13, 1300), '#c9a479'),
  d('desk-studio', 'desk', 'Creator studio desk', 'studio', '#efe9e1', at(16, 1800, focus(1200))),
  d('desk-glass', 'desk', 'Glass desk', 'glass', '#bcd7e6', at(20, 2200)),
  d('desk-exec', 'desk', 'Executive desk', 'exec', '#5a3a24', at(35, 4500, goals(3)), '#d4a63a'),
  // computer setup
  d('tech-none', 'tech', 'Nothing', 'none', undefined, free),
  d('tech-laptop', 'tech', 'Laptop + coffee', 'laptop', '#b8bec8', free),
  d('tech-single', 'tech', 'Monitor + PC tower', 'single', '#1f2228', at(5, 450), '#7cc7ff'),
  d('tech-retro', 'tech', 'Retro TV + console', 'retro', '#d8d1c4', at(8, 700)),
  d('tech-dual', 'tech', 'Dual monitors', 'dual', '#1f2228', at(11, 1200), '#a78bfa'),
  d('tech-ultrawide', 'tech', 'Curved ultrawide', 'ultrawide', '#1f2228', at(15, 1900), '#7cc7ff'),
  d('tech-streamer', 'tech', 'Streamer setup', 'streamer', '#1f2228', at(19, 2600, focus(900)), '#f9a8d4'),
  d('tech-triple', 'tech', 'Triple-screen rig', 'triple', '#1f2228', at(27, 3800), '#86efac'),
  // chair
  d('chair-stool', 'chair', 'Wooden stool', 'stool', '#b88b5e', free),
  d('chair-office', 'chair', 'Office chair', 'office', '#3c4250', at(3, 200)),
  d('chair-windsor', 'chair', 'Library chair', 'windsor', '#8b5a34', at(6, 420)),
  d('chair-racer', 'chair', 'Racing gaming chair', 'racer', '#c0262d', at(8, 800), '#f5f5f5'),
  d('chair-racer-blue', 'chair', 'Racing chair (blue)', 'racer', '#1f4fa3', at(10, 950), '#e5e7eb'),
  d('chair-ergo', 'chair', 'Ergonomic pro chair', 'ergo', '#3a3d45', at(13, 1300), '#7cc7ff'),
  d('chair-egg', 'chair', 'Egg pod chair', 'egg', '#e8e2d8', at(17, 1700), '#2a2a2e'),
  d('chair-throne', 'chair', 'Gaming throne', 'throne', '#24262c', at(23, 2600, streak(30)), '#d4a63a'),
  d('chair-throne-white', 'chair', 'White gaming throne', 'throne', '#ece9e3', chest, '#7cc7ff'),
  // plants
  d('plant-none', 'plant', 'No plant', 'none', undefined, free),
  d('plant-small', 'plant', 'Little succulent', 'small', undefined, free),
  d('plant-cactus', 'plant', 'Flowering cactus', 'cactus', undefined, at(3, 140)),
  d('plant-snake', 'plant', 'Snake plant', 'snake', undefined, at(5, 260)),
  d('plant-monstera', 'plant', 'Monstera', 'monstera', undefined, at(6, 350)),
  d('plant-bonsai', 'plant', 'Bonsai on a stand', 'bonsai', undefined, at(12, 900)),
  d('plant-fiddle', 'plant', 'Fiddle-leaf fig', 'fiddle', undefined, at(15, 1200)),
  d('plant-olive', 'plant', 'Olive tree', 'olive', undefined, at(20, 1600, perfect(14))),
  // rugs
  d('rug-none', 'rug', 'No rug', 'none', undefined, free),
  d('rug-round', 'rug', 'Round rug', 'round', '#b98a6a', free),
  d('rug-round-blue', 'rug', 'Blue round rug', 'round', '#4a77a8', at(5, 250)),
  d('rug-stripe', 'rug', 'Striped rug', 'stripe', '#3f5a73', at(8, 450)),
  d('rug-stripe-red', 'rug', 'Red striped rug', 'stripe', '#9b3b3b', at(10, 550)),
  d('rug-checker', 'rug', 'Checkerboard rug', 'checker', '#d9a066', at(9, 520)),
  d('rug-gamer', 'rug', 'Gamer rug', 'gamer', '#7cc7ff', at(11, 700)),
  d('rug-shag', 'rug', 'Shaggy cloud rug', 'shag', '#e8e2d8', at(14, 1000)),
  d('rug-persian', 'rug', 'Persian rug', 'persian', '#8a2f2f', at(24, 2200, quests(500))),
  d('rug-persian-navy', 'rug', 'Navy Persian rug', 'persian', '#23395d', chest),
  // collectibles (right corner)
  d('col-none', 'collectible', 'Nothing', 'none', undefined, free),
  d('col-guitar', 'collectible', 'Acoustic guitar', 'guitar', '#c98a4b', at(6, 500)),
  d('col-telescope', 'collectible', 'Telescope', 'telescope', '#e5e7eb', at(9, 800)),
  d('col-turntable', 'collectible', 'Record player', 'turntable', '#8b5a34', at(11, 1100)),
  d('col-cat', 'collectible', 'Cat tree (with cat)', 'cat', '#e39a4f', at(13, 1300, streak(10))),
  d('col-aquarium', 'collectible', 'Aquarium', 'aquarium', undefined, at(17, 1900)),
  d('col-kicks', 'collectible', 'Sneaker tower', 'kicks', '#f97316', at(21, 2500)),
  d('col-arcade', 'collectible', 'Arcade cabinet', 'arcade', '#1e3a8a', at(26, 3400, quests(300))),
  d('col-plinth', 'collectible', 'Champion trophy', 'plinth', '#d4a63a', at(40, 6000, goals(5))),
  d('col-cat-black', 'collectible', 'Cat tree (black cat)', 'cat', '#2b2b30', chest),
];

/** Spots in the room: label, icon and where it is (room coordinates, for tap targets and the camera). */
export const DECOR_SLOTS: Array<{ id: DecorSlot; label: string; icon: string; rect: [number, number, number, number] }> = [
  { id: 'bed', label: 'Bed', icon: '🛏', rect: [30, 250, 310, 215] },
  { id: 'seat', label: 'Sofa', icon: '🛋', rect: [400, 320, 340, 150] },
  { id: 'chair', label: 'Chair', icon: '🪑', rect: [915, 230, 170, 285] },
  { id: 'desk', label: 'Desk', icon: '🗄', rect: [860, 330, 260, 130] },
  { id: 'tech', label: 'Setup', icon: '💻', rect: [880, 240, 220, 110] },
  { id: 'poster', label: 'Poster', icon: '🖼', rect: [100, 100, 180, 170] },
  { id: 'art', label: 'Wall art', icon: '🎨', rect: [736, 92, 112, 160] },
  { id: 'shelf', label: 'Shelf', icon: '🏆', rect: [880, 92, 220, 120] },
  { id: 'collectible', label: 'Collectible', icon: '🎸', rect: [1105, 270, 95, 195] },
  { id: 'lamp', label: 'Lamp', icon: '🕯', rect: [340, 240, 72, 210] },
  { id: 'plant', label: 'Plant', icon: '🪴', rect: [722, 240, 86, 220] },
  { id: 'table', label: 'Table', icon: '☕', rect: [490, 440, 160, 75] },
  { id: 'rug', label: 'Rug', icon: '🟫', rect: [400, 460, 400, 85] },
  { id: 'window', label: 'Window', icon: '🪟', rect: [400, 40, 340, 270] },
  { id: 'light', label: 'Lights', icon: '💡', rect: [300, 20, 600, 120] },
  { id: 'wall', label: 'Walls', icon: '🎨', rect: [0, 0, 1200, 400] },
  { id: 'floor', label: 'Floor', icon: '🧱', rect: [0, 400, 1200, 160] },
];

export const DEFAULT_DECOR: Record<DecorSlot, string> = {
  wall: 'wall-cream',
  floor: 'floor-oak',
  window: 'win-plain',
  light: 'light-bulb',
  poster: 'poster-mountain',
  art: 'art-none',
  shelf: 'shelf-trophy',
  bed: 'bed-mattress',
  lamp: 'lamp-floor',
  seat: 'seat-beanbag',
  table: 'table-crate',
  rug: 'rug-round',
  plant: 'plant-small',
  desk: 'desk-simple',
  tech: 'tech-laptop',
  chair: 'chair-stool',
  collectible: 'col-none',
};

const LEGACY: Vehicle[] = [
  { id: 'v-bike', name: 'City bike', kind: 'bike', rarity: 'common', blurb: 'Free, healthy, and always parks right outside.', unlock: free, paint: 'p-mint' },
  { id: 'v-scooter', name: 'E-scooter', kind: 'scooter', rarity: 'common', blurb: 'Zip through the city in silence.', unlock: at(4, 400), paint: 'p-white' },
  { id: 'v-racebike', name: 'Carbon race bike', kind: 'racebike', rarity: 'rare', blurb: 'Earned with your own legs.', unlock: at(8, 1000, km(100)), paint: 'p-flame' },
  { id: 'v-moto', name: 'Street motorbike', kind: 'moto', rarity: 'rare', blurb: 'Two wheels, a lot of fun.', unlock: at(12, 1800, streak(14)), paint: 'p-black' },
  { id: 'v-hatch', name: 'City hatchback', kind: 'hatch', rarity: 'rare', blurb: 'Your first car. Paid with a savings goal you reached.', unlock: at(18, 3500, saved(1)), paint: 'p-sky' },
  { id: 'v-coupe', name: 'Sports coupe', kind: 'coupe', rarity: 'epic', blurb: 'Low, fast and gleaming.', unlock: at(30, 7000, streak(30)), paint: 'p-red' },
  { id: 'v-classic', name: 'Classic convertible', kind: 'classic', rarity: 'epic', blurb: 'Chrome, curves and summer drives.', unlock: at(45, 10000, goals(5)), paint: 'p-cream' },
  { id: 'v-nightrider', name: 'Night rider', kind: 'moto', rarity: 'epic', blurb: 'A chest-only motorbike in deep galaxy purple.', unlock: chest, paint: 'p-galaxy' },
  { id: 'v-retro', name: 'Retro roadster', kind: 'classic', rarity: 'legendary', blurb: 'A legendary chest drop. Turn heads everywhere.', unlock: chest, paint: 'p-chrome' },
  { id: 'v-super', name: 'Apex supercar', kind: 'super', rarity: 'legendary', blurb: 'For people who never gave up.', unlock: at(60, 18000, streak(100)), paint: 'p-gold' },
];

/** How far up the ladder each kind of car sits (0 = first car, 6 = hypercar). */
const CLASS_TIER: Record<CarModel['cls'], number> = { hatch: 0, ev: 1, wagon: 1, sedan: 1, classic: 2, pickup: 2, suv: 2, offroad: 2, rally: 3, muscle: 3, sports: 3, luxury: 3, gt: 4, super: 5, hyper: 6 };
const TIER_MILESTONE: Array<Milestone | undefined> = [undefined, undefined, streak(7), quests(150), streak(21), streak(45), streak(90)];

function carVehicles(): Vehicle[] {
  const cars = carCollection();
  // Rank each car inside its class by power, so the strongest of a class costs the most.
  const byClass = new Map<string, CarModel[]>();
  for (const c of cars) byClass.set(c.cls, [...(byClass.get(c.cls) ?? []), c]);
  for (const list of byClass.values()) list.sort((a, b) => a.hp - b.hp);
  return cars.map((c, i) => {
    const list = byClass.get(c.cls)!;
    const f = list.length > 1 ? list.indexOf(c) / (list.length - 1) : 0;
    const tier = CLASS_TIER[c.cls];
    // Every 15th car is a chest-only exclusive: a reason to keep opening chests.
    const isChest = i % 15 === 7;
    const level = Math.min(80, 6 + tier * 9 + Math.round(f * 7));
    const coins = Math.round((1400 * Math.pow(1.55, tier) * (1 + f * 0.9)) / 50) * 50;
    const rarity: Vehicle['rarity'] = isChest ? (tier >= 4 ? 'legendary' : 'epic') : tier >= 5 || (tier === 4 && f > 0.6) ? 'legendary' : tier >= 3 ? 'epic' : tier >= 1 ? 'rare' : 'common';
    const milestone = f > 0.7 || tier >= 5 ? TIER_MILESTONE[tier] : undefined;
    return {
      id: c.id,
      name: `${c.maker} ${c.model}`,
      kind: 'car',
      rarity,
      blurb: `${c.hp} hp · 0–100 in ${c.zeroTo100}s · ${c.top} km/h`,
      unlock: isChest ? chest : at(level, coins, milestone),
      paint: c.paint,
      car: c,
    };
  });
}

let vehicleCache: Vehicle[] | null = null;
function allVehicles(): Vehicle[] {
  if (vehicleCache) return vehicleCache;
  const legacy = LEGACY.map((v) => {
    const l = LEGACY_BODIES[v.id];
    return l ? { ...v, car: { maker: 'Squzo', model: v.name, cls: l.cls, body: l.body, hp: 0, zeroTo100: 0, top: 0 } } : v;
  });
  vehicleCache = [...legacy, ...carVehicles()];
  return vehicleCache;
}

/** Bikes, the five original cars and the 300-car collection. Ids never change, so saves keep working. */
export const VEHICLES: Vehicle[] = allVehicles();
export const isCar = (v: Vehicle) => !!v.car;

/* ---------------------------------------------------------------- car parts */

export interface Part {
  id: string;
  kind: keyof CarMods;
  /** Value passed to the car designer (rim style, spoiler, kit, stance). */
  value: string;
  name: string;
  unlock: Unlock;
}

const part = (kind: keyof CarMods, value: string, name: string, unlock: Unlock): Part => ({ id: `part-${kind}-${value}`, kind, value, name, unlock });

/** Swap-on parts. A car's own factory parts are always free for that car. */
export const PARTS: Part[] = [
  part('rim', 'five', 'Five spoke', free),
  part('rim', 'split', 'Split spoke', at(6, 250)),
  part('rim', 'multi', 'Multi spoke', at(9, 400)),
  part('rim', 'mesh', 'Mesh', at(12, 600)),
  part('rim', 'dish', 'Deep dish', at(14, 700)),
  part('rim', 'hubcap', 'Steel + hubcap', free),
  part('rim', 'offroad', 'Trail', at(10, 450)),
  part('rim', 'beadlock', 'Beadlock', at(20, 1100, km(50))),
  part('rim', 'wire', 'Wire', at(24, 1300)),
  part('rim', 'turbine', 'Turbine', at(30, 1800, streak(21))),
  part('rim', 'aero', 'Aero disc', at(36, 2400)),
  part('spoiler', 'none', 'Clean', free),
  part('spoiler', 'lip', 'Lip spoiler', at(8, 300)),
  part('spoiler', 'duck', 'Ducktail', at(15, 800)),
  part('spoiler', 'wing', 'Swan wing', at(26, 1600)),
  part('spoiler', 'gt', 'GT wing', at(40, 3000, streak(30))),
  part('kit', 'stock', 'Factory body', free),
  part('kit', 'sport', 'Sport kit', at(16, 1000)),
  part('kit', 'wide', 'Widebody', at(34, 2600, quests(300))),
  part('stance', 'stock', 'Factory height', free),
  part('stance', 'low', 'Lowered', at(12, 600)),
  part('stance', 'lifted', 'Lifted', at(12, 600)),
];

export function partsOf(world: WorldState, v: Vehicle): Required<CarMods> {
  const m = world.mods?.[v.id] ?? {};
  return { rim: m.rim ?? v.car?.body.rim ?? 'five', spoiler: m.spoiler ?? v.car?.body.spoiler ?? 'none', kit: m.kit ?? 'stock', stance: m.stance ?? 'stock' };
}

/** Can this car wear this part? Its factory parts always; others once bought. */
export function canFit(world: WorldState, v: Vehicle, p: Part): boolean {
  if (p.kind === 'rim' && v.car?.body.rim === p.value) return true;
  if (p.kind === 'spoiler' && v.car?.body.spoiler === p.value) return true;
  return owns(world, p.id);
}

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
  { id: 'p-forest', name: 'Forest green', hex: '#2f6b4f', unlock: at(8, 400) },
  { id: 'p-orange', name: 'Sunset orange', hex: '#f08a24', unlock: at(16, 900) },
  { id: 'p-chrome', name: 'Chrome', hex: '#c8d0d9', unlock: chest },
  { id: 'p-rose', name: 'Rose pink', hex: '#f472b6', unlock: chest },
  { id: 'p-galaxy', name: 'Galaxy purple', hex: '#3b1d8f', unlock: chest },
  { id: 'p-gold', name: 'Liquid gold', hex: '#d4a63a', unlock: at(40, 4000, perfect(50)) },
];

/** Extra garage spots: you can own one vehicle per spot. */
export const GARAGE_SPOTS: Array<{ id: string; unlock: Unlock; label?: string }> = [
  { id: 'g-spot-3', unlock: at(10, 900) },
  { id: 'g-spot-4', unlock: at(22, 2500) },
  { id: 'g-spot-5', unlock: at(38, 6000, quests(750)) },
  { id: 'g-row-2', unlock: at(26, 3500), label: 'Second row (+3 spots)' },
  { id: 'g-row-3', unlock: at(42, 7000, streak(30)), label: 'Third row (+5 spots)' },
  { id: 'g-hall', unlock: at(55, 12000, goals(3)), label: 'Collector hall (no limit)' },
];
const SPOT_SIZE: Record<string, number> = { 'g-row-2': 3, 'g-row-3': 5 };

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
    GARAGE_SPOTS.find((g) => g.id === id)?.unlock ??
    PARTS.find((p) => p.id === id)?.unlock
  );
}

/** Free things are owned from the start; everything else once paid for. */
export function owns(world: WorldState, id: string): boolean {
  const u = unlockOf(id);
  if (!u) return false;
  return (u.coins === 0 && u.level <= 1 && !u.milestone && !u.chest) || id in world.paid;
}

export type Gate = { ok: true } | { ok: false; reason: 'level' | 'milestone' | 'coins' | 'space' | 'chest'; text: string };

/** Can this be bought right now? Level and milestone first, then coins. */
export function canUnlock(unlock: Unlock, stats: DerivedStats): Gate {
  if (unlock.chest) return { ok: false, reason: 'chest', text: 'Only from chests' };
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
  if ('g-hall' in world.paid) return Infinity;
  return 2 + GARAGE_SPOTS.filter((g) => g.id in world.paid).reduce((n, g) => n + (SPOT_SIZE[g.id] ?? 1), 0);
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

/* ---------------------------------------------------------------- chest drops */

export interface WorldDrop {
  id: string;
  name: string;
  kind: 'decor' | 'vehicle' | 'paint';
  /** For decor: which spot it goes in. */
  slot?: DecorSlot;
  color?: string;
  rarity: 'rare' | 'epic' | 'legendary';
}

/** Chest-only World items you don't own yet. */
export function worldChestPool(world: WorldState): WorldDrop[] {
  const out: WorldDrop[] = [];
  for (const d of DECOR) if (d.unlock.chest && !owns(world, d.id)) out.push({ id: d.id, name: d.name, kind: 'decor', slot: d.slot, color: d.color, rarity: 'rare' });
  for (const p of PAINTS) if (p.unlock.chest && !owns(world, p.id)) out.push({ id: p.id, name: `${p.name} paint`, kind: 'paint', color: p.hex, rarity: 'rare' });
  for (const v of VEHICLES) if (v.unlock.chest && !owns(world, v.id)) out.push({ id: v.id, name: v.name, kind: 'vehicle', color: v.paint.startsWith('#') ? v.paint : undefined, rarity: v.rarity === 'legendary' ? 'legendary' : 'epic' });
  return out;
}

/** Chance a chest gives a World item instead of clothes (while chest-only World items are left). */
export const WORLD_DROP_CHANCE = 0.2;

export function rollWorldDrop(world: WorldState, rand: () => number = Math.random): WorldDrop | null {
  const pool = worldChestPool(world);
  if (!pool.length) return null;
  // Vehicles are the jackpot: much rarer than decor and paint.
  const weighted = pool.flatMap((d) => Array(d.kind === 'vehicle' ? (d.rarity === 'legendary' ? 1 : 2) : 6).fill(d) as WorldDrop[]);
  return weighted[Math.floor(rand() * weighted.length)];
}

/** The colour a vehicle wears right now (chosen paint, else its factory colour). */
export function vehicleHex(world: WorldState, v: Vehicle): string {
  const chosen = world.paints?.[v.id];
  const p = PAINTS.find((x) => x.id === (chosen ?? v.paint));
  return p?.hex ?? (v.paint.startsWith('#') ? v.paint : '#888');
}
