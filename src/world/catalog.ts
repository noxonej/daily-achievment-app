import type { AppState, CarMods, DecorSlot, DerivedStats, NumericStat, WorldState } from '../lib/types';
import { SHAPES } from './px/cars';

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
  /** Legendary: only from a 0.3% chest drop or a legendary milestone pick. */
  legendary?: boolean;
}

export type View = 'city' | 'park' | 'skyline' | 'garden' | 'hills' | 'sea' | 'cliffs' | 'forest' | 'snow' | 'beach' | 'space' | 'jungle';

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

export type VehicleClass = 'bicycle' | 'escooter' | 'motorcycle' | 'car' | 'special' | 'legendary';

/** Which pixel drawing a vehicle uses (src/world/px). */
export type VehicleArtRef = { type: 'car'; shape: string } | { type: 'two'; model: string };

export interface Vehicle {
  id: string;
  name: string;
  /** Fictional maker or series line, shown small under the name. */
  maker: string;
  cls: VehicleClass;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  blurb: string;
  unlock: Unlock;
  /** Paint it comes in: a paint id or a factory colour (hex). */
  paint: string;
  art: VehicleArtRef;
  /** Showroom numbers (made up, for fun). */
  stats?: { hp: number; zeroTo100: number; top: number };
  /** Legendary only: permanent account-wide XP bonus in percent (see legendaryBonus). */
  xpBonus?: number;
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
  { id: 'attic', name: 'Cozy Attic', blurb: 'Slanted ceilings, creaky floor, all yours. Small but cozy.', unlock: at(3, 250), view: 'city', wall: 'wall-cream', floor: 'floor-oak', tier: 1 },
  { id: 'studio', name: 'Parkside Studio', blurb: 'Your own front door, with the park right outside.', unlock: at(5, 600), view: 'park', wall: 'wall-sage', floor: 'floor-oak', tier: 2 },
  { id: 'city', name: 'Skyline Apartment', blurb: 'Twelve floors up. At night the city lights are yours.', unlock: at(10, 1500, streak(7)), view: 'skyline', wall: 'wall-stone', floor: 'floor-walnut', tier: 3 },
  { id: 'cabin', name: 'Pine Cabin', blurb: 'Logs, a fire and a forest outside. No wifi, no excuses.', unlock: at(12, 2000, quests(150)), view: 'forest', wall: 'wall-panels', floor: 'floor-walnut', tier: 3 },
  { id: 'beachhut', name: 'Beach Hut', blurb: 'Sand on the floor, waves at the door.', unlock: at(15, 2500, streak(14)), view: 'beach', wall: 'wall-ocean', floor: 'floor-oak', tier: 3 },
  { id: 'loft', name: 'Brickworks Loft', blurb: 'Old factory brick, tall windows and room to think.', unlock: at(18, 3000, quests(250)), view: 'skyline', wall: 'wall-brick', floor: 'floor-concrete', tier: 4 },
  { id: 'house', name: 'Willow Lane House', blurb: 'A garden of your own, and quiet mornings.', unlock: at(25, 5000, streak(30)), view: 'garden', wall: 'wall-cream', floor: 'floor-walnut', tier: 5 },
  { id: 'chalet', name: 'Snowpeak Chalet', blurb: 'Snowy mountains and hot chocolate after training.', unlock: at(32, 6500, streak(45)), view: 'snow', wall: 'wall-panels', floor: 'floor-oak', tier: 5 },
  { id: 'treehouse', name: 'Jungle Treehouse', blurb: 'High up in the trees. The parrots are your alarm clock.', unlock: at(36, 7500, quests(800)), view: 'jungle', wall: 'wall-forest', floor: 'floor-oak', tier: 5 },
  { id: 'villa', name: 'Hillcrest Villa', blurb: 'Glass walls, open hills, pure calm.', unlock: at(40, 9000, goals(3)), view: 'hills', wall: 'wall-white', floor: 'floor-marble', tier: 6 },
  { id: 'mansion', name: 'Seacliff Estate', blurb: 'The ocean from every room. You built this.', unlock: at(60, 16000, streak(100)), view: 'sea', wall: 'wall-white', floor: 'floor-marble', tier: 7 },
  { id: 'moonbase', name: 'Moon Base', blurb: 'Earth in the window. You really went far.', unlock: at(75, 22000, streak(200)), view: 'space', wall: 'wall-concrete', floor: 'floor-concrete', tier: 6 },
  { id: 'penthouse', name: 'Rooftop Penthouse', blurb: 'A glass wall over the whole city. Only the most consistent get here.', unlock: at(90, 30000, streak(250)), view: 'skyline', wall: 'wall-night', floor: 'floor-marble', tier: 7 },
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
  d('poster-cat', 'poster', 'Cool cat in shades', 'funny-cat', undefined, at(2, 120), undefined, 'Too cool for Mondays.'),
  d('poster-potato', 'poster', 'Gym potato', 'funny-potato', undefined, at(4, 200), undefined, 'Not a couch potato any more.'),
  d('poster-ufo', 'poster', 'Cow abduction', 'funny-ufo', undefined, at(8, 450), undefined, 'They only wanted milk.'),
  d('poster-toast', 'poster', 'Toast of the town', 'funny-toast', undefined, at(6, 300)),
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
  d('art-duck', 'art', 'Duck royalty', 'funny-duck', undefined, at(3, 150), undefined, 'A rubber duck who rules the bath.'),
  d('art-pizza', 'art', 'Happy slice', 'funny-pizza', undefined, at(5, 250)),
  d('art-cat', 'art', 'Cool cat (small)', 'funny-cat', undefined, at(7, 300)),
  d('art-banana', 'art', 'Taped banana', 'banana', undefined, at(9, 999), undefined, 'Very serious, very expensive art.'),
  d('art-ufo', 'art', 'Cow abduction mini', 'funny-ufo', undefined, chest),
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

/* ---------------------------------------------------------------- vehicles */

const legendary: Unlock = { level: 1, coins: 0, legendary: true };
const car = (shape: string): VehicleArtRef => ({ type: 'car', shape });
const two = (model: string): VehicleArtRef => ({ type: 'two', model });

/**
 * The collection (rebuilt 2026-11-16): fewer, better vehicles, every one pixel art at the same
 * scale. Makers are fictional. Legendary designs are original, only *inspired* by film and
 * motorsport icons. Ids of older vehicles are kept so saves keep working.
 */
export const VEHICLES: Vehicle[] = [
  // bicycles
  { id: 'v-bike', name: 'Dutchie', maker: 'City bike', cls: 'bicycle', rarity: 'common', blurb: 'Free, healthy, and always parks right outside.', unlock: free, paint: 'p-mint', art: two('citybike') },
  { id: 'v-racebike', name: 'Carbon Arrow', maker: 'Road racer', cls: 'bicycle', rarity: 'rare', blurb: 'Earned with your own legs: 100 km of running.', unlock: at(8, 1000, km(100)), paint: 'p-flame', art: two('racebike') },
  // e-scooters
  { id: 'v-scooter', name: 'Glide One', maker: 'Commuter e-scooter', cls: 'escooter', rarity: 'common', blurb: 'Zip through the city in silence.', unlock: at(4, 400), paint: 'p-white', art: two('escooter') },
  { id: 'sc-glide-pro', name: 'Glide Pro', maker: 'Dual-motor e-scooter', cls: 'escooter', rarity: 'rare', blurb: 'Suspension, two motors and a light bar.', unlock: at(14, 1600, streak(14)), paint: 'p-black', art: two('escooterpro') },
  // motorcycles
  { id: 'v-moto', name: 'Stryker 700', maker: 'Naked street bike', cls: 'motorcycle', rarity: 'rare', blurb: 'Two wheels, a lot of fun.', unlock: at(12, 1800, streak(14)), paint: 'p-black', art: two('naked') },
  { id: 'mc-cafe', name: 'Brass Café 500', maker: 'Café racer', cls: 'motorcycle', rarity: 'rare', blurb: 'Hand-built look, wire wheels, megaphone pipe.', unlock: at(16, 2400, quests(150)), paint: 'p-forest', art: two('cafe') },
  { id: 'mc-adv', name: 'Ridgeline 690', maker: 'Adventure bike', cls: 'motorcycle', rarity: 'epic', blurb: 'Goes where the road ends.', unlock: at(24, 4200, km(50)), paint: 'p-orange', art: two('adventure') },
  { id: 'mc-sport', name: 'Veloce RR', maker: 'Superbike', cls: 'motorcycle', rarity: 'epic', blurb: 'Tucked in, chin on the tank.', unlock: at(32, 6500, streak(30)), paint: 'p-red', art: two('sport') },
  { id: 'v-nightrider', name: 'Night Rider', maker: 'Cruiser', cls: 'motorcycle', rarity: 'epic', blurb: 'A chest-only chopper in deep galaxy purple.', unlock: chest, paint: 'p-galaxy', art: two('cruiser') },
  // cars
  { id: 'v-hatch', name: 'Pip', maker: 'City hatchback', cls: 'car', rarity: 'rare', blurb: 'Your first car. Paid with a savings goal you reached.', unlock: at(18, 3500, saved(1)), paint: 'p-sky', art: car('hatch'), stats: { hp: 110, zeroTo100: 9.8, top: 185 } },
  { id: 'car-kei', name: 'Bento', maker: 'Kei city car', cls: 'car', rarity: 'rare', blurb: 'Tiny, cheerful, parks anywhere.', unlock: at(16, 3000), paint: 'p-mint', art: car('kei'), stats: { hp: 64, zeroTo100: 13.5, top: 140 } },
  { id: 'car-van', name: 'Wanderer', maker: 'Camper van', cls: 'car', rarity: 'rare', blurb: 'Sleep anywhere. Earned with 30 perfect days.', unlock: at(21, 4400, perfect(30)), paint: 'p-sand', art: car('van'), stats: { hp: 150, zeroTo100: 12.4, top: 160 } },
  { id: 'car-sedan', name: 'Hush E', maker: 'Electric saloon', cls: 'car', rarity: 'epic', blurb: 'Silent, smooth and very quick. Save for 2 money goals.', unlock: at(30, 7500, saved(2)), paint: 'p-white', art: car('sedan'), stats: { hp: 420, zeroTo100: 4.1, top: 230 } },
  { id: 'car-drift', name: 'Sideways S', maker: 'Drift coupe', cls: 'special', rarity: 'epic', blurb: 'Wide arches, gold mesh wheels, smoke everywhere.', unlock: at(38, 10000, streak(60)), paint: 'p-sky', art: car('drift'), stats: { hp: 380, zeroTo100: 4.9, top: 250 } },
  { id: 'car-lowrider', name: 'Bajito', maker: 'Lowrider', cls: 'special', rarity: 'epic', blurb: 'Slammed, pinstriped, wire wheels. Pure style.', unlock: at(34, 8500, quests(600)), paint: 'p-teal', art: car('lowrider'), stats: { hp: 230, zeroTo100: 8.8, top: 190 } },
  { id: 'car-wagon', name: 'Fjord Estate', maker: 'Family wagon', cls: 'car', rarity: 'rare', blurb: 'Room for bikes, dogs and road trips.', unlock: at(20, 4000), paint: 'p-forest', art: car('wagon'), stats: { hp: 190, zeroTo100: 7.9, top: 220 } },
  { id: 'car-pickup', name: 'Ridgeback', maker: 'Pickup truck', cls: 'car', rarity: 'rare', blurb: 'Hauls anything. Earned with 250 finished quests.', unlock: at(22, 4800, quests(250)), paint: 'p-white', art: car('pickup'), stats: { hp: 300, zeroTo100: 7.4, top: 190 } },
  { id: 'car-offroad', name: 'Trailhound 4x4', maker: 'Off-roader', cls: 'car', rarity: 'epic', blurb: 'Snorkel, spare wheel, beadlocks. Run 100 km to earn it.', unlock: at(28, 6500, km(100)), paint: 'p-sand', art: car('offroad'), stats: { hp: 280, zeroTo100: 8.1, top: 175 } },
  { id: 'v-coupe', name: 'Vela Coupe', maker: 'Sports coupe', cls: 'car', rarity: 'epic', blurb: 'Low, fast and gleaming.', unlock: at(30, 7000, streak(30)), paint: 'p-red', art: car('coupe'), stats: { hp: 340, zeroTo100: 5.1, top: 260 } },
  { id: 'car-tuner', name: 'Kaze R', maker: 'Street tuner', cls: 'car', rarity: 'epic', blurb: 'Big wing, mesh wheels, built in a garage at night.', unlock: at(34, 8500, perfect(30)), paint: 'p-yellow', art: car('tuner'), stats: { hp: 320, zeroTo100: 4.9, top: 255 } },
  { id: 'car-muscle', name: 'Thunder 68', maker: 'Muscle car', cls: 'car', rarity: 'epic', blurb: 'Long hood, loud heart. 500 quests to earn it.', unlock: at(38, 9500, quests(500)), paint: 'p-navy', art: car('muscle'), stats: { hp: 425, zeroTo100: 5.4, top: 240 } },
  { id: 'v-classic', name: 'Riviera Spider', maker: 'Classic convertible', cls: 'car', rarity: 'epic', blurb: 'Chrome, whitewalls and summer drives.', unlock: at(45, 10000, goals(5)), paint: 'p-cream', art: car('classic'), stats: { hp: 180, zeroTo100: 8.9, top: 200 } },
  { id: 'car-gt', name: 'Aurora GT', maker: 'Grand tourer', cls: 'car', rarity: 'epic', blurb: 'Crosses a continent in one go.', unlock: at(50, 14000, streak(60)), paint: 'p-steel', art: car('gt'), stats: { hp: 560, zeroTo100: 3.9, top: 305 } },
  { id: 'v-super', name: 'Apex V12', maker: 'Supercar', cls: 'car', rarity: 'epic', blurb: 'For people who never gave up: a 100-day streak.', unlock: at(60, 18000, streak(100)), paint: 'p-gold', art: car('super'), stats: { hp: 780, zeroTo100: 2.9, top: 340 } },
  // special: rally, racing, performance
  { id: 'car-rally', name: 'Gravel Hawk', maker: 'Rally special', cls: 'special', rarity: 'epic', blurb: 'Mud flaps, light pod, sideways everywhere. Run 200 km.', unlock: at(42, 11000, km(200)), paint: 'p-white', art: car('rally'), stats: { hp: 300, zeroTo100: 3.8, top: 220 } },
  { id: 'car-touring', name: 'Sprint Tourer', maker: 'Touring race car', cls: 'special', rarity: 'epic', blurb: 'A race saloon with a widebody and a GT wing.', unlock: at(55, 16000, perfect(100)), paint: 'p-teal', art: car('touring'), stats: { hp: 480, zeroTo100: 3.6, top: 285 } },
  { id: 'car-proto', name: 'Volta LMP', maker: 'Endurance prototype', cls: 'special', rarity: 'epic', blurb: 'Built for 24 hours flat out. A 150-day streak.', unlock: at(70, 24000, streak(150)), paint: 'p-black', art: car('proto'), stats: { hp: 680, zeroTo100: 2.8, top: 345 } },
  { id: 'v-retro', name: 'Retro Roadster', maker: 'Chest exclusive', cls: 'special', rarity: 'epic', blurb: 'A chest-only roadster. Turn heads everywhere.', unlock: chest, paint: 'p-chrome', art: car('roadster'), stats: { hp: 150, zeroTo100: 8.2, top: 195 } },
  // legendary: original designs, the rarest things in Squzo
  { id: 'lg-nocturne', name: 'Nocturne', maker: 'Legendary · night cruiser', cls: 'legendary', rarity: 'legendary', blurb: 'Armoured, silent, with a jet turbine and a tail fin. Rules the city after dark.', unlock: legendary, paint: '#1c1d23', art: car('nocturne'), stats: { hp: 900, zeroTo100: 2.6, top: 330 }, xpBonus: 1 },
  { id: 'lg-quarter', name: 'Quarter King', maker: 'Legendary · drag muscle', cls: 'legendary', rarity: 'legendary', blurb: 'A supercharger through the hood and a wheelie bar. Ten seconds or less.', unlock: legendary, paint: '#121318', art: car('quarter'), stats: { hp: 900, zeroTo100: 2.4, top: 290 }, xpBonus: 1 },
  { id: 'lg-kaze', name: 'Midnight Kaze', maker: 'Legendary · street racer', cls: 'legendary', rarity: 'legendary', blurb: 'Widebody, underglow and a wild vinyl. Born on the night highway.', unlock: legendary, paint: '#2c3e8f', art: car('kaze'), stats: { hp: 650, zeroTo100: 3.1, top: 315 }, xpBonus: 1 },
  { id: 'lg-sidewinder', name: 'Sidewinder B', maker: 'Legendary · rally monster', cls: 'legendary', rarity: 'legendary', blurb: 'A wedge from rally’s wildest era: giant wing, light pod, no fear.', unlock: legendary, paint: '#f4f1ea', art: car('sidewinder'), stats: { hp: 560, zeroTo100: 2.9, top: 250 }, xpBonus: 1 },
  { id: 'lg-phantom', name: 'Phantom LM', maker: 'Legendary · endurance hypercar', cls: 'legendary', rarity: 'legendary', blurb: 'Shark fin, light bars, built to win the long race.', unlock: legendary, paint: '#b3121f', art: car('phantom'), stats: { hp: 1000, zeroTo100: 2.3, top: 360 }, xpBonus: 1 },
];

export const isCar = (v: Vehicle) => v.art.type === 'car';

export const CLASS_LABEL: Record<VehicleClass, string> = {
  bicycle: 'Bicycles',
  escooter: 'E-scooters',
  motorcycle: 'Motorcycles',
  car: 'Cars',
  special: 'Special',
  legendary: 'Legendary',
};

/* ---------------------------------------------------------------- legendary */

/** XP bonus per legendary owned, and the cap (5 legendaries = +5%, never more). */
export const LEGENDARY_BONUS_CAP = 5;
/** Chance one reward chest holds a legendary vehicle. */
export const LEGENDARY_CHEST_CHANCE = 0.003;

export function legendaryBonus(world: WorldState): number {
  const sum = VEHICLES.filter((v) => v.cls === 'legendary' && owns(world, v.id)).reduce((n, v) => n + (v.xpBonus ?? 0), 0);
  return Math.min(LEGENDARY_BONUS_CAP, sum);
}

/** Huge milestones that let you pick one legendary of your choice (each once). */
export const LEGENDARY_PICKS: Array<{ id: string; label: string; stat: NumericStat; target: number }> = [
  { id: 'pick-level-100', label: 'Reach level 100', stat: 'level', target: 100 },
  { id: 'pick-streak-365', label: 'Reach a 365-day streak', stat: 'longestStreak', target: 365 },
  { id: 'pick-quests-2000', label: 'Finish 2,000 quests', stat: 'totalQuestsCompleted', target: 2000 },
];

export function legendaryPicksReady(world: WorldState, stats: DerivedStats): Array<(typeof LEGENDARY_PICKS)[number]> {
  return LEGENDARY_PICKS.filter((p) => !(world.picks ?? []).includes(p.id) && stats[p.stat] >= p.target);
}

/* ---------------------------------------------------------------- car parts */

export interface Part {
  id: string;
  kind: keyof CarMods;
  /** Value passed to the car drawer (rim style, rim colour, spoiler, kit, stance, livery). */
  value: string;
  name: string;
  unlock: Unlock;
}

const part = (kind: keyof CarMods, value: string, name: string, unlock: Unlock): Part => ({ id: `part-${kind}-${value}`, kind, value, name, unlock });

/** Swap-on parts. A car's own factory parts are always free for that car. */
export const PARTS: Part[] = [
  part('rim', 'five', 'Five spoke', free),
  part('rim', 'hubcap', 'Steel + hubcap', free),
  part('rim', 'split', 'Split spoke', at(6, 250)),
  part('rim', 'multi', 'Multi spoke', at(9, 400)),
  part('rim', 'offroad', 'Trail', at(10, 450)),
  part('rim', 'mesh', 'Mesh', at(12, 600)),
  part('rim', 'dish', 'Deep dish', at(14, 700)),
  part('rim', 'rays', 'Six ray', at(16, 800)),
  part('rim', 'beadlock', 'Beadlock', at(20, 1100, km(50))),
  part('rim', 'wire', 'Wire', at(24, 1300)),
  part('rim', 'turbine', 'Turbine', at(30, 1800, streak(21))),
  part('rim', 'aero', 'Aero disc', at(36, 2400)),
  part('rimColor', 'silver', 'Silver', free),
  part('rimColor', 'black', 'Gloss black', at(10, 300)),
  part('rimColor', 'white', 'Rally white', at(14, 500)),
  part('rimColor', 'bronze', 'Bronze', at(18, 800)),
  part('rimColor', 'gold', 'Gold', at(26, 1400, perfect(20))),
  part('spoiler', 'none', 'Clean', free),
  part('spoiler', 'lip', 'Lip spoiler', at(8, 300)),
  part('spoiler', 'duck', 'Ducktail', at(15, 800)),
  part('spoiler', 'wing', 'Swan wing', at(26, 1600)),
  part('spoiler', 'gt', 'GT wing', at(40, 3000, streak(30))),
  part('kit', 'stock', 'Factory body', free),
  part('kit', 'sport', 'Sport kit', at(16, 1000)),
  part('kit', 'rally', 'Rally kit', at(30, 2000, km(50))),
  part('kit', 'wide', 'Widebody', at(34, 2600, quests(300))),
  part('stance', 'stock', 'Factory height', free),
  part('stance', 'low', 'Lowered', at(12, 600)),
  part('stance', 'lifted', 'Lifted', at(12, 600)),
  part('livery', 'none', 'Clean paint', free),
  part('livery', 'pinline', 'Pinstripe', at(6, 200)),
  part('livery', 'stripe', 'Twin stripes', at(8, 350)),
  part('livery', 'twotone', 'Two-tone', at(12, 600)),
  part('livery', 'racing', 'Race number', at(20, 1200)),
  part('livery', 'check', 'Checker band', at(24, 1500, streak(21))),
  part('livery', 'flames', 'Flames', at(28, 1800)),
  part('livery', 'rally', 'Rally colours', at(36, 2600, km(100))),
  part('livery', 'vinyl', 'Night vinyl', at(44, 3400, perfect(50))),
];

export const RIM_COLORS: Record<string, string> = { silver: '#c3c8d0', black: '#2a2c33', white: '#eceae4', bronze: '#a8784a', gold: '#d4a63a' };

/** Factory parts of a car (from its drawing). */
export function factoryParts(v: Vehicle): Required<CarMods> {
  const s = v.art.type === 'car' ? SHAPES[v.art.shape] : undefined;
  const rc = s?.rimColor ? Object.entries(RIM_COLORS).find(([, hex]) => hex === s.rimColor)?.[0] ?? 'factory' : 'silver';
  return { rim: s?.rim ?? 'five', spoiler: s?.spoiler ?? 'none', kit: s?.kit ?? 'stock', stance: 'stock', livery: s?.livery ?? 'none', rimColor: rc };
}

export function partsOf(world: WorldState, v: Vehicle): Required<CarMods> {
  const f = factoryParts(v);
  const m = world.mods?.[v.id] ?? {};
  return { rim: m.rim ?? f.rim, spoiler: m.spoiler ?? f.spoiler, kit: m.kit ?? f.kit, stance: m.stance ?? f.stance, livery: m.livery ?? f.livery, rimColor: m.rimColor ?? f.rimColor };
}

/** Can this car wear this part? Its factory parts always; others once bought. */
export function canFit(world: WorldState, v: Vehicle, p: Part): boolean {
  if (factoryParts(v)[p.kind] === p.value) return true;
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
  { id: 'p-teal', name: 'Squzo teal', hex: '#2aa7bd', unlock: at(20, 1200, streak(21)) },
  { id: 'p-violet', name: 'Midnight violet', hex: '#5b3fd6', unlock: at(25, 1500) },
  { id: 'p-forest', name: 'Forest green', hex: '#2f6b4f', unlock: at(8, 400) },
  { id: 'p-orange', name: 'Sunset orange', hex: '#f08a24', unlock: at(16, 900) },
  { id: 'p-chrome', name: 'Chrome', hex: '#c8d0d9', unlock: chest },
  { id: 'p-rose', name: 'Rose pink', hex: '#f472b6', unlock: chest },
  { id: 'p-galaxy', name: 'Galaxy purple', hex: '#3b1d8f', unlock: chest },
  { id: 'p-gold', name: 'Liquid gold', hex: '#d4a63a', unlock: at(40, 4000, perfect(50)) },
  { id: 'p-navy', name: 'Deep navy', hex: '#26386e', unlock: at(9, 450) },
  { id: 'p-sand', name: 'Desert sand', hex: '#c9a46a', unlock: at(10, 450) },
  { id: 'p-yellow', name: 'Sunburst yellow', hex: '#f0b429', unlock: at(12, 600) },
  { id: 'p-steel', name: 'Gunmetal', hex: '#5b616e', unlock: at(18, 800) },
  { id: 'p-matte', name: 'Matte black', hex: '#2a2b30', unlock: at(22, 1000, streak(14)) },
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
    PARTS.find((p) => p.id === id)?.unlock ??
    GARAGE_ENVS.find((g) => g.id === id)?.unlock
  );
}

/** Free things are owned from the start; everything else once paid for. */
export function owns(world: WorldState, id: string): boolean {
  const u = unlockOf(id);
  if (!u) return false;
  return (u.coins === 0 && u.level <= 1 && !u.milestone && !u.chest && !u.legendary) || id in world.paid;
}

export type Gate = { ok: true } | { ok: false; reason: 'level' | 'milestone' | 'coins' | 'space' | 'chest'; text: string };

/** Can this be bought right now? Level and milestone first, then coins. */
export function canUnlock(unlock: Unlock, stats: DerivedStats): Gate {
  if (unlock.legendary) return { ok: false, reason: 'chest', text: 'Legendary: 0.3% chest drop or a legendary pick' };
  if (unlock.chest) return { ok: false, reason: 'chest', text: 'Only from chests' };
  if (stats.level < unlock.level) return { ok: false, reason: 'level', text: `Reach level ${unlock.level}` };
  if (unlock.milestone && stats[unlock.milestone.stat] < unlock.milestone.target) {
    return { ok: false, reason: 'milestone', text: unlock.milestone.label };
  }
  if (stats.availableShards < unlock.coins) return { ok: false, reason: 'coins', text: `${unlock.coins - stats.availableShards} more coins` };
  return { ok: true };
}

/** Coins spent in the World. Items that no longer exist (the retired 300-car collection) cost nothing, so they are refunded. */
export function worldSpent(state: AppState): number {
  return Object.entries(state.world?.paid ?? {}).reduce((a, [id, n]) => a + (Number.isFinite(n) && unlockOf(id) ? n : 0), 0);
}

/** Retired vehicles someone had bought, with the coins they got back. */
export function refundedVehicles(world: WorldState): Array<{ id: string; coins: number }> {
  return Object.entries(world.paid)
    .filter(([id]) => /^(car-|v-)/.test(id) && !unlockOf(id))
    .map(([id, coins]) => ({ id, coins: Number(coins) || 0 }));
}

export function garageSpots(world: WorldState): number {
  // Two spots to start (the free bike takes one), more as you build.
  if ('g-hall' in world.paid) return Infinity;
  return 2 + GARAGE_SPOTS.filter((g) => g.id in world.paid).reduce((n, g) => n + (SPOT_SIZE[g.id] ?? 1), 0);
}

export function ownedVehicles(world: WorldState): Vehicle[] {
  return VEHICLES.filter((v) => owns(world, v.id));
}

/** Garage spots in use. Legendaries stand on their own plinth and never take a spot. */
export function garageUsed(world: WorldState): number {
  return ownedVehicles(world).filter((v) => v.cls !== 'legendary').length;
}

export function decorFor(world: WorldState, slot: DecorSlot): DecorItem {
  const property = PROPERTIES.find((p) => p.id === world.property) ?? PROPERTIES[0];
  const fallback = slot === 'wall' ? property.wall : slot === 'floor' ? property.floor : DEFAULT_DECOR[slot];
  const id = world.decor[slot] ?? fallback;
  const item = DECOR.find((d) => d.id === id && d.slot === slot) ?? DECOR.find((d) => d.id === DEFAULT_DECOR[slot])!;
  const tint = slot === 'wall' || slot === 'floor' ? world.tints?.[slot] : undefined;
  return tint ? { ...item, color: tint } : item;
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
  for (const v of VEHICLES) if (v.unlock.chest && !owns(world, v.id)) out.push({ id: v.id, name: v.name, kind: 'vehicle', color: v.paint.startsWith('#') ? v.paint : undefined, rarity: 'epic' });
  return out;
}

/** Chance a chest gives a World item instead of clothes (while chest-only World items are left). */
export const WORLD_DROP_CHANCE = 0.2;

/** Legendary vehicles you don't own yet (for the 0.3% chest roll and milestone picks). */
export function legendaryPool(world: WorldState): Vehicle[] {
  return VEHICLES.filter((v) => v.cls === 'legendary' && !owns(world, v.id));
}

/** The 0.3% legendary roll a chest makes before anything else. */
export function rollLegendary(world: WorldState, rand: () => number = Math.random): WorldDrop | null {
  const pool = legendaryPool(world);
  if (!pool.length || rand() >= LEGENDARY_CHEST_CHANCE) return null;
  const v = pool[Math.floor(rand() * pool.length)];
  return { id: v.id, name: v.name, kind: 'vehicle', rarity: 'legendary' };
}

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
  return p?.hex ?? (v.paint.startsWith('#') ? v.paint : '#888888');
}

/* ---------------------------------------------------------------- garage places */

/** Where your vehicles live. Better places unlock as you grow, then you pick one. */
export interface GarageEnv {
  id: string;
  name: string;
  blurb: string;
  unlock: Unlock;
}

export const GARAGE_ENVS: GarageEnv[] = [
  { id: 'gx-lockup', name: 'Lock-up garage', blurb: 'A roller door, a work light and big plans.', unlock: free },
  { id: 'gx-workshop', name: 'Tuning workshop', blurb: 'Tool wall, lift and a parts shelf.', unlock: at(15, 1500, quests(100)) },
  { id: 'gx-showroom', name: 'Glass showroom', blurb: 'Spotlights, a turntable and the city outside.', unlock: at(30, 5000, streak(30)) },
  { id: 'gx-rooftop', name: 'Rooftop at night', blurb: 'Your own spot above the city lights.', unlock: at(50, 9000) },
  { id: 'gx-pitlane', name: 'Pit lane', blurb: 'Pit board, tyre stacks and a grandstand. For 100-day legends.', unlock: at(40, 8000, streak(100)) },
];

export function garageEnvOf(world: WorldState): GarageEnv {
  const id = world.garage && owns(world, world.garage) ? world.garage : 'gx-lockup';
  return GARAGE_ENVS.find((g) => g.id === id) ?? GARAGE_ENVS[0];
}

/**
 * Trophies you earn by living, not buying: each real milestone hangs something in your garage
 * automatically (shown in the garage scene and the milestone road).
 */
export interface Trophy {
  id: string;
  name: string;
  stat: NumericStat;
  target: number;
  label: string;
}

export const TROPHIES: Trophy[] = [
  { id: 't-flag', name: 'Checkered flag', stat: 'totalQuestsCompleted', target: 100, label: 'Finish 100 quests' },
  { id: 't-tyres', name: 'Tyre stack', stat: 'kmRun', target: 25, label: 'Run 25 km in total' },
  { id: 't-banner', name: 'Champion banner', stat: 'totalPerfectDays', target: 30, label: 'Have 30 perfect days' },
  { id: 't-sign', name: 'Squzo light sign', stat: 'longestStreak', target: 30, label: 'Reach a 30-day streak' },
  { id: 't-cup', name: 'Gold cup', stat: 'level', target: 25, label: 'Reach level 25' },
  { id: 't-plaque', name: 'Legend plaque', stat: 'level', target: 50, label: 'Reach level 50' },
];

export function trophiesEarned(stats: DerivedStats): Set<string> {
  return new Set(TROPHIES.filter((t) => stats[t.stat] >= t.target).map((t) => t.id));
}
