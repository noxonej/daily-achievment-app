import { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { titleForLevel } from '../lib/xp';
import { ProgressBar } from './ProgressBar';
import { levelFromTotalXp } from '../lib/xp';
import { useCountUp } from '../lib/useCountUp';
import { CharacterAvatar } from './CharacterAvatar';
import { CharacterModal } from './CharacterModal';

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
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setCharacterOpen(true)}
                className="relative shrink-0"
                aria-label="Customize your character"
              >
                <CharacterAvatar character={state.character} size={44} />
                <span
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border-2 border-[#0b0e17] flex items-center justify-center text-[10px] font-display font-bold text-white transition-transform ${
                    levelBump ? 'animate-pop-in' : ''
                  }`}
                >
                  {stats.level}
                </span>
              </button>
              <div className="min-w-0">
                <p className="font-display font-bold text-white text-base leading-tight truncate">
                  {title}
                </p>
                <p className="text-xs text-slate-400 leading-tight">
                  {animatedXp} / {xpForNextLevel} XP to level {stats.level + 1}
                </p>
              </div>
            </div>
            <div
              className={`shrink-0 flex items-center gap-1.5 border rounded-full px-3 py-1.5 transition-all ${streakClass} ${
                streakTier >= 3 ? 'badge-shine' : ''
              }`}
            >
              <span className={`leading-none ${streakTier >= 2 ? 'text-lg' : 'text-base'}`}>🔥</span>
              <span className="font-display font-bold text-orange-300 text-sm leading-none">
                {stats.currentStreak}
              </span>
            </div>
          </div>
          <div className="mt-2.5">
            <ProgressBar value={xpIntoLevel} max={xpForNextLevel} heightClass="h-2" />
          </div>
        </div>
      </header>
      <CharacterModal open={characterOpen} onClose={() => setCharacterOpen(false)} />
    </>
  );
}
