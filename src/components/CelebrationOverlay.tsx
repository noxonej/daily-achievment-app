import { useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { titleForLevel } from '../lib/xp';
import { Confetti } from './Confetti';
import { Icon } from './Icon';

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
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismissCelebration} />
        <Confetti count={48} />
        <div className="relative bg-gradient-to-b from-[#241a10] to-[#121629] border border-amber-500/40 rounded-2xl shadow-2xl shadow-amber-900/50 px-8 py-8 text-center max-w-xs w-full animate-celebrate">
          <div className="flex justify-center mb-3 text-amber-300"><Icon name="🎉" size={60} strokeWidth={1.6} /></div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-300 font-bold mb-1">Level Up</p>
          <p className="font-display text-4xl font-extrabold text-white mb-1">{current.level}</p>
          <p className="text-slate-300 text-sm mb-6">You are now a {titleForLevel(current.level)}</p>
          <button
            onClick={dismissCelebration}
            className="w-full rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 text-white font-semibold py-2.5 active:scale-95 transition-transform"
          >
            Nice!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-[calc(env(safe-area-inset-top)+0.75rem)] left-0 right-0 z-[60] flex justify-center px-4 pointer-events-none">
      <button
        onClick={dismissCelebration}
        className="pointer-events-auto animate-celebrate flex items-center gap-3 bg-[#161a2e] border border-amber-400/30 shadow-xl shadow-black/40 rounded-2xl px-4 py-3 max-w-sm"
      >
        <span className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center"><Icon name={current.icon} size={22} /></span>
        <span className="text-left min-w-0">
          <p className="text-[10px] uppercase tracking-wide font-bold text-amber-300">
            {current.kind === 'goal' ? 'Goal Complete' : 'Achievement Unlocked'}
          </p>
          <p className="text-sm font-semibold text-white truncate">{current.title}</p>
        </span>
      </button>
    </div>
  );
}
