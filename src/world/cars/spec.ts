/**
 * The car designer (2026-11-14). Instead of one car picture in different colours, every car is
 * built from its own body plan: length, wheelbase, overhangs, roof height, windscreen rake, hood
 * length, rear shape (fastback, notchback, hatch, box, wedge, pickup bed, open top), ride height,
 * wheel size, nose and tail height, plus maker "DNA" (signature side scoops, a chrome side line,
 * a window kink, a hood scoop...). Change any number and the silhouette changes, so a hypercar,
 * an SUV and a muscle car are different shapes, and two hypercars from different makers are too.
 *
 * Makers are fictional. Each is *inspired by* a real-world design language (noted in a comment) but
 * uses no real names, logos or badges.
 */
export type CarClass = 'hyper' | 'super' | 'sports' | 'gt' | 'muscle' | 'sedan' | 'luxury' | 'suv' | 'offroad' | 'pickup' | 'hatch' | 'ev' | 'classic' | 'wagon' | 'rally';
export type Rear = 'fastback' | 'notch' | 'hatch' | 'box' | 'wedge' | 'pickup' | 'open';
export type Lamp = 'slim' | 'round' | 'bar' | 'quad' | 'pop';

export interface BodySpec {
  /** Overall length (viewBox units, the art is 400 wide). */
  len: number;
  /** Front and rear overhang as a share of length. */
  ohF: number;
  ohR: number;
  wheelR: number;
  /** Gap under the body. */
  clear: number;
  /** Heights above the ground. */
  nose: number;
  belt: number;
  roof: number;
  tail: number;
  /** Hood length as a share of length. */
  hood: number;
  /** Windscreen run per unit of height (bigger = more raked). */
  rake: number;
  /** Roof length as a share of length. */
  roofLen: number;
  rear: Rear;
  /** How far the rear glass runs back (fastback/notch), share of length. */
  rearRun: number;
  lamp: Lamp;
  /** Signature details. */
  scoop?: boolean;
  intake?: boolean;
  chromeLine?: boolean;
  kink?: boolean;
  hoodScoop?: boolean;
  ccurve?: boolean;
  fender?: boolean;
  rack?: boolean;
  spare?: boolean;
  snorkel?: boolean;
  bullbar?: boolean;
  twoTone?: boolean;
  louvres?: boolean;
  floatRoof?: boolean;
  stripes?: boolean;
  chromeBumpers?: boolean;
  /** Factory parts. */
  rim: string;
  spoiler: string;
}

export interface CarModel {
  id: string;
  maker: string;
  model: string;
  cls: CarClass;
  body: BodySpec;
  /** Factory paint (hex). */
  paint: string;
  /** Made-up but consistent performance numbers. */
  hp: number;
  zeroTo100: number;
  top: number;
}

/* ---------------------------------------------------------------- seeded randomness */

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Range = [number, number];
const pick = <T,>(r: () => number, list: T[]) => list[Math.floor(r() * list.length) % list.length];
const span = (r: () => number, [a, b]: Range) => a + (b - a) * r();

/* ---------------------------------------------------------------- class body plans */

interface ClassPlan {
  len: Range;
  ohF: Range;
  ohR: Range;
  wheelR: Range;
  clear: Range;
  nose: Range;
  belt: Range;
  roof: Range;
  tail: Range;
  hood: Range;
  rake: Range;
  roofLen: Range;
  rear: Rear[];
  rearRun: Range;
  lamp: Lamp[];
  rims: string[];
  spoilers: string[];
  hp: Range;
}

const PLAN: Record<CarClass, ClassPlan> = {
  hyper: { len: [352, 372], ohF: [0.17, 0.21], ohR: [0.2, 0.25], wheelR: [29, 32], clear: [9, 12], nose: [26, 34], belt: [50, 58], roof: [74, 82], tail: [52, 62], hood: [0.2, 0.26], rake: [2.2, 3], roofLen: [0.1, 0.16], rear: ['wedge', 'fastback'], rearRun: [0.22, 0.3], lamp: ['slim', 'bar'], rims: ['turbine', 'split', 'multi', 'aero'], spoilers: ['duck', 'wing', 'lip'], hp: [1100, 1600] },
  super: { len: [338, 358], ohF: [0.17, 0.21], ohR: [0.19, 0.24], wheelR: [28, 31], clear: [9, 13], nose: [28, 36], belt: [52, 60], roof: [76, 86], tail: [54, 64], hood: [0.19, 0.25], rake: [2, 2.7], roofLen: [0.1, 0.15], rear: ['wedge', 'fastback'], rearRun: [0.2, 0.28], lamp: ['slim', 'bar'], rims: ['five', 'split', 'multi', 'turbine'], spoilers: ['none', 'duck', 'wing'], hp: [600, 1000] },
  sports: { len: [300, 330], ohF: [0.16, 0.2], ohR: [0.18, 0.23], wheelR: [26, 29], clear: [11, 15], nose: [36, 44], belt: [58, 66], roof: [86, 96], tail: [58, 68], hood: [0.22, 0.3], rake: [1.6, 2.2], roofLen: [0.12, 0.18], rear: ['fastback', 'fastback', 'hatch'], rearRun: [0.22, 0.3], lamp: ['slim', 'round', 'pop'], rims: ['five', 'mesh', 'split', 'multi'], spoilers: ['none', 'duck', 'lip', 'wing'], hp: [300, 520] },
  gt: { len: [345, 365], ohF: [0.15, 0.18], ohR: [0.18, 0.22], wheelR: [28, 31], clear: [11, 14], nose: [38, 46], belt: [60, 68], roof: [88, 96], tail: [62, 70], hood: [0.32, 0.38], rake: [1.8, 2.4], roofLen: [0.12, 0.17], rear: ['fastback'], rearRun: [0.22, 0.28], lamp: ['slim', 'bar'], rims: ['multi', 'five', 'turbine'], spoilers: ['none', 'lip'], hp: [500, 720] },
  muscle: { len: [345, 368], ohF: [0.16, 0.2], ohR: [0.2, 0.24], wheelR: [27, 30], clear: [13, 17], nose: [50, 58], belt: [66, 74], roof: [96, 104], tail: [66, 74], hood: [0.32, 0.38], rake: [1.4, 1.9], roofLen: [0.16, 0.22], rear: ['notch', 'fastback'], rearRun: [0.12, 0.18], lamp: ['bar', 'quad', 'round'], rims: ['five', 'dish', 'split'], spoilers: ['none', 'duck', 'lip'], hp: [450, 810] },
  sedan: { len: [335, 355], ohF: [0.17, 0.2], ohR: [0.2, 0.24], wheelR: [26, 29], clear: [13, 17], nose: [46, 54], belt: [66, 74], roof: [100, 108], tail: [68, 76], hood: [0.24, 0.29], rake: [1.3, 1.7], roofLen: [0.2, 0.26], rear: ['notch'], rearRun: [0.1, 0.14], lamp: ['slim', 'bar'], rims: ['five', 'multi', 'split'], spoilers: ['none', 'lip', 'duck'], hp: [250, 620] },
  luxury: { len: [360, 378], ohF: [0.16, 0.18], ohR: [0.2, 0.23], wheelR: [28, 31], clear: [14, 17], nose: [50, 58], belt: [70, 78], roof: [104, 112], tail: [72, 80], hood: [0.27, 0.33], rake: [1.2, 1.6], roofLen: [0.24, 0.3], rear: ['notch'], rearRun: [0.08, 0.12], lamp: ['slim', 'bar', 'quad'], rims: ['multi', 'aero', 'five'], spoilers: ['none'], hp: [400, 640] },
  suv: { len: [330, 360], ohF: [0.16, 0.19], ohR: [0.18, 0.22], wheelR: [30, 34], clear: [22, 28], nose: [64, 74], belt: [86, 94], roof: [128, 138], tail: [86, 96], hood: [0.2, 0.25], rake: [1, 1.4], roofLen: [0.36, 0.44], rear: ['box', 'hatch', 'fastback'], rearRun: [0.06, 0.14], lamp: ['slim', 'bar'], rims: ['five', 'multi', 'split', 'aero'], spoilers: ['none', 'lip'], hp: [300, 650] },
  offroad: { len: [300, 330], ohF: [0.12, 0.15], ohR: [0.12, 0.16], wheelR: [33, 37], clear: [30, 36], nose: [72, 82], belt: [92, 100], roof: [136, 146], tail: [90, 100], hood: [0.22, 0.26], rake: [0.5, 0.8], roofLen: [0.44, 0.52], rear: ['box'], rearRun: [0.02, 0.04], lamp: ['round', 'bar'], rims: ['beadlock', 'offroad'], spoilers: ['none'], hp: [270, 470] },
  pickup: { len: [360, 378], ohF: [0.14, 0.16], ohR: [0.16, 0.2], wheelR: [32, 36], clear: [26, 32], nose: [72, 82], belt: [92, 100], roof: [130, 140], tail: [92, 100], hood: [0.22, 0.26], rake: [0.9, 1.2], roofLen: [0.18, 0.24], rear: ['pickup'], rearRun: [0.3, 0.36], lamp: ['bar', 'quad'], rims: ['offroad', 'beadlock', 'five'], spoilers: ['none'], hp: [380, 720] },
  hatch: { len: [270, 300], ohF: [0.16, 0.19], ohR: [0.12, 0.16], wheelR: [24, 27], clear: [14, 18], nose: [48, 56], belt: [70, 78], roof: [106, 114], tail: [74, 82], hood: [0.18, 0.22], rake: [1.3, 1.7], roofLen: [0.3, 0.36], rear: ['hatch'], rearRun: [0.04, 0.08], lamp: ['slim', 'round', 'bar'], rims: ['five', 'mesh', 'multi'], spoilers: ['none', 'lip', 'wing'], hp: [120, 320] },
  ev: { len: [330, 352], ohF: [0.16, 0.19], ohR: [0.18, 0.22], wheelR: [27, 30], clear: [13, 17], nose: [40, 48], belt: [66, 72], roof: [102, 110], tail: [70, 78], hood: [0.16, 0.2], rake: [1.8, 2.3], roofLen: [0.22, 0.28], rear: ['fastback', 'fastback', 'hatch'], rearRun: [0.16, 0.22], lamp: ['bar', 'slim'], rims: ['aero', 'turbine'], spoilers: ['none', 'lip'], hp: [350, 1020] },
  classic: { len: [320, 352], ohF: [0.17, 0.21], ohR: [0.2, 0.25], wheelR: [24, 27], clear: [15, 19], nose: [48, 56], belt: [64, 72], roof: [92, 102], tail: [62, 70], hood: [0.28, 0.34], rake: [1.2, 1.7], roofLen: [0.18, 0.24], rear: ['notch', 'fastback', 'open'], rearRun: [0.1, 0.18], lamp: ['round'], rims: ['wire', 'dish', 'hubcap'], spoilers: ['none'], hp: [110, 400] },
  wagon: { len: [345, 365], ohF: [0.16, 0.19], ohR: [0.19, 0.23], wheelR: [27, 30], clear: [14, 18], nose: [46, 54], belt: [68, 76], roof: [104, 112], tail: [76, 84], hood: [0.24, 0.28], rake: [1.3, 1.7], roofLen: [0.36, 0.42], rear: ['hatch'], rearRun: [0.05, 0.08], lamp: ['slim', 'bar'], rims: ['five', 'multi'], spoilers: ['none', 'lip'], hp: [250, 600] },
  rally: { len: [290, 320], ohF: [0.16, 0.19], ohR: [0.16, 0.2], wheelR: [26, 28], clear: [17, 21], nose: [48, 54], belt: [70, 76], roof: [106, 112], tail: [74, 80], hood: [0.22, 0.26], rake: [1.4, 1.7], roofLen: [0.24, 0.3], rear: ['notch', 'hatch'], rearRun: [0.08, 0.12], lamp: ['quad', 'bar'], rims: ['five', 'mesh', 'split'], spoilers: ['wing', 'gt'], hp: [280, 420] },
};

/* ---------------------------------------------------------------- makers (fictional) */

interface Maker {
  name: string;
  /** Classes this maker builds, with how many models of each. */
  line: Array<[CarClass, number]>;
  /** Signature details turned on for every model. */
  dna: Partial<BodySpec>;
  /** Paints this maker likes. */
  paints: string[];
  /** Syllables for model names. */
  names: string[];
}

/* Inspirations (internal note only, never shown): Veyra ≈ French hypercar house; Taurino ≈ Italian
 * raging-bull wedge supercars; Cavalla ≈ Italian prancing-horse supercars; Stellmar ≈ German
 * three-point-star luxury; Kessler ≈ Bavarian sports sedans; Vierling ≈ German four-ring quattro;
 * Zuffen ≈ Stuttgart rear-engine sports cars; Hellion ≈ American supercharged muscle; Bronc ≈
 * American pony cars; Ashmoor ≈ British luxury SUVs; Ridgeback ≈ American trail 4x4s; Brute ≈
 * full-size pickups; Kaiju ≈ Japanese tuner legends; Northline ≈ American EVs; Belgrave ≈ British
 * grand tourers; Halcyon ≈ British carbon supercars; Frostvik ≈ Swedish megacars; Aurelio ≈ Italian
 * artisan hypercars; Sovereign ≈ British ultra-luxury; Civica ≈ everyday hatchbacks and sedans;
 * Heritage ≈ 1950s–70s classics; Vulcan ≈ rally-bred sedans. */
const MAKERS: Maker[] = [
  { name: 'Veyra', line: [['hyper', 9], ['gt', 3]], dna: { ccurve: true, twoTone: true }, paints: ['#1f3a8a', '#0f172a', '#7f1d1d', '#e5e7eb', '#0f766e'], names: ['Aerion', 'Solenne', 'Vantor', 'Lumen', 'Corvane', 'Esprit', 'Altair', 'Noctis', 'Celeste', 'Sabrewing', 'Orellan', 'Marquise'] },
  { name: 'Taurino', line: [['super', 11], ['hyper', 3], ['suv', 2]], dna: { intake: true, louvres: true }, paints: ['#a3e635', '#f59e0b', '#16a34a', '#111827', '#f97316', '#e11d48'], names: ['Furia', 'Toro', 'Saeta', 'Corrida', 'Bravio', 'Matador', 'Embiste', 'Rayo', 'Indomito', 'Tempesta', 'Volcan', 'Murcio', 'Asta', 'Feroz', 'Rugido', 'Cuerno'] },
  { name: 'Cavalla', line: [['super', 8], ['sports', 4], ['gt', 4]], dna: { scoop: true }, paints: ['#dc2626', '#facc15', '#111827', '#f8fafc', '#1e3a8a'], names: ['Rossa', 'Galoppo', 'Stellina', 'Fiamma', 'Ventosa', 'Corsetta', 'Spirito', 'Brianza', 'Tribuna', 'Sangue', 'Lampo', 'Albeggio', 'Velocita', 'Coronata', 'Scintilla', 'Trionfo'] },
  { name: 'Stellmar', line: [['luxury', 6], ['gt', 3], ['suv', 5], ['sedan', 4]], dna: { chromeLine: true }, paints: ['#e5e7eb', '#111827', '#64748b', '#1e293b', '#c7c2b8'], names: ['Regentia', 'Aurum', 'Kontor', 'Silbern', 'Elanor', 'Prestis', 'Vektra', 'Gelanda', 'Atlasa', 'Primus', 'Stradon', 'Kometa', 'Novella', 'Pfeil', 'Magnat', 'Kaisar', 'Optimar', 'Horizonte'] },
  { name: 'Kessler', line: [['sedan', 7], ['sports', 4], ['suv', 4], ['wagon', 3]], dna: { kink: true }, paints: ['#1d4ed8', '#e5e7eb', '#111827', '#475569', '#0e7490'], names: ['Sechs', 'Vier', 'Acht', 'Linie', 'Motor', 'Rennsport', 'Turbo', 'Alpen', 'Isar', 'Tegern', 'Werk', 'Kraft', 'Blitz', 'Zeit', 'Tour', 'Grat', 'Falke', 'Sturm'] },
  { name: 'Vierling', line: [['sedan', 5], ['super', 3], ['suv', 4], ['wagon', 4]], dna: { intake: true }, paints: ['#e5e7eb', '#475569', '#111827', '#b91c1c', '#0369a1'], names: ['Ringo', 'Quadra', 'Avant', 'Sportiv', 'Allroad', 'Rennring', 'Klar', 'Frost', 'Nebel', 'Kreis', 'Takt', 'Tempo', 'Licht', 'Spur', 'Wende', 'Fluss'] },
  { name: 'Zuffen', line: [['sports', 9], ['suv', 4], ['ev', 3], ['super', 2]], dna: { lamp: 'round' }, paints: ['#e5e7eb', '#facc15', '#16a34a', '#111827', '#1e40af', '#9ca3af'], names: ['Elfer', 'Rennbahn', 'Spinne', 'Flachmotor', 'Stromer', 'Lader', 'Dachlos', 'Windhund', 'Kurve', 'Rund', 'Feld', 'Wald', 'Lichtung', 'Strom', 'Hang', 'Weite', 'Sprint', 'Ziel'] },
  { name: 'Hellion', line: [['muscle', 10], ['sedan', 4]], dna: { hoodScoop: true, stripes: true }, paints: ['#7f1d1d', '#111827', '#ea580c', '#a21caf', '#15803d', '#f8fafc'], names: ['Inferno', 'Demonix', 'Brimstone', 'Scorch', 'Havoc', 'Spectral', 'Blaze', 'Rampart', 'Outlawz', 'Reaperz', 'Furnace', 'Torch', 'Riot', 'Cinder'] },
  { name: 'Bronc', line: [['muscle', 8], ['sports', 4]], dna: { stripes: true }, paints: ['#1d4ed8', '#f97316', '#facc15', '#111827', '#dc2626', '#e5e7eb'], names: ['Steed', 'Galloper', 'Rodeon', 'Lasso', 'Paint', 'Bucker', 'Freehand', 'Trailhand', 'Corral', 'Prairie', 'Spurr', 'Mesquite'] },
  { name: 'Ashmoor', line: [['suv', 11], ['offroad', 3]], dna: { floatRoof: true }, paints: ['#1f2937', '#e5e7eb', '#365314', '#334155', '#78716c'], names: ['Vellum', 'Sportmoor', 'Highland', 'Moor', 'Glen', 'Heath', 'Evermoor', 'Fell', 'Dale', 'Ridgeway', 'Ashby', 'Kensal', 'Brook', 'Thorn'] },
  { name: 'Ridgeback', line: [['offroad', 10], ['pickup', 4]], dna: { rack: true, fender: true }, paints: ['#15803d', '#ea580c', '#facc15', '#475569', '#111827', '#f8fafc'], names: ['Trailer', 'Summit', 'Boulder', 'Mesa', 'Arroyo', 'Granite', 'Ridgecrest', 'Badland', 'Riverford', 'Gulch', 'Talus', 'Crag', 'Scree', 'Butte'] },
  { name: 'Brute', line: [['pickup', 12]], dna: { bullbar: true }, paints: ['#111827', '#b91c1c', '#e5e7eb', '#1e3a8a', '#ca8a04', '#3f6212'], names: ['Hauler', 'Permafrost', 'Hornhead', 'Clawback', 'Highpass', 'Colossus', 'Rangeman', 'Workhorse', 'Bison', 'Mammoth', 'Grizzly', 'Moose'] },
  { name: 'Kaiju', line: [['sports', 8], ['sedan', 4], ['hatch', 3], ['super', 3]], dna: { }, paints: ['#e5e7eb', '#1d4ed8', '#dc2626', '#111827', '#facc15', '#7c3aed'], names: ['Raijin', 'Kitsune', 'Ronin', 'Tengu', 'Shogi', 'Senpai', 'Hayate', 'Kaze', 'Oni', 'Tora', 'Ryu', 'Akari', 'Sora', 'Yuki', 'Hikari', 'Daichi', 'Kumo', 'Arashi'] },
  { name: 'Northline', line: [['ev', 7], ['suv', 3], ['pickup', 2]], dna: { }, paints: ['#e5e7eb', '#111827', '#b91c1c', '#1e3a8a', '#64748b'], names: ['Volta', 'Ampere', 'Pulsar', 'Borealis', 'Polar', 'Current', 'Flux', 'Ionis', 'Tartan', 'Glacier', 'Wedge', 'Arcline'] },
  { name: 'Belgrave', line: [['gt', 7], ['sports', 3], ['suv', 2]], dna: { chromeLine: true }, paints: ['#14532d', '#1f2937', '#94a3b8', '#7f1d1d', '#e5e7eb'], names: ['Vantis', 'Rapier', 'Lagoon', 'Mayfair', 'Chelsea', 'Windmere', 'Ascot', 'Belgravia', 'Regency', 'Strand', 'Kingsway', 'Marlow'] },
  { name: 'Halcyon', line: [['super', 8], ['hyper', 4]], dna: { scoop: true }, paints: ['#f97316', '#e5e7eb', '#0f172a', '#0ea5e9', '#a3e635'], names: ['Sennet', 'Arcturo', 'Elvane', 'Longtail', 'Sabre', 'Apexa', 'Velo', 'Talon', 'Kestrel', 'Swiftwing', 'Harrier', 'Osprey'] },
  { name: 'Frostvik', line: [['hyper', 8]], dna: { louvres: true, twoTone: true }, paints: ['#f8fafc', '#0f172a', '#ea580c', '#0e7490', '#94a3b8'], names: ['Jarl', 'Gemma', 'Rimfrost', 'Aska', 'Polstjarna', 'Fjord', 'Norrsken', 'Isbrytare'] },
  { name: 'Aurelio', line: [['hyper', 8]], dna: { ccurve: true, scoop: true }, paints: ['#78350f', '#0f172a', '#e5e7eb', '#1e3a8a', '#9f1239'], names: ['Tramonto', 'Zefiro', 'Utopica', 'Orafo', 'Brezza', 'Scirocco', 'Libeccio', 'Grecalia'] },
  { name: 'Sovereign', line: [['luxury', 7], ['suv', 2], ['gt', 3]], dna: { chromeLine: true, twoTone: true }, paints: ['#0f172a', '#e5e7eb', '#3b0764', '#7f1d1d', '#c7c2b8'], names: ['Phantasm', 'Silhouette', 'Spectrum', 'Apparition', 'Diamante', 'Daybreak', 'Mulberry', 'Crossing', 'Soaring', 'Ermine', 'Majesty', 'Coronet'] },
  { name: 'Civica', line: [['hatch', 5], ['sedan', 2], ['wagon', 1], ['suv', 2]], dna: { }, paints: ['#e5e7eb', '#dc2626', '#1d4ed8', '#16a34a', '#facc15', '#475569'], names: ['Urbo', 'Pollo', 'Golfo', 'Festa', 'Jive', 'Dash', 'Clia', 'Rivo', 'Pixie', 'Pulso'] },
  { name: 'Heritage', line: [['classic', 18]], dna: { chromeBumpers: true }, paints: ['#e7d8b8', '#7dd3fc', '#dc2626', '#14532d', '#f8fafc', '#fb7185', '#1e3a8a'], names: ['Breezeway', 'Crestline', 'Starlite', 'Thunderline', 'Eldora', 'Seaside', 'Cosmica', 'Fairway', 'Wasp', 'Riviere', 'Bayshore', 'Emberbird', 'Hornbeam', 'Lancette', 'Roamer', 'Skyward', 'Ladybug', 'Camper'] },
  { name: 'Vulcan', line: [['rally', 10]], dna: { hoodScoop: true }, paints: ['#1d4ed8', '#e5e7eb', '#dc2626', '#111827', '#facc15'], names: ['Evolve', 'Impulse', 'Hillclimb', 'Gravel', 'Tarmac', 'Stage', 'Special', 'Groupe', 'Savanna', 'Montane'] },
];

/* ---------------------------------------------------------------- build the collection */

function buildBody(cls: CarClass, dna: Partial<BodySpec>, r: () => number): BodySpec {
  const p = PLAN[cls];
  const b: BodySpec = {
    len: span(r, p.len),
    ohF: span(r, p.ohF),
    ohR: span(r, p.ohR),
    wheelR: span(r, p.wheelR),
    clear: span(r, p.clear),
    nose: span(r, p.nose),
    belt: span(r, p.belt),
    roof: span(r, p.roof),
    tail: span(r, p.tail),
    hood: span(r, p.hood),
    rake: span(r, p.rake),
    roofLen: span(r, p.roofLen),
    rear: pick(r, p.rear),
    rearRun: span(r, p.rearRun),
    lamp: pick(r, p.lamp),
    rim: pick(r, p.rims),
    spoiler: pick(r, p.spoilers),
    ...dna,
  };
  if (cls === 'suv' && r() < 0.3) b.scoop = false;
  // Rear-engine sports car look (short nose, long sloping tail, round lamps).
  if (dna.lamp === 'round' && cls === 'sports') Object.assign(b, { hood: span(r, [0.16, 0.2]), rearRun: span(r, [0.3, 0.36]), roofLen: span(r, [0.13, 0.17]), rear: 'fastback' as Rear, spoiler: pick(r, ['duck', 'none', 'wing']) });
  if (cls === 'offroad' && r() < 0.5) b.spare = true;
  if (cls === 'offroad' && r() < 0.35) b.snorkel = true;
  if (cls === 'classic' && r() < 0.5) b.fender = true;
  if (cls === 'super' || cls === 'hyper') b.intake = b.intake ?? r() < 0.5;
  return b;
}

function perf(cls: CarClass, b: BodySpec, r: () => number) {
  const hp = Math.round(span(r, PLAN[cls].hp) / 10) * 10;
  // Lower, longer and more powerful cars are quicker.
  const weight = 900 + b.len * 3 + b.roof * 4;
  const t = Math.max(1.9, Math.min(12, (weight / hp) * 1.15 + 0.4));
  const top = Math.round(Math.min(490, 140 + hp * 0.22 - (b.roof - 80) * 0.6));
  return { hp, zeroTo100: Math.round(t * 10) / 10, top };
}

let cache: CarModel[] | null = null;

/** The full collection: 300 cars, the same every time (seeded). */
export function carCollection(): CarModel[] {
  if (cache) return cache;
  const out: CarModel[] = [];
  for (const m of MAKERS) {
    let n = 0;
    for (const [cls, count] of m.line) {
      for (let i = 0; i < count; i++) {
        const name = m.names[n % m.names.length] + (n >= m.names.length ? ` ${['S', 'R', 'GT', 'Evo'][Math.floor(n / m.names.length) - 1] ?? 'X'}` : '');
        const id = `car-${m.name.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const r = rng(id);
        const body = buildBody(cls, m.dna, r);
        out.push({ id, maker: m.name, model: name, cls, body, paint: m.paints[n % m.paints.length], ...perf(cls, body, r) });
        n++;
      }
    }
  }
  cache = out;
  return out;
}

export const CLASS_LABEL: Record<CarClass, string> = {
  hyper: 'Hypercar',
  super: 'Supercar',
  sports: 'Sports car',
  gt: 'Grand tourer',
  muscle: 'Muscle car',
  sedan: 'Sports sedan',
  luxury: 'Luxury sedan',
  suv: 'SUV',
  offroad: 'Off-road',
  pickup: 'Pickup',
  hatch: 'Hatchback',
  ev: 'Electric',
  classic: 'Classic',
  wagon: 'Wagon',
  rally: 'Rally',
};

/** Hand-made body plans for the five cars from before 2026-11-14 (ids kept so owners keep them). */
export const LEGACY_BODIES: Record<string, { cls: CarClass; body: BodySpec }> = {
  'v-hatch': { cls: 'hatch', body: { len: 286, ohF: 0.17, ohR: 0.13, wheelR: 25, clear: 16, nose: 52, belt: 74, roof: 110, tail: 78, hood: 0.2, rake: 1.5, roofLen: 0.33, rear: 'hatch', rearRun: 0.06, lamp: 'round', rim: 'five', spoiler: 'none' } },
  'v-coupe': { cls: 'sports', body: { len: 322, ohF: 0.18, ohR: 0.2, wheelR: 28, clear: 12, nose: 38, belt: 62, roof: 90, tail: 62, hood: 0.27, rake: 2, roofLen: 0.14, rear: 'fastback', rearRun: 0.27, lamp: 'slim', rim: 'split', spoiler: 'duck' } },
  'v-classic': { cls: 'classic', body: { len: 340, ohF: 0.19, ohR: 0.23, wheelR: 25, clear: 17, nose: 52, belt: 66, roof: 96, tail: 64, hood: 0.32, rake: 1.4, roofLen: 0.2, rear: 'open', rearRun: 0.14, lamp: 'round', rim: 'wire', spoiler: 'none', chromeBumpers: true, fender: true } },
  'v-retro': { cls: 'classic', body: { len: 330, ohF: 0.18, ohR: 0.22, wheelR: 25, clear: 16, nose: 50, belt: 64, roof: 94, tail: 62, hood: 0.34, rake: 1.6, roofLen: 0.16, rear: 'fastback', rearRun: 0.16, lamp: 'round', rim: 'dish', spoiler: 'none', chromeBumpers: true } },
  'v-super': { cls: 'hyper', body: { len: 362, ohF: 0.19, ohR: 0.22, wheelR: 31, clear: 10, nose: 30, belt: 54, roof: 78, tail: 58, hood: 0.23, rake: 2.6, roofLen: 0.12, rear: 'wedge', rearRun: 0.26, lamp: 'slim', rim: 'turbine', spoiler: 'wing', intake: true } },
};
