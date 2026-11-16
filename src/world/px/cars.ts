import { Mask, Px, luma, mixHex, ramp, type Pt } from './raster';

/**
 * Pixel-art cars, side view, facing right (2026-11-16).
 * One canvas size and one pixel size for every car, so a hatchback, a pickup and a hypercar
 * stand at their true sizes next to each other. Wheels are big on purpose (arcade-racer look).
 *
 * Shapes are written as [x, height above the ground] points; the drawer turns them into pixels,
 * cuts the wheel arches, shades the paint (light from the top left), adds glass, lights, trim,
 * the chosen parts and livery, then outlines the whole sprite.
 */

export const CAR_W = 128;
export const CAR_H = 50;
/** The ground row (height 0). */
export const GY = 46;

export type Extra =
  | 'scoop'
  | 'blower'
  | 'vents'
  | 'roofrack'
  | 'exhaust'
  | 'lightpod'
  | 'snorkel'
  | 'fin'
  | 'batfins'
  | 'sidepipes'
  | 'louvers'
  | 'bed'
  | 'softtop'
  | 'underglow'
  | 'turbine'
  | 'wheelie'
  | 'pins'
  | 'number'
  | 'spare';

export interface CarShape {
  /** Upper outline from the rear end to the front end. */
  top: Pt[];
  /** Lower outline from the front end back to the rear end. */
  bottom: Pt[];
  glass: Pt[];
  pillars?: number[];
  belt: number;
  wheels: [number, number];
  r: number;
  /** Rear wheel radius when different (pro-street muscle). */
  rr?: number;
  head: Pt[];
  tail: Pt[];
  doors?: number[];
  handle?: number;
  mirror?: [number, number];
  intake?: Pt[][];
  extras?: Extra[];
  /** Factory parts. */
  rim: string;
  spoiler: string;
  kit?: string;
  livery?: string;
  rimColor?: string;
  /** Tyre wall in pixels (default 3). */
  tyre?: number;
}

/* ------------------------------------------------------------------ shapes */

export const SHAPES: Record<string, CarShape> = {
  /** Small, upright city hatchback: short nose, tall glasshouse, cheeky round lights. */
  hatch: {
    top: [[22, 13], [21, 22], [22, 28], [26, 33], [30, 34], [62, 34], [66, 33], [78, 24], [94, 22], [101, 20], [104, 17], [105, 12]],
    bottom: [[104, 7], [101, 4], [26, 4], [22, 7]],
    glass: [[25, 25], [27, 31], [30, 32.5], [61, 32.5], [64, 31.5], [74, 25]],
    pillars: [44, 31],
    belt: 24,
    wheels: [34, 91],
    r: 9,
    head: [[98, 20], [102, 19], [103, 16], [99, 16]],
    tail: [[22, 23], [24, 23], [24, 17], [21.5, 17]],
    doors: [47, 73],
    handle: 50,
    mirror: [74, 25],
    intake: [[[101, 11], [105, 11], [104, 7], [101, 7]]],
    rim: 'five',
    spoiler: 'lip',
  },
  /** Long, low estate with a roof rack. */
  wagon: {
    top: [[12, 13], [12, 22], [14, 29], [17, 32], [62, 32], [67, 31], [80, 24], [100, 21], [109, 19], [113, 15], [113, 11]],
    bottom: [[112, 7], [108, 4], [16, 4], [12, 7]],
    glass: [[16, 24], [18, 30], [20, 31], [61, 31], [65, 30], [77, 24]],
    pillars: [32, 50],
    belt: 23,
    wheels: [29, 97],
    r: 9,
    head: [[106, 19], [111, 18], [112, 15], [106, 16]],
    tail: [[12, 22], [15, 22], [15, 16], [12, 16]],
    doors: [52, 76],
    handle: 55,
    mirror: [78, 24],
    intake: [[[109, 11], [113, 11], [112, 7], [109, 7]]],
    extras: ['roofrack'],
    rim: 'multi',
    spoiler: 'none',
  },
  /** Pickup truck: tall cab, open bed, chunky tyres. */
  pickup: {
    top: [[10, 16], [10, 25], [46, 25], [46, 26], [49, 37], [53, 39], [71, 39], [75, 37], [84, 29], [104, 28], [113, 26], [116, 22], [116, 14]],
    bottom: [[116, 9], [112, 7], [14, 7], [10, 10]],
    glass: [[50, 29], [53, 37], [55, 37.5], [70, 37.5], [73, 36], [81, 29]],
    pillars: [62],
    belt: 28,
    wheels: [27, 98],
    r: 11,
    head: [[110, 27], [115, 26], [115, 22], [110, 23]],
    tail: [[10, 24], [12, 24], [12, 18], [10, 18]],
    doors: [47, 80],
    handle: 51,
    mirror: [82, 30],
    intake: [[[110, 21], [116, 21], [116, 15], [110, 15]]],
    extras: ['bed'],
    rim: 'offroad',
    spoiler: 'none',
    tyre: 4,
  },
  /** Boxy off-roader with a snorkel and a spare wheel on the back. */
  offroad: {
    top: [[14, 15], [14, 37], [16, 40], [70, 40], [73, 38], [80, 30], [100, 29], [108, 28], [110, 24], [110, 14]],
    bottom: [[110, 9], [106, 8], [18, 8], [14, 11]],
    glass: [[18, 30], [18, 37.5], [69, 37.5], [72, 36], [78, 30]],
    pillars: [36, 54],
    belt: 29,
    wheels: [31, 93],
    r: 11,
    head: [[105, 27], [109, 27], [109, 23], [105, 23]],
    tail: [[14, 28], [16, 28], [16, 22], [14, 22]],
    doors: [37, 56, 77],
    handle: 59,
    mirror: [79, 31],
    intake: [[[104, 21], [110, 21], [110, 14], [104, 14]]],
    extras: ['snorkel', 'spare', 'roofrack'],
    rim: 'beadlock',
    spoiler: 'none',
    tyre: 4,
  },
  /** Mid-size sports coupe: long hood, fastback roof. */
  coupe: {
    top: [[14, 12], [14, 19], [17, 22], [28, 23], [38, 25], [50, 31], [57, 32.5], [68, 32.5], [75, 30], [86, 23], [104, 21], [111, 19], [114, 15], [114, 11]],
    bottom: [[113, 6], [108, 4], [20, 4], [15, 6]],
    glass: [[41, 24.5], [50, 30], [57, 31.5], [67, 31.5], [74, 29], [84, 24]],
    pillars: [55],
    belt: 23,
    wheels: [31, 97],
    r: 9,
    head: [[106, 20], [112, 18], [113, 16], [107, 17]],
    tail: [[14, 19], [17, 21], [17, 17], [14, 16]],
    doors: [55, 83],
    handle: 59,
    mirror: [84, 24],
    intake: [[[108, 9], [114, 10], [113, 6], [108, 6]]],
    rim: 'split',
    spoiler: 'duck',
  },
  /** Street tuner: wedge nose, pop-up-light hood, hatch with a big wing. */
  tuner: {
    top: [[14, 12], [14, 20], [17, 24], [30, 26], [42, 29], [52, 31], [66, 31], [74, 28], [86, 22], [104, 19], [111, 17], [114, 13], [114, 10]],
    bottom: [[113, 6], [108, 4], [20, 4], [15, 6]],
    glass: [[33, 25.5], [44, 28.5], [52, 30], [65, 30], [72, 27], [83, 22.5]],
    pillars: [50],
    belt: 22,
    wheels: [31, 97],
    r: 9,
    head: [[105, 18], [112, 16], [112, 14], [105, 15]],
    tail: [[14, 20], [18, 21], [18, 17], [14, 16]],
    doors: [52, 82],
    handle: 56,
    mirror: [83, 23],
    intake: [[[106, 9], [114, 9], [113, 6], [106, 6]]],
    extras: ['vents'],
    rim: 'mesh',
    spoiler: 'wing',
    kit: 'sport',
    livery: 'stripe',
  },
  /** Late-60s muscle: long flat hood, short deck, hood scoop. */
  muscle: {
    top: [[10, 14], [10, 23], [13, 25], [28, 25], [34, 27], [44, 33], [50, 34], [64, 34], [70, 32], [78, 26], [110, 25], [116, 23], [117, 19], [117, 13]],
    bottom: [[117, 8], [113, 5], [16, 5], [10, 8]],
    glass: [[38, 27], [45, 32.5], [50, 33], [63, 33], [68, 31.5], [76, 26]],
    pillars: [56],
    belt: 25,
    wheels: [29, 99],
    r: 10,
    head: [[113, 23], [116, 23], [116, 20], [113, 20]],
    tail: [[10, 22], [13, 22], [13, 18], [10, 18]],
    doors: [55, 77],
    handle: 59,
    mirror: [77, 27],
    intake: [[[111, 18], [117, 18], [117, 13], [111, 13]]],
    extras: ['scoop', 'pins'],
    rim: 'dish',
    spoiler: 'duck',
    livery: 'racing',
  },
  /** 60s open roadster with chrome and whitewalls. */
  classic: {
    top: [[12, 13], [12, 20], [16, 23], [32, 24], [40, 25], [44, 29], [46, 25], [74, 25], [80, 31], [82, 31], [84, 25], [96, 24], [108, 22], [114, 19], [116, 15], [116, 11]],
    bottom: [[115, 7], [110, 5], [18, 5], [12, 8]],
    glass: [[76, 25], [80, 30.5], [82, 30.5], [80, 25]],
    belt: 22,
    wheels: [30, 98],
    r: 9,
    head: [[110, 21], [115, 19], [115, 16], [110, 17]],
    tail: [[12, 19], [15, 21], [15, 17], [12, 16]],
    doors: [54, 78],
    handle: 58,
    intake: [[[110, 12], [116, 12], [115, 8], [110, 8]]],
    extras: ['softtop'],
    rim: 'wire',
    spoiler: 'none',
    livery: 'pinline',
    rimColor: '#e8edf2',
  },
  /** Grand tourer: very long hood, cab set back, smooth tail. */
  gt: {
    top: [[12, 12], [12, 19], [16, 23], [26, 24], [36, 26], [46, 31], [54, 32.5], [64, 32.5], [71, 30], [82, 23], [106, 21], [113, 18], [116, 14], [116, 10]],
    bottom: [[115, 6], [110, 4], [18, 4], [13, 6]],
    glass: [[39, 25.5], [47, 30.5], [54, 31.5], [63, 31.5], [70, 29], [80, 23.5]],
    pillars: [52],
    belt: 23,
    wheels: [29, 99],
    r: 9.5,
    head: [[108, 20], [114, 17], [114, 15], [108, 17]],
    tail: [[12, 19], [16, 21], [16, 17], [12, 16]],
    doors: [52, 80],
    handle: 56,
    mirror: [80, 24],
    intake: [[[109, 8], [116, 9], [115, 5], [109, 5]]],
    extras: ['vents', 'exhaust'],
    rim: 'turbine',
    spoiler: 'lip',
  },
  /** Mid-engine supercar: cab forward, side intake, low wedge. */
  super: {
    top: [[14, 11], [14, 19], [18, 21], [32, 22], [46, 27], [56, 30], [66, 30], [74, 27], [86, 20], [104, 17], [111, 15], [115, 12], [115, 9]],
    bottom: [[114, 5], [108, 3], [20, 3], [15, 5]],
    glass: [[48, 26], [56, 29], [66, 29], [73, 26], [84, 20]],
    belt: 19,
    wheels: [30, 98],
    r: 9.5,
    head: [[105, 16], [112, 14], [112, 13], [106, 14]],
    tail: [[14, 18], [19, 19], [19, 16], [14, 15]],
    doors: [80],
    intake: [[[36, 17], [46, 19], [44, 11], [36, 11]], [[108, 7], [115, 8], [114, 4], [108, 4]]],
    extras: ['louvers', 'exhaust'],
    rim: 'split',
    spoiler: 'wing',
    rimColor: '#2a2c33',
  },
  /** Rally hatch: raised, mud flaps, light pod, roof scoop. */
  rally: {
    top: [[20, 15], [19, 24], [21, 30], [25, 35], [29, 36], [60, 36], [64, 35], [76, 26], [93, 24], [101, 22], [104, 19], [105, 14]],
    bottom: [[104, 9], [101, 6], [25, 6], [20, 9]],
    glass: [[24, 27], [26, 33], [29, 34.5], [59, 34.5], [62, 33.5], [72, 27]],
    pillars: [44],
    belt: 26,
    wheels: [33, 91],
    r: 9.5,
    head: [[98, 22], [102, 21], [103, 18], [99, 18]],
    tail: [[20, 25], [22, 25], [22, 19], [20, 19]],
    doors: [46, 71],
    handle: 49,
    mirror: [72, 27],
    intake: [[[100, 13], [105, 13], [104, 9], [100, 9]]],
    extras: ['lightpod', 'number'],
    rim: 'offroad',
    spoiler: 'wing',
    kit: 'rally',
    livery: 'rally',
    rimColor: '#f1f1ec',
  },
  /** Touring race car: saloon with a splitter, wing and race number. */
  touring: {
    top: [[12, 12], [12, 21], [15, 23], [28, 24], [36, 27], [44, 32], [50, 33], [68, 33], [74, 31], [86, 24], [104, 22], [111, 20], [114, 16], [114, 10]],
    bottom: [[114, 5], [109, 3], [18, 3], [12, 6]],
    glass: [[38, 27], [45, 31.5], [50, 32], [67, 32], [72, 30], [83, 24.5]],
    pillars: [58],
    belt: 23,
    wheels: [30, 97],
    r: 9.5,
    head: [[106, 21], [112, 19], [113, 17], [107, 18]],
    tail: [[12, 21], [15, 22], [15, 17], [12, 17]],
    doors: [58, 82],
    mirror: [83, 25],
    intake: [[[107, 9], [114, 10], [114, 5], [107, 5]]],
    extras: ['number', 'exhaust'],
    rim: 'multi',
    spoiler: 'gt',
    kit: 'wide',
    livery: 'racing',
    rimColor: '#e9e3d0',
  },
  /** Tiny boxy city car: all cabin, no nose. */
  kei: {
    top: [[30, 10], [30, 31], [32, 36], [36, 38], [78, 38], [82, 36], [90, 25], [96, 23], [98, 19], [98, 10]],
    bottom: [[98, 6], [95, 4], [33, 4], [30, 6]],
    glass: [[33, 29], [34, 35], [37, 36.5], [77, 36.5], [80, 35], [87, 26]],
    pillars: [56],
    belt: 27,
    wheels: [43, 86],
    r: 8,
    head: [[93, 22], [97, 21], [97, 17], [93, 17]],
    tail: [[30, 27], [32, 27], [32, 20], [30, 20]],
    doors: [58],
    handle: 60,
    mirror: [86, 27],
    rim: 'hubcap',
    spoiler: 'none',
  },
  /** Camper van: tall roof, big side window, sliding door. */
  van: {
    top: [[12, 10], [12, 38], [14, 41], [18, 42], [86, 42], [92, 40], [100, 28], [108, 25], [113, 21], [114, 12]],
    bottom: [[113, 6], [109, 4], [16, 4], [12, 7]],
    glass: [[16, 30], [16, 38], [18, 39], [84, 39], [88, 37.5], [96, 29]],
    pillars: [40, 62, 82],
    belt: 28,
    wheels: [28, 97],
    r: 9,
    head: [[106, 24], [112, 22], [113, 18], [107, 18]],
    tail: [[12, 30], [14, 30], [14, 20], [12, 20]],
    doors: [62, 84],
    handle: 66,
    mirror: [96, 30],
    extras: ['roofrack'],
    rim: 'dish',
    spoiler: 'none',
  },
  /** Smooth electric saloon: long glass roof, flush everything. */
  sedan: {
    top: [[12, 13], [12, 20], [16, 23], [32, 25], [40, 30], [48, 33], [72, 33], [80, 29], [90, 23], [106, 21], [113, 18], [115, 13]],
    bottom: [[114, 6], [110, 4], [16, 4], [12, 7]],
    glass: [[38, 26.5], [46, 31.5], [50, 32], [71, 32], [78, 28.5], [86, 23.5]],
    pillars: [62],
    belt: 23,
    wheels: [31, 97],
    r: 9.5,
    head: [[104, 20], [113, 17], [113, 16], [104, 18]],
    tail: [[12, 19], [16, 20], [16, 18], [12, 17]],
    doors: [60, 84],
    handle: 64,
    mirror: [86, 24],
    rim: 'aero',
    spoiler: 'lip',
    rimColor: '#2a2c33',
  },
  /** Drift coupe: long nose, pop-up-era wedge, wide fenders. */
  drift: {
    top: [[14, 13], [14, 21], [18, 24], [34, 26], [42, 31], [50, 33], [66, 33], [72, 30], [84, 23], [104, 20], [112, 17], [114, 12]],
    bottom: [[113, 6], [109, 3], [18, 3], [14, 6]],
    glass: [[40, 27.5], [48, 32], [52, 32], [65, 32], [70, 29.5], [80, 24]],
    pillars: [58],
    belt: 23,
    wheels: [30, 96],
    r: 9.5,
    head: [[104, 19], [111, 17], [112, 15], [105, 16]],
    tail: [[14, 21], [18, 22], [18, 17], [14, 17]],
    doors: [58, 80],
    mirror: [80, 24.5],
    intake: [[[106, 10], [113, 10], [113, 6], [106, 6]]],
    extras: ['exhaust'],
    rim: 'mesh',
    spoiler: 'duck',
    kit: 'wide',
    livery: 'vinyl',
    rimColor: '#c9a227',
  },
  /** Lowrider: long, slammed classic with wire wheels. */
  lowrider: {
    top: [[8, 12], [8, 19], [12, 21], [30, 22], [38, 29], [44, 31], [70, 31], [78, 27], [84, 22], [110, 20], [118, 17], [119, 12]],
    bottom: [[118, 6], [114, 4], [12, 4], [8, 7]],
    glass: [[39, 28], [45, 30], [69, 30], [75, 27], [80, 22.5]],
    pillars: [58],
    belt: 21,
    wheels: [28, 99],
    r: 8.5,
    head: [[112, 19], [118, 17], [118, 14], [112, 15]],
    tail: [[8, 18], [11, 19], [11, 14], [8, 14]],
    doors: [56, 80],
    handle: 60,
    mirror: [80, 23],
    extras: ['pins'],
    rim: 'wire',
    spoiler: 'none',
    livery: 'pinline',
    rimColor: '#e9e3d0',
  },
  /** Endurance prototype: long tail, fin, bubble cockpit. */
  proto: {
    top: [[8, 10], [8, 21], [12, 22], [30, 21], [44, 22], [52, 27], [58, 29], [66, 29], [72, 26], [80, 19], [100, 15], [112, 12], [118, 9], [118, 6]],
    bottom: [[118, 4], [112, 2], [12, 2], [8, 5]],
    glass: [[54, 25], [59, 28], [66, 28], [70, 25.5], [76, 20.5]],
    belt: 17,
    wheels: [27, 101],
    r: 9.5,
    head: [[104, 14], [112, 12], [112, 11], [104, 12]],
    tail: [[8, 18], [11, 19], [11, 16], [8, 15]],
    intake: [[[36, 15], [48, 17], [46, 10], [36, 10]]],
    extras: ['fin', 'number'],
    rim: 'aero',
    spoiler: 'gt',
    livery: 'racing',
    rimColor: '#2a2c33',
  },
  /** Retro roadster: rounded wings, separate headlight pods. */
  roadster: {
    top: [[16, 13], [16, 20], [20, 24], [34, 25], [40, 25], [44, 28], [47, 25], [70, 25], [75, 30], [77, 30], [80, 25], [90, 25], [96, 27], [102, 26], [108, 22], [112, 17], [112, 12]],
    bottom: [[111, 7], [106, 5], [22, 5], [16, 8]],
    glass: [[72, 25], [75.5, 29.5], [77, 29.5], [75, 25]],
    belt: 22,
    wheels: [33, 96],
    r: 9,
    head: [[100, 25], [104, 25], [104, 22], [100, 22]],
    tail: [[16, 19], [19, 21], [19, 17], [16, 16]],
    doors: [52, 72],
    handle: 56,
    intake: [[[107, 13], [112, 13], [111, 8], [107, 8]]],
    rim: 'wire',
    spoiler: 'none',
    livery: 'pinline',
    rimColor: '#e8edf2',
  },
  /* ------------------------------------------ legendary (original designs) */
  /** Nocturne: armoured night cruiser with twin tail fins and a jet turbine (bat-inspired, original). */
  nocturne: {
    top: [[4, 10], [4, 21], [5, 33], [7, 33], [13, 25], [20, 21], [34, 22], [46, 27], [54, 30], [64, 30], [72, 26], [84, 21], [104, 19], [116, 16], [122, 12], [123, 8]],
    bottom: [[122, 5], [116, 3], [10, 3], [4, 6]],
    glass: [[50, 26], [56, 29], [63, 29], [70, 25.5], [80, 21]],
    belt: 19,
    wheels: [28, 102],
    r: 10,
    head: [[110, 18], [120, 15], [120, 14], [110, 16]],
    tail: [[4, 17], [8, 18], [8, 14], [4, 13]],
    intake: [[[34, 17], [46, 19], [46, 12], [34, 12]], [[113, 9], [122, 10], [121, 6], [113, 6]]],
    extras: ['turbine', 'louvers'],
    rim: 'turbine',
    spoiler: 'none',
    livery: 'none',
    rimColor: '#24262c',
    tyre: 4,
  },
  /** Quarter King: pro-street muscle with a supercharger through the hood and a wheelie bar. */
  quarter: {
    top: [[12, 16], [12, 25], [15, 27], [28, 27], [34, 29], [44, 35], [50, 36], [64, 36], [70, 34], [78, 28], [110, 27], [116, 25], [117, 21], [117, 15]],
    bottom: [[117, 9], [113, 6], [18, 6], [12, 9]],
    glass: [[38, 29], [45, 34.5], [50, 35], [63, 35], [68, 33.5], [76, 28]],
    pillars: [56],
    belt: 27,
    wheels: [30, 100],
    r: 9,
    rr: 12,
    head: [[112, 25], [116, 25], [116, 21], [112, 21]],
    tail: [[12, 24], [15, 24], [15, 20], [12, 20]],
    doors: [55, 77],
    handle: 59,
    mirror: [77, 29],
    intake: [[[111, 20], [117, 20], [117, 15], [111, 15]]],
    extras: ['blower', 'wheelie', 'sidepipes'],
    rim: 'dish',
    spoiler: 'duck',
    livery: 'stripe',
    rimColor: '#dfe4ea',
    tyre: 4,
  },
  /** Midnight Kaze: widebody street racer with underglow and a wild vinyl (street-racing-inspired, original). */
  kaze: {
    top: [[12, 11], [12, 20], [15, 24], [28, 26], [40, 29], [50, 31], [65, 31], [73, 28], [86, 21], [104, 18], [112, 16], [115, 12], [115, 9]],
    bottom: [[114, 4], [108, 2], [18, 2], [13, 4]],
    glass: [[31, 25.5], [42, 28.5], [50, 30], [64, 30], [71, 27], [83, 21.5]],
    pillars: [49],
    belt: 21,
    wheels: [30, 98],
    r: 9.5,
    head: [[105, 17], [113, 15], [113, 13], [105, 14]],
    tail: [[12, 19], [17, 20], [17, 16], [12, 15]],
    doors: [52, 82],
    mirror: [83, 22],
    intake: [[[105, 8], [115, 8], [114, 4], [105, 4]]],
    extras: ['underglow', 'vents', 'exhaust'],
    rim: 'multi',
    spoiler: 'gt',
    kit: 'wide',
    livery: 'vinyl',
    rimColor: '#c9cdd4',
  },
  /** Sidewinder B: 80s rally monster, boxy wedge, giant wing and light pod. */
  sidewinder: {
    top: [[16, 15], [16, 27], [20, 31], [26, 35], [58, 35], [62, 34], [74, 26], [96, 23], [104, 21], [108, 18], [108, 13]],
    bottom: [[108, 8], [104, 6], [22, 6], [16, 9]],
    glass: [[27, 27], [28, 33.5], [57, 33.5], [60, 32.5], [70, 27]],
    pillars: [44],
    belt: 26,
    wheels: [32, 93],
    r: 10,
    head: [[101, 21], [106, 20], [107, 17], [101, 18]],
    tail: [[16, 26], [19, 26], [19, 20], [16, 20]],
    doors: [45, 70],
    handle: 48,
    mirror: [70, 27],
    intake: [[[20, 22], [26, 22], [26, 16], [20, 16]], [[102, 12], [108, 12], [107, 8], [102, 8]]],
    extras: ['lightpod', 'number', 'louvers'],
    rim: 'offroad',
    spoiler: 'gt',
    kit: 'rally',
    livery: 'rally',
    rimColor: '#f1f1ec',
  },
  /** Phantom LM: endurance hypercar with shark fin and glowing light bars. */
  phantom: {
    top: [[6, 9], [6, 22], [10, 23], [28, 22], [44, 23], [52, 28], [58, 30], [67, 30], [73, 27], [82, 19], [102, 15], [114, 12], [120, 8], [120, 5]],
    bottom: [[120, 3], [114, 1.5], [10, 1.5], [6, 4]],
    glass: [[54, 26], [59, 29], [67, 29], [71, 26.5], [78, 20.5]],
    belt: 17,
    wheels: [26, 102],
    r: 10,
    head: [[106, 14], [116, 11], [116, 10], [106, 12]],
    tail: [[6, 19], [10, 20], [10, 18], [6, 17]],
    intake: [[[34, 15], [48, 17], [46, 9], [34, 9]]],
    extras: ['fin', 'number', 'louvers'],
    rim: 'aero',
    spoiler: 'gt',
    livery: 'racing',
    rimColor: '#1f2127',
  },
};

/* ------------------------------------------------------------------ parts */

export interface CarLook {
  paint: string;
  rim?: string;
  rimColor?: string;
  spoiler?: string;
  kit?: string;
  stance?: string;
  livery?: string;
  /** Livery colour (defaults to a contrasting white or ink). */
  accent?: string;
  /** Headlights and underglow on (night garage). */
  lights?: boolean;
}

export const RIM_STYLES = ['five', 'split', 'multi', 'mesh', 'dish', 'hubcap', 'offroad', 'beadlock', 'wire', 'turbine', 'aero', 'rays'] as const;

const TYRE = ['#111216', '#1b1c21', '#26272e', '#34363e'];
const TRIM = '#16171c';
const OUTLINE = '#0b0c10';

function rimShade(base: string) {
  const r = ramp(base);
  return { hi: r[6], lt: r[5], mid: r[3], dk: r[1], deep: r[0] };
}

/** One wheel: tyre, sidewall light, rim pattern, brake and caliper. */
export function drawWheel(px: Px, cx: number, cy: number, r: number, style: string, rimColor: string, opts: { tyre?: number; caliper?: string; whitewall?: boolean } = {}) {
  const t = opts.tyre ?? 2.5;
  const rr = r - t;
  const c = rimShade(rimColor);
  for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++)
    for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d = Math.hypot(dx, dy);
      if (d > r) continue;
      const a = Math.atan2(dy, dx); // 0 = right, +pi/2 = down
      const lightFace = -dx - dy; // >0 = top-left
      if (d > rr) {
        // tyre: tread edge darkest, sidewall catches a little light top-left
        let col = d > r - 0.8 ? TYRE[0] : lightFace > r * 0.6 ? TYRE[3] : lightFace > 0 ? TYRE[2] : TYRE[1];
        if (opts.whitewall && d > rr + 0.6 && d < rr + 1.8) col = '#e9e6dd';
        px.set(x, y, col);
        continue;
      }
      // rim
      const lip = d > rr - 1;
      if (lip) {
        px.set(x, y, lightFace > 0 ? c.hi : lightFace > -rr * 0.6 ? c.lt : c.mid);
        continue;
      }
      // brake disc behind the spokes
      let col = d < rr * 0.5 ? '#23252c' : '#2e3139';
      if (opts.caliper && a > -1.5 && a < -0.5 && d > rr * 0.45 && d < rr - 1) col = opts.caliper;
      const spoke = rimSpoke(style, d, a, rr, dx, dy);
      if (spoke === 2) col = lightFace > 0 ? c.lt : c.mid;
      else if (spoke === 1) col = lightFace > 0 ? c.mid : c.dk;
      else if (spoke === 3) col = c.deep;
      px.set(x, y, col);
    }
  // centre cap
  px.set(Math.floor(cx), Math.floor(cy), c.deep);
  px.set(Math.floor(cx) - 1, Math.floor(cy) - 1, c.hi);
}

/** 0 = gap, 1 = spoke in shade, 2 = spoke in light, 3 = dark detail. */
function rimSpoke(style: string, d: number, a: number, rr: number, dx: number, dy: number): number {
  const spokes = (n: number, w: number, off = 0) => {
    for (let k = 0; k < n; k++) {
      const th = off + (k * Math.PI * 2) / n;
      const along = Math.cos(a - th) * d;
      const across = Math.abs(Math.sin(a - th) * d);
      if (along > 0 && across < w) return true;
    }
    return false;
  };
  const hub = d < rr * 0.34;
  switch (style) {
    case 'five':
      return hub ? 2 : spokes(5, 1.1, -Math.PI / 2) ? 2 : 0;
    case 'split':
      return hub ? 2 : spokes(5, 0.55, -Math.PI / 2 - 0.22) || spokes(5, 0.55, -Math.PI / 2 + 0.22) ? 2 : 0;
    case 'multi':
      return hub ? 2 : spokes(10, 0.55, -Math.PI / 2) ? 2 : 0;
    case 'rays':
      return hub ? 2 : spokes(6, 0.75, -Math.PI / 2) ? 2 : 0;
    case 'mesh': {
      if (hub) return 2;
      const x = Math.round(dx);
      const y = Math.round(dy);
      return (x + y) % 2 === 0 || (x - y) % 3 === 0 ? 2 : 1;
    }
    case 'dish':
      if (d > rr * 0.62) return d > rr * 0.72 ? 2 : 3;
      return hub ? 2 : spokes(5, 0.9, -Math.PI / 2) ? 2 : 0;
    case 'hubcap':
      if (d > rr * 0.86) return 1;
      return d > rr * 0.5 && spokes(8, 0.5) ? 1 : 2;
    case 'offroad':
      return hub ? 2 : spokes(6, 1.5, -Math.PI / 2) ? 2 : 0;
    case 'beadlock': {
      if (d > rr * 0.7) {
        const bolt = Math.abs(((a / (Math.PI * 2)) * 12) % 1) < 0.18;
        return bolt ? 2 : 3;
      }
      return hub ? 2 : spokes(5, 1.4, -Math.PI / 2) ? 1 : 0;
    }
    case 'wire':
      return hub ? 2 : spokes(14, 0.38, (d / rr) * 0.6) ? 2 : 3;
    case 'turbine': {
      if (hub) return 2;
      return spokes(7, 0.8, -Math.PI / 2 + d * 0.18) ? 2 : 0;
    }
    case 'aero':
      if (d < rr * 0.3) return 3;
      return d > rr * 0.55 && d < rr * 0.75 && spokes(4, 0.9, Math.PI / 4) ? 3 : 2;
    default:
      return hub ? 2 : spokes(5, 1.1, -Math.PI / 2) ? 2 : 0;
  }
}

/* ------------------------------------------------------------------ drawing */

export function drawCar(shape: CarShape, look: CarLook, opts: { w?: number; h?: number; gy?: number; ox?: number } = {}): Px {
  const W = opts.w ?? CAR_W;
  const H = opts.h ?? CAR_H;
  const gy = opts.gy ?? GY;
  const ox = opts.ox ?? 0;
  const px = new Px(W, H);
  const pr = ramp(look.paint);
  const rim = look.rim ?? shape.rim;
  const rimColor = look.rimColor ?? shape.rimColor ?? '#c3c8d0';
  const spoiler = look.spoiler ?? shape.spoiler;
  const kit = look.kit ?? shape.kit ?? 'stock';
  const livery = look.livery ?? shape.livery ?? 'none';
  const stance = look.stance ?? 'stock';
  const lift = stance === 'low' ? -1.5 : stance === 'lifted' ? 3 : 0;
  const extras = new Set(shape.extras ?? []);
  const accent = look.accent ?? (luma(look.paint) > 0.62 ? '#1d1f26' : '#f4f1ea');
  const Y = (h: number) => gy - h - lift;
  const X = (x: number) => x + ox;
  const pt = ([x, h]: Pt): Pt => [X(x), Y(h)];
  const r = shape.r + (stance === 'lifted' ? 0.5 : 0);
  const rrRear = (shape.rr ?? shape.r) + (stance === 'lifted' ? 0.5 : 0);
  const wy = (rad: number) => gy - rad;
  const wheels: Array<{ x: number; r: number }> = [
    { x: X(shape.wheels[0]), r: rrRear },
    { x: X(shape.wheels[1]), r },
  ];

  const x0 = X(shape.top[0][0]);
  const x1 = X(shape.top[shape.top.length - 1][0]);

  // body mask
  const body = new Mask(W, H);
  body.poly([...shape.top.map(pt), ...shape.bottom.map(pt)]);

  // body kits that change the silhouette
  if (kit === 'wide' || extras.has('turbine')) {
    // fender flares bulge out over each wheel
    for (const w of wheels) {
      const cy = wy(w.r);
      for (let y = Math.floor(cy - w.r - 4); y <= cy; y++)
        for (let x = Math.floor(w.x - w.r - 4); x <= w.x + w.r + 4; x++) {
          const d = Math.hypot(x + 0.5 - w.x, y + 0.5 - cy);
          if (d <= w.r + 3.6 && d > w.r && y >= body.top(x) - 1) body.put(x, y);
        }
    }
  }
  if (kit === 'sport' || kit === 'wide') {
    // side skirt down to the ground line between the wheels
    for (let x = Math.round(wheels[0].x + wheels[0].r + 2); x <= wheels[1].x - r - 2; x++) body.put(x, body.bottom(x) + 1);
  }

  // wheel arches: cut out around each wheel
  const inner = new Mask(W, H);
  for (const w of wheels) {
    const cy = wy(w.r);
    for (let y = Math.floor(cy - w.r - 3); y <= Math.ceil(cy + w.r + 1); y++)
      for (let x = Math.floor(w.x - w.r - 3); x <= Math.ceil(w.x + w.r + 3); x++) {
        const d = Math.hypot(x + 0.5 - w.x, y + 0.5 - cy);
        if (d <= w.r + 1.6 && body.on(x, y)) {
          body.put(x, y, 0);
          inner.put(x, y);
        }
      }
  }

  // paint shading
  const yBelt = Math.round(Y(shape.belt));
  const tops: number[] = [];
  for (let x = 0; x < W; x++) tops[x] = body.top(x);
  for (let x = 0; x < W; x++) {
    const top = tops[x];
    if (top < 0) continue;
    const bot = body.bottom(x);
    const flat = Math.abs((tops[x + 1] ?? top) - (tops[x - 1] ?? top)) <= 1 && tops[x + 1] >= 0 && tops[x - 1] >= 0;
    for (let y = top; y <= bot; y++) {
      if (!body.on(x, y)) continue;
      const dTop = y - top;
      let i: number;
      if (dTop === 0) i = flat ? 6 : 5;
      else if (dTop === 1 && flat && y < yBelt) i = 5;
      else if (y < yBelt) i = 4;
      else if (y === yBelt) i = 6;
      else if (y === yBelt + 1) i = 2;
      else {
        const t = (y - yBelt) / Math.max(1, bot - yBelt);
        i = t < 0.42 ? 3 : t < 0.72 ? 2 : t < 0.92 ? 1 : 0;
        // glossy reflection band along the flank
        if (t >= 0.5 && t < 0.58 && x > wheels[0].x + 4 && x < wheels[1].x - 4) i = 3;
      }
      // round off the very front and rear
      if (!body.on(x + 1, y) || !body.on(x - 1, y)) i = Math.max(0, i - 1);
      px.set(x, y, pr[i]);
    }
  }

  // livery (on the paint, under glass and trim)
  applyLivery(px, body, livery, accent, look.paint, { yBelt, wheels, x0, x1, Y, X });

  // arch lips and wheel wells
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (inner.on(x, y)) px.set(x, y, '#08090c');
      else if (body.on(x, y) && (inner.on(x + 1, y) || inner.on(x - 1, y) || inner.on(x, y + 1) || inner.on(x, y - 1))) px.set(x, y, pr[0]);
    }
  if (kit === 'wide') {
    // flare edge highlight
    for (const w of wheels) {
      const cy = wy(w.r);
      for (let k = 0; k < 40; k++) {
        const a = Math.PI + (k / 39) * Math.PI;
        const x = Math.round(w.x + Math.cos(a) * (w.r + 3));
        const y = Math.round(cy + Math.sin(a) * (w.r + 3));
        if (body.on(x, y) && !body.on(x, y - 1)) continue;
        if (body.on(x, y)) px.set(x, y, pr[5]);
      }
    }
  }

  // glass
  const glass = new Mask(W, H);
  glass.poly(shape.glass.map(pt));
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!glass.on(x, y)) continue;
      const edge = !glass.on(x, y - 1) || !glass.on(x - 1, y) || !glass.on(x + 1, y) || !glass.on(x, y + 1);
      let col = y - glass.top(x) < 2 ? '#1f2633' : '#2f3a4c';
      const streak = (x - y * 1.1) % 13;
      if (streak >= 0 && streak < 1.6) col = '#8ea2bd';
      else if (streak >= 1.6 && streak < 2.6) col = '#5d708c';
      if (edge) col = TRIM;
      px.set(x, y, col);
    }
  for (const p of shape.pillars ?? []) {
    for (let y = 0; y < H; y++) if (glass.on(X(p), y) || glass.on(X(p) + 1, y)) {
      px.set(X(p), y, TRIM);
      px.set(X(p) + 1, y, TRIM);
    }
  }

  // door cuts, handle, mirror
  for (const d of shape.doors ?? []) {
    const x = X(d);
    for (let y = yBelt + 1; y < body.bottom(x) - 1; y++) if (body.on(x, y)) px.set(x, y, pr[0]);
  }
  if (shape.handle !== undefined) {
    const x = X(shape.handle);
    px.set(x, yBelt + 2, pr[6]);
    px.set(x + 1, yBelt + 2, pr[6]);
    px.set(x + 2, yBelt + 2, pr[5]);
    px.set(x, yBelt + 3, pr[0]);
    px.set(x + 1, yBelt + 3, pr[0]);
  }
  if (shape.mirror) {
    const [mx, mh] = pt(shape.mirror);
    px.rect(mx - 1, mh - 1, 3, 2, pr[3]);
    px.set(mx - 1, mh - 1, pr[5]);
    px.set(mx, mh + 1, TRIM);
  }

  // intakes and grilles
  for (const poly of shape.intake ?? []) {
    const m = new Mask(W, H);
    m.poly(poly.map(pt));
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) if (m.on(x, y) && (body.on(x, y) || px.has(x, y))) px.set(x, y, y % 2 === 0 ? '#121318' : '#262830');
  }

  // lights
  lamp(px, shape.head.map(pt), ['#fffdf2', '#f3efe0', '#c6cbd3'], look.lights);
  lamp(px, shape.tail.map(pt), ['#ff7b8b', '#d4213d', '#8f1228']);
  if (look.lights) {
    // headlight beam
    const [hx, hy] = pt(shape.head[1]);
    for (let k = 1; k < 10; k++) for (let j = -Math.floor(k / 3); j <= Math.floor(k / 3); j++) px.set(hx + k, hy + j + 1, '#fff7d6', 0.22 - k * 0.018);
  }

  // extras
  const topAt = (x: number) => body.top(Math.round(x));
  if (extras.has('scoop')) {
    const x = X(shape.wheels[1] - 22);
    const t = topAt(x);
    px.rect(x, t - 2, 8, 2, pr[3]);
    px.rect(x, t - 2, 8, 1, pr[5]);
    px.rect(x + 6, t - 2, 2, 2, '#121318');
  }
  if (extras.has('blower')) {
    const x = X(shape.wheels[1] - 30);
    const t = topAt(x + 4);
    px.rect(x, t - 6, 10, 6, '#b9bfc8');
    for (let i = 0; i < 10; i += 2) px.rect(x + i, t - 6, 1, 6, '#7d838d');
    px.rect(x - 1, t - 9, 12, 3, '#2a2c33');
    px.rect(x - 1, t - 9, 12, 1, '#4a4d57');
    px.rect(x + 2, t - 11, 6, 2, '#c8a64a');
  }
  if (extras.has('pins')) {
    const x = X(shape.wheels[1] + 8);
    px.set(x, topAt(x), '#d9dde3');
    px.set(x + 4, topAt(x + 4), '#d9dde3');
  }
  if (extras.has('vents')) {
    const x = X(shape.wheels[1] - 13);
    for (let i = 0; i < 3; i++) {
      px.set(x + i * 2, yBelt + 3 + i, '#121318');
      px.set(x + i * 2 + 1, yBelt + 3 + i, '#121318');
    }
  }
  if (extras.has('louvers')) {
    const x = X(shape.wheels[0] + 4);
    for (let i = 0; i < 4; i++) {
      const t = topAt(x + i * 3);
      px.set(x + i * 3, t + 1, '#121318');
      px.set(x + i * 3 + 1, t + 1, pr[1]);
    }
  }
  if (extras.has('roofrack')) {
    const g = shape.glass;
    const a = X(g[1][0]) + 1;
    const b = X(g[g.length - 2][0]) - 1;
    const t = Math.min(topAt(a), topAt(b));
    px.rect(a, t - 2, b - a, 1, '#2a2c33');
    for (let x = a + 1; x < b; x += Math.max(4, Math.floor((b - a) / 4))) px.rect(x, t - 1, 1, 1, '#2a2c33');
  }
  if (extras.has('snorkel')) {
    const x = X(shape.glass[shape.glass.length - 1][0]);
    const t = Y(shape.belt);
    px.rect(x, t - 12, 2, 12, '#202228');
    px.rect(x - 2, t - 13, 4, 2, '#202228');
  }
  if (extras.has('spare')) {
    const x = X(shape.top[0][0]) - 3;
    const cy = Y(shape.belt) + 2;
    drawWheel(px, x, cy, 6, 'offroad', '#4a4d57', { tyre: 3 });
  }
  if (extras.has('bed')) {
    // open load bed: inner wall shade and tailgate line
    const a = X(shape.top[0][0]) + 2;
    const b = X(46) - 1;
    const t = Y(25);
    px.rect(a, t + 1, b - a, 1, pr[1]);
    px.rect(a, t + 2, b - a, 1, pr[2]);
    px.rect(X(shape.top[0][0]) + 1, t + 3, 1, 6, pr[0]);
  }
  if (extras.has('softtop')) {
    // folded hood behind the seats
    const x = X(shape.top[2][0]) + 12;
    const t = topAt(x);
    px.rect(x, t - 3, 12, 3, '#2a2522');
    px.rect(x + 1, t - 4, 10, 1, '#3a3330');
    // seat back
    px.rect(X(shape.glass[0][0]) - 16, Y(shape.belt) - 4, 3, 4, '#5a2b22');
  }
  if (extras.has('lightpod')) {
    const x = X(shape.wheels[1] - 2);
    const t = topAt(x + 4);
    for (let i = 0; i < 3; i++) {
      px.rect(x + i * 3, t - 3, 3, 3, '#16171c');
      px.set(x + i * 3 + 1, t - 2, '#fff6cf');
      px.set(x + i * 3 + 2, t - 2, '#ffe28a');
    }
  }
  if (extras.has('number') && livery !== 'racing') {
    const cx = X(Math.round((shape.wheels[0] + shape.wheels[1]) / 2));
    const cy = yBelt + 4;
    px.disc(cx, cy, 3.2, '#f4f1ea');
    // a pixel "7"
    px.rect(cx - 1, cy - 2, 3, 1, '#16171c');
    px.set(cx + 1, cy - 1, '#16171c');
    px.set(cx, cy, '#16171c');
    px.set(cx, cy + 1, '#16171c');
  }
  if (extras.has('fin')) {
    const a = X(shape.top[0][0]) + 2;
    const b = X(shape.glass[0][0]);
    const t = Y(shape.belt) + 1;
    for (let x = a; x < b; x++) {
      const h = Math.round(((x - a) / (b - a)) * 7);
      for (let y = 0; y < h; y++) if (!body.on(x, t - 1 - y - 3)) px.set(x, topAt(x) - 1 - y + 1, y === h - 1 ? pr[5] : pr[2]);
    }
  }
  if (extras.has('batfins')) {
    // two swept tail fins rising from the rear
    const a = X(shape.top[0][0]);
    for (let i = 0; i < 18; i++) {
      const x = a + i;
      const h = i < 4 ? 10 + i : Math.max(0, 14 - (i - 4) * 0.9);
      const t = topAt(x);
      for (let y = 0; y < h; y++) px.set(x, t - y, y > h - 2 ? pr[4] : pr[1]);
    }
  }
  if (extras.has('turbine')) {
    // jet exhaust at the tail
    const x = X(shape.top[0][0]) - 2;
    const cy = Y(12);
    px.disc(x + 2, cy, 3.5, '#2a2c33');
    px.disc(x + 2, cy, 2.2, '#ff9a3c');
    px.disc(x + 2, cy, 1.2, '#fff1c2');
    for (let k = 1; k < 7; k++) px.set(x - k, cy, '#ff9a3c', 0.6 - k * 0.08);
  }
  if (extras.has('exhaust')) {
    const x = X(shape.top[0][0]);
    const y = Y(shape.bottom[shape.bottom.length - 1][1]) - 1;
    px.rect(x - 1, y, 2, 2, '#b9bfc8');
    px.set(x - 1, y + 1, '#2a2c33');
  }
  if (extras.has('sidepipes')) {
    const a = Math.round(wheels[0].x + wheels[0].r + 2);
    const b = Math.round(wheels[1].x - r - 2);
    const y = Math.round(Y(shape.bottom[1][1])) - 1;
    px.rect(a, y, b - a, 2, '#c3c8d0');
    px.rect(a, y + 1, b - a, 1, '#7d838d');
  }

  // spoilers
  drawSpoiler(px, spoiler, { x0, topAt, pr, gy, Y });

  // body kit details on the ground line
  if (kit === 'sport' || kit === 'wide') {
    const yb = Math.round(Y(shape.bottom[0][1])) + 1;
    px.rect(x1 - 6, yb, 8, 1, '#16171c');
    px.rect(x0 - 1, Math.round(Y(shape.bottom[shape.bottom.length - 1][1])), 5, 1, '#16171c');
    for (let x = Math.round(wheels[0].x + wheels[0].r + 3); x < wheels[1].x - r - 2; x++) if (body.on(x, body.bottom(x))) px.set(x, body.bottom(x), '#16171c');
  }
  if (kit === 'rally') {
    for (const w of wheels) {
      const x = Math.round(w.x - w.r - 3);
      const y = wy(w.r);
      px.rect(x, y + 2, 2, Math.round(w.r) - 3, '#c8102e');
      px.rect(x, y + 2, 1, Math.round(w.r) - 3, '#8f0c22');
    }
  }
  if (extras.has('wheelie')) {
    const yb = gy - 3;
    px.rect(x0 - 12, yb, 12, 1, '#b9bfc8');
    px.line(x0, Y(10), x0 - 12, yb, '#b9bfc8');
    px.disc(x0 - 12, gy - 1.5, 1.5, '#16171c');
  }

  // wheels on top
  for (const w of wheels) drawWheel(px, w.x, wy(w.r), w.r, rim, rimColor, { tyre: shape.tyre ?? (w.r >= 11 ? 4 : 3), caliper: kit === 'stock' && rim !== 'hubcap' && rim !== 'wire' ? undefined : '#d7263d', whitewall: rim === 'wire' && shape.rimColor === '#e8edf2' });

  px.outline(OUTLINE);

  // shadow on the ground (soft, two steps), drawn after the outline so it stays soft
  for (let x = x0 - 3; x <= x1 + 3; x++) {
    if (!px.has(x, gy + 1)) px.set(x, gy + 1, '#000000', x < x0 || x > x1 ? 0.14 : 0.3);
    if (x > x0 + 6 && x < x1 - 6 && !px.has(x, gy + 2)) px.set(x, gy + 2, '#000000', 0.13);
  }
  if (extras.has('underglow')) {
    for (let x = x0 + 4; x <= x1 - 4; x++) {
      if (!px.has(x, gy + 1)) px.set(x, gy + 1, '#a855f7', 0.7);
      if (!px.has(x, gy + 2)) px.set(x, gy + 2, '#a855f7', 0.3);
    }
  }
  return px;
}

function lamp(px: Px, pts: Pt[], cols: [string, string, string], on = false) {
  const m = new Mask(px.w, px.h);
  m.poly(pts);
  for (let y = 0; y < px.h; y++)
    for (let x = 0; x < px.w; x++) {
      if (!m.on(x, y)) continue;
      const topEdge = !m.on(x, y - 1);
      const botEdge = !m.on(x, y + 1);
      px.set(x, y, topEdge ? cols[0] : botEdge ? cols[2] : cols[1]);
      if (on) px.set(x, y, '#fffbe6');
    }
}

function drawSpoiler(px: Px, kind: string, g: { x0: number; topAt: (x: number) => number; pr: string[]; gy: number; Y: (h: number) => number }) {
  const { x0, topAt, pr } = g;
  if (kind === 'lip') {
    const t = topAt(x0 + 3);
    px.rect(x0 + 1, t - 1, 5, 1, pr[2]);
    px.set(x0 + 1, t - 1, pr[1]);
  } else if (kind === 'duck') {
    const t = topAt(x0 + 4);
    px.rect(x0 + 1, t - 2, 7, 1, pr[4]);
    px.rect(x0 + 2, t - 1, 8, 1, pr[2]);
  } else if (kind === 'wing') {
    const t = topAt(x0 + 6);
    const top = t - 5;
    px.rect(x0 + 5, top + 1, 1, 4, '#22242a');
    px.rect(x0 + 11, top + 1, 1, 4, '#22242a');
    px.rect(x0 + 1, top, 15, 1, pr[5]);
    px.rect(x0 + 1, top + 1, 15, 1, pr[2]);
  } else if (kind === 'gt') {
    const t = topAt(x0 + 7);
    const top = t - 8;
    px.rect(x0 + 6, top + 2, 1, 6, '#22242a');
    px.rect(x0 + 13, top + 2, 1, 6, '#22242a');
    px.rect(x0, top, 19, 1, '#3a3d46');
    px.rect(x0, top + 1, 19, 1, '#1d1f25');
    px.rect(x0, top - 2, 2, 5, '#16171c');
    px.rect(x0 + 18, top - 1, 1, 3, '#16171c');
  }
}

function applyLivery(
  px: Px,
  body: Mask,
  kind: string,
  accent: string,
  paint: string,
  g: { yBelt: number; wheels: Array<{ x: number; r: number }>; x0: number; x1: number; Y: (h: number) => number; X: (x: number) => number },
) {
  if (kind === 'none') return;
  const ar = ramp(accent);
  const put = (x: number, y: number, i: number) => {
    if (body.on(x, y)) px.set(x, y, ar[i]);
  };
  const { yBelt, x0, x1, wheels } = g;
  const mid = (wheels[0].x + wheels[1].x) / 2;
  switch (kind) {
    case 'stripe':
      // twin pinstripes along the flank
      for (let x = x0; x <= x1; x++) {
        put(x, yBelt + 3, 4);
        put(x, yBelt + 4, 3);
        put(x, yBelt + 6, 3);
      }
      break;
    case 'pinline':
      for (let x = x0; x <= x1; x++) put(x, yBelt + 2, 4);
      break;
    case 'racing': {
      // wide band low on the doors + roundel
      for (let x = x0; x <= x1; x++) for (let y = yBelt + 2; y <= yBelt + 3; y++) put(x, y, 3);
      const cy = yBelt + 6;
      const cx = Math.round(mid);
      for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 4; x <= cx + 4; x++) if (Math.hypot(x - cx, y - cy) < 3.7) put(x, y, 6);
      const ink = luma(accent) > 0.5 ? '#16171c' : '#f4f1ea';
      [[-1, -2], [0, -2], [1, -2], [1, -1], [0, 0], [0, 1], [0, 2]].forEach(([dx, dy]) => body.on(cx + dx, cy + dy) && px.set(cx + dx, cy + dy, ink));
      break;
    }
    case 'twotone':
      for (let x = x0; x <= x1; x++) for (let y = yBelt + 5; y < px.h; y++) if (body.on(x, y)) px.set(x, y, ramp(mixHex(accent, paint, 0.15))[y > yBelt + 9 ? 1 : 2]);
      break;
    case 'check':
      for (let x = x0; x <= x1; x++) for (let y = yBelt + 3; y <= yBelt + 6; y++) if (((x >> 1) + (y >> 1)) % 2 === 0) put(x, y, 4);
      break;
    case 'flames': {
      const fl = ['#ffd23f', '#ff9a3c', '#e8481c'];
      for (let x = x1 - 40; x <= x1; x++) {
        const k = (x1 - x) / 40;
        const wave = Math.sin(x * 0.55) * 2.2 * k;
        const reach = 1 + (1 - k) * 6 + wave;
        for (let y = yBelt + 1; y < yBelt + 1 + reach; y++) if (body.on(x, y)) px.set(x, y, fl[Math.min(2, Math.floor(((y - yBelt) / reach) * 3))]);
      }
      break;
    }
    case 'rally': {
      // bold diagonal blocks
      const cols = ['#f4f1ea', '#1d4ed8', '#e11d48'];
      for (let x = x0; x <= x1; x++)
        for (let y = 0; y < px.h; y++) {
          if (!body.on(x, y) || y < yBelt - 1) continue;
          const band = Math.floor((x + y * 0.9) / 9) % 5;
          if (band === 1) px.set(x, y, cols[0]);
          if (band === 2) px.set(x, y, cols[1]);
          if (band === 3 && y > yBelt + 4) px.set(x, y, cols[2]);
        }
      break;
    }
    case 'vinyl': {
      // street-racer graphic: sweeping blades from the front wheel back
      const cols = ['#22d3ee', '#a855f7', '#f4f1ea'];
      for (let x = x0; x <= x1; x++)
        for (let y = yBelt; y < px.h; y++) {
          if (!body.on(x, y)) continue;
          const u = (x - x0) / (x1 - x0);
          const curve = yBelt + 2 + Math.sin(u * 6 + 1) * 2 + (1 - u) * 5;
          if (Math.abs(y - curve) < 1) px.set(x, y, cols[0]);
          else if (Math.abs(y - curve - 2.5) < 0.8 && u > 0.2) px.set(x, y, cols[1]);
          else if (Math.abs(y - curve + 2) < 0.6 && u > 0.45) px.set(x, y, cols[2]);
        }
      break;
    }
  }
}
