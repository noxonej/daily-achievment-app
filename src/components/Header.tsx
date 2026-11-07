import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store/AppContext';
import { levelFromTotalXp, titleForLevel } from '../lib/xp';
import { useCountUp } from '../lib/useCountUp';
import { Avatar } from './Avatar';
import { wardrobe } from '../lib/wardrobe';
import { Logo, Wordmark } from './Logo';
import { Icon } from './Icon';
import { settings } from '../lib/settingsNav';
import { t } from '../lib/prefs';

/** Glassy top bar: logo and level on the left, streak, settings and your character (with an XP ring) on the right. */
export function Header() {
  const { state, stats } = useApp();
  const { xpIntoLevel, xpForNextLevel } = levelFromTotalXp(stats.totalXp);
  const title = titleForLevel(stats.level);
  const [scrolled, setScrolled] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    // A little hysteresis so it doesn't flicker right at the threshold.
    const onScroll = () => setScrolled((was) => (was ? window.scrollY > 4 : window.scrollY > 16));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const streak = stats.currentStreak;
  const hot = streak >= 7;

  return (
    <header
      className={`sticky top-0 z-30 pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] transition-[background-color,box-shadow] duration-300 ${
        scrolled ? 'bg-canvas/[0.97] shadow-[0_10px_30px_-18px_rgba(0,0,0,0.6)]' : 'bg-canvas/[0.93]'
      }`}
    >
      <div className="max-w-2xl mx-auto px-4 flex items-center gap-2.5 h-[60px]">
        <div className="relative min-w-0">
          <button
            onClick={() => setInfoOpen((o) => !o)}
            aria-expanded={infoOpen}
            aria-label={`Level ${stats.level}, ${title}`}
            className="flex items-center gap-2.5 min-w-0 rounded-2xl -ml-1 pl-1 pr-2 py-1 hover:bg-white/[0.04]"
          >
            <span className="relative shrink-0">
              <span className="absolute inset-1 rounded-xl bg-amber-400/40 blur-md" aria-hidden="true" />
              <Logo size={36} className={`relative transition-transform duration-300 ${scrolled ? 'scale-90' : ''}`} />
            </span>
            <span className="min-w-0 text-left leading-none">
              <Wordmark className="block text-[18px]" />
              <span className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 truncate">
                <span className="rounded-md bg-amber-500/15 text-amber-300 px-1.5 py-px font-bold tabular-nums">LV {stats.level}</span>
                <span className="truncate">{title}</span>
              </span>
            </span>
          </button>
          {infoOpen && <LevelPopover onClose={() => setInfoOpen(false)} into={xpIntoLevel} need={xpForNextLevel} level={stats.level} />}
        </div>

        <div className="flex-1" />

        <div
          className={`flex items-center gap-1 rounded-full pl-2 pr-2.5 h-9 border transition-colors ${
            hot ? 'bg-orange-500/15 border-orange-400/40 badge-shine' : 'bg-white/[0.04] border-white/10'
          }`}
          title={`${streak} day streak`}
        >
          <Icon name="🔥" size={17} className={`text-orange-400 ${streak > 0 ? 'animate-flicker' : 'opacity-60'}`} fill={streak > 0 ? 'currentColor' : 'none'} />
          <span key={streak} className="font-display font-bold text-[15px] leading-none tabular-nums text-white animate-num-pop">
            {streak}
          </span>
        </div>

        <button
          onClick={() => settings.open()}
          aria-label={t('settings.title')}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
        >
          <Icon name="⚙" size={18} className="gear-spin" />
        </button>

        <AvatarRing
          onClick={() => wardrobe.open()}
          look={state.character}
          level={stats.level}
          progress={xpForNextLevel > 0 ? xpIntoLevel / xpForNextLevel : 0}
          dot={stats.chestsAvailable > 0}
        />
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-amber-400/35 to-transparent" />
    </header>
  );
}

/** Your character inside a ring that fills with XP; a dot means a chest is waiting. */
function AvatarRing({
  onClick,
  look,
  level,
  progress,
  dot,
}: {
  onClick: () => void;
  look: Parameters<typeof Avatar>[0]['look'];
  level: number;
  progress: number;
  dot: boolean;
}) {
  const size = 46;
  const r = 21;
  const c = 2 * Math.PI * r;
  // Ring draws in on first paint, then eases to new values; a level-up flashes it.
  const [drawn, setDrawn] = useState(false);
  const [flash, setFlash] = useState(false);
  const firstLevel = useRef(level);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setDrawn(true)));
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    if (level === firstLevel.current) return;
    firstLevel.current = level;
    setFlash(true);
    const tm = setTimeout(() => setFlash(false), 900);
    return () => clearTimeout(tm);
  }, [level]);
  const shown = useCountUp(Math.round(progress * 1000), 900, 0) / 1000;

  return (
    <button onClick={onClick} className="relative shrink-0 rounded-full" aria-label={`Customize your character (level ${level})`} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className={`absolute inset-0 -rotate-90 overflow-visible ${flash ? 'ring-flash' : ''}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" className="text-white/10" strokeWidth="3" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-amber-400)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - (drawn ? Math.max(0.02, shown) : 0))}
          style={{ transition: 'stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)', filter: 'drop-shadow(0 0 4px var(--color-amber-400))' }}
        />
      </svg>
      <span className="absolute inset-[5px] rounded-full overflow-hidden bg-raised">
        <Avatar look={look} size={36} className="scale-[1.18] translate-y-[2px]" />
      </span>
      {dot && (
        <span className="absolute top-0 right-0 w-3 h-3">
          <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-60" />
          <span className="absolute inset-0 rounded-full bg-rose-500 border-2 border-canvas" />
        </span>
      )}
    </button>
  );
}

/** Tap the logo: level, XP to the next level, and what levels give you. */
function LevelPopover({ onClose, into, need, level }: { onClose: () => void; into: number; need: number; level: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.parentElement?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  const pct = need > 0 ? Math.min(100, (into / need) * 100) : 0;
  return (
    <div ref={ref} role="dialog" aria-label="Your level" className="absolute left-0 top-full mt-2 w-64 rounded-2xl border border-white/10 bg-raised p-4 shadow-2xl popover-in z-40">
      <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Level {level}</p>
      <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-amber-400 transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-sm text-white font-semibold mt-2 tabular-nums">
        {into} / {need} XP
      </p>
      <p className="text-xs text-slate-400 mt-1 leading-relaxed">Finish quests to earn XP. Every new level gives you a reward chest.</p>
    </div>
  );
}
