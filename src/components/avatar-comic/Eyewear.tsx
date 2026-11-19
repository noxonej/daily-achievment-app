import {  type AvatarItem } from '../../data/avatar';
import { heart } from './Face';
import { star, type Ctx } from './colors';

/* ---------- eyewear ---------- */
export function Eyewear({ item, x }: { item: AvatarItem; x: Ctx }) {
  const g = `${x.id}eye`;
  switch (item.style) {
    case 'oval':
      // tiny tinted Y2K shades
      return (
        <g>
          <ellipse cx="42" cy="46" rx="5.4" ry="3.4" fill={item.c1 ?? '#f472b6'} fillOpacity=".72" stroke="#cbd5e1" strokeWidth=".9" />
          <ellipse cx="58" cy="46" rx="5.4" ry="3.4" fill={item.c1 ?? '#f472b6'} fillOpacity=".72" stroke="#cbd5e1" strokeWidth=".9" />
          <path d="M47.4 45.6 Q50 44.6 52.6 45.6 M36.6 45.5 L30 44 M63.4 45.5 L70 44" stroke="#cbd5e1" strokeWidth=".9" fill="none" />
          <path d="M39.5 45 q1.5 -1.2 3.2 -1.3 M55.5 45 q1.5 -1.2 3.2 -1.3" stroke="#fff" strokeWidth=".8" strokeLinecap="round" opacity=".85" />
        </g>
      );
    case 'wrap':
      // chrome wraparound shield
      return (
        <g>
          <defs>
            <linearGradient id={`${g}w`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#e0f2fe" />
              <stop offset=".35" stopColor="#818cf8" />
              <stop offset=".65" stopColor="#f0abfc" />
              <stop offset="1" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <path d="M30 42 Q50 37.5 70 42 L68.5 47.5 Q60 51.5 52 48.5 Q50 47.6 48 48.5 Q40 51.5 31.5 47.5Z" fill={`url(#${g}w)`} stroke="#1b1512" strokeWidth=".9" strokeLinejoin="round" />
          <path d="M34 43 Q42 40.6 48 41.2" stroke="#fff" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity=".9" />
        </g>
      );
    case 'round':
      return (
        <g stroke={item.c1 ?? '#1f2937'} strokeWidth="1.5" fill="#fff" fillOpacity=".12">
          <circle cx="42.5" cy="45" r="5.6" />
          <circle cx="57.5" cy="45" r="5.6" />
          <path d="M48.1 44.6 Q50 43.4 51.9 44.6 M36.9 44.5 L30 43 M63.1 44.5 L70 43" fill="none" />
        </g>
      );
    case 'shades':
      return (
        <g>
          <defs>
            <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#334155" />
              <stop offset="1" stopColor="#020617" />
            </linearGradient>
          </defs>
          <path d="M35 41.5 H48 Q48.5 50.5 42 50.8 Q35.5 50.5 35 41.5Z M52 41.5 H65 Q64.5 50.5 58 50.8 Q51.5 50.5 52 41.5Z" fill={`url(#${g})`} stroke="#d4af37" strokeWidth=".8" />
          <path d="M48 42.4 H52 M35 42 L30 41 M65 42 L70 41" stroke="#d4af37" strokeWidth="1" />
          <path d="M37.5 43.5 l3 3 M54.5 43.5 l3 3" stroke="#fff" strokeOpacity=".5" strokeWidth=".9" strokeLinecap="round" />
        </g>
      );
    case 'pixel':
      return (
        <g fill="#0a0a0a">
          <rect x="33" y="41" width="34" height="2.5" />
          {[34, 37, 40, 43, 53, 56, 59, 62].map((px, i) => (
            <rect key={px} x={px} y="43.5" width="3" height={i % 4 === 3 ? 2.5 : 5} />
          ))}
          <rect x="35" y="43.5" width="2.5" height="2.5" fill="#fff" opacity=".85" />
          <rect x="54" y="43.5" width="2.5" height="2.5" fill="#fff" opacity=".85" />
        </g>
      );
    case 'stars':
      return (
        <g>
          <path d={star(42.5, 45, 7, 3.4)} fill="#f472b6" fillOpacity=".75" stroke="#facc15" strokeWidth="1" strokeLinejoin="round" />
          <path d={star(57.5, 45, 7, 3.4)} fill="#f472b6" fillOpacity=".75" stroke="#facc15" strokeWidth="1" strokeLinejoin="round" />
          <path d="M48.6 44 H51.4" stroke="#facc15" strokeWidth="1.2" />
        </g>
      );
    case 'monocle':
      return (
        <g fill="none">
          <circle cx="57.5" cy="45" r="5.4" stroke="#d4af37" strokeWidth="1.6" fill="#fff" fillOpacity=".12" />
          <path d="M61.5 49 Q66 58 63 66" stroke="#d4af37" strokeWidth=".8" strokeDasharray="1.2 1" />
        </g>
      );
    case 'visor':
      return (
        <g>
          <defs>
            <linearGradient id={g} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#22d3ee" />
              <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <path d="M31 40.5 H69 Q72 45 69 49.5 H31 Q28 45 31 40.5Z" fill={`url(#${g})`} opacity=".92" />
          <path d="M33 44.8 H67" stroke="#fff" strokeWidth=".9" opacity=".9" />
          <path d="M31 40.5 H69 Q72 45 69 49.5 H31 Q28 45 31 40.5Z" fill="none" stroke="#0f172a" strokeWidth=".8" />
        </g>
      );
    case 'nerd':
      return (
        <g fill="#fff" fillOpacity=".1" stroke="#111827" strokeWidth="2.2" strokeLinejoin="round">
          <rect x="36" y="41" width="12.5" height="8.5" rx="2" />
          <rect x="51.5" y="41" width="12.5" height="8.5" rx="2" />
          <path d="M48.5 44 H51.5 M36 43 L30 42 M64 43 L70 42" fill="none" />
        </g>
      );
    case '3d':
      return (
        <g>
          <rect x="34.5" y="40.5" width="31" height="9.5" rx="1.5" fill="#f8fafc" />
          <rect x="36.5" y="42" width="11.5" height="6.5" rx="1" fill="#ef4444" opacity=".85" />
          <rect x="52" y="42" width="11.5" height="6.5" rx="1" fill="#06b6d4" opacity=".85" />
          <path d="M34.5 43 L30 42 M65.5 43 L70 42" stroke="#f8fafc" strokeWidth="1.4" />
        </g>
      );
    case 'goggles':
      return (
        <g>
          <defs>
            <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fde047" />
              <stop offset=".5" stopColor="#f97316" />
              <stop offset="1" stopColor="#db2777" />
            </linearGradient>
          </defs>
          <path d="M27 42 Q50 38 73 42 L73 46 Q50 42 27 46Z" fill="#111827" />
          <rect x="33" y="38.5" width="34" height="13" rx="6.5" fill="#1f2937" />
          <rect x="35" y="40.5" width="30" height="9" rx="4.5" fill={`url(#${g})`} />
          <path d="M38 43 Q44 41 50 42" stroke="#fff" strokeOpacity=".6" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'hearts':
      return (
        <g>
          <path d={heart(42.5, 45, 4)} fill="#f43f5e" fillOpacity=".8" stroke="#be123c" strokeWidth=".9" />
          <path d={heart(57.5, 45, 4)} fill="#f43f5e" fillOpacity=".8" stroke="#be123c" strokeWidth=".9" />
          <path d="M48.3 44 H51.7 M36.5 43 L30 42 M63.5 43 L70 42" stroke="#be123c" strokeWidth="1" />
        </g>
      );
    case 'patch':
      return (
        <g>
          <path d="M29 37 L71 51" stroke="#111827" strokeWidth="1.3" />
          <ellipse cx="57.5" cy="45.5" rx="5.2" ry="4.6" fill="#111827" />
        </g>
      );
    default:
      return null;
  }
}
