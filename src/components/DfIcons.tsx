import type { ReactNode } from 'react';

/**
 * Dayforge's own icon set: rounded line drawings with a soft two-tone fill, used for the app's
 * signature things (tabs, streak, coins, XP, chests…). Everything else still uses the line icons.
 * Each glyph is drawn on a 24×24 grid; `D` marks the filled (duotone) parts.
 */
const D = { fill: 'currentColor', fillOpacity: 0.3, stroke: 'none' } as const;

const GLYPHS: Record<string, ReactNode> = {
  today: (
    <>
      <path {...D} d="M6.5 17a5.5 5.5 0 0 1 11 0Z" />
      <path d="M2.5 17h19 M6.5 17a5.5 5.5 0 0 1 11 0" />
      <path d="M12 6v2.2 M5.4 9.4l1.5 1.5 M18.6 9.4l-1.5 1.5 M7 20.5h10" />
      <path d="M18.5 2.6l.55 1.25 1.25.55-1.25.55-.55 1.25-.55-1.25-1.25-.55 1.25-.55Z" fill="currentColor" strokeWidth="0.8" />
    </>
  ),
  plan: (
    <>
      <path {...D} d="M3.5 9.5V8a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v1.5Z" />
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 9.5h17 M8 3v4 M16 3v4 M8.6 14.6l2.2 2.2 4.6-4.6" />
    </>
  ),
  money: (
    <>
      <rect {...D} x="3.5" y="7.5" width="17" height="12" rx="3" />
      <path d="M5 7.5V7a2.5 2.5 0 0 1 2.5-2.5H16a2 2 0 0 1 2 2v1" />
      <rect x="3.5" y="7.5" width="17" height="12" rx="3" />
      <path d="M20.5 11h-4a2.5 2.5 0 0 0 0 5h4" />
      <circle cx="16.6" cy="13.5" r=".9" fill="currentColor" stroke="none" />
    </>
  ),
  quests: (
    <>
      <path {...D} d="M5.5 4.5c3.6-1.8 6 1.8 9.6 0 1.6-.8 2.9-.9 3.9-.6v8.6c-1-.3-2.3-.2-3.9.6-3.6 1.8-6-1.8-9.6 0Z" />
      <path d="M5.5 21V3.5 M5.5 4.5c3.6-1.8 6 1.8 9.6 0 1.6-.8 2.9-.9 3.9-.6v8.6c-1-.3-2.3-.2-3.9.6-3.6 1.8-6-1.8-9.6 0" />
      <path d="M12.2 6.4l.7 1.5 1.6.2-1.2 1.1.3 1.6-1.4-.8-1.4.8.3-1.6-1.2-1.1 1.6-.2Z" fill="currentColor" strokeWidth="0.6" />
    </>
  ),
  streak: (
    <>
      <path {...D} d="M12 2.5c1.2 3.3 5.8 5.6 5.8 11a5.8 5.8 0 0 1-11.6 0c0-2.6 1.2-4.2 2.3-5.6.3 1.6 1 2.6 2.1 3-.6-2.9-.1-5.8 1.4-8.4Z" />
      <path d="M12 2.5c1.2 3.3 5.8 5.6 5.8 11a5.8 5.8 0 0 1-11.6 0c0-2.6 1.2-4.2 2.3-5.6.3 1.6 1 2.6 2.1 3-.6-2.9-.1-5.8 1.4-8.4Z" />
      <path d="M12 13c.9 1.4 2.6 2.4 2.6 4.4a2.6 2.6 0 0 1-5.2 0c0-1 .6-1.8 1.1-2.4.2.6.5 1 1 1.1-.2-1.1 0-2.2.5-3.1Z" fill="currentColor" fillOpacity=".55" />
    </>
  ),
  gem: (
    <>
      <path {...D} d="M7 3.5h10l4 5.2L12 20.5 3 8.7Z" />
      <path d="M7 3.5h10l4 5.2L12 20.5 3 8.7Z M3 8.7h18 M9.5 3.5 8 8.7l4 11.8 4-11.8-1.5-5.2" />
    </>
  ),
  xp: (
    <>
      <path {...D} d="M13.5 2 4.5 13.5h6.5L10 22l9.5-12.5H13Z" />
      <path d="M13.5 2 4.5 13.5h6.5L10 22l9.5-12.5H13Z" />
    </>
  ),
  chest: (
    <>
      <path {...D} d="M3.5 11h17v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
      <path d="M3.5 11v7.5a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V11 M3.5 11a8.5 6 0 0 1 17 0Z M3.5 11h17 M8 6.4V11 M16 6.4V11" />
      <rect x="10.4" y="10" width="3.2" height="4.2" rx="1" fill="currentColor" strokeWidth="1" />
    </>
  ),
  shield: (
    <>
      <path {...D} d="M12 3 19.5 6v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6Z" />
      <path d="M12 3 19.5 6v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6Z M8.8 12l2.2 2.2 4.4-4.4" />
    </>
  ),
  focus: (
    <>
      <circle {...D} cx="12" cy="13.5" r="7.5" />
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 13.5V9.6 M12 13.5l2.6 1.6 M9.8 2.5h4.4 M12 2.5V6 M18.4 6.6l1.4-1.4" />
    </>
  ),
  breathe: (
    <>
      <circle {...D} cx="17" cy="6.5" r="3" />
      <path d="M3 9h11a3 3 0 1 0-2.9-3.8 M3 13h14.5a3 3 0 1 1-2.9 3.8 M3 17h7" />
    </>
  ),
  run: (
    <>
      <circle {...D} cx="15.5" cy="4.6" r="2.6" />
      <circle cx="15.5" cy="4.6" r="2.1" />
      <path d="M13.6 8.6 10.4 12.8l3.6 2.4-1.6 5.6 M10.4 12.8l-4.2.9 M13.6 8.6l3.4 3 3.2-.6 M14 15.2l4.4 1.6" />
      <path d="M2.5 9.5h4 M1.5 12.5h3 M3 15.5h2.5" strokeOpacity=".6" />
    </>
  ),
  spend: (
    <>
      <rect {...D} x="2.5" y="6.5" width="15" height="11" rx="2.5" />
      <rect x="2.5" y="6.5" width="15" height="11" rx="2.5" />
      <circle cx="10" cy="12" r="2.4" />
      <path d="M17.5 9.5h4.5 M20 7.3l2.2 2.2L20 11.7" />
    </>
  ),
  coach: (
    <>
      <path {...D} d="M12 3a6.5 6.5 0 0 0-3.8 11.8c.8.6 1.3 1.5 1.3 2.5V18h5v-.7c0-1 .5-1.9 1.3-2.5A6.5 6.5 0 0 0 12 3Z" />
      <path d="M12 3a6.5 6.5 0 0 0-3.8 11.8c.8.6 1.3 1.5 1.3 2.5V18h5v-.7c0-1 .5-1.9 1.3-2.5A6.5 6.5 0 0 0 12 3Z M9.5 21h5 M12 7.5l-1.6 3h3.2L12 13.5" />
    </>
  ),
  swap: (
    <>
      <path d="M4 8.5h13.5 M14.5 5.5l3 3-3 3 M20 15.5H6.5 M9.5 12.5l-3 3 3 3" />
      <circle {...D} cx="12" cy="12" r="9" />
    </>
  ),
  skip: (
    <>
      <path {...D} d="M5 5.5v13l9.5-6.5Z" />
      <path d="M5 5.5v13l9.5-6.5Z M18.5 5.5v13" />
    </>
  ),
};

/** Ids that use a Dayforge glyph (UI ids plus the emoji the app uses for the same things). */
const ALIASES: Record<string, string> = {
  'df:today': 'today', 'df:plan': 'plan', 'df:money': 'money', 'df:quests': 'quests', 'df:streak': 'streak',
  'df:gem': 'gem', 'df:xp': 'xp', 'df:chest': 'chest', 'df:shield': 'shield', 'df:focus': 'focus',
  'df:breathe': 'breathe', 'df:run': 'run', 'df:spend': 'spend', 'df:coach': 'coach', 'df:swap': 'swap', 'df:skip': 'skip',
  '🔥': 'streak', '💎': 'gem', '⚡': 'xp', '🛡': 'shield', '⏱': 'focus', '🌬': 'breathe', '🔁': 'swap', '⏭': 'skip', '🧠': 'coach',
};

export function dfGlyph(id: string): string | null {
  return ALIASES[id] ?? null;
}

export function DfIcon({ glyph, size = 20, strokeWidth = 2, className, ...rest }: { glyph: string; size?: number | string; strokeWidth?: number | string; className?: string; [k: string]: unknown }) {
  // `fill` (used by callers to fill line icons) means "solid" here: raise the two-tone fill.
  const solid = rest.fill && rest.fill !== 'none';
  delete rest.fill;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`df-icon ${solid ? 'df-solid' : ''} ${className ?? ''}`}
      aria-hidden="true"
      {...rest}
    >
      {GLYPHS[glyph]}
    </svg>
  );
}
