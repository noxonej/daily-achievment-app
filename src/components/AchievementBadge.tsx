import type { Achievement } from '../lib/types';
import { TIER_STYLES } from '../lib/achievementTiers';
import { formatShortDate } from '../lib/date';

interface AchievementBadgeProps {
  achievement: Achievement;
  unlockedAt?: string;
  current: number;
  shineDelay: number;
}

export function AchievementBadge({ achievement, unlockedAt, current, shineDelay }: AchievementBadgeProps) {
  const isUnlocked = !!unlockedAt;
  const tier = TIER_STYLES[achievement.tier];
  const clampedCurrent = Math.min(current, achievement.target);
  const pct = Math.min(100, Math.round((current / achievement.target) * 100));

  return (
    <div
      className={`rounded-2xl border p-3.5 text-center transition ${
        isUnlocked ? 'border-white/10 bg-white/[0.03]' : 'border-white/5 bg-white/[0.015]'
      }`}
    >
      <div className="relative inline-flex items-center justify-center mb-2 w-16 h-16">
        {isUnlocked ? (
          <div
            className={`badge-shine relative w-full h-full rounded-full flex items-center justify-center overflow-hidden ${tier.glow}`}
            style={{ background: tier.gradient, ['--shine-delay' as string]: `${shineDelay}s` }}
          >
            <span className="text-2xl drop-shadow-sm">{achievement.icon}</span>
          </div>
        ) : (
          <div className="w-full h-full rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-2xl grayscale opacity-30">{achievement.icon}</span>
          </div>
        )}
      </div>

      <p className={`text-[10px] font-bold uppercase tracking-wide ${isUnlocked ? tier.labelColor : 'text-slate-600'}`}>
        {tier.label}
      </p>
      <p className={`text-[13px] font-bold leading-tight mt-0.5 ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
        {achievement.title}
      </p>
      <p className={`text-[11px] mt-1 leading-snug ${isUnlocked ? 'text-slate-400' : 'text-slate-600'}`}>
        {achievement.description}
      </p>

      {isUnlocked && unlockedAt ? (
        <p className="text-[10px] mt-1.5 font-semibold text-slate-500">{formatShortDate(unlockedAt.slice(0, 10))}</p>
      ) : (
        <div className="mt-2">
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-1 rounded-full bg-white/25" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[10px] text-slate-600 mt-1">
            {clampedCurrent} / {achievement.target}
          </p>
        </div>
      )}
    </div>
  );
}
