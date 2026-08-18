import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { titleForLevel } from '../lib/xp';
import { ProgressBar } from './ProgressBar';
import { levelFromTotalXp } from '../lib/xp';
import { CharacterAvatar } from './CharacterAvatar';
import { CharacterModal } from './CharacterModal';

export function Header() {
  const { state, stats } = useApp();
  const { xpIntoLevel, xpForNextLevel } = levelFromTotalXp(stats.totalXp);
  const title = titleForLevel(stats.level);
  const [characterOpen, setCharacterOpen] = useState(false);

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
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border-2 border-[#0b0e17] flex items-center justify-center text-[10px] font-display font-bold text-white">
                  {stats.level}
                </span>
              </button>
              <div className="min-w-0">
                <p className="font-display font-bold text-white text-base leading-tight truncate">
                  {title}
                </p>
                <p className="text-xs text-slate-400 leading-tight">
                  {xpIntoLevel} / {xpForNextLevel} XP to level {stats.level + 1}
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1.5">
              <span className="text-base leading-none">🔥</span>
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
