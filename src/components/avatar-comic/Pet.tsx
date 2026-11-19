import { type ReactNode } from 'react';
import {  type AvatarItem } from '../../data/avatar';
import { shade, star } from './colors';

/* ---------- pet (on the right shoulder) ---------- */
export function Pet({ item }: { item: AvatarItem }) {
  const c = item.c1 ?? '#f59e0b';
  const eyes = (y = 11, l = 8.5, r = 13.5) => (
    <>
      <circle cx={l} cy={y} r="1.2" fill="#111" />
      <circle cx={r} cy={y} r="1.2" fill="#111" />
      <circle cx={l + 0.4} cy={y - 0.4} r=".4" fill="#fff" />
      <circle cx={r + 0.4} cy={y - 0.4} r=".4" fill="#fff" />
    </>
  );
  let body: ReactNode = null;
  switch (item.style) {
    case 'butterfly':
      body = (
        <g stroke="#1b1512" strokeWidth=".7">
          <path d="M11 12 C2 2 -3 12 3 16 C6 18 9 16 11 13Z" fill={c} />
          <path d="M11 12 C20 2 25 12 19 16 C16 18 13 16 11 13Z" fill={c} />
          <path d="M11 13 C6 15 4 22 8 22 C10 22 11 18 11 14Z M11 13 C16 15 18 22 14 22 C12 22 11 18 11 14Z" fill={shade(c, 0.3)} />
          <circle cx="5" cy="10" r="1.4" fill="#fff" />
          <circle cx="17" cy="10" r="1.4" fill="#fff" />
          <path d="M11 10 V21" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M11 10 Q9 6 8 5 M11 10 Q13 6 14 5" fill="none" />
        </g>
      );
      break;
    case 'pixelpet':
      // an egg-shaped pocket pet with a pixel creature on its screen
      body = (
        <g>
          <ellipse cx="11" cy="14" rx="9" ry="10.5" fill={c} stroke="#1b1512" strokeWidth=".8" />
          <rect x="5" y="7" width="12" height="10" rx="1.5" fill="#bef264" stroke="#1b1512" strokeWidth=".7" />
          <g fill="#1b1512">
            <rect x="9" y="9" width="4" height="1.2" />
            <rect x="8" y="10.2" width="6" height="3.6" />
            <rect x="8" y="13.8" width="1.4" height="1.2" />
            <rect x="12.6" y="13.8" width="1.4" height="1.2" />
          </g>
          <rect x="9.2" y="11" width="1" height="1" fill="#bef264" />
          <rect x="11.8" y="11" width="1" height="1" fill="#bef264" />
          {[7, 11, 15].map((bx) => (
            <circle key={bx} cx={bx} cy="20.5" r="1.2" fill="#fde047" stroke="#1b1512" strokeWidth=".5" />
          ))}
        </g>
      );
      break;
    case 'flipphone':
      body = (
        <g stroke="#1b1512" strokeWidth=".8" strokeLinejoin="round">
          <path d="M15 1.5 V4" strokeWidth=".9" strokeLinecap="round" />
          <rect x="5" y="4" width="12" height="9" rx="2" fill={c} />
          <rect x="7" y="6" width="8" height="5" rx="1" fill="#a5f3fc" />
          <rect x="5" y="13.5" width="12" height="10" rx="2" fill={shade(c, -0.12)} />
          <g fill="#fff" stroke="none">
            {[0, 1, 2].map((r) => [0, 1, 2].map((k) => <rect key={`${r}${k}`} x={7.2 + k * 2.8} y={15.5 + r * 2.4} width="1.8" height="1.3" rx=".4" />))}
          </g>
          <path d={star(-1.5, 7, 2.4, 0.7, 4)} fill="#fde047" strokeWidth=".5" />
        </g>
      );
      break;
    case 'cat':
      body = (
        <>
          <path d="M18 20 C26 20 28 10 24 6" stroke={shade(c, -0.2)} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <ellipse cx="11" cy="19" rx="8" ry="5" fill={c} />
          <path d="M4 7 L5 1 L9 5 Z M18 7 L17 1 L13 5 Z" fill={c} />
          <circle cx="11" cy="10.5" r="7" fill={c} />
          <path d="M6 7 l1 -3 l2 2.5z M16 7 l-1 -3 l-2 2.5z" fill="#fda4af" />
          {eyes(10.5)}
          <path d="M10 13 l1 1 l1 -1" stroke="#7c2d12" strokeWidth=".7" fill="none" />
          <path d="M8 9 l1 0 M13 9 l1 0" stroke={shade(c, -0.3)} strokeWidth=".6" />
        </>
      );
      break;
    case 'puppy':
      body = (
        <>
          <ellipse cx="11" cy="19" rx="8" ry="5" fill={c} />
          <circle cx="11" cy="10.5" r="7" fill={c} />
          <ellipse cx="4.5" cy="10" rx="2.6" ry="5" fill={shade(c, -0.35)} transform="rotate(15 4.5 10)" />
          <ellipse cx="17.5" cy="10" rx="2.6" ry="5" fill={shade(c, -0.35)} transform="rotate(-15 17.5 10)" />
          <ellipse cx="11" cy="13.5" rx="3.6" ry="2.6" fill="#fef3c7" />
          {eyes(9.5)}
          <ellipse cx="11" cy="12.5" rx="1.3" ry=".9" fill="#111" />
          <path d="M10.4 15 q.6 1.6 1.2 0" fill="#fb7185" />
        </>
      );
      break;
    case 'bird':
      body = (
        <>
          <ellipse cx="11" cy="14" rx="8" ry="7.5" fill={c} />
          <ellipse cx="11.5" cy="16.5" rx="4.5" ry="4" fill="#e0f2fe" />
          <path d="M3 13 Q0 18 5 21 Q7 17 6 13Z" fill={shade(c, -0.3)} />
          <path d="M8 4 Q11 1 13 5" stroke={shade(c, -0.3)} strokeWidth="1.5" fill="none" />
          {eyes(11, 8.5, 14)}
          <path d="M10.5 13 L13 13 L11.7 15 Z" fill="#f59e0b" />
        </>
      );
      break;
    case 'slime':
      body = (
        <>
          <path d="M2 21 C1 12 6 4 11 4 C16 4 21 12 20 21 Q11 24 2 21Z" fill={c} opacity=".9" />
          <path d="M6 9 Q8 6 11 6" stroke="#fff" strokeOpacity=".7" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          {eyes(13.5, 8, 14)}
          <path d="M9.5 17 Q11 18.4 12.5 17" stroke="#14532d" strokeWidth=".8" fill="none" />
        </>
      );
      break;
    case 'robot':
      body = (
        <>
          <path d="M11 3 V0" stroke="#94a3b8" strokeWidth="1" />
          <circle cx="11" cy="0" r="1.3" fill="#ef4444" />
          <rect x="3" y="3" width="16" height="12" rx="3" fill="#cbd5e1" stroke="#64748b" strokeWidth=".8" />
          <rect x="5.5" y="5.5" width="11" height="7" rx="2" fill="#0f172a" />
          <circle cx="8.5" cy="9" r="1.3" fill="#22d3ee" />
          <circle cx="13.5" cy="9" r="1.3" fill="#22d3ee" />
          <rect x="5" y="16" width="12" height="7" rx="2" fill="#94a3b8" />
          <circle cx="11" cy="19.5" r="1.2" fill="#facc15" />
        </>
      );
      break;
    case 'dragon':
      body = (
        <>
          <path d="M2 14 L-3 6 L5 10 Z M20 14 L25 6 L17 10 Z" fill={shade(c, -0.25)} />
          <ellipse cx="11" cy="18.5" rx="7.5" ry="5" fill={c} />
          <ellipse cx="11" cy="19.5" rx="4" ry="3" fill="#fde68a" />
          <circle cx="11" cy="10" r="7" fill={c} />
          <path d="M6 5 L5 0 L8.5 3.5 Z M16 5 L17 0 L13.5 3.5 Z" fill="#fde68a" />
          {eyes(9.5)}
          <path d="M9 13.5 h4" stroke={shade(c, -0.4)} strokeWidth=".8" strokeLinecap="round" />
          <circle cx="9.5" cy="12" r=".5" fill={shade(c, -0.4)} />
          <circle cx="12.5" cy="12" r=".5" fill={shade(c, -0.4)} />
        </>
      );
      break;
    case 'frog':
      body = (
        <>
          <ellipse cx="11" cy="16" rx="9" ry="7" fill={c} />
          <circle cx="6" cy="8" r="3.6" fill={c} />
          <circle cx="16" cy="8" r="3.6" fill={c} />
          {eyes(8, 6, 16)}
          <path d="M6 16 Q11 20 16 16" stroke="#14532d" strokeWidth=".9" fill="none" />
          <ellipse cx="11" cy="20" rx="5" ry="2.4" fill="#bbf7d0" />
          <circle cx="4.5" cy="14.5" r="1.2" fill="#fb7185" opacity=".5" />
          <circle cx="17.5" cy="14.5" r="1.2" fill="#fb7185" opacity=".5" />
        </>
      );
      break;
    case 'bunnypet':
      body = (
        <>
          <ellipse cx="7.5" cy="2" rx="2.4" ry="6" fill={c} />
          <ellipse cx="14.5" cy="2" rx="2.4" ry="6" fill={c} />
          <ellipse cx="7.5" cy="2.5" rx="1.1" ry="4" fill="#fbcfe8" />
          <ellipse cx="14.5" cy="2.5" rx="1.1" ry="4" fill="#fbcfe8" />
          <ellipse cx="11" cy="19" rx="8" ry="5" fill={c} />
          <circle cx="11" cy="11" r="6.8" fill={c} />
          {eyes(10.5)}
          <path d="M10.2 13 L11 13.8 L11.8 13" stroke="#f472b6" strokeWidth=".8" fill="none" />
        </>
      );
      break;
    case 'penguin':
      body = (
        <>
          <ellipse cx="11" cy="14" rx="8.5" ry="9" fill="#1e293b" />
          <ellipse cx="11" cy="16" rx="5.6" ry="6.6" fill="#f8fafc" />
          <ellipse cx="11" cy="9" rx="5.2" ry="4.4" fill="#f8fafc" />
          {eyes(8.5, 8.5, 13.5)}
          <path d="M9.6 11 L12.4 11 L11 13 Z" fill="#f59e0b" />
          <path d="M3 14 Q0 18 3.5 21 M19 14 Q22 18 18.5 21" stroke="#1e293b" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      );
      break;
    case 'fox':
      body = (
        <>
          <path d="M18 22 C26 22 28 12 22 8 C24 14 20 18 16 18Z" fill={c} />
          <path d="M22 8 C24 10 25 13 24 15" stroke="#fff" strokeWidth="1.6" fill="none" />
          <ellipse cx="11" cy="19" rx="7.5" ry="4.6" fill={c} />
          <path d="M3 4 L6 11 L10 7 Z M19 4 L16 11 L12 7 Z" fill={c} />
          <path d="M4.5 6 L6.5 10 L8.5 8 Z M17.5 6 L15.5 10 L13.5 8 Z" fill="#1c1917" />
          <path d="M3.5 10 Q11 4 18.5 10 Q17 16 11 17 Q5 16 3.5 10Z" fill={c} />
          <path d="M5.5 12.5 Q11 18 16.5 12.5 Q14 16.5 11 17 Q8 16.5 5.5 12.5Z" fill="#fff" />
          {eyes(11, 8.3, 13.7)}
          <circle cx="11" cy="15" r=".9" fill="#1c1917" />
        </>
      );
      break;
    case 'ghost':
      body = (
        <>
          <path d="M3 22 V11 C3 5 7 2 11 2 C15 2 19 5 19 11 V22 L16.3 19.5 L13.7 22 L11 19.5 L8.3 22 L5.7 19.5 Z" fill="#f8fafc" opacity=".92" />
          <ellipse cx="8" cy="10.5" rx="1.4" ry="2" fill="#1e293b" />
          <ellipse cx="14" cy="10.5" rx="1.4" ry="2" fill="#1e293b" />
          <ellipse cx="11" cy="15" rx="1.6" ry="1.2" fill="#1e293b" />
          <circle cx="6" cy="13" r="1.1" fill="#fda4af" opacity=".6" />
          <circle cx="16" cy="13" r="1.1" fill="#fda4af" opacity=".6" />
        </>
      );
      break;
    case 'phoenix':
      body = (
        <>
          <path d="M3 16 C-4 10 -2 2 3 0 C2 6 5 10 8 12Z" fill="#facc15" />
          <path d="M19 16 C26 10 24 2 19 0 C20 6 17 10 14 12Z" fill="#facc15" />
          <path d="M8 22 Q11 30 14 22" fill="#ef4444" />
          <ellipse cx="11" cy="15" rx="7" ry="7.5" fill={c} />
          <ellipse cx="11" cy="17" rx="4" ry="4.4" fill="#fde68a" />
          <path d="M9 7 Q10 2 11 6 Q12 1 13 7" fill="#ef4444" />
          {eyes(12, 8.5, 13.5)}
          <path d="M10 14 L12 14 L11 16Z" fill="#facc15" />
        </>
      );
      break;
    default:
      return null;
  }
  return <g transform="translate(72 64) scale(1.05)">{body}</g>;
}
