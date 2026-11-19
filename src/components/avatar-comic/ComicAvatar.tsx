import { useId } from 'react';
import type { Character } from '../../lib/types';
import { findItem, normalizeLook } from '../../data/avatar';
import { useTodayMood } from '../../store/AppContext';
import { Backdrop } from '../AvatarBackdrop';
import { HairBack, HairFront } from './Hair';
import { INK, Face } from './Face';
import { Outfit } from './Outfit';
import { Eyewear } from './Eyewear';
import { Pet } from './Pet';
import { shade, mix, type Ctx } from './colors';
import { Headwear } from './Headwear';
import { HEAD, FEATURES, FACE, BODY, Ears } from './Head';

/* ---------- the avatar (previous comic style, kept for reference) ---------- */
export function ComicAvatar({
  look,
  size = 96,
  shape = 'rounded',
  className = '',
  title,
  mood,
}: {
  look: Partial<Character> | undefined;
  /** Today's mood (1–5), used when the "Match my mood" face is worn. */
  mood?: number;
  size?: number;
  shape?: 'rounded' | 'circle' | 'square';
  className?: string;
  title?: string;
}) {
  const id = useId().replace(/:/g, '');
  const todayMood = useTodayMood();
  const l = normalizeLook(look);
  const skinItem = findItem(l.skin)!;
  const hairItem = findItem(l.hair)!;
  const hairColor = findItem(l.hairColor)!.c1!;
  const skin = skinItem.c1!;
  const lip = mix(skin, '#b4505a', 0.5);
  const x: Ctx = {
    id,
    skin,
    skinDark: shade(skin, -0.22),
    hair: hairColor,
    hairDark: shade(hairColor, -0.35),
    eye: ['#a87545', '#6b4426', '#2e1b0e'],
    brow: INK,
    lip,
    lipDark: shade(lip, -0.18),
  };
  const clip = `${id}clip`;
  // The cartoon ink outline around every shape. Thicker on small pictures so it still shows.
  const ink = `url(#${id}ink)`;
  const radius = size < 60 ? 1.25 : size < 120 ? 1 : 0.9;
  const shadow = shade(skin, -0.16);

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label={title ?? 'Avatar'}>
      <defs>
        <clipPath id={clip}>
          {shape === 'circle' ? <circle cx="50" cy="50" r="50" /> : <rect width="100" height="100" rx={shape === 'rounded' ? 24 : 0} />}
        </clipPath>
        <filter id={`${id}ink`} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius={radius} result="grown" />
          <feFlood floodColor={INK} />
          <feComposite in2="grown" operator="in" result="outline" />
          <feMerge>
            <feMergeNode in="outline" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`${id}face`}>
          <path d={FACE} />
        </clipPath>
        {/* comic-book halftone dots for the shadows */}
        <pattern id={`${id}dots`} width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx="1.2" cy="1.2" r=".62" fill={shade(skin, -0.32)} />
        </pattern>
        <linearGradient id={`${id}rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".12" />
          <stop offset=".2" stopColor="#fff" stopOpacity="0" />
          <stop offset=".8" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".18" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <Backdrop item={findItem(l.backdrop)!} x={x} />
        <g transform={HEAD}>
          <g filter={ink}>
            <HairBack style={hairItem.style} x={x} />
          </g>
        </g>
        {/* a thin neck with the chin's shadow */}
        <g filter={ink}>
          <path d="M43.6 58 H56.4 V80 H43.6 Z" fill={skin} />
        </g>
        <path d="M43.6 62.5 Q50 68.5 56.4 62.5 V67.5 Q50 72 43.6 67.5 Z" fill={shadow} />
        <path d="M43.6 64 Q50 70 56.4 64 V72 H43.6 Z" fill={`url(#${id}dots)`} opacity=".6" />
        <path d="M47.4 68 Q48.6 72 47.6 76" stroke={shade(skin, -0.25)} strokeWidth=".7" fill="none" opacity=".6" strokeLinecap="round" />
        <g transform={BODY}>
          <g filter={ink}>
            <Outfit item={findItem(l.outfit)!} x={x} />
          </g>
        </g>
        <g transform={HEAD}>
          <g filter={ink}>
            <Ears x={x} />
          </g>
          <g filter={ink}>
            <path d={FACE} fill={skin} />
          </g>
          {/* one flat cel shadow on the far cheek and under the hairline */}
          <g clipPath={`url(#${id}face)`}>
            {/* hard comic shadow on the far side of the face, with halftone in it */}
            <path d="M63.4 27 C69 34 69.6 46 66 53.6 C63.4 58.8 59 62 54.4 64 L73 66 L73 24Z" fill={shadow} opacity=".55" />
            <path d="M61.6 30 C66.6 38 67 49 62.6 56.4 C60 60.4 56.4 62.6 52.6 63.6 L73 66 L73 26Z" fill={`url(#${id}dots)`} opacity=".75" />
            {/* cheekbone and jaw shadows, a rim light on the near side, the chin */}
            <path d="M59.6 50.4 Q63 52.2 64.8 55.6" stroke={shadow} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M34.8 52 Q36.6 54.6 39.6 55.4" stroke={shadow} strokeWidth=".9" fill="none" strokeLinecap="round" opacity=".7" />
            <path d="M31.4 36 Q30.6 44 32.8 51" stroke="#fff" strokeWidth="1.1" fill="none" opacity=".35" strokeLinecap="round" />
            <path d="M46.2 61.6 Q50 63 53.8 61.6" stroke={shadow} strokeWidth="1" fill="none" strokeLinecap="round" />
          </g>
          <g transform={FEATURES}>
            <Face x={x} style={findItem(l.expression)!.style} mood={mood ?? todayMood} />
          </g>
          <g filter={ink}>
            <HairFront style={hairItem.style} x={x} />
          </g>
          <g transform={FEATURES}>
            <Eyewear item={findItem(l.face)!} x={x} />
          </g>
          <g filter={ink}>
            <Headwear item={findItem(l.headwear)!} x={x} />
          </g>
        </g>
        <g filter={ink}>
          <Pet item={findItem(l.pet)!} />
        </g>
        <rect width="100" height="100" fill={`url(#${id}rim)`} />
        {shape !== 'circle' && (
          <rect x=".6" y=".6" width="98.8" height="98.8" rx={shape === 'rounded' ? 23.5 : 0} fill="none" stroke="#fff" strokeOpacity=".14" strokeWidth="1.2" />
        )}
      </g>
    </svg>
  );
}

// The character style used everywhere in the app.
