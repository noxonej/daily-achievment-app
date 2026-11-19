import { type ReactNode } from 'react';
import { shade, mix, star, type Ctx } from './colors';

/* ---------- face / expression ---------- */
// Realistic comic style (like a modern game character): almond eyes with a coloured iris and a
// bold inked upper lid, tapered inked brows, a drawn nose and lips, all with hard comic shadows.
const EYE_L = 42.5;
const EYE_R = 57.5;
const EYE_Y = 45;
const EYE_W = 4.3;
const EYE_H = 3.3;
export const INK = '#1b1512';
const MOUTH_IN = '#4a1418';
const TONGUE = '#d9596a';

export function heart(cx: number, cy: number, s: number): string {
  return `M${cx} ${cy + s * 0.9} C${cx - s * 1.6} ${cy - s * 0.1} ${cx - s * 0.9} ${cy - s * 1.3} ${cx} ${cy - s * 0.45} C${cx + s * 0.9} ${cy - s * 1.3} ${cx + s * 1.6} ${cy - s * 0.1} ${cx} ${cy + s * 0.9}Z`;
}

type EyeKind = 'open' | 'round' | 'happy' | 'closed' | 'half' | 'star' | 'heart' | 'dizzy' | 'robot' | 'fire' | 'side' | 'x' | 'sparkle' | 'puppy' | 'cosmic' | 'squint' | 'droopy';
/** How the upper lid cuts across the eye: angry slants down to the nose, sad slants up. */
type Lid = 'none' | 'angry' | 'sad' | 'half' | 'squint' | 'droopy';

/** Almond eye outline; `dir` points to the outer corner (towards the ear). */
function almond(cx: number, cy: number, dir: number, w = EYE_W, h = EYE_H): string {
  const X = (dx: number) => cx + dx * dir;
  return `M${X(-w)} ${cy + 0.4} Q${X(-w * 0.45)} ${cy - h} ${X(w * 0.12)} ${cy - h * 0.98} Q${X(w * 0.78)} ${cy - h * 0.86} ${X(w)} ${cy - 0.3} Q${X(w * 0.45)} ${cy + h * 0.78} ${X(-w * 0.08)} ${cy + h * 0.74} Q${X(-w * 0.72)} ${cy + h * 0.62} ${X(-w)} ${cy + 0.4}Z`;
}

/**
 * The comic eye: white almond, coloured iris with a dark ring, pupil and a hard light dot, a bold
 * inked upper lid with a flick at the outer corner, a light lower lid and the crease above.
 */
function ComicEye({ cx, cy, x, dir, lid = 'none', look = 0, big = false }: { cx: number; cy: number; x: Ctx; dir: number; lid?: Lid; look?: number; big?: boolean }) {
  const w = big ? EYE_W + 0.5 : EYE_W;
  const h = big ? EYE_H + 1 : EYE_H;
  const X = (dx: number) => cx + dx * dir;
  const cid = `${x.id}k${Math.round(cx * 10)}`;
  const shape = almond(cx, cy, dir, w, h);
  // the lid line: from the inner end height to the outer end height
  const cut: Record<Lid, [number, number]> = {
    none: [cy - 20, cy - 20],
    angry: [cy - 0.8, cy - 3.6],
    sad: [cy - 3.6, cy - 1],
    half: [cy - 0.2, cy - 0.5],
    squint: [cy - 1.5, cy - 1.9],
    droopy: [cy + 0.6, cy + 0.2],
  };
  const [yi, yo] = cut[lid];
  const inner = X(-7);
  const outer = X(7);
  const below = `M${inner} ${yi} L${outer} ${yo} L${outer} ${cy + 10} L${inner} ${cy + 10}Z`;
  const at = (ax: number) => yi + ((yo - yi) * (ax - inner)) / (outer - inner);
  const pupilY = lid === 'half' || lid === 'droopy' ? cy + 1.3 : lid === 'squint' ? cy + 0.6 : cy - 0.1;
  const px = cx - dir * 0.25 + look * 1.7;
  const irisR = big ? 1.75 : 2.15;
  return (
    <g>
      <defs>
        <clipPath id={`${cid}e`}>
          <path d={shape} />
        </clipPath>
        <clipPath id={`${cid}l`}>
          <path d={below} />
        </clipPath>
      </defs>
      {/* brow-ridge shadow */}
      <path d={`M${X(-4.8)} ${cy - 3.3} Q${cx} ${cy - 5.6} ${X(5)} ${cy - 3.1}`} stroke={x.skinDark} strokeWidth="1.5" fill="none" opacity=".35" strokeLinecap="round" />
      <path d={`M${X(-3.9)} ${cy - h - 0.9} Q${cx} ${cy - h - 2.4} ${X(4.1)} ${cy - h - 0.7}`} stroke={x.skinDark} strokeWidth=".6" fill="none" opacity=".7" />
      <g clipPath={`url(#${cid}l)`}>
        <g clipPath={`url(#${cid}e)`}>
          <rect x={cx - 7} y={cy - 7} width="14" height="14" fill="#fbf8f4" />
          <path d={`M${cx - 7} ${cy - 7} H${cx + 7} V${cy - h * 0.25} Q${cx} ${cy - h * 0.7} ${cx - 7} ${cy - h * 0.2}Z`} fill={INK} opacity=".18" />
          <circle cx={px} cy={pupilY} r={irisR} fill={x.eye[1]} />
          <circle cx={px} cy={pupilY} r={irisR} fill="none" stroke={x.eye[2]} strokeWidth=".55" />
          <circle cx={px} cy={pupilY} r={irisR * 0.48} fill={INK} />
          <circle cx={px + 0.75} cy={pupilY - 0.75} r=".58" fill="#fff" />
        </g>
        {/* bold upper lid with an outer flick, light lower lid */}
        <path
          d={`M${X(-w - 0.1)} ${cy + 0.5} Q${X(-w * 0.45)} ${cy - h - 0.35} ${X(w * 0.12)} ${cy - h - 0.3} Q${X(w * 0.8)} ${cy - h * 0.92} ${X(w + 1.1)} ${cy - 1.3}`}
          stroke={INK}
          strokeWidth="1.35"
          fill="none"
          strokeLinecap="round"
        />
        <path d={`M${X(-w * 0.75)} ${cy + h * 0.66} Q${X(0)} ${cy + h * 0.95} ${X(w * 0.85)} ${cy + h * 0.35}`} stroke={INK} strokeWidth=".5" fill="none" opacity=".55" strokeLinecap="round" />
      </g>
      {lid !== 'none' && (
        <g clipPath={`url(#${cid}e)`}>
          <path d={`M${X(-w - 1)} ${at(X(-w - 1))} L${X(w + 1)} ${at(X(w + 1))}`} stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

function Eye({ cx, kind, x, lid }: { cx: number; kind: EyeKind; x: Ctx; lid: Lid }) {
  const cy = EYE_Y;
  const dir = cx < 50 ? -1 : 1;
  const X = (dx: number) => cx + dx * dir;
  const big = (el: ReactNode) => <g transform={`translate(${cx} ${cy}) scale(1.15) translate(${-cx} ${-cy})`}>{el}</g>;
  switch (kind) {
    case 'side':
      return <ComicEye cx={cx} cy={cy} x={x} dir={dir} lid={lid === 'none' ? 'squint' : lid} look={1} />;
    case 'round':
      return <ComicEye cx={cx} cy={cy} x={x} dir={dir} big />;
    case 'half':
      return <ComicEye cx={cx} cy={cy} x={x} dir={dir} lid={lid === 'none' ? 'half' : lid} />;
    case 'squint':
      return <ComicEye cx={cx} cy={cy} x={x} dir={dir} lid={lid === 'none' ? 'squint' : lid} />;
    case 'droopy':
      return <ComicEye cx={cx} cy={cy} x={x} dir={dir} lid="droopy" />;
    case 'happy':
      // laughing eyes: an upward arc with a lash flick and the cheek pushed up
      return (
        <g>
          <path d={`M${X(-4.4)} ${cy + 1.2} Q${cx} ${cy - 3.6} ${X(4.6)} ${cy + 0.6} l${0.9 * dir} -.6`} stroke={INK} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M${X(-3.2)} ${cy + 3} Q${cx} ${cy + 2} ${X(3.4)} ${cy + 2.8}`} stroke={x.skinDark} strokeWidth=".7" fill="none" opacity=".7" strokeLinecap="round" />
        </g>
      );
    case 'closed':
      return (
        <g>
          <path d={`M${X(-4.3)} ${cy} Q${cx} ${cy + 2.6} ${X(4.5)} ${cy - 0.3} l${0.8 * dir} -.5`} stroke={INK} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          {[-1.8, 0, 1.8].map((d) => (
            <path key={d} d={`M${X(d)} ${cy + 1.85 - Math.abs(d) * 0.2} l${0.3 * dir} .9`} stroke={INK} strokeWidth=".5" strokeLinecap="round" />
          ))}
          <path d={`M${X(-3.9)} ${cy - 2.6} Q${cx} ${cy - 4.2} ${X(4.1)} ${cy - 2.4}`} stroke={x.skinDark} strokeWidth=".6" fill="none" opacity=".7" />
        </g>
      );
    case 'cosmic':
      return big(
        <g>
          <path d={almond(cx, cy, dir)} fill="#2e1065" stroke={INK} strokeWidth="1" />
          <circle cx={cx - 0.6} cy={cy + 0.6} r=".8" fill="#22d3ee" />
          <path d={star(cx + 0.6, cy - 0.5, 1.8, 0.5, 4)} fill="#fff" />
          <circle cx={cx + 2.2} cy={cy + 0.8} r=".4" fill="#f0abfc" />
        </g>,
      );
    case 'x':
      return big(<path d={`M${cx - 2.3} ${cy - 2.3} L${cx + 2.3} ${cy + 2.3} M${cx + 2.3} ${cy - 2.3} L${cx - 2.3} ${cy + 2.3}`} stroke={INK} strokeWidth="1.4" strokeLinecap="round" />);
    case 'sparkle':
      return (
        <g>
          <ComicEye cx={cx} cy={cy} x={x} dir={dir} big />
          <path d={star(cx - dir * 0.25 + 1.2, cy - 1.2, 1.7, 0.5, 4)} fill="#fff" />
          <circle cx={cx - dir * 0.25 - 1} cy={cy + 1.3} r=".5" fill="#fff" />
        </g>
      );
    case 'puppy':
      return (
        <g>
          <ComicEye cx={cx} cy={cy} x={x} dir={dir} lid="sad" big />
          <circle cx={cx - dir * 0.25 + 0.9} cy={cy - 0.4} r=".8" fill="#fff" />
          <path d={`M${X(-3.4)} ${cy + 4.6} Q${cx} ${cy + 5.8} ${X(3.6)} ${cy + 4.4}`} stroke="#7dd3fc" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'star':
      return big(<path d={star(cx, cy, 3.9, 1.6)} fill="#facc15" stroke={INK} strokeWidth=".8" strokeLinejoin="round" />);
    case 'heart':
      return big(<path d={heart(cx, cy, 3)} fill="#f43f5e" stroke={INK} strokeWidth=".8" />);
    case 'dizzy':
      return (
        <g>
          <path d={almond(cx, cy, dir)} fill="#fbf8f4" stroke={INK} strokeWidth="1.1" />
          <path d={`M${cx} ${cy} m-.5 0 a.5 .5 0 1 1 1 0 a1.2 1.2 0 1 1 -2.4 0 a1.9 1.9 0 1 1 3.8 0`} stroke={INK} strokeWidth=".8" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'robot':
      return big(
        <g>
          <rect x={cx - 3.2} y={cy - 1.8} width="6.4" height="3.6" rx="1" fill="#0f172a" stroke={INK} strokeWidth=".6" />
          <rect x={cx - 2.4} y={cy - 1.1} width="4.8" height="2.2" rx=".6" fill="#22d3ee" />
        </g>,
      );
    case 'fire':
      return (
        <g>
          <ComicEye cx={cx} cy={cy} x={x} dir={dir} lid="angry" />
          <circle cx={cx - dir * 0.25} cy={cy - 0.1} r="2.15" fill="#f97316" />
          <circle cx={cx - dir * 0.25} cy={cy - 0.1} r="1" fill="#fde047" />
        </g>
      );
    default:
      return <ComicEye cx={cx} cy={cy} x={x} dir={dir} lid={lid} />;
  }
}

type BrowKind = 'normal' | 'raised' | 'angry' | 'sad' | 'flat' | 'one' | 'worried' | 'none';
/** Left brow as [inner, middle, outer]; the right one is mirrored. */
const BROW_PTS: Record<Exclude<BrowKind, 'none' | 'one'>, [[number, number], [number, number], [number, number]]> = {
  normal: [[46.6, 39.3], [42.6, 37.8], [38.2, 39.2]],
  raised: [[46.4, 37.6], [42.4, 35.4], [38.2, 37.2]],
  angry: [[46.8, 41.3], [42.8, 39.5], [38.4, 38]],
  sad: [[46.4, 38], [42.6, 38.9], [38.6, 40.8]],
  flat: [[46.6, 40.1], [42.6, 39.7], [38.4, 40]],
  worried: [[46.4, 37.6], [42.6, 38.2], [38.6, 39.8]],
};

function browPath(pts: [[number, number], [number, number], [number, number]], mirror: boolean, thick: number): string {
  const m = ([px, py]: [number, number]): [number, number] => (mirror ? [100 - px, py] : [px, py]);
  const [a, b, c] = pts.map(m);
  // bold at the inner end, tapering to a point at the outer end
  return `M${a[0]} ${a[1] - thick * 0.55} Q${b[0]} ${b[1] - thick * 0.7} ${c[0]} ${c[1]} Q${b[0]} ${b[1] + thick * 0.35} ${a[0]} ${a[1] + thick * 0.5}Z`;
}

/** Bold, tapered inked brows: the strongest part of a comic face. */
function Brows({ kind, x }: { kind: BrowKind; x: Ctx }) {
  if (kind === 'none') return null;
  const fill = mix(x.hairDark, INK, 0.55);
  const thick = kind === 'angry' ? 2.3 : 1.9;
  const left = kind === 'one' ? BROW_PTS.flat : BROW_PTS[kind];
  const right = kind === 'one' ? ([[46.4, 37.2], [42.4, 34.6], [38.2, 36.4]] as [[number, number], [number, number], [number, number]]) : BROW_PTS[kind];
  return (
    <g fill={fill} stroke={INK} strokeWidth=".35" strokeLinejoin="round">
      <path d={browPath(left, false, thick)} />
      <path d={browPath(right, true, thick)} />
    </g>
  );
}

function lidFor(brows: BrowKind): Lid {
  if (brows === 'angry') return 'angry';
  if (brows === 'sad') return 'sad';
  return 'none';
}

/** Lips along a line from l through m to r: an inked parting line, a shaded lower lip and corners. */
function Lips({ l, m, r, x, lower = 1 }: { l: [number, number]; m: [number, number]; r: [number, number]; x: Ctx; lower?: number }) {
  const midY = (l[1] + r[1]) / 4 + m[1] / 2;
  return (
    <g>
      <path d={`M${l[0] + 1} ${l[1] + 0.3} Q${m[0]} ${midY + 2.6 * lower} ${r[0] - 1} ${r[1] + 0.3} Q${m[0]} ${midY + 0.6} ${l[0] + 1} ${l[1] + 0.3}Z`} fill={x.lip} opacity=".55" />
      <path d={`M${m[0] - 1.8} ${midY + 2.6 * lower} Q${m[0]} ${midY + 3.1 * lower} ${m[0] + 1.8} ${midY + 2.6 * lower}`} stroke={x.skinDark} strokeWidth=".7" fill="none" strokeLinecap="round" />
      <path d={`M${l[0]} ${l[1]} Q${m[0]} ${m[1]} ${r[0]} ${r[1]}`} stroke={INK} strokeWidth="1.15" fill="none" strokeLinecap="round" />
      <path d={`M${l[0] - 0.2} ${l[1] - 0.6} l.3 1.1 M${r[0] + 0.2} ${r[1] - 0.6} l-.3 1.1`} stroke={INK} strokeWidth=".6" strokeLinecap="round" opacity=".7" />
    </g>
  );
}

/** An open mouth: dark inside, top teeth, tongue, inked outline and a shaded lower lip. */
function OpenMouth({ w, h, T = 52, teeth = true, tongue = true, x }: { w: number; h: number; T?: number; teeth?: boolean; tongue?: boolean; x: Ctx }) {
  const L = 50 - w;
  const R = 50 + w;
  const id = `${x.id}m`;
  const shape = `M${L} ${T} Q50 ${T + 1.2} ${R} ${T} Q${R - 0.5} ${T + h} 50 ${T + h + 0.3} Q${L + 0.5} ${T + h} ${L} ${T}Z`;
  return (
    <g>
      <defs>
        <clipPath id={`${id}c`}>
          <path d={shape} />
        </clipPath>
      </defs>
      <path d={shape} fill={MOUTH_IN} />
      <g clipPath={`url(#${id}c)`}>
        {tongue && <ellipse cx="50" cy={T + h + 0.4} rx={w * 0.6} ry={h * 0.42} fill={TONGUE} />}
        {teeth && <path d={`M${L} ${T - 1} H${R} V${T + 1.7} Q50 ${T + 2.7} ${L} ${T + 1.7}Z`} fill="#f8f5ef" />}
        {teeth && <path d={`M${L + w * 0.55} ${T + 0.6} V${T + 2.2} M${R - w * 0.55} ${T + 0.6} V${T + 2.2}`} stroke="#cfc6b8" strokeWidth=".35" />}
      </g>
      <path d={shape} fill="none" stroke={INK} strokeWidth="1.05" strokeLinejoin="round" />
      <path d={`M${50 - w * 0.45} ${T + h + 1.6} Q50 ${T + h + 2.3} ${50 + w * 0.45} ${T + h + 1.6}`} stroke={x.skinDark} strokeWidth=".8" fill="none" strokeLinecap="round" />
    </g>
  );
}

type MouthKind = 'smile' | 'grin' | 'soft' | 'sad' | 'frown' | 'o' | 'smirk' | 'laugh' | 'cat' | 'robot' | 'grit' | 'small' | 'flat' | 'buck' | 'pout' | 'tongue' | 'wavy' | 'yawn' | 'side' | 'smug';
function Mouth({ kind, x }: { kind: MouthKind; x: Ctx }) {
  const line = { stroke: INK, strokeWidth: 1.15, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (kind) {
    case 'grin':
      return <OpenMouth w={5.4} h={4.4} tongue={false} x={x} />;
    case 'laugh':
      return <OpenMouth w={5.8} h={6.8} T={51.6} x={x} />;
    case 'soft':
      return <Lips l={[46.8, 53.2]} m={[50, 55]} r={[53.2, 53.2]} x={x} lower={0.8} />;
    case 'sad':
      return <Lips l={[46, 55.2]} m={[50, 52.6]} r={[54, 55.2]} x={x} lower={0.7} />;
    case 'frown':
      return (
        <g>
          <Lips l={[45.4, 55.4]} m={[50, 52.2]} r={[54.6, 55.4]} x={x} lower={0.7} />
          <path d="M47.5 58.6 Q50 59.6 52.5 58.6" stroke={x.skinDark} strokeWidth=".8" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'o':
      return (
        <g>
          <ellipse cx="50" cy="55" rx="2.2" ry="2.8" fill={MOUTH_IN} stroke={INK} strokeWidth="1" />
          <path d="M48.4 58.8 Q50 59.4 51.6 58.8" stroke={x.skinDark} strokeWidth=".7" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'yawn':
      return <OpenMouth w={3} h={5} T={52.6} teeth={false} x={x} />;
    case 'smirk':
      return (
        <g>
          <Lips l={[45.8, 54.2]} m={[50.6, 55.6]} r={[54.8, 52.4]} x={x} lower={0.7} />
          <path d="M55.4 51.6 q.9 .8 .5 1.9" stroke={INK} strokeWidth=".7" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'smug':
      // closed, satisfied little smile pushed to one side
      return <Lips l={[47, 54.4]} m={[51, 55.2]} r={[54.4, 53]} x={x} lower={0.6} />;
    case 'side':
      // mouth pressed and pulled to one side
      return <path d="M49 54.6 Q51.6 54 54 53.2" {...line} />;
    case 'cat':
      return <path d="M45.6 53 q2.2 2.4 4.4 0 q2.2 2.4 4.4 0" {...line} />;
    case 'wavy':
      return <path d="M45.4 54.6 q1.15 -1.2 2.3 0 t2.3 0 t2.3 0 t2.3 0" {...line} />;
    case 'robot':
      return (
        <g>
          <rect x="44.5" y="52" width="11" height="3" rx="1" fill="#0f172a" stroke={INK} strokeWidth=".6" />
          {[46.5, 49, 51.5, 54].map((mx) => (
            <rect key={mx} x={mx - 0.6} y="52.6" width="1.2" height="1.8" fill="#22d3ee" />
          ))}
        </g>
      );
    case 'grit':
      return (
        <g>
          <rect x="44.2" y="51.8" width="11.6" height="4.6" rx="2" fill="#f8f5ef" stroke={INK} strokeWidth="1.05" />
          <path d="M44.6 54.1 H55.4 M47 52 V56.2 M50 51.8 V56.4 M53 52 V56.2" stroke={INK} strokeWidth=".5" />
          <path d="M47 58.6 Q50 59.5 53 58.6" stroke={x.skinDark} strokeWidth=".8" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'small':
      return <Lips l={[48, 54]} m={[50, 54.7]} r={[52, 54]} x={x} lower={0.5} />;
    case 'flat':
      return <Lips l={[46.2, 54.2]} m={[50, 54.3]} r={[53.8, 54.2]} x={x} lower={0.6} />;
    case 'buck':
      return (
        <g>
          <path d="M44.8 52.4 Q50 57.2 55.2 52.4" {...line} />
          <path d="M48 53.9 V56 H52 V53.9" fill="#f8f5ef" stroke={INK} strokeWidth=".8" strokeLinejoin="round" />
          <path d="M50 54.4 V56" stroke={INK} strokeWidth=".5" />
        </g>
      );
    case 'pout':
      return (
        <g>
          <ellipse cx="50" cy="54.6" rx="2" ry="1.4" fill={x.lip} stroke={INK} strokeWidth=".8" />
          <path d="M48.6 54.4 H51.4" stroke={INK} strokeWidth=".6" />
        </g>
      );
    case 'tongue':
      return (
        <g>
          <path d="M51 54.2 Q51.2 59 54 59 Q56.6 58.8 56 54" fill={TONGUE} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
          <path d="M53.6 55.2 V57.2" stroke={shade(TONGUE, -0.25)} strokeWidth=".6" strokeLinecap="round" />
          <path d="M44.6 52.8 Q50.5 57 56.4 52.4" {...line} />
        </g>
      );
    default:
      return <Lips l={[45.2, 52.8]} m={[50, 56.4]} r={[54.8, 52.8]} x={x} />;
  }
}

interface ExpressionSpec {
  eyes: [EyeKind, EyeKind];
  brows: BrowKind;
  mouth: MouthKind;
  blush?: boolean;
  tear?: boolean;
  whiskers?: boolean;
  zzz?: boolean;
  sweat?: boolean;
  tears2?: boolean;
  /** Little motion lines by the head (surprise). */
  pop?: boolean;
  /** The comic "angry vein" mark on the forehead. */
  vein?: boolean;
  /** Sparkles around the face. */
  bling?: boolean;
  /** A sweat drop on the side of the head (awkward / deadpan). */
  drop?: boolean;
}

/** Every expression differs from every other in at least two of: eyes, brows, mouth, extras. */
const EXPRESSIONS: Record<string, ExpressionSpec> = {
  happy: { eyes: ['open', 'open'], brows: 'normal', mouth: 'smile' },
  grin: { eyes: ['squint', 'squint'], brows: 'raised', mouth: 'grin' },
  calm: { eyes: ['closed', 'closed'], brows: 'flat', mouth: 'soft' },
  sad: { eyes: ['open', 'open'], brows: 'sad', mouth: 'sad', tear: true },
  angry: { eyes: ['open', 'open'], brows: 'angry', mouth: 'frown', vein: true },
  surprised: { eyes: ['round', 'round'], brows: 'raised', mouth: 'o', pop: true },
  sleepy: { eyes: ['droopy', 'droopy'], brows: 'worried', mouth: 'yawn', zzz: true },
  wink: { eyes: ['open', 'happy'], brows: 'normal', mouth: 'smile', blush: true },
  laugh: { eyes: ['happy', 'happy'], brows: 'raised', mouth: 'laugh', blush: true },
  smirk: { eyes: ['open', 'squint'], brows: 'one', mouth: 'smirk' },
  determined: { eyes: ['squint', 'squint'], brows: 'angry', mouth: 'grit', sweat: true },
  starstruck: { eyes: ['star', 'star'], brows: 'raised', mouth: 'grin', blush: true },
  love: { eyes: ['heart', 'heart'], brows: 'raised', mouth: 'smile', blush: true },
  dizzy: { eyes: ['dizzy', 'dizzy'], brows: 'worried', mouth: 'wavy' },
  cat: { eyes: ['happy', 'happy'], brows: 'normal', mouth: 'cat', blush: true, whiskers: true },
  robot: { eyes: ['robot', 'robot'], brows: 'none', mouth: 'robot' },
  fire: { eyes: ['fire', 'fire'], brows: 'angry', mouth: 'smirk' },
  sigma: { eyes: ['half', 'half'], brows: 'flat', mouth: 'smug' },
  sideeye: { eyes: ['side', 'side'], brows: 'one', mouth: 'side' },
  rizz: { eyes: ['squint', 'happy'], brows: 'raised', mouth: 'smirk', blush: true, bling: true },
  bruh: { eyes: ['half', 'half'], brows: 'raised', mouth: 'flat', drop: true },
  unbothered: { eyes: ['closed', 'closed'], brows: 'raised', mouth: 'smug' },
  nerd: { eyes: ['round', 'round'], brows: 'normal', mouth: 'buck', blush: true },
  crylaugh: { eyes: ['happy', 'happy'], brows: 'worried', mouth: 'laugh', tear: true, tears2: true },
  pleading: { eyes: ['puppy', 'puppy'], brows: 'worried', mouth: 'pout', blush: true },
  dead: { eyes: ['x', 'x'], brows: 'flat', mouth: 'tongue' },
  maincharacter: { eyes: ['open', 'open'], brows: 'one', mouth: 'grin', bling: true },
  cosmic: { eyes: ['cosmic', 'cosmic'], brows: 'normal', mouth: 'soft' },
  silly: { eyes: ['happy', 'open'], brows: 'raised', mouth: 'tongue', blush: true },
  sparkle: { eyes: ['sparkle', 'sparkle'], brows: 'normal', mouth: 'soft', bling: true },
};

/** Maps today's mood check-in (1–5) to an expression for the "Match my mood" face. */
const MOOD_FACE: Record<number, string> = { 1: 'sad', 2: 'sleepy', 3: 'calm', 4: 'happy', 5: 'laugh' };


export function Face({ x, style, mood }: { x: Ctx; style: string; mood?: number }) {
  const key = style === 'mood' ? (mood ? MOOD_FACE[mood] : 'happy') : style;
  const e = EXPRESSIONS[key] ?? EXPRESSIONS.happy;
  const lid = lidFor(e.brows);
  return (
    <g>
      {e.blush && (
        <>
          <ellipse cx="37.5" cy="51.4" rx="3" ry="1.5" fill="#ff5a78" opacity=".24" />
          <ellipse cx="62.5" cy="51.4" rx="3" ry="1.5" fill="#ff5a78" opacity=".24" />
          <path d="M36 51 l.8 -.6 M37.6 51.2 l.8 -.6 M62 51 l.8 -.6 M63.6 51.2 l.8 -.6" stroke="#e11d48" strokeWidth=".45" opacity=".6" strokeLinecap="round" />
        </>
      )}
      <Eye cx={EYE_L} kind={e.eyes[0]} x={x} lid={lid} />
      <Eye cx={EYE_R} kind={e.eyes[1]} x={x} lid={lid} />
      <Brows kind={e.brows} x={x} />
      {e.mouth !== 'robot' && (
        // nose: bridge line on the shadow side, the tip, nostrils and the shadow under it
        <g>
          <path d="M51.6 44.4 Q52.8 47.6 52.6 49.6" stroke={x.skinDark} strokeWidth=".8" fill="none" strokeLinecap="round" />
          <path d="M48 50.6 Q50 52.4 52.4 50.4" fill={x.skinDark} opacity=".45" />
          <path d="M47.6 50.2 Q47.9 51.4 49.2 51.3 M52.6 50.2 Q52.3 51.4 51 51.3" stroke={INK} strokeWidth=".7" fill="none" strokeLinecap="round" />
          <path d="M49.4 51.5 Q50.1 51.9 50.8 51.5" stroke={INK} strokeWidth=".55" fill="none" strokeLinecap="round" />
        </g>
      )}
      <Mouth kind={e.mouth} x={x} />
      {e.tear && <path d="M38.6 48.4 q-1.4 2.4 0 3.4 q1.4 -1 0 -3.4Z M38.6 52.6 q-.8 1.6 0 2.2 q.8 -.6 0 -2.2Z" fill="#7dd3fc" stroke={INK} strokeWidth=".45" />}
      {e.tears2 && <path d="M61.4 48.4 q-1.4 2.4 0 3.4 q1.4 -1 0 -3.4Z M61.4 52.6 q-.8 1.6 0 2.2 q.8 -.6 0 -2.2Z" fill="#7dd3fc" stroke={INK} strokeWidth=".45" />}
      {e.sweat && <path d="M66.5 35 q-1.7 2.8 0 4 q1.7 -1.2 0 -4Z" fill="#7dd3fc" stroke={INK} strokeWidth=".5" />}
      {e.drop && <path d="M68 38 q-2.2 3.6 0 5.2 q2.2 -1.6 0 -5.2Z" fill="#bae6fd" stroke={INK} strokeWidth=".55" />}
      {e.pop && <path d="M30 31 l-2.6 -2.2 M28.4 35.6 l-3.2 -.8 M32.6 27.6 l-1.2 -3" stroke={INK} strokeWidth="1" strokeLinecap="round" />}
      {e.vein && <path d="M61.4 31.4 q1.6 1.6 0 3.2 M63.2 30.6 q-1.6 1.6 0 3.2 M60.6 33.4 q1.6 -1.6 3.2 0 M61.4 35.2 q1.6 -1.6 3.2 0" stroke="#dc2626" strokeWidth=".9" fill="none" strokeLinecap="round" />}
      {e.bling && (
        <g fill="#fde047" stroke={INK} strokeWidth=".4">
          <path d={star(30, 34, 2.4, 0.7, 4)} />
          <path d={star(70.5, 31, 1.8, 0.5, 4)} />
          <path d={star(68, 56, 1.4, 0.4, 4)} />
        </g>
      )}
      {e.whiskers && <path d="M33 51 l-5 -1 M33 53 l-5 1 M67 51 l5 -1 M67 53 l5 1" stroke={INK} strokeWidth=".7" strokeLinecap="round" />}
      {e.zzz && (
        <text x="66" y="27" fontSize="8.5" fontWeight="900" fill="#e2e8f0" stroke={INK} strokeWidth=".5" fontFamily="system-ui, sans-serif">
          z<tspan fontSize="5" dy="-3">z</tspan>
        </text>
      )}
    </g>
  );
}
