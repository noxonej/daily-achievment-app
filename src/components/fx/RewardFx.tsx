import { Coin } from '../Coin';

/**
 * The scene around chest and box openings (2026-11-14 redesign).
 *
 * Before: a purple blob behind everything, a blurred yellow circle behind the chest, a grey shock ring,
 * hard-edged light beams and a full-screen white flash. It looked cheap and flat.
 *
 * Now it's lit like a little stage, and every effect has one job:
 * - StageLight: a soft spotlight from above and a pool of light on the floor, so the chest stands
 *   somewhere instead of floating in a purple fog. A few slow dust motes give depth.
 * - OpenBurst: light pours out of the chest mouth in the prize's rarity colour (the hint of what's
 *   coming), coins arc out, and a handful of small star glints. No rings, no screen flash.
 * - PrizeHalo: one soft backlight in the rarity colour behind the prize, and a pedestal shadow.
 * All transform/opacity only, so it stays smooth on phones.
 */
export function StageLight({ tint = '#9fb7ff', lit = false }: { tint?: string; lit?: boolean }) {
  return (
    <div className="stage-light pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" style={{ ['--tint' as string]: tint }}>
      <div className="stage-cone" />
      <div className={`stage-pool ${lit ? 'on' : ''}`} />
      {MOTES.map((m, i) => (
        <span key={i} className="stage-mote" style={{ left: `${m.x}%`, top: `${m.y}%`, animationDelay: `${m.d}s`, animationDuration: `${m.t}s`, width: m.s, height: m.s }} />
      ))}
    </div>
  );
}

const MOTES = Array.from({ length: 14 }, (_, i) => ({
  x: 18 + ((i * 47) % 64),
  y: 22 + ((i * 31) % 50),
  d: -((i * 1.37) % 9),
  t: 9 + (i % 5) * 1.8,
  s: 2 + (i % 3),
}));

/** Light pouring out of the opened chest, coins and a few glints. Place inside the chest's relative box. */
export function OpenBurst({ color, coins = 12 }: { color: string; coins?: number }) {
  return (
    <span className="open-burst pointer-events-none absolute inset-0" aria-hidden="true" style={{ ['--ray' as string]: color }}>
      <span className="ob-bloom" />
      <span className="ob-shaft ob-shaft-1" />
      <span className="ob-shaft ob-shaft-2" />
      <span className="ob-shaft ob-shaft-3" />
      {Array.from({ length: coins }, (_, i) => {
        const side = i % 2 ? 1 : -1;
        const dx = side * (24 + ((i * 37) % 120));
        return (
          <span
            key={`c${i}`}
            className="coin-arc"
            style={{ ['--dx' as string]: `${dx}px`, ['--up' as string]: `${130 + ((i * 53) % 90)}px`, ['--spin' as string]: `${side * (240 + (i % 3) * 90)}deg`, animationDelay: `${0.05 + (i % 6) * 0.045}s` }}
          >
            <Coin size={20 + (i % 3) * 2} />
          </span>
        );
      })}
      {GLINTS.map((g, i) => (
        <svg key={i} className="ob-glint" viewBox="0 0 10 10" width={g.s} height={g.s} style={{ ['--x' as string]: `${g.x}px`, ['--y' as string]: `${g.y}px`, animationDelay: `${g.d}s` }}>
          <path d="M5 0 C5.4 3.6 6.4 4.6 10 5 C6.4 5.4 5.4 6.4 5 10 C4.6 6.4 3.6 5.4 0 5 C3.6 4.6 4.6 3.6 5 0Z" fill="#fff" />
        </svg>
      ))}
    </span>
  );
}

const GLINTS = [
  { x: -78, y: -110, s: 12, d: 0.18 },
  { x: 70, y: -140, s: 9, d: 0.3 },
  { x: -30, y: -175, s: 8, d: 0.42 },
  { x: 96, y: -70, s: 11, d: 0.24 },
  { x: -104, y: -40, s: 8, d: 0.36 },
  { x: 20, y: -205, s: 10, d: 0.5 },
];

/** Soft rarity backlight + pedestal shadow behind a revealed prize. */
export function PrizeHalo({ color, big = false }: { color: string; big?: boolean }) {
  return (
    <>
      <span className={`prize-halo ${big ? 'big' : ''}`} style={{ ['--ray' as string]: color }} aria-hidden="true" />
      <span className="prize-floor" aria-hidden="true" />
    </>
  );
}
