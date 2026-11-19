import { INK } from './Face';
import { type Ctx } from './colors';

/* ---------- head geometry ---------- */
/** Scales every head layer (hair, face, glasses, hats) about the chin. A big head reads as a cartoon. */
export const HEAD = 'translate(50 68.5) scale(1.02) translate(-50 -63.5)';
/** Where the eyes, nose and mouth sit inside the head (eyes and glasses share it). */
export const FEATURES = 'translate(50 48) scale(1.13) translate(-50 -48)';
/** A round, wide head with soft full cheeks and a rounded chin. */
export const FACE =
  'M29.4 40.6 C29.4 27.2 38.8 20.6 50 20.6 C61.2 20.6 70.6 27.2 70.6 40.6 C70.6 46.6 69.6 51.2 67.4 55 C64.8 59.6 59.4 63.6 53.6 64.6 C51.2 65 48.8 65 46.4 64.6 C40.6 63.6 35.2 59.6 32.6 55 C30.4 51.2 29.4 46.6 29.4 40.6Z';
/** Shoulders a little narrower than real life: heroic but still comic. */
export const BODY = 'translate(50 100) scale(.92 1) translate(-50 -100)';

/** Big round ears that stick out at eye level. */
export function Ears({ x }: { x: Ctx }) {
  return (
    <g>
      {[-1, 1].map((d) => {
        const ex = 50 + d * 20.2;
        return (
          <g key={d}>
            <path
              d={`M${ex} 40.8 C${ex + d * 5} 39.6 ${ex + d * 6} 45.6 ${ex + d * 4.4} 49.6 C${ex + d * 3.2} 52.4 ${ex + d * 1.2} 52.6 ${ex - d * 0.4} 51.2 Z`}
              fill={x.skin}
            />
            <path d={`M${ex + d * 1.2} 43 C${ex + d * 3.8} 42.6 ${ex + d * 4.2} 47.6 ${ex + d * 2.2} 49`} stroke={INK} strokeWidth=".8" fill="none" strokeLinecap="round" />
            <path d={`M${ex + d * 1.6} 44.4 C${ex + d * 3.2} 44.6 ${ex + d * 3.2} 47.2 ${ex + d * 2} 47.8 Z`} fill={x.skinDark} opacity=".5" />
          </g>
        );
      })}
    </g>
  );
}
