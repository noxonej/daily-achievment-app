import { useId } from 'react';
import type { BodySpec } from './spec';
import { shade, tint, luma } from '../room/paint';

/**
 * Draws a car from its body plan (side view, facing right). viewBox 400 × 170, ground at y = 150.
 * Parts (wheels, spoiler, body kit, stance) can be swapped without changing the body.
 */
export interface CarParts {
  rim?: string;
  spoiler?: string;
  kit?: string;
  stance?: string;
}

const G = 150;

export function CarArt({ body, paint, parts = {}, className = '', spin = false, shadow = true }: { body: BodySpec; paint: string; parts?: CarParts; className?: string; spin?: boolean; shadow?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const kit = parts.kit ?? 'stock';
  const lowered = parts.stance === 'low' ? 5 : parts.stance === 'lifted' ? -8 : 0;
  const rimStyle = parts.rim ?? body.rim;
  const spoiler = parts.spoiler ?? body.spoiler;
  const b = body;
  const L = b.len;
  const xf = 200 + L / 2;
  const xr = 200 - L / 2;
  const R = b.wheelR + (kit === 'wide' ? 1 : 0);
  const axY = G - R;
  const xfa = xf - L * b.ohF;
  const xra = xr + L * b.ohR;
  // Body heights (lowering drops the body, not the wheels).
  const y = (h: number) => G - h + lowered;
  const yb = y(b.clear);
  const cowlX = xf - L * b.hood;
  const rise = b.roof - b.belt;
  const roofFX = b.rear === 'open' ? cowlX - 14 : cowlX - rise * b.rake;
  const roofRX = roofFX - L * b.roofLen;
  const tailX = xr + 4;

  /* ---------- body outline (clockwise from the front bottom) */
  const archR = R + 4;
  const arch = (cx: number, dir: 1 | -1) => {
    // Endpoints where the arch meets the body bottom; the arch is drawn going from rear to front.
    const dy = yb - axY;
    const dx = Math.sqrt(Math.max(archR * archR - dy * dy, 0));
    const big = dy > 0 ? 1 : 0;
    return dir === 1 ? `L${cx - dx} ${yb} A${archR} ${archR} 0 ${big} 1 ${cx + dx} ${yb}` : '';
  };
  let top = '';
  const noseY = y(b.nose);
  const beltY = y(b.belt);
  const roofY = y(b.roof);
  const tailY = y(b.tail);
  // Front: bumper up to the nose, hood back to the cowl.
  const front = `M${xf - 6} ${yb - 2} Q${xf + 2} ${yb - 4} ${xf + 1} ${noseY + 10} Q${xf} ${noseY} ${xf - 10} ${noseY - 2} Q${(xf + cowlX) / 2} ${noseY - (b.belt - b.nose) * 0.55} ${cowlX} ${beltY}`;
  const corner = 10;
  const wsx = (roofFX - cowlX);
  const windscreen = `L${roofFX - wsx * -0.0 + corner * 0.6} ${roofY + corner * 0.4} Q${roofFX} ${roofY} ${roofFX - corner} ${roofY - 1}`;
  const roofLine = `Q${(roofFX + roofRX) / 2} ${roofY - 3} ${roofRX + corner} ${roofY}`;
  switch (b.rear) {
    case 'fastback': {
      const run = L * b.rearRun;
      top = `${windscreen} ${roofLine} Q${roofRX} ${roofY + 1} ${roofRX - run * 0.5} ${(roofY + tailY) / 2 - 2} L${tailX + 10} ${tailY}`;
      break;
    }
    case 'wedge': {
      top = `${windscreen} ${roofLine} Q${roofRX - 4} ${roofY + 2} ${roofRX - 18} ${roofY + 10} L${tailX + 8} ${tailY}`;
      break;
    }
    case 'notch': {
      const deckX = roofRX - L * b.rearRun;
      const deckY = y(b.tail + 4);
      top = `${windscreen} ${roofLine} Q${roofRX - 2} ${roofY + 2} ${deckX + 6} ${deckY - 2} Q${deckX} ${deckY} ${deckX - 8} ${deckY} L${tailX + 6} ${tailY}`;
      break;
    }
    case 'hatch': {
      top = `${windscreen} ${roofLine} Q${roofRX - 2} ${roofY + 2} ${roofRX - 6} ${roofY + 10} L${tailX + 4} ${tailY - 6}`;
      break;
    }
    case 'box': {
      top = `${windscreen} L${roofRX + 4} ${roofY} Q${tailX + 2} ${roofY} ${tailX + 1} ${roofY + 8} L${tailX} ${tailY}`;
      break;
    }
    case 'pickup': {
      const cabX = roofRX;
      top = `${windscreen} L${cabX + 6} ${roofY} Q${cabX} ${roofY} ${cabX} ${roofY + 8} L${cabX} ${beltY - 2} L${tailX + 2} ${beltY - 2} L${tailX} ${tailY}`;
      break;
    }
    case 'open': {
      top = `L${tailX + 10} ${beltY + 2} L${tailX + 4} ${tailY}`;
      break;
    }
  }
  const back = `Q${xr - 2} ${tailY + 2} ${xr - 1} ${tailY + 14} L${xr + 2} ${yb - 4} Q${xr + 2} ${yb} ${xr + 8} ${yb}`;
  const bottom = `${arch(xra, 1)} ${arch(xfa, 1)} L${xf - 6} ${yb - 2} Z`;
  const outline = `${front} ${top} ${back} ${bottom}`;

  /* ---------- glass */
  const gInset = 5;
  const belt2 = beltY - 2;
  let glass = '';
  if (b.rear !== 'open') {
    const gFront = `M${cowlX - 8} ${belt2} L${roofFX + corner * 0.4} ${roofY + gInset}`;
    let gBack = '';
    switch (b.rear) {
      case 'fastback':
        gBack = `L${roofRX + 2} ${roofY + gInset} Q${roofRX - 10} ${roofY + gInset + 4} ${roofRX - L * b.rearRun * 0.42} ${belt2}`;
        break;
      case 'wedge':
        gBack = `L${roofRX + 4} ${roofY + gInset} L${roofRX - 10} ${belt2}`;
        break;
      case 'notch':
        gBack = `L${roofRX + 4} ${roofY + gInset} L${roofRX - L * b.rearRun * 0.7} ${belt2}`;
        break;
      case 'hatch':
        gBack = `L${roofRX} ${roofY + gInset} L${roofRX - 4} ${belt2}`;
        break;
      case 'box':
        gBack = `L${tailX + 14} ${roofY + gInset} L${tailX + 12} ${belt2}`;
        break;
      case 'pickup':
        gBack = `L${roofRX + 8} ${roofY + gInset} L${roofRX + 6} ${belt2}`;
        break;
    }
    glass = `${gFront} ${gBack} Z`;
  }
  // Pillars between side windows.
  const pillars: number[] = [];
  if (b.rear !== 'open') {
    const span = roofFX - (b.rear === 'box' ? tailX + 14 : roofRX);
    if (b.rear === 'box' || b.rear === 'hatch') pillars.push(roofFX - span * 0.48);
    if (b.rear === 'box') pillars.push(roofFX - span * 0.8);
    if (b.rear === 'notch' || b.rear === 'fastback' || b.rear === 'hatch') pillars.push(roofFX - (roofFX - roofRX) * 0.55);
  }

  const dark = shade(paint, 0.38);
  const light = tint(paint, 0.38);
  const lightPaint = luma(paint) > 0.7;
  const secondary = b.twoTone ? (lightPaint ? '#1f2937' : shade(paint, 0.55)) : paint;
  const glassTop = '#9fb4c8';
  const glassBot = '#1b2633';
  const doorX = (cowlX + (b.rear === 'pickup' ? roofRX : roofRX)) / 2;

  return (
    <svg viewBox="0 0 400 170" className={className} role="img" aria-hidden="true">
      <defs>
        <linearGradient id={`b${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="0.38" stopColor={paint} />
          <stop offset="0.72" stopColor={shade(paint, 0.12)} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={glassTop} />
          <stop offset="1" stopColor={glassBot} />
        </linearGradient>
        <clipPath id={`c${uid}`}>
          <path d={outline} />
        </clipPath>
      </defs>
      {shadow && <ellipse cx={200} cy={G + 2} rx={L / 2 + 6} ry={6} fill="#000" opacity={0.35} />}

      {/* far-side wheels peeking (depth) */}
      <circle cx={xfa + 6} cy={axY} r={R - 2} fill="#0b0c0f" />
      <circle cx={xra + 6} cy={axY} r={R - 2} fill="#0b0c0f" />

      {/* dark wheel wells */}
      <circle cx={xfa} cy={axY} r={archR - 0.5} fill="#08090b" />
      <circle cx={xra} cy={axY} r={archR - 0.5} fill="#08090b" />

      {/* body */}
      <path d={outline} fill={`url(#b${uid})`} />
      <g clipPath={`url(#c${uid})`}>
        {/* lower body darker, like a reflection of the road */}
        <rect x={0} y={yb - 16} width={400} height={30} fill={dark} opacity={0.35} />
        {b.twoTone && <path d={`M${xf} ${noseY + 14} Q${200} ${beltY + 30} ${xr} ${tailY + 18} V${yb + 4} H${xf} Z`} fill={secondary} opacity={0.9} />}
        {b.ccurve && <path d={`M${cowlX - 4} ${beltY + 4} Q${cowlX - 40} ${yb - 4} ${doorX - 10} ${yb - 6}`} stroke="#d1d5db" strokeWidth={3} fill="none" opacity={0.85} />}
        {b.stripes && <path d={`M${xf} ${noseY + 3} L${cowlX} ${beltY + 3} L${xr} ${tailY + 3}`} stroke={lightPaint ? '#111827' : '#f8fafc'} strokeWidth={4} fill="none" opacity={0.85} />}
        {b.chromeLine && <path d={`M${xf - 14} ${(noseY + yb) / 2 + 4} L${xr + 14} ${(tailY + yb) / 2 + 4}`} stroke="#e5e7eb" strokeWidth={1.5} opacity={0.8} />}
        {/* shoulder highlight */}
        <path d={`M${xf - 12} ${noseY + 4} Q${cowlX} ${beltY + 6} ${(cowlX + xr) / 2} ${beltY + 7} L${xr + 6} ${tailY + 6}`} stroke={tint(paint, 0.6)} strokeWidth={1.4} fill="none" opacity={0.55} />
        {/* door shut line */}
        {b.rear !== 'open' && <path d={`M${doorX} ${beltY + 2} Q${doorX + 3} ${(beltY + yb) / 2} ${doorX} ${yb - 2}`} stroke={dark} strokeWidth={1} opacity={0.6} fill="none" />}
        {b.rear === 'box' && <path d={`M${doorX - 60} ${beltY + 2} V${yb - 2}`} stroke={dark} strokeWidth={1} opacity={0.5} />}
      </g>

      {/* wheel-arch lips catch the light, which gives the body its round fenders */}
      {[xfa, xra].map((cx) => (
        <path key={cx} d={`M${cx - archR - 2} ${Math.min(yb, axY + 6)} A${archR + 2} ${archR + 2} 0 0 1 ${cx + archR + 2} ${Math.min(yb, axY + 6)}`} stroke={tint(paint, 0.5)} strokeWidth={1.4} fill="none" opacity={0.45} clipPath={`url(#c${uid})`} />
      ))}

      {/* glass */}
      {glass && <path d={glass} fill={`url(#g${uid})`} stroke={shade(paint, 0.55)} strokeWidth={1.2} strokeLinejoin="round" />}
      {glass && <path d={glass} fill="#fff" opacity={0.08} clipPath={`url(#c${uid})`} />}
      {pillars.map((px) => (
        <path key={px} d={`M${px} ${roofY + 4} L${px - 3} ${belt2}`} stroke={b.floatRoof ? '#0b0c0f' : shade(paint, 0.45)} strokeWidth={b.floatRoof ? 5 : 4} />
      ))}
      {b.kink && b.rear !== 'open' && <path d={`M${roofRX - 2} ${belt2} q4 -8 10 -6`} stroke={shade(paint, 0.5)} strokeWidth={3} fill="none" />}
      {b.floatRoof && b.rear !== 'open' && <path d={`M${roofFX - 2} ${roofY + 2} L${tailX + 8} ${roofY + 2}`} stroke="#0b0c0f" strokeWidth={4} />}
      {/* open top: windscreen frame, seats and a roll hoop */}
      {b.rear === 'open' && (
        <g>
          <path d={`M${cowlX - 4} ${beltY} L${cowlX - 22} ${beltY - 24}`} stroke="#c7ccd4" strokeWidth={3} />
          <path d={`M${cowlX - 6} ${beltY - 2} L${cowlX - 20} ${beltY - 20} L${cowlX - 8} ${beltY - 20}`} fill="#9fb4c8" opacity={0.5} />
          <rect x={doorX - 16} y={beltY - 18} width={14} height={20} rx={5} fill="#3a2a1a" />
          <rect x={doorX - 50} y={beltY - 16} width={14} height={18} rx={5} fill="#3a2a1a" />
        </g>
      )}

      {/* signature details */}
      {b.scoop && <path d={`M${xra + R + 14} ${(beltY + yb) / 2 - 6} q12 -6 26 0 l-4 12 q-10 -4 -22 0 Z`} fill={shade(paint, 0.6)} />}
      {b.intake && <path d={`M${xra + R + 8} ${yb - 8} L${xra + R + 40} ${beltY + 10} L${xra + R + 46} ${beltY + 18} L${xra + R + 22} ${yb - 6} Z`} fill="#0b0c0f" opacity={0.85} />}
      {b.louvres && [0, 1, 2, 3].map((i) => <path key={i} d={`M${roofRX - 26 - i * 9} ${roofY + 12 + i * 2.5} l7 0`} stroke="#0b0c0f" strokeWidth={2} />)}
      {b.hoodScoop && <path d={`M${cowlX + 20} ${beltY - 1} q16 -10 40 -4 l2 6 Z`} fill={shade(paint, 0.5)} />}
      {b.rack && b.rear !== 'open' && (
        <g stroke="#1f2228" strokeWidth={3}>
          <path d={`M${roofFX - 6} ${roofY - 4} H${Math.max(roofRX, tailX + 10)}`} />
          <path d={`M${roofFX - 14} ${roofY - 4} v4 M${(roofFX + tailX) / 2} ${roofY - 4} v4 M${tailX + 16} ${roofY - 4} v4`} />
        </g>
      )}
      {b.snorkel && <path d={`M${cowlX + 4} ${beltY + 10} V${roofY + 6} Q${cowlX + 4} ${roofY - 2} ${cowlX - 4} ${roofY - 2}`} stroke="#1f2228" strokeWidth={5} fill="none" strokeLinecap="round" />}
      {b.spare && (
        <g>
          <circle cx={xr - 6} cy={(tailY + yb) / 2 - 4} r={R * 0.75} fill="#16171b" />
          <circle cx={xr - 6} cy={(tailY + yb) / 2 - 4} r={R * 0.4} fill="#2e3036" />
        </g>
      )}
      {b.bullbar && <path d={`M${xf + 2} ${yb - 4} V${noseY + 2} H${xf - 10}`} stroke="#1f2228" strokeWidth={5} fill="none" strokeLinejoin="round" />}
      {b.chromeBumpers && (
        <g fill="#d6dbe2">
          <rect x={xf - 14} y={yb - 12} width={20} height={6} rx={3} />
          <rect x={xr - 6} y={yb - 12} width={20} height={6} rx={3} />
        </g>
      )}
      {b.fender && (
        <g fill={shade(paint, 0.15)} opacity={0.9}>
          <path d={`M${xfa - archR - 6} ${yb + 1} A${archR + 6} ${archR + 6} 0 0 1 ${xfa + archR + 6} ${yb + 1} L${xfa + archR} ${yb + 1} A${archR} ${archR} 0 0 0 ${xfa - archR} ${yb + 1} Z`} />
          <path d={`M${xra - archR - 6} ${yb + 1} A${archR + 6} ${archR + 6} 0 0 1 ${xra + archR + 6} ${yb + 1} L${xra + archR} ${yb + 1} A${archR} ${archR} 0 0 0 ${xra - archR} ${yb + 1} Z`} />
        </g>
      )}

      {/* lights */}
      <Headlight style={b.lamp} x={xf} y={noseY} />
      <path d={`M${xr + 1} ${tailY + 4} q3 6 0 12`} stroke="#ef4444" strokeWidth={4} strokeLinecap="round" fill="none" />
      <path d={`M${xr + 1} ${tailY + 4} q3 6 0 12`} stroke="#fecaca" strokeWidth={1.2} strokeLinecap="round" fill="none" opacity={0.8} />
      {/* mirror */}
      {b.rear !== 'open' && <path d={`M${cowlX - 10} ${beltY - 3} l8 -6 h6 l-2 6 Z`} fill={shade(paint, 0.2)} />}

      {/* body kit */}
      {kit !== 'stock' && (
        <g fill="#141519">
          <path d={`M${xra + archR} ${yb} L${xfa - archR} ${yb} L${xfa - archR - 4} ${yb + 4} L${xra + archR + 4} ${yb + 4} Z`} />
          <path d={`M${xf - 2} ${yb - 3} L${xf + 6} ${yb + 2} L${xfa + archR} ${yb + 2} L${xfa + archR} ${yb - 1} Z`} />
          <path d={`M${xr + 2} ${yb - 2} L${xra - archR} ${yb - 1} V${yb + 2} L${xr - 2} ${yb + 2} Z`} />
        </g>
      )}
      {kit === 'wide' && (
        <g fill={shade(paint, 0.2)}>
          {[xfa, xra].map((cx) => {
            // A flare that follows the wheel arch (centred on the axle) and stops where it meets the sill.
            const ro = archR + 7;
            const ri = archR + 1;
            // Only the top of the wheel gets a flare: it ends a little below the axle at most.
            const ye = Math.min(yb, axY + 5);
            const dy = ye - axY;
            const dxo = Math.sqrt(Math.max(ro * ro - dy * dy, 0));
            const dxi = Math.sqrt(Math.max(ri * ri - dy * dy, 0));
            const big = dy > 0 ? 1 : 0;
            return <path key={cx} d={`M${cx - dxo} ${ye} A${ro} ${ro} 0 ${big} 1 ${cx + dxo} ${ye} L${cx + dxi} ${ye} A${ri} ${ri} 0 ${big} 0 ${cx - dxi} ${ye} Z`} />;
          })}
        </g>
      )}

      {/* spoiler */}
      <Spoiler kind={spoiler} x={tailX} y={b.rear === 'pickup' ? beltY : tailY} paint={paint} />

      {/* wheel arches + wheels */}
      <Wheel cx={xfa} cy={axY} r={R} rim={rimStyle} spin={spin} />
      <Wheel cx={xra} cy={axY} r={R} rim={rimStyle} spin={spin} />
    </svg>
  );
}

function Headlight({ style, x, y }: { style: string; x: number; y: number }) {
  switch (style) {
    case 'round':
      return <circle cx={x - 8} cy={y + 6} r={5} fill="#fff8dc" stroke="#9ca3af" strokeWidth={1} />;
    case 'quad':
      return (
        <g fill="#fff8dc">
          <circle cx={x - 5} cy={y + 6} r={3.4} />
          <circle cx={x - 13} cy={y + 5} r={3.4} />
        </g>
      );
    case 'bar':
      return <rect x={x - 22} y={y + 2} width={22} height={4} rx={2} fill="#fff8dc" />;
    case 'pop':
      return <path d={`M${x - 22} ${y + 1} L${x - 4} ${y + 3}`} stroke="#d1d5db" strokeWidth={2} />;
    default:
      return <path d={`M${x - 26} ${y + 2} Q${x - 12} ${y + 2} ${x - 2} ${y + 7}`} stroke="#fff8dc" strokeWidth={3} strokeLinecap="round" fill="none" />;
  }
}

function Spoiler({ kind, x, y, paint }: { kind: string; x: number; y: number; paint: string }) {
  const c = shade(paint, 0.25);
  switch (kind) {
    case 'lip':
      return <path d={`M${x + 4} ${y - 1} l18 1 l-2 3 Z`} fill="#141519" />;
    case 'duck':
      return <path d={`M${x + 2} ${y + 1} q4 -9 26 -4 l-4 5 Z`} fill={c} />;
    case 'wing':
      return (
        <g>
          <path d={`M${x + 14} ${y - 1} l-2 -12 M${x + 28} ${y - 1} l-2 -12`} stroke="#141519" strokeWidth={3} />
          <path d={`M${x - 4} ${y - 16} h44 l-4 5 h-38 Z`} fill={c} />
        </g>
      );
    case 'gt':
      return (
        <g>
          <path d={`M${x + 12} ${y - 1} l-4 -20 M${x + 30} ${y - 1} l-4 -20`} stroke="#3a3d44" strokeWidth={3} />
          {/* carbon wing with a lit top edge, so it reads on a dark stage too */}
          <path d={`M${x - 10} ${y - 24} h52 q-2 6 -6 7 h-42 Z`} fill="#24262b" stroke="#5b606b" strokeWidth={1} />
          <path d={`M${x - 9} ${y - 23.5} h50`} stroke={c} strokeWidth={1.4} opacity={0.9} />
          <rect x={x - 12} y={y - 30} width={4} height={14} rx={1} fill="#24262b" stroke="#5b606b" strokeWidth={0.8} />
          <rect x={x + 40} y={y - 30} width={4} height={14} rx={1} fill="#24262b" stroke="#5b606b" strokeWidth={0.8} />
        </g>
      );
    default:
      return null;
  }
}

/** Rim styles: each is a different design, not a different colour. */
export const RIMS: Array<{ id: string; name: string }> = [
  { id: 'five', name: 'Five-spoke' },
  { id: 'split', name: 'Split ten-spoke' },
  { id: 'multi', name: 'Multi-spoke' },
  { id: 'mesh', name: 'Mesh' },
  { id: 'turbine', name: 'Turbine' },
  { id: 'aero', name: 'Aero disc' },
  { id: 'dish', name: 'Deep dish' },
  { id: 'wire', name: 'Wire spokes' },
  { id: 'hubcap', name: 'Classic hubcap' },
  { id: 'offroad', name: 'Off-road' },
  { id: 'beadlock', name: 'Beadlock' },
];

export function Wheel({ cx, cy, r, rim, spin }: { cx: number; cy: number; r: number; rim: string; spin?: boolean }) {
  const rr = r * 0.66;
  const spokes = (n: number, w: number, color = '#c7ccd4', inner = 0.22) =>
    Array.from({ length: n }, (_, i) => (
      <rect key={i} x={cx - w / 2} y={cy - rr} width={w} height={rr * (1 - inner)} rx={w / 3} fill={color} transform={`rotate(${(360 / n) * i} ${cx} ${cy})`} />
    ));
  let face: React.ReactNode;
  switch (rim) {
    case 'split':
      face = Array.from({ length: 5 }, (_, i) => (
        <g key={i} transform={`rotate(${72 * i} ${cx} ${cy})`}>
          <path d={`M${cx - 1.5} ${cy - rr * 0.2} L${cx - 5} ${cy - rr} M${cx + 1.5} ${cy - rr * 0.2} L${cx + 5} ${cy - rr}`} stroke="#c7ccd4" strokeWidth={2.4} />
        </g>
      ));
      break;
    case 'multi':
      face = spokes(14, 1.8);
      break;
    case 'mesh':
      face = (
        <g stroke="#c7ccd4" strokeWidth={1.2}>
          {Array.from({ length: 10 }, (_, i) => (
            <path key={i} d={`M${cx} ${cy} L${cx + Math.cos((i * Math.PI) / 5) * rr} ${cy + Math.sin((i * Math.PI) / 5) * rr}`} />
          ))}
          <circle cx={cx} cy={cy} r={rr * 0.62} fill="none" />
          {Array.from({ length: 10 }, (_, i) => (
            <path key={`d${i}`} d={`M${cx + Math.cos((i * Math.PI) / 5) * rr * 0.62} ${cy + Math.sin((i * Math.PI) / 5) * rr * 0.62} L${cx + Math.cos(((i + 1) * Math.PI) / 5) * rr} ${cy + Math.sin(((i + 1) * Math.PI) / 5) * rr}`} />
          ))}
        </g>
      );
      break;
    case 'turbine':
      face = Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M${cx} ${cy} q${rr * 0.5} ${-rr * 0.2} ${rr * 0.25} ${-rr}`} stroke="#d4d8de" strokeWidth={3} fill="none" transform={`rotate(${40 * i} ${cx} ${cy})`} />
      ));
      break;
    case 'aero':
      face = (
        <g>
          <circle cx={cx} cy={cy} r={rr} fill="#9aa1ab" />
          {Array.from({ length: 5 }, (_, i) => (
            <path key={i} d={`M${cx} ${cy - rr * 0.35} a${rr * 0.65} ${rr * 0.65} 0 0 1 ${rr * 0.6} ${rr * 0.25}`} stroke="#6b7280" strokeWidth={2} fill="none" transform={`rotate(${72 * i} ${cx} ${cy})`} />
          ))}
        </g>
      );
      break;
    case 'dish':
      face = (
        <g>
          <circle cx={cx} cy={cy} r={rr} fill="#e5e7eb" />
          <circle cx={cx} cy={cy} r={rr * 0.72} fill="#9ca3af" />
          {spokes(6, 4, '#e5e7eb', 0.5)}
        </g>
      );
      break;
    case 'wire':
      face = (
        <g stroke="#e5e7eb" strokeWidth={0.8}>
          {Array.from({ length: 24 }, (_, i) => (
            <path key={i} d={`M${cx} ${cy} L${cx + Math.cos((i * Math.PI) / 12 + 0.3) * rr} ${cy + Math.sin((i * Math.PI) / 12 + 0.3) * rr}`} />
          ))}
        </g>
      );
      break;
    case 'hubcap':
      face = (
        <g>
          <circle cx={cx} cy={cy} r={rr} fill="#e5e7eb" />
          <circle cx={cx} cy={cy} r={rr * 0.45} fill="#cbd0d8" />
          <circle cx={cx} cy={cy} r={rr * 0.82} fill="none" stroke="#9ca3af" strokeWidth={1} />
        </g>
      );
      break;
    case 'offroad':
      face = (
        <g>
          <circle cx={cx} cy={cy} r={rr} fill="#2e3036" />
          {Array.from({ length: 6 }, (_, i) => (
            <circle key={i} cx={cx + Math.cos((i * Math.PI) / 3) * rr * 0.6} cy={cy + Math.sin((i * Math.PI) / 3) * rr * 0.6} r={rr * 0.18} fill="#111" />
          ))}
        </g>
      );
      break;
    case 'beadlock':
      face = (
        <g>
          <circle cx={cx} cy={cy} r={rr} fill="#1f2228" />
          <circle cx={cx} cy={cy} r={rr * 0.92} fill="none" stroke="#9ca3af" strokeWidth={2} />
          {Array.from({ length: 16 }, (_, i) => (
            <circle key={i} cx={cx + Math.cos((i * Math.PI) / 8) * rr * 0.92} cy={cy + Math.sin((i * Math.PI) / 8) * rr * 0.92} r={0.9} fill="#e5e7eb" />
          ))}
          {spokes(8, 3, '#3a3d45', 0.4)}
        </g>
      );
      break;
    default:
      face = spokes(5, 5);
  }
  const offroad = rim === 'offroad' || rim === 'beadlock';
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#111214" />
      {offroad &&
        Array.from({ length: 18 }, (_, i) => (
          <rect key={i} x={cx - 2.5} y={cy - r - 1} width={5} height={5} fill="#111214" transform={`rotate(${20 * i} ${cx} ${cy})`} />
        ))}
      <circle cx={cx} cy={cy} r={r - 2} fill="none" stroke="#2a2c31" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={rr + 1.5} fill="#3a3d44" />
      <g className={spin ? 'wheel-spin' : ''} style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy} r={rr} fill="#2a2c31" />
        {face}
      </g>
      <circle cx={cx} cy={cy} r={rr * 0.16} fill="#d6dbe2" />
      <path d={`M${cx - r * 0.7} ${cy - r * 0.55} A${r} ${r} 0 0 1 ${cx + r * 0.2} ${cy - r * 0.95}`} stroke="#fff" strokeWidth={1.2} opacity={0.15} fill="none" />
    </g>
  );
}
