import type { LucideProps } from 'lucide-react';
import { normalizeIconId, resolveIcon } from '../lib/icons';
import { DfIcon, dfGlyph } from './DfIcons';
import { Coin } from './Coin';

interface IconProps extends Omit<LucideProps, 'ref' | 'name'> {
  /** An icon id from the app's data (the emoji it was saved with). */
  name: string | undefined | null;
}

export function Icon({ name, size = 20, strokeWidth = 2, ...rest }: IconProps) {
  // The app's money (coins, saved as coins) is a pixel-art gold coin everywhere.
  if (name === '💎' || name === 'df:gem' || name === 'coin') {
    return <Coin size={typeof size === 'number' ? Math.round(size * 1.05) : size} className={typeof rest.className === 'string' ? rest.className : ''} />;
  }
  // The app's own glyphs for its signature things (tabs, streak, XP…).
  const glyph = name ? dfGlyph(normalizeIconId(name)) : null;
  if (glyph) return <DfIcon glyph={glyph} size={size} strokeWidth={strokeWidth} {...(rest as Record<string, unknown>)} />;
  const C = resolveIcon(name);
  return <C size={size} strokeWidth={strokeWidth} aria-hidden="true" {...rest} />;
}

/** A grid of icons to pick from; values are the same ids the app stores. */
export function IconGrid({
  options,
  value,
  onChange,
  size = 'md',
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  size?: 'sm' | 'md';
}) {
  const box = size === 'sm' ? 'w-9 h-9' : 'w-10 h-10';
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Icon">
      {options.map((o) => {
        const on = normalizeIconId(o) === normalizeIconId(value);
        return (
          <button
            type="button"
            key={o}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o)}
            className={`${box} rounded-lg flex items-center justify-center border transition ${
              on
                ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:text-white'
            }`}
          >
            <Icon name={o} size={size === 'sm' ? 17 : 19} />
          </button>
        );
      })}
    </div>
  );
}
