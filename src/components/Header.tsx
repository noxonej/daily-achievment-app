import { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { titleForLevel } from '../lib/xp';
import { ProgressBar } from './ProgressBar';
import { levelFromTotalXp } from '../lib/xp';
import { useCountUp } from '../lib/useCountUp';
import { CharacterAvatar } from './CharacterAvatar';
import { CharacterModal } from './CharacterModal';
import { Logo, Wordmark } from './Logo';
import { Icon } from './Icon';

export function Header() {
  const { state, stats } = useApp();
  const { xpIntoLevel, xpForNextLevel } = levelFromTotalXp(stats.totalXp);
  const animatedXp = useCountUp(xpIntoLevel);
  const title = titleForLevel(stats.level);
  const [characterOpen, setCharacterOpen] = useState(false);

  const [levelBump, setLevelBump] = useState(false);
  useEffect(() => {
    setLevelBump(true);
    const t = setTimeout(() => setLevelBump(false), 500);
    return () => clearTimeout(t);
  }, [stats.level]);

  const streakTier = stats.currentStreak >= 30 ? 3 : stats.currentStreak >= 7 ? 2 : stats.currentStreak >= 3 ? 1 : 0;
  const streakClass =
    streakTier === 3
      ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/20 border-orange-400/50 shadow-[0_0_16px_rgba(251,113,133,0.4)]'
      : streakTier === 2
        ? 'bg-orange-500/10 border-orange-400/40 shadow-[0_0_12px_rgba(251,146,60,0.3)]'
        : streakTier === 1
          ? 'bg-orange-500/10 border-orange-500/30'
          : 'bg-orange-500/10 border-orange-500/30';

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0b0e17]/90 backdrop-blur border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Logo size={30} />
              <Wordmark className="text-[17px]" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`flex items-center gap-1.5 border rounded-full px-3 py-1.5 transition-all ${streakClass} ${
                  streakTier >= 3 ? 'badge-shine' : ''
                }`}
                title={`${stats.currentStreak} day streak`}
              >
                <Icon
                  name="🔥"
                  size={streakTier >= 2 ? 18 : 16}
                  className={`text-orange-400 ${stats.currentStreak > 0 ? 'animate-flicker' : ''}`}
                  fill={streakTier >= 1 ? 'currentColor' : 'none'}
                />
                <span className="font-display font-bold text-orange-300 text-sm leading-none tabular-nums">
                  {stats.currentStreak}
                </span>
              </div>
              <button
                onClick={() => setCharacterOpen(true)}
                className="relative shrink-0 rounded-xl"
                aria-label="Customize your character"
              >
                <CharacterAvatar character={state.character} size={38} />
                <span
                  className={`absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full bg-amber-500 border-2 border-[#0b0e17] flex items-center justify-center text-[9px] font-display font-bold text-white ${
                    levelBump ? 'animate-pop-in' : ''
                  }`}
                >
                  {stats.level}
                </span>
              </button>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <ProgressBar value={xpIntoLevel} max={xpForNextLevel} heightClass="h-1.5" />
            </div>
            <p className="shrink-0 text-[11px] text-slate-400 tabular-nums">
              <span className="font-semibold text-slate-200">{title}</span> · {animatedXp}/{xpForNextLevel} XP
            </p>
          </div>
        </div>
      </header>
      <CharacterModal open={characterOpen} onClose={() => setCharacterOpen(false)} />
    </>
  );
}
