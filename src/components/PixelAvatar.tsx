import { useId, useMemo } from 'react';
import type { Character } from '../lib/types';
import { findItem, normalizeLook, type AvatarItem } from '../data/avatar';
import { useTodayMood } from '../store/AppContext';
import { Backdrop } from './AvatarBackdrop';

/*
 * Dayforge's pixel-art character: a small full-body sprite on a 32×32 grid, drawn layer by layer
 * (back hair, cape, body, legs, head, face, hair, glasses, hat, pet), then outlined in one dark
 * pixel so it reads like a classic 2D game sprite. Every colour comes from the chosen items, so
 * skin, hair and clothes colours always show clearly.
 *
 * Layout (x right, y down): head x11–20 / y6–14, body x12–19 / y15–22, arms x10–11 and x20–21,
 * legs y23–27, boots y28–29, pet at the bottom right.
 */

const N = 32;
type Grid = (string | null)[][];
const OUTLINE = '#14100e';
const WHITE = '#f8fafc';
const EYE = '#2b1d16';

function hex(c: string): [number, number, number] {
  const n = parseInt(c.replace('#', '').slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function shade(c: string, amt: number): string {
  const [r, g, b] = hex(c);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return `#${[f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function blank(): Grid {
  return Array.from({ length: N }, () => Array<string | null>(N).fill(null));
}
function put(g: Grid, x: number, y: number, c: string | null) {
  if (x >= 0 && y >= 0 && x < N && y < N && c) g[y][x] = c;
}
function rect(g: Grid, x: number, y: number, w: number, h: number, c: string) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(g, x + i, y + j, c);
}
/** Paints a text sprite: each character maps to a colour in `pal` ('.' and unknown are see-through). */
function sprite(g: Grid, x0: number, y0: number, rows: string[], pal: Record<string, string | undefined>) {
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const c = pal[row[i]];
      if (c) put(g, x0 + i, y0 + j, c);
    }
  });
}

/* ------------------------------------------------------------------ hair */
// Front hair, 14 columns wide starting at x=9 and row y=0. H hair, L highlight, D darker, A accent.
const HAIR: Record<string, string[]> = {
  short: ['', '', '', '....HHHHHH', '...HLLHHHHH', '..HHHHHHHHHH', '..HHHHHHHHHH', '..HHHHHHHHHH', '..HH.HH...HH', '..H........H', '..H........H'],
  buzz: ['', '', '', '', '....DDDDDD', '...DDDDDDDD', '..DDDDDDDDDD', '..D........D'],
  long: ['', '', '', '....HHHHHH', '...HLLHHHHH', '..HHHHHHHHHH', '..HHHHHHHHHH', '..HHHHHHH.HH', '..HHH.....HH', '..HH......HH', '..HH......HH', '..HH......HH', '..H........H', '..H........H', '..H........H', '..H........H', '..H........H'],
  clips: ['', '', '', '....HHHHHH', '...HLLHHHHH', '..HHAHHHBHHH', '..HHHHHHCHHH', '..HHHHHHH.HH', '..HHH.....HH', '..HH......HH', '..HH......HH', '..HH......HH', '..H........H', '..H........H', '..H........H', '..H........H', '..H........H'],
  curly: ['', '', '....H.HH.H', '...HHHHHHHH', '..HHHLHHHHHH', '.HHHHHHHHHHHH', '.HHHHHHHHHHHH', '.HHHHHHHHHHHH', '.HH.H.H.H..HH', '.HH........HH', '.H..........H'],
  ponytail: ['', '', '', '....HHHHHH', '...HLLHHHHH', '..HHHHHHHHHH', '..HHHHHHHHHHA', '..HHHHHHHHHHH', '..H........HHH', '..H.........HH', '.............H', '............HH', '............H'],
  bald: [],
  bun: ['', '.....HHHH', '.....HLHH', '....HHHHHH', '...HHHHHHHH', '..HHHHHHHHHH', '..HHHHHHHHHH', '..H........H'],
  spiky: ['', '..H...H...H', '..HH.HHH.HH.H', '..HHHHHHHHHHH', '.HHHLHHHHHHHH', '.HHHHHHHHHHHH', '..HHHHHHHHHH', '..HH.H.H.HHH', '..H........H'],
  afro: ['...HHHHHHHH', '..HHHHHHHHHH', '.HHHLLHHHHHHH', 'HHHHHHHHHHHHHH', 'HHHHHHHHHHHHHH', 'HHHHHHHHHHHHHH', 'HHHHHHHHHHHHHH', 'HHH........HHH', 'HH..........HH', 'HH..........HH', '.H..........H'],
  mohawk: ['......HH', '......HH', '.....HHHH', '.....HLHH', '.....HHHH', '...DDHHHHDD', '..DDDDDDDDDD', '..D........D'],
  quiff: ['', '.....HHHH', '....HLLHHH', '...HHHHHHHH', '...HHHHHHHHH', '..HHHHHHHHHH', '..HHHHHHHHHH', '..HH.....HHH', '..H........H'],
  bob: ['', '', '', '....HHHHHH', '...HLLHHHHH', '..HHHHHHHHHH', '.HHHHHHHHHHHH', '.HHHHHHHHHHHH', '.HHHHHHHHHHHH', '.HH........HH', '.HH........HH', '.HH........HH', '.HHH......HHH'],
  pigtails: ['', '', '', '....HHHHHH', '...HLLHHHHH', '..HHHHHHHHHH', '.AHHHHHHHHHHA', 'HH.HHHHHHHH.HH', 'HH.H......H.HH', 'HH..........HH', '.H..........H'],
  braids: ['', '', '', '....HHHHHH', '...HHHHDHHH', '..HHHHHDHHHH', '..HHHHHDHHHH', '..HHH.....HH', '.HH........HH', '.HD........DH', '.HH........HH', '.HD........DH', '.HH........HH', '.HD........DH', '.HH........HH', '.AA........AA'],
  messy: ['', '', '...H.H..H.H', '..HHHHHHHHHH', '.HHHLHHHHHHHH', '..HHHHHHHHHHH', '.HHHHHHHHHHHH', '..HH.HHH.H.HH', '..H...H....H'],
  twists: ['', '...H.H.H.H.H', '...HHHHHHHHH', '..HHHLHHHLHH', '..HHHHHHHHHH', '..HHHHHHHHHH', '..DDDDDDDDDD', '..D........D'],
  frosted: ['..F...F...F', '..HF.FHF.FH', '..HHHHHHHHHHF', '.FHHHHHHHHHHH', '.HHHHHHHHHHHH', '..HHHHHHHHHH', '..HHHHHHHHHH', '..HH.H.H.HHH', '..H........H'],
  spacebuns: ['', '..HH......HH', '.HHLH....HLHH', '.HHHHHHHHHHHH', '..HHHHHHHHHH', '..HHHHHHHHHH', '..HHHHHHHHHH', '..H........H'],
  dreads: ['', '', '...H.HH.HH.H', '..HHHHHHHHHH', '.HHHLHHHHLHHH', '.HHHHHHHHHHHH', '.HD.HHHHHH.DH', '.HD........DH', '.HH........HH', '.HD........DH', '.HH........HH', '.D..........D'],
  longdreads: ['', '', '...H.HH.HH.H', '..HHHHHHHHHH', '.HHHLHHHHLHHH', '.HHHHHHHHHHHH', '.HD.HHHHHH.DH', '.HD........DH', '.HH........HH', '.HD........DH', '.HH........HH', '.HD........DH', '.HH........HH', '.HD........DH', '.HH........HH', '.D..........D'],
  mullet: ['', '', '', '....HHHHHH', '...HLLHHHHH', '..HHHHHHHHHH', '..HHHHHHHHHH', '..HHHHHHHHHH', '..HH.HH...HH', '.HH........HH', '.HH........HH', '.HH........HH', '.H..........H'],
  curtains: ['', '', '', '....HHHHHH', '...HHHHHHHH', '..HHHHHHHHHH', '..HHHHHDHHHH', '..HHHH..HHHH', '..HHH....HHH', '..HH......HH', '..H........H'],
};
/** Hair that hangs behind the head (drawn first), 14 wide from x=9. */
const HAIR_BACK: Record<string, string[]> = {
  long: ['', '', '', '', '', '.HHHHHHHHHHHH', '.HHHHHHHHHHHH', '.HHHHHHHHHHHH', '.HHHHHHHHHHHH', '.HHHHHHHHHHHH', '.HHHHHHHHHHHH', '.HHHHHHHHHHHH', '.HHHHHHHHHHHH', '.HHHHHHHHHHHH', '.HHHHHHHHHHHH'],
  bob: ['', '', '', '', '', '.HHHHHHHHHHHH', '.HHHHHHHHHHHH', '.HHHHHHHHHHHH', '.HHHHHHHHHHHH', '.HHHHHHHHHHHH', '.HHHHHHHHHHHH', '.HHHHHHHHHHHH', '.HHHHHHHHHHHH'],
};
HAIR_BACK.longdreads = ['', '', '', '', '', 'H.H.HHHHHH.H.H', 'H.H.HHHHHH.H.H', 'HDH.HHHHHH.HDH', 'H.H.HHHHHH.H.H', 'HDH.HHHHHH.HDH', 'H.H.HHHHHH.H.H', 'HDH.HHHHHH.HDH', 'H.H.HHHHHH.H.H', 'D.D.HHHHHH.D.D'];
HAIR_BACK.clips = HAIR_BACK.long;

function drawHair(g: Grid, rows: string[] | undefined, hair: string) {
  if (!rows) return;
  sprite(g, 9, 0, rows, {
    H: hair,
    L: shade(hair, 0.35),
    D: shade(hair, -0.3),
    F: '#fdf2c2',
    A: '#f472b6',
    B: '#a78bfa',
    C: '#38bdf8',
  });
  // Shade the right edge of the hair a little, like light from the top left.
  for (let y = 0; y < 18; y++)
    for (let x = 9; x < 23; x++) {
      if (g[y][x] === hair && g[y][x + 1] !== hair && g[y][x + 1] !== shade(hair, 0.35)) g[y][x] = shade(hair, -0.18);
    }
}

/* ------------------------------------------------------------------ hats */
// 16 columns wide from x=8, rows from y=0. C main colour, c accent, W white, Y gold, K dark, R red,
// P pink, G green, B sky, V violet, S silver, O orange.
const HATS: Record<string, string[]> = {
  cap: ['', '', '.....CCCCCC', '....CCCCCCCC', '...CCCWCCCCCC', '...CCCCCCCCCC', '..cccccccccccc'],
  trucker: ['', '', '.....CCCCCC', '....cWWWWWWc', '...cWWcWWWWWc', '...cWWWWWWWWc', '..CCCCCCCCCCCC'],
  bandana: ['', '', '', '.....CCCCCC', '....CWCCCWCC', '...CCCCCWCCCC', '...CCCCCCCCCCCC', '............CC'],
  butterflies: ['', '', '', '', '....P..V..B', '...PPP.VVV.BBB'],
  sportvisor: ['', '', '', '', '', '...CCCCCCCCCC', '..cccccccccccc'],
  headband: ['', '', '', '', '', '', '', '...CCCCCCCCCC'],
  beanie: ['', '......WW', '.....CCCCCC', '....CCCCCCCC', '...CCCCCCCCCC', '...CCCCCCCCCC', '...cccccccccc'],
  headphones: ['', '', '.....CCCCCC', '....C......C', '...C........C', '...C........C', '...C........C', '...C........C', '..cC........Cc', '..cC........Cc', '..cC........Cc'],
  flowers: ['', '', '', '', '...PGYGPGYGPG', '...GPYGVYGPYG'],
  catears: ['', '', '...C........C', '...CC......CC', '...CPC....CPC', '...CCC....CCC'],
  viking: ['..W..........W', '..WW........WW', '...W.SSSSSS.W', '...WSSSSSSSSW', '....SSSSSSSS', '...SSYSSSSYSS', '...cccccccccc'],
  wizard: ['.......C', '......CCC', '......CcCC', '.....CCCCC', '.....CCCcCC', '....CCCCCCC', '..CCCCCCCCCCCC'],
  crown: ['', '', '', '....Y..YY..Y', '....YY.YY.YY', '....YYYRYYYY', '....YYYYYYYY'],
  halo: ['......YYYY', '.....Y....Y', '......YYYY'],
  party: ['.......W', '.......C', '......CcC', '......cCc', '.....CcCcC', '.....cCcCc'],
  bucket: ['', '', '.....CCCCCC', '....CCCCCCCC', '....CCCCCCCC', '..cccccccccccc', '..cc........cc'],
  beret: ['', '.......C', '.....CCCCCC', '...CCCCCCCCCC', '..CCCCCCCCCC', '...cccccccccc'],
  chefhat: ['.....WWWWWW', '....WWWWWWWW', '....WWWWWWWW', '.....WWWWWW', '....WWWWWWWW', '....SSSSSSSS'],
  cowboy: ['', '', '......CCCC', '.....CCCCCC', 'C....cccccc....C', 'CCCCCCCCCCCCCCCC'],
  tophat: ['.....CCCCCC', '.....CCCCCC', '.....CCCCCC', '.....cccccc', '.....CCCCCC', '...CCCCCCCCCC'],
  propeller: ['...GGG.K.PPP', '.......K', '.....RRYYBB', '....RRRYYBBB', '...RRRRYYBBBB', '...RRRRYYBBBB'],
  bunny: ['....WW....WW', '....WP....PW', '....WP....PW', '....WP....PW', '....WW....WW', '...PPPPPPPPPP'],
  piratehat: ['', '', '....KKKKKKKK', '...KKKKWWKKKK', '..KKKKKWWKKKKK', '.KKKKKKKKKKKKKK', '..YYYYYYYYYYYY'],
  devil: ['', '', '...R........R', '...RR......RR', '....RR....RR'],
  tam: ['', '....GGGGGGGG', '...GGGGGGGGGG', '..YYYYYYYYYYYY', '..RRRRRRRRRRRR', '...KKKKKKKKKK'],
  duck: ['', '........YYY', '.......YYKYOO', '.......YYYYYO', '....YYYYYYY', '...YYYYYYYYY', '....YYYYYYY'],
  crystalcrown: ['', '', '....B..V..B', '....BB.VV.BB', '....BBVVVVBB', '....SSSSSSSS'],
};
const HAT_PAL = (c1: string, c2: string): Record<string, string> => ({
  C: c1,
  c: c2,
  W: WHITE,
  Y: '#facc15',
  K: '#1f2937',
  R: '#dc2626',
  P: '#f472b6',
  G: '#22c55e',
  B: '#38bdf8',
  V: '#a78bfa',
  S: '#cbd5e1',
  O: '#f97316',
});

/* ------------------------------------------------------------------ eyewear */
// 12 columns wide from x=10, rows from y=8 (eyes are at x13–14 and x17–18, rows 9–10).
const GLASSES: Record<string, string[]> = {
  oval: ['', '..SCCSSCCS', '...CC..CC'],
  round: ['...KK..KK', '..K..KK..K', '..K..KK..K', '...KK..KK'],
  shades: ['', '..YKKYYKKY', '...KK..KK'],
  stars: ['...Y....Y', '..YPY..YPY', '...Y....Y'],
  monocle: ['.......YY', '......Y..Y', '......Y..Y', '.......YY', '.........Y', '.........Y'],
  pixel: ['', '..KWKKKWKK', '...KK..KK'],
  visor: ['', '.BBBBBBBBBB', '.BWBBBBBBBB'],
  nerd: ['..KKKKKKKK', '..K..KK..K', '..K..KK..K', '..KKKKKKKK'],
  '3d': ['', '..WRRWWBBW', '..WRRWWBBW'],
  goggles: ['..KKKKKKKK', 'KKOOOOOOOOKK', '..KKKKKKKK'],
  hearts: ['', '..R.R..R.R', '..RRR..RRR', '...R....R'],
  patch: ['KKKKKKKKKKKK', '.......KK', '.......KK'],
  wrap: ['', '.SBVVVVVVBS', '..BVVVVVVB'],
};

/* ------------------------------------------------------------------ pets */
// 8×8 sprites placed at x=23, y=22. C main colour, c lighter, d darker, K eye/dark, W white, P pink, Y yellow, R red, O orange, B sky.
const PETS: Record<string, string[]> = {
  cat: ['........', '.C....C.', '.CC..CC.', '.CCCCCC.', '.CKCCKC.', '.CCPCCC.', '..CCCC.d', '.CC..CCd'],
  puppy: ['........', 'dd....dd', 'dCCCCCCd', '.CKCCKC.', '.CCCCCC.', '.CCKKCC.', '..CCCC..', '.CC..CC.'],
  bird: ['........', '...CCC..', '..CCKCY.', '.CCCCCYY', 'CCcCCCC.', '.CcccC..', '..CCCC..', '..Y..Y..'],
  robot: ['...Y....', '...K....', '.SSSSSS.', '.SBSSBS.', '.SSSSSS.', '..SKKS..', '.SSSSSS.', '.S....S.'],
  slime: ['........', '........', '...CC...', '..CcCC..', '.CCCCCC.', '.CKCCKC.', 'CCCCCCCC', 'CCCCCCCC'],
  dragon: ['.Y....Y.', '.CC..CC.', 'C.CCCC.C', 'CCCKCKCC', '.CCCCCC.', '..CYYC..', '.CCCCCC.', '.C....CC'],
  frog: ['........', '.CC..CC.', 'CWKCCWKC', 'CCCCCCCC', 'CRRRRRRC', '.CCCCCC.', '..C..C..', '.CC..CC.'],
  bunnypet: ['.C...C..', '.CP..CP.', '.CP..CP.', '.CCCCC..', 'CCKCKCC.', 'CCCPCCC.', '.CCCCC..', '.CC.CC..'],
  penguin: ['........', '..KKKK..', '.KKKKKK.', '.KWKKWK.', '.KWWWWK.', 'KKWOOWKK', '.KWWWWK.', '..O..O..'],
  fox: ['........', '.C....C.', '.CC..CC.', '.CCCCCC.', 'CWKCCKWC', '.WWKKWW.', '..WWWW.C', '.CC..CCC'],
  ghost: ['........', '..WWWW..', '.WWWWWW.', '.WKWWKW.', '.WWWWWW.', '.WWKKWW.', '.WWWWWW.', '.W.WW.W.'],
  phoenix: ['...R....', '..YCY...', 'Y.CKC..Y', 'YYCCCCYY', '.YYCCYY.', '..CYYC..', '..RYYR..', '...RR...'],
  butterfly: ['........', 'CC....CC', 'CcC..CcC', 'CCCKKCCC', '.CCKKCC.', 'CcC..CcC', 'CC....CC', '........'],
  pixelpet: ['..CCCC..', '.CCCCCC.', 'CGGGGGGC', 'CGKGGKGC', 'CGGKKGGC', 'CCCCCCCC', 'CYCYCYCC', '.CCCCCC.'],
  flipphone: ['......K.', '.CCCCCK.', '.CBBBBC.', '.CBBBBC.', '.CCCCCC.', '.CWCWCd.', '.CWCWCd.', '.CCCCCd.'],
};

/* ------------------------------------------------------------------ faces */
type Spec = { eyes: [string, string]; brows?: 'angry' | 'sad' | 'one' | 'raised'; mouth: string; extra?: string[] };
// Same expressions as before, made distinct in pixels.
const FACES: Record<string, Spec> = {
  happy: { eyes: ['open', 'open'], mouth: 'smile' },
  grin: { eyes: ['squint', 'squint'], mouth: 'grin', brows: 'raised' },
  calm: { eyes: ['closed', 'closed'], mouth: 'soft' },
  sad: { eyes: ['open', 'open'], brows: 'sad', mouth: 'sad', extra: ['tear'] },
  angry: { eyes: ['open', 'open'], brows: 'angry', mouth: 'frown', extra: ['vein'] },
  surprised: { eyes: ['round', 'round'], brows: 'raised', mouth: 'o', extra: ['pop'] },
  sleepy: { eyes: ['half', 'half'], mouth: 'yawn', extra: ['zzz'] },
  wink: { eyes: ['open', 'happy'], mouth: 'smile', extra: ['blush'] },
  laugh: { eyes: ['happy', 'happy'], mouth: 'laugh', extra: ['blush'] },
  smirk: { eyes: ['open', 'squint'], brows: 'one', mouth: 'smirk' },
  determined: { eyes: ['squint', 'squint'], brows: 'angry', mouth: 'grit', extra: ['sweat'] },
  starstruck: { eyes: ['star', 'star'], mouth: 'grin', extra: ['blush'] },
  love: { eyes: ['heart', 'heart'], mouth: 'smile', extra: ['blush'] },
  dizzy: { eyes: ['dizzy', 'dizzy'], mouth: 'wavy' },
  cat: { eyes: ['happy', 'happy'], mouth: 'cat', extra: ['blush', 'whiskers'] },
  robot: { eyes: ['robot', 'robot'], mouth: 'robot' },
  fire: { eyes: ['fire', 'fire'], brows: 'angry', mouth: 'smirk' },
  sigma: { eyes: ['half', 'half'], mouth: 'smug' },
  sideeye: { eyes: ['side', 'side'], brows: 'one', mouth: 'side' },
  rizz: { eyes: ['squint', 'happy'], mouth: 'smirk', extra: ['blush', 'bling'] },
  bruh: { eyes: ['half', 'half'], brows: 'raised', mouth: 'flat', extra: ['drop'] },
  unbothered: { eyes: ['closed', 'closed'], brows: 'raised', mouth: 'smug' },
  nerd: { eyes: ['round', 'round'], mouth: 'buck', extra: ['blush'] },
  crylaugh: { eyes: ['happy', 'happy'], mouth: 'laugh', extra: ['tear', 'tear2'] },
  pleading: { eyes: ['puppy', 'puppy'], brows: 'sad', mouth: 'pout', extra: ['blush'] },
  dead: { eyes: ['x', 'x'], mouth: 'tongue' },
  maincharacter: { eyes: ['open', 'open'], brows: 'one', mouth: 'grin', extra: ['bling'] },
  cosmic: { eyes: ['cosmic', 'cosmic'], mouth: 'soft' },
  silly: { eyes: ['happy', 'open'], mouth: 'tongue', extra: ['blush'] },
  sparkle: { eyes: ['sparkle', 'sparkle'], mouth: 'soft', extra: ['bling'] },
};
const MOOD_FACE: Record<number, string> = { 1: 'sad', 2: 'sleepy', 3: 'calm', 4: 'happy', 5: 'laugh' };

/** One eye; `x` is the left pixel of its 2-wide box, `inner` is which side faces the nose (+1 / -1). */
function drawEye(g: Grid, kind: string, x: number, inner: number, skinDark: string) {
  const ix = inner > 0 ? x + 1 : x; // pupil column (towards the nose)
  const ox = inner > 0 ? x : x + 1; // white column (towards the ear)
  switch (kind) {
    case 'happy':
      put(g, x - (inner > 0 ? 1 : 0), 10, EYE);
      put(g, x + (inner > 0 ? 0 : 1), 9, EYE);
      put(g, x + (inner > 0 ? 1 : 2), 10, EYE);
      return;
    case 'closed':
      rect(g, x, 10, 2, 1, EYE);
      return;
    case 'half':
      rect(g, x, 9, 2, 1, skinDark);
      put(g, ox, 10, WHITE);
      put(g, ix, 10, EYE);
      return;
    case 'squint':
      put(g, ox, 10, WHITE);
      put(g, ix, 10, EYE);
      rect(g, x, 9, 2, 1, EYE);
      return;
    case 'side':
      put(g, x, 9, WHITE);
      put(g, x + 1, 9, WHITE);
      put(g, inner > 0 ? x : x + 1, 10, EYE);
      put(g, inner > 0 ? x + 1 : x, 10, WHITE);
      return;
    case 'round':
      rect(g, x, 8, 2, 3, WHITE);
      put(g, ix, 9, EYE);
      return;
    case 'star':
      put(g, x, 9, '#facc15');
      put(g, x + 1, 9, '#facc15');
      put(g, x, 10, '#facc15');
      put(g, x + 1, 10, '#fde68a');
      put(g, x + (inner > 0 ? -1 : 2), 9, '#fde047');
      return;
    case 'heart':
      put(g, x, 9, '#f43f5e');
      put(g, x + 1, 9, '#f43f5e');
      put(g, x, 10, '#e11d48');
      put(g, x + 1, 10, '#e11d48');
      return;
    case 'dizzy':
      rect(g, x, 9, 2, 2, WHITE);
      put(g, x, 9, EYE);
      put(g, x + 1, 10, EYE);
      return;
    case 'robot':
      rect(g, x, 9, 2, 2, '#22d3ee');
      put(g, x, 9, '#a5f3fc');
      return;
    case 'fire':
      put(g, ox, 9, '#fde047');
      put(g, ix, 9, '#f97316');
      put(g, ox, 10, '#f97316');
      put(g, ix, 10, '#ea580c');
      return;
    case 'x':
      put(g, x, 9, EYE);
      put(g, x + 1, 10, EYE);
      put(g, x + 1, 9, '#7f1d1d');
      put(g, x, 10, '#7f1d1d');
      return;
    case 'sparkle':
      put(g, ox, 9, WHITE);
      put(g, ix, 9, '#fde047');
      put(g, ox, 10, EYE);
      put(g, ix, 10, EYE);
      return;
    case 'puppy':
      rect(g, x, 9, 2, 2, EYE);
      put(g, ox, 9, WHITE);
      put(g, x + (inner > 0 ? 0 : 1), 11, '#7dd3fc');
      return;
    case 'cosmic':
      rect(g, x, 9, 2, 2, '#4c1d95');
      put(g, ix, 9, '#22d3ee');
      put(g, ox, 10, '#f0abfc');
      return;
    default:
      // open: white on the ear side, a dark pupil on the nose side, two pixels tall
      put(g, ox, 9, WHITE);
      put(g, ox, 10, WHITE);
      put(g, ix, 9, EYE);
      put(g, ix, 10, EYE);
  }
}

function drawMouth(g: Grid, kind: string, lip: string) {
  const D = '#3b1a14';
  const T = '#e2626f';
  const p = (pts: Array<[number, number]>, c: string) => pts.forEach(([x, y]) => put(g, x, y, c));
  switch (kind) {
    case 'grin':
      rect(g, 14, 12, 4, 1, WHITE);
      rect(g, 15, 13, 2, 1, D);
      return;
    case 'laugh':
      rect(g, 14, 12, 4, 1, D);
      p([[14, 13], [17, 13]], D);
      rect(g, 15, 13, 2, 1, T);
      return;
    case 'soft':
      rect(g, 15, 13, 2, 1, D);
      return;
    case 'sad':
    case 'frown':
      p([[14, 13], [15, 12], [16, 12], [17, 13]], D);
      return;
    case 'o':
      rect(g, 15, 12, 2, 2, D);
      return;
    case 'yawn':
      rect(g, 15, 12, 2, 2, D);
      put(g, 15, 13, T);
      return;
    case 'smirk':
      p([[15, 13], [16, 13], [17, 12]], D);
      return;
    case 'smug':
      p([[14, 13], [15, 13], [16, 13], [17, 12]], D);
      put(g, 18, 12, shadeOf(lip));
      return;
    case 'side':
      p([[16, 13], [17, 13]], D);
      return;
    case 'cat':
      p([[14, 12], [15, 13], [16, 12], [17, 13]], D);
      return;
    case 'wavy':
      p([[14, 13], [15, 12], [16, 13], [17, 12]], D);
      return;
    case 'robot':
      rect(g, 14, 12, 4, 1, '#0f172a');
      p([[15, 12], [16, 12]], '#22d3ee');
      return;
    case 'grit':
      rect(g, 14, 12, 4, 2, WHITE);
      p([[15, 12], [16, 13]], D);
      return;
    case 'small':
      put(g, 15, 13, D);
      return;
    case 'flat':
      rect(g, 14, 13, 4, 1, D);
      return;
    case 'buck':
      rect(g, 14, 12, 4, 1, D);
      p([[15, 13], [16, 13]], WHITE);
      return;
    case 'pout':
      rect(g, 15, 13, 2, 1, lip);
      return;
    case 'tongue':
      rect(g, 14, 12, 4, 1, D);
      p([[16, 13], [17, 13]], T);
      return;
    default:
      // smile
      p([[14, 12], [15, 13], [16, 13], [17, 12]], D);
  }
}
function shadeOf(c: string) {
  return shade(c, -0.25);
}

/* ------------------------------------------------------------------ outfits */
interface OutfitLook {
  sleeves: 'short' | 'long';
  pants: string;
  boots: string;
  /** Coat tails over the legs (robes, lab coats…). */
  coat?: number;
  cape?: string;
}

function outfitLook(item: AvatarItem): OutfitLook {
  const c1 = item.c1 ?? '#64748b';
  const c2 = item.c2 ?? shade(c1, -0.3);
  const s = item.style;
  const base: OutfitLook = { sleeves: 'long', pants: '#3f4a5c', boots: '#4a3426' };
  if (['tee', 'graphic', 'babytee', 'chaintee', 'hawaii', 'jersey', 'meshjersey', 'overalls', 'num67', 'rasta', 'duck', 'pizza'].includes(s)) base.sleeves = 'short';
  if (s === 'suit' || s === 'ninja' || s === 'track') base.pants = c1;
  if (s === 'ninja') base.boots = '#111827';
  if (s === 'overalls') base.pants = c1;
  if (s === 'space') Object.assign(base, { pants: '#e2e8f0', boots: '#94a3b8' });
  if (s === 'armor' || s === 'dragonarmor') Object.assign(base, { pants: c2 === '#facc15' ? '#3f1d1d' : '#64748b', boots: '#334155' });
  if (s === 'hero') Object.assign(base, { pants: c1, boots: c2, cape: c2 });
  if (['robe', 'lab', 'chef', 'pirate'].includes(s)) base.coat = s === 'robe' ? 5 : 3;
  if (s === 'robe') base.cape = shade(c1, -0.25);
  return base;
}

function drawOutfit(g: Grid, item: AvatarItem, skin: string) {
  const s = item.style;
  let c1 = item.c1 ?? '#64748b';
  let c2 = item.c2 ?? shade(c1, -0.3);
  if (s === 'chromepuffer') {
    c1 = '#cbd5e1';
    c2 = '#a5b4fc';
  }
  if (s === 'holo') {
    c1 = '#c4b5fd';
    c2 = '#7dd3fc';
  }
  if (s === 'galaxyhoodie' && !item.c1) c1 = '#312e81';
  const look = outfitLook(item);
  const dark = shade(c1, -0.22);

  // torso (x13–18) with the right column shaded; arms at x11–12 and x19–20
  rect(g, 13, 15, 6, 8, c1);
  rect(g, 18, 15, 1, 8, dark);
  const sleeveRows = look.sleeves === 'long' ? 6 : 2;
  const sleeve = s === 'varsity' ? c2 : c1;
  rect(g, 11, 15, 2, sleeveRows, sleeve);
  rect(g, 19, 15, 2, sleeveRows, shade(sleeve, -0.15));
  if (look.sleeves === 'short') {
    rect(g, 11, 17, 2, 4, skin);
    rect(g, 19, 17, 2, 4, shade(skin, -0.12));
  }
  rect(g, 11, 21, 2, 2, skin);
  rect(g, 19, 21, 2, 2, shade(skin, -0.12));

  const p = (pts: Array<[number, number]>, c: string) => pts.forEach(([x, y]) => put(g, x, y, c));
  switch (s) {
    case 'num67': {
      // A big "67" across the chest.
      p([[15, 15], [16, 15]], skin);
      const ink = c2;
      p([[13, 17], [14, 17], [15, 17], [13, 18], [13, 19], [14, 19], [15, 19], [13, 20], [15, 20], [13, 21], [14, 21], [15, 21]], ink);
      p([[16, 17], [17, 17], [18, 17], [18, 18], [18, 19], [17, 20], [17, 21]], ink);
      break;
    }
    case 'rasta':
      rect(g, 13, 15, 6, 3, '#16a34a');
      rect(g, 13, 18, 6, 2, '#facc15');
      rect(g, 13, 20, 6, 3, '#dc2626');
      rect(g, 18, 15, 1, 8, '#00000033');
      rect(g, 11, 15, 2, 2, '#16a34a');
      rect(g, 19, 15, 2, 2, '#15803d');
      p([[15, 15], [16, 15]], skin);
      break;
    case 'duck':
      p([[15, 15], [16, 15]], skin);
      p([[16, 17], [17, 17], [16, 18], [17, 18]], '#facc15');
      put(g, 17, 17, '#1b1512');
      put(g, 18, 18, '#f97316');
      p([[13, 19], [14, 19], [15, 19], [16, 19], [17, 19], [14, 20], [15, 20], [16, 20]], '#facc15');
      break;
    case 'pizza':
      p([[15, 15], [16, 15]], skin);
      p([[13, 17], [14, 17], [15, 17], [16, 17], [17, 17], [18, 17]], '#b45309');
      p([[14, 18], [15, 18], [16, 18], [17, 18], [15, 19], [16, 19], [15, 20], [16, 20]], '#fbbf24');
      p([[15, 18], [16, 20]], '#dc2626');
      break;
    case 'tee':
    case 'graphic':
    case 'babytee':
    case 'chaintee':
    case 'jersey':
    case 'meshjersey':
      p([[15, 15], [16, 15]], skin);
      put(g, 15, 16, s === 'jersey' || s === 'meshjersey' ? c2 : shade(skin, -0.1));
      if (s === 'graphic') {
        p([[14, 18], [17, 18]], '#1b1512');
        p([[14, 20], [15, 21], [16, 21], [17, 20]], '#1b1512');
      }
      if (s === 'babytee') p([[15, 18], [16, 19], [15, 19], [14, 19], [15, 20]], '#e0e7ff');
      if (s === 'chaintee') p([[13, 16], [14, 17], [15, 18], [16, 18], [17, 17], [18, 16]], '#e2e8f0');
      if (s === 'jersey' || s === 'meshjersey') {
        p([[13, 18], [14, 18], [13, 19], [14, 20], [13, 20]], c2);
        p([[16, 18], [17, 18], [16, 19], [17, 19], [16, 20], [17, 20]], c2);
        rect(g, 11, 16, 2, 1, c2);
        rect(g, 19, 16, 2, 1, c2);
      }
      break;
    case 'hoodie':
    case 'flame':
    case 'galaxyhoodie':
    case 'holo':
      rect(g, 13, 15, 6, 1, c2);
      p([[14, 16], [14, 17], [17, 16], [17, 17]], WHITE);
      rect(g, 14, 20, 4, 2, shade(c1, -0.12));
      if (s === 'flame') {
        p([[13, 22], [14, 21], [15, 20], [16, 22], [17, 21], [18, 22]], '#f97316');
        p([[14, 22], [15, 21], [17, 22]], '#facc15');
      }
      if (s === 'galaxyhoodie') p([[13, 18], [17, 17], [18, 20], [14, 21], [16, 19]], WHITE);
      if (s === 'holo') for (let x = 13; x < 19; x++) put(g, x, 17 + (x % 3), ['#f0abfc', '#7dd3fc', '#fde68a'][x % 3]);
      break;
    case 'bomber':
    case 'denim':
    case 'leather':
    case 'puffer':
    case 'chromepuffer':
    case 'varsity':
    case 'track':
      rect(g, 15, 15, 2, 8, s === 'leather' || s === 'track' ? c2 : s === 'varsity' ? WHITE : '#e2e8f0');
      if (s === 'track') {
        rect(g, 11, 15, 1, 6, WHITE);
        rect(g, 20, 15, 1, 6, WHITE);
      }
      if (s === 'puffer' || s === 'chromepuffer') {
        for (const y of [17, 19, 21]) {
          rect(g, 13, y, 2, 1, c2);
          rect(g, 17, y, 2, 1, c2);
        }
      }
      if (s === 'bomber') p([[13, 15], [18, 15]], c2);
      if (s === 'varsity') p([[13, 18], [14, 18], [13, 19]], c2);
      break;
    case 'suit':
      rect(g, 14, 15, 4, 5, WHITE);
      p([[15, 16], [16, 16], [15, 17], [16, 17], [15, 18], [16, 18]], c2);
      p([[14, 15], [17, 15]], c1);
      break;
    case 'ninja':
      rect(g, 13, 20, 6, 1, c2);
      p([[15, 15], [16, 16], [15, 17]], shade(c1, 0.15));
      break;
    case 'space':
      rect(g, 14, 17, 4, 4, '#e2e8f0');
      p([[14, 18], [16, 18], [17, 19]], '#ef4444');
      p([[15, 18], [14, 19]], '#22d3ee');
      break;
    case 'armor':
    case 'dragonarmor':
      for (const y of [17, 20]) rect(g, 13, y, 6, 1, c2);
      rect(g, 10, 15, 3, 2, c2);
      rect(g, 19, 15, 3, 2, shade(c2, -0.15));
      if (s === 'dragonarmor') p([[14, 18], [16, 19], [17, 18], [14, 21], [17, 21]], '#facc15');
      else p([[15, 18], [16, 18], [15, 19], [16, 19]], '#facc15');
      break;
    case 'robe':
    case 'pirate':
    case 'lab':
    case 'chef':
      rect(g, 15, 15, 2, 8, s === 'lab' ? '#e2e8f0' : c2);
      if (s === 'chef') p([[14, 17], [17, 17], [14, 19], [17, 19], [14, 21], [17, 21]], c2);
      if (s === 'lab') p([[14, 18], [14, 19]], c2);
      if (s === 'robe') rect(g, 13, 15, 6, 1, '#facc15');
      break;
    case 'stripes':
      for (const y of [16, 18, 20, 22]) rect(g, 13, y, 6, 1, c2);
      for (const y of [16, 18, 20]) {
        rect(g, 11, y, 2, 1, c2);
        rect(g, 19, y, 2, 1, c2);
      }
      break;
    case 'flannel':
      for (let y = 15; y < 23; y++) for (let x = 11; x < 21; x++) if ((x + y) % 3 === 0 && g[y][x] !== skin && g[y][x] !== shade(skin, -0.12)) put(g, x, y, c2);
      break;
    case 'hawaii':
      p([[14, 17], [17, 16], [15, 19], [18, 20], [13, 21], [16, 22]], c2);
      p([[15, 15], [16, 15]], skin);
      break;
    case 'overalls':
      rect(g, 13, 15, 6, 2, WHITE);
      rect(g, 14, 17, 4, 6, c1);
      p([[14, 15], [14, 16], [17, 15], [17, 16]], c1);
      p([[14, 17], [17, 17]], c2);
      rect(g, 11, 15, 2, 2, WHITE);
      rect(g, 19, 15, 2, 2, WHITE);
      break;
    case 'hero':
      p([[15, 17], [16, 17], [14, 18], [17, 18], [15, 19], [16, 19]], c2);
      rect(g, 13, 21, 6, 1, '#facc15');
      break;
    default:
      p([[15, 15], [16, 15]], skin);
  }
  return look;
}

/* ------------------------------------------------------------------ compose */
function drawHands(g: Grid, item: AvatarItem) {
  const c1 = item.c1 ?? '#111827';
  const c2 = item.c2 ?? shade(c1, 0.4);
  switch (item.style) {
    case 'watch':
      put(g, 11, 20, c1);
      put(g, 12, 20, c2);
      break;
    case 'bracelet':
      put(g, 11, 20, c1);
      put(g, 12, 20, c2);
      put(g, 20, 20, c1);
      break;
    case 'bands':
      put(g, 11, 20, c1);
      put(g, 12, 20, c2);
      put(g, 19, 20, c2);
      put(g, 20, 20, c1);
      break;
    case 'gloves':
      rect(g, 11, 20, 2, 1, c2);
      rect(g, 19, 20, 2, 1, c2);
      rect(g, 11, 21, 2, 2, c1);
      rect(g, 19, 21, 2, 2, shade(c1, -0.15));
      break;
    case 'boxing':
      rect(g, 11, 20, 2, 1, c2);
      rect(g, 19, 20, 2, 1, c2);
      rect(g, 10, 21, 3, 3, c1);
      rect(g, 19, 21, 3, 3, shade(c1, -0.15));
      put(g, 10, 21, shade(c1, 0.35));
      put(g, 19, 21, shade(c1, 0.25));
      break;
  }
}

function compose(look: Character, mood: number | undefined): Grid {
  const g = blank();
  const skin = findItem(look.skin)?.c1 ?? '#f6c9a0';
  const skinDark = shade(skin, -0.18);
  const hairItem = findItem(look.hair);
  const hairColor = findItem(look.hairColor)?.c1 ?? '#6b4429';
  const outfit = findItem(look.outfit)!;
  const hat = findItem(look.headwear);
  const face = findItem(look.face);
  const pet = findItem(look.pet);
  const ostyle = outfitLook(outfit);

  // 1. behind: long hair, capes
  if (hairItem && HAIR_BACK[hairItem.style]) drawHair(g, HAIR_BACK[hairItem.style], hairColor);
  if (ostyle.cape) rect(g, 12, 15, 8, 13, ostyle.cape);
  // 2. legs and boots
  rect(g, 13, 23, 3, 5, ostyle.pants);
  rect(g, 16, 23, 3, 5, shade(ostyle.pants, -0.15));
  rect(g, 12, 28, 4, 2, ostyle.boots);
  rect(g, 16, 28, 4, 2, shade(ostyle.boots, -0.15));
  // 3. body
  drawOutfit(g, outfit, skin);
  if (ostyle.coat) {
    const c = outfit.c1 ?? '#64748b';
    rect(g, 13, 23, 6, ostyle.coat, c);
    rect(g, 18, 23, 1, ostyle.coat, shade(c, -0.22));
    rect(g, 15, 23, 2, ostyle.coat, outfit.style === 'lab' ? '#e2e8f0' : outfit.c2 ?? shade(c, -0.3));
  }
  // 3b. hands: gloves, watches and wristbands
  const hands = findItem(look.hands);
  if (hands && hands.style !== 'none') drawHands(g, hands);
  // 4. head with a rounded jaw and the far side a little darker
  rect(g, 11, 6, 10, 9, skin);
  g[6][11] = null;
  g[6][20] = null;
  g[14][11] = null;
  g[14][20] = null;
  rect(g, 20, 7, 1, 7, skinDark);
  rect(g, 12, 14, 8, 1, skinDark);
  g[14][12] = skin;
  // 5. face
  const styleKey = findItem(look.expression)?.style ?? 'happy';
  const key = styleKey === 'mood' ? (mood ? MOOD_FACE[mood] : 'happy') : styleKey;
  const f = FACES[key] ?? FACES.happy;
  drawEye(g, f.eyes[0], 13, 1, skinDark);
  drawEye(g, f.eyes[1], 17, -1, skinDark);
  const brow = shade(hairColor, -0.35);
  if (f.brows === 'angry') {
    [[12, 8], [13, 8], [14, 9], [19, 8], [18, 8], [17, 9]].forEach(([x, y]) => put(g, x, y, brow));
  } else if (f.brows === 'sad') {
    [[14, 8], [13, 8], [12, 9], [17, 8], [18, 8], [19, 9]].forEach(([x, y]) => put(g, x, y, brow));
  } else if (f.brows === 'raised') {
    [[13, 7], [14, 7], [17, 7], [18, 7]].forEach(([x, y]) => put(g, x, y, brow));
  } else if (f.brows === 'one') {
    [[17, 7], [18, 7], [13, 8], [14, 8]].forEach(([x, y]) => put(g, x, y, brow));
  }
  drawMouth(g, f.mouth, shade(skin, -0.3));
  const extras = new Set(f.extra ?? []);
  if (extras.has('blush')) {
    put(g, 12, 12, '#f472b6');
    put(g, 19, 12, '#f472b6');
  }
  if (extras.has('whiskers')) {
    put(g, 9, 12, OUTLINE);
    put(g, 22, 12, OUTLINE);
  }
  // 6. hair, glasses, hat
  if (hairItem) drawHair(g, HAIR[hairItem.style], hairColor);
  if (face && GLASSES[face.style]) {
    sprite(g, 10, 8, GLASSES[face.style], { ...HAT_PAL(face.c1 ?? '#1f2937', face.c2 ?? '#94a3b8'), C: face.c1 ?? '#f472b6' });
  }
  if (hat && HATS[hat.style]) {
    const rows = HATS[hat.style];
    sprite(g, 8, 0, rows, HAT_PAL(hat.c1 ?? '#2563eb', hat.c2 ?? shade(hat.c1 ?? '#2563eb', -0.3)));
  }
  // 7. after-hair extras (they sit on top of everything)
  if (extras.has('tear')) {
    put(g, 13, 11, '#7dd3fc');
    put(g, 13, 12, '#38bdf8');
  }
  if (extras.has('tear2')) {
    put(g, 18, 11, '#7dd3fc');
    put(g, 18, 12, '#38bdf8');
  }
  if (extras.has('sweat')) {
    put(g, 21, 7, '#7dd3fc');
    put(g, 21, 8, '#38bdf8');
  }
  if (extras.has('drop')) {
    put(g, 22, 8, '#bae6fd');
    put(g, 22, 9, '#7dd3fc');
  }
  if (extras.has('vein')) [[23, 4], [24, 5], [23, 6], [25, 4], [25, 6]].forEach(([x, y]) => put(g, x, y, '#ef4444'));
  if (extras.has('pop')) [[7, 4], [8, 5], [6, 7], [24, 4], [23, 5], [25, 7]].forEach(([x, y]) => put(g, x, y, OUTLINE));
  if (extras.has('zzz')) [[23, 3], [24, 3], [24, 4], [23, 5], [24, 5], [26, 1], [27, 1], [26, 2]].forEach(([x, y]) => put(g, x, y, '#e2e8f0'));
  if (extras.has('bling')) [[8, 6], [7, 7], [9, 7], [8, 8], [24, 10], [23, 11], [25, 11], [24, 12]].forEach(([x, y]) => put(g, x, y, '#fde047'));
  // 8. pet
  if (pet && PETS[pet.style]) {
    const c = pet.c1 ?? (pet.style === 'robot' ? '#cbd5e1' : '#f1f5f9');
    sprite(g, 23, 22, PETS[pet.style], { C: c, c: shade(c, 0.3), d: shade(c, -0.25), K: '#1b1512', W: WHITE, P: '#f9a8d4', Y: '#facc15', R: '#ef4444', O: '#f97316', B: '#38bdf8', S: '#cbd5e1', G: '#bef264' });
  }
  return g;
}

/** Adds the one-pixel dark outline around everything, then merges runs of the same colour into rects. */
function toRects(g: Grid): Array<[number, number, number, string]> {
  const out: Grid = g.map((row) => row.slice());
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      if (g[y][x]) continue;
      const near = (dx: number, dy: number) => !!g[y + dy]?.[x + dx];
      if (near(1, 0) || near(-1, 0) || near(0, 1) || near(0, -1)) out[y][x] = OUTLINE;
    }
  const rects: Array<[number, number, number, string]> = [];
  for (let y = 0; y < N; y++) {
    let x = 0;
    while (x < N) {
      const c = out[y][x];
      if (!c) {
        x++;
        continue;
      }
      let w = 1;
      while (x + w < N && out[y][x + w] === c) w++;
      rects.push([x, y, w, c]);
      x += w;
    }
  }
  return rects;
}

export function PixelAvatar({
  look,
  size = 96,
  shape = 'rounded',
  className = '',
  title,
  mood,
  framing,
  bare = false,
  alive = false,
}: {
  look: Partial<Character> | undefined;
  /** Big, featured pictures (World, wardrobe, profile): the character blinks now and then. */
  alive?: boolean;
  /** No backdrop: just the character (standing in a World scene). */
  bare?: boolean;
  mood?: number;
  /** "head" zooms in on the face (small pictures do this automatically), "full" shows the whole body. */
  framing?: 'head' | 'bust' | 'full';
  size?: number;
  shape?: 'rounded' | 'circle' | 'square';
  className?: string;
  title?: string;
}) {
  const id = useId().replace(/:/g, '');
  const todayMood = useTodayMood();
  const l = normalizeLook(look);
  const m = mood ?? todayMood;
  const key = JSON.stringify(l) + m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rects = useMemo(() => toRects(compose(l, m)), [key]);
  // Small pictures (header, lists) zoom in on the head so the face stays readable.
  // "head": a close-up for square wardrobe tiles. Small round pictures (header, lists) get a looser
  // head-and-shoulders view so the face sits inside the circle with room around it.
  const mode = framing ?? (size < 64 ? 'bust' : 'full');
  const crop = mode !== 'full';
  // Full body: pixel rows 0–30 fill the middle 84% of the picture, centred on the body.
  // Head view: pixel area x7.5–24.5, y-0.5–16.5 (room for tall hats).
  // Bust view: pixel area x2.5–29.5, y-2–25 (head, shoulders, a bit of the chest and any hat).
  const s = mode === 'head' ? 100 / 17 : mode === 'bust' ? 100 / 27 : 2.8;
  const tx = mode === 'head' ? -7.5 * s : mode === 'bust' ? -2.5 * s : 50 - 16 * s;
  const ty = mode === 'head' ? 0.5 * s : mode === 'bust' ? 2 * s : 7;
  const clip = `${id}c`;
  // Blinking: only for wide-open eyes with nothing covering them (glasses, masks).
  const faceKey = findItem(l.expression)?.style ?? 'happy';
  const eyes = (FACES[faceKey === 'mood' ? (m ? MOOD_FACE[m] : 'happy') : faceKey] ?? FACES.happy).eyes;
  const canBlink = alive && eyes[0] === 'open' && eyes[1] === 'open' && (!l.face || l.face === 'face-none');
  const skin = findItem(l.skin)?.c1 ?? '#f6c9a0';
  // Each character blinks on its own rhythm, so two on screen never blink together.
  const blinkDelay = `${-((id.charCodeAt(id.length - 2) * 7) % 40) / 10}s`;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label={title ?? 'Avatar'}>
      <defs>
        <clipPath id={clip}>{shape === 'circle' ? <circle cx="50" cy="50" r="50" /> : <rect width="100" height="100" rx={shape === 'rounded' ? 24 : 0} />}</clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        {!bare && <Backdrop item={findItem(l.backdrop)!} x={{ id }} />}
        {!crop && <ellipse cx="50" cy="91.5" rx="19" ry="3" fill="#000" opacity=".3" />}
        <g transform={`translate(${tx} ${ty}) scale(${s})`} shapeRendering="crispEdges">
          {rects.map(([x, y, w, c], i) => (
            <rect key={i} x={x} y={y} width={w} height={1.02} fill={c} />
          ))}
          {canBlink && (
            <g className="px-blink" style={{ animationDelay: blinkDelay }} aria-hidden="true">
              <rect x={13} y={9} width={2} height={1.02} fill={shade(skin, -0.18)} />
              <rect x={17} y={9} width={2} height={1.02} fill={shade(skin, -0.18)} />
              <rect x={13} y={10} width={2} height={1.02} fill={EYE} />
              <rect x={17} y={10} width={2} height={1.02} fill={EYE} />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}
