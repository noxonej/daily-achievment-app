import { useEffect, useRef, useState } from 'react';
import { Fire } from './fx/Fire';
import { useApp } from '../store/AppContext';
import { levelFromTotalXp, titleForLevel } from '../lib/xp';
import { useCountUp } from '../lib/useCountUp';
import { Avatar } from './Avatar';
import { wardrobe } from '../lib/wardrobe';
import { Logo, Wordmark } from './Logo';
import { Icon } from './Icon';
import { RankBadge } from './RankBadge';
import { RANK_COUNT, rankAt, rankForLevel } from '../lib/ranks';
import { settings } from '../lib/settingsNav';
import { t } from '../lib/prefs';

/** Glassy top bar: logo and level on the left, streak, settings and your character (with an XP ring) on the right. */
export function Header() {
  const { state, stats } = useApp();
  const { xpIntoLevel, xpForNextLevel } = levelFromTotalXp(stats.totalXp);
  const title = titleForLevel(stats.level);
  const rank = rankForLevel(stats.level);
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
        scrolled ? 'bg-canvas/75 backdrop-blur-xl shadow-[0_10px_30px_-18px_rgba(0,0,0,0.6)]' : 'bg-transparent'
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
              <span className="absolute inset-1 rounded-xl bg-cyan-400/35 blur-md" aria-hidden="true" />
              <Logo size={36} className={`relative transition-transform duration-300 ${scrolled ? 'scale-90' : ''}`} />
            </span>
            <span className="min-w-0 text-left leading-none">
              <Wordmark className="block text-[18px]" />
              <span className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 truncate">
                <RankBadge rank={rank} size={15} className="shrink-0 -my-1" />
                <span className="truncate text-slate-300">{title}</span>
                <span className="text-slate-500 font-bold tabular-nums">· LV {stats.level}</span>
              </span>
            </span>
          </button>
          {infoOpen && <LevelPopover onClose={() => setInfoOpen(false)} into={xpIntoLevel} need={xpForNextLevel} level={stats.level} />}
        </div>

        <div className="flex-1" />

        <div
          className={`flex items-center gap-1 rounded-full pl-2 pr-2.5 h-9 border transition-colors ${
            hot ? 'bg-orange-500/15 border-orange-400/40 badge-shine' : 'bg-white/[0.06] border-transparent backdrop-blur-md'
          }`}
          title={`${streak} day streak`}
        >
          <Fire size={19} lit={streak > 0} intensity={streak >= 30 ? 3 : streak >= 7 ? 2 : 1} />
          <span key={streak} className="font-display font-bold text-[15px] leading-none tabular-nums text-white animate-num-pop">
            {streak}
          </span>
        </div>

        <button
          onClick={() => settings.open()}
          aria-label={t('settings.title')}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.06] backdrop-blur-md text-slate-300 hover:text-white hover:bg-white/10"
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
        <Avatar look={look} size={36} />
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
  const rank = rankForLevel(level);
  const ladderRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Start the ladder at your own rank.
    ladderRef.current?.querySelector('[data-current]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, []);
  return (
    <div ref={ref} role="dialog" aria-label="Your rank" className="absolute left-0 top-full mt-2 w-[19rem] bg-raised border border-white/10 shadow-2xl max-w-[calc(100vw-2rem)] rounded-3xl p-4 popover-in z-40">
      <div className="flex items-center gap-3">
        <RankBadge rank={rank} size={56} shine />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Your rank</p>
          <p className="font-display text-xl font-semibold text-white truncate">{rank.name}</p>
          <p className="text-[11px] text-slate-400 tabular-nums">
            {rank.nextLevel ? `Next rank at level ${rank.nextLevel}` : 'The highest rank there is'}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between text-[11px] tabular-nums">
        <span className="font-bold text-white">Level {level}</span>
        <span className="text-slate-400">{into} / {need} XP</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-[var(--mood)] transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <div ref={ladderRef} className="mt-4 -mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar" aria-label="All ranks">
        {Array.from({ length: RANK_COUNT }, (_, i) => rankAt(i)).map((r) => {
          const reached = r.index <= rank.index;
          return (
            <div key={r.index} data-current={r.index === rank.index ? '' : undefined} className={`shrink-0 w-[60px] flex flex-col items-center gap-1 ${reached ? '' : 'opacity-35 grayscale'}`}>
              <RankBadge rank={r} size={r.index === rank.index ? 40 : 32} />
              <span className={`text-[9px] leading-tight text-center ${r.index === rank.index ? 'font-bold text-white' : 'text-slate-400'}`}>{r.name}</span>
              <span className="text-[9px] text-slate-500 tabular-nums">LV {r.startLevel}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">Finish quests to earn XP. Every level gives a reward chest, and new ranks come as you level up. A rank never goes down.</p>
    </div>
  );
}
