import { useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { titleForLevel } from '../lib/xp';
import { Confetti } from './Confetti';
import { Icon } from './Icon';
import { RankBadge } from './RankBadge';
import { rankForLevel, rankRarity, formatPct } from '../lib/ranks';

export function CelebrationOverlay() {
  const { celebrations, dismissCelebration } = useApp();
  const current = celebrations[0];

  useEffect(() => {
    if (!current || current.kind === 'levelup') return;
    const t = setTimeout(() => dismissCelebration(), 3200);
    return () => clearTimeout(t);
  }, [current, dismissCelebration]);

  if (!current) return null;

  if (current.kind === 'levelup') {
    // Cinematic: flash, spinning light rays, shockwaves, the number slamming in, letters dropping.
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-hidden" role="dialog" aria-label={`Level ${current.level}`}>
        <div className="absolute inset-0 bg-[#04060a]/92 backdrop-in" onClick={dismissCelebration} />
        <div className="absolute w-[170vmax] h-[170vmax] fx-rays pointer-events-none" />
        <div className="absolute inset-0 fx-flash pointer-events-none" />
        <Confetti count={90} />
        <div className="relative w-full max-w-xs text-center">
          <span className="absolute left-1/2 top-[42%] w-0 h-0 pointer-events-none">
            <span className="fx-shock" />
            <span className="fx-shock fx-shock-2" />
          </span>
          <p className="font-display text-sm font-black tracking-[0.35em] text-amber-200" aria-hidden="true">
            {'LEVEL UP'.split('').map((ch, i) => (
              <span key={i} className="lv-letter" style={{ animationDelay: `${i * 45}ms` }}>
                {ch === ' ' ? '\u00a0' : ch}
              </span>
            ))}
          </p>
          <p className="lv-num font-display text-[120px] leading-none font-black tabular-nums mt-1">{current.level}</p>
          {(() => {
            const rank = rankForLevel(current.level);
            const ranked = rank.startLevel === current.level && current.level > 1;
            return (
              <div className="mt-2 flex flex-col items-center fade-up [animation-delay:.9s]">
                <RankBadge rank={rank} size={ranked ? 96 : 56} shine className={ranked ? 'rank-pop' : ''} />
                {ranked && <p className="mt-2 text-[11px] font-black tracking-[0.3em] text-amber-200">NEW RANK</p>}
                <p className="text-white font-display text-xl font-bold mt-1">{titleForLevel(current.level)}</p>
                {rank.index > 0 && (
                  <p className="mt-1 text-sm text-violet-200">
                    Only about <b className="text-white">{formatPct(rankRarity(rank.index))}</b> of players get this far
                  </p>
                )}
              </div>
            );
          })()}
          <div className="mt-4 flex justify-center gap-2 fade-up [animation-delay:1.05s]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 border border-violet-400/40 px-3 py-1 text-xs font-bold text-violet-100">
              <Icon name="df:chest" size={14} /> +1 reward chest
            </span>
          </div>
          <button
            onClick={dismissCelebration}
            className="lv-glow mt-8 w-full rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 text-white font-display text-lg font-bold py-3.5 active:scale-95 transition-transform fade-up [animation-delay:1.2s]"
          >
            Let's go
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-[calc(env(safe-area-inset-top)+0.75rem)] left-0 right-0 z-[60] flex justify-center px-4 pointer-events-none">
      <button
        onClick={dismissCelebration}
        className="toast-glass pointer-events-auto animate-celebrate flex items-center gap-3 rounded-full pl-2 pr-5 py-2 max-w-sm"
      >
        <span className="shrink-0 w-10 h-10 rounded-full bg-[var(--mood)] text-[#15110e] flex items-center justify-center shadow-[0_0_20px_-2px_var(--mood)]"><Icon name={current.icon} size={20} /></span>
        <span className="text-left min-w-0">
          <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-slate-400">
            {current.kind === 'goal' ? 'Goal Complete' : 'Achievement Unlocked'}
          </p>
          <p className="text-sm font-semibold text-white truncate">{current.title}</p>
        </span>
      </button>
    </div>
  );
}
