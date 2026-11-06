import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Segmented } from '../components/Segmented';
import { Avatar } from '../components/Avatar';
import { ProgressBar } from '../components/ProgressBar';
import { Icon } from '../components/Icon';
import { StatsView } from './StatsView';
import { AchievementsView } from './AchievementsView';
import { ManageView } from './ManageView';
import { wardrobe } from '../lib/wardrobe';
import { levelFromTotalXp, titleForLevel } from '../lib/xp';
import { takeIntent } from '../lib/intents';

type Section = 'stats' | 'badges' | 'settings';

/** Profile hub: your character and level up top, then stats, badges and settings. */
export function YouView() {
  const { state, stats } = useApp();
  const [section, setSection] = useState<Section>(() => (takeIntent('you-settings') ? 'settings' : 'stats'));
  const { xpIntoLevel, xpForNextLevel } = levelFromTotalXp(stats.totalXp);
  const name = state.profile?.name;

  return (
    <div>
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/[0.12] via-white/[0.03] to-violet-500/[0.10] p-4">
          <div className="flex items-center gap-4">
            <button onClick={() => wardrobe.open()} className="relative shrink-0 rounded-[28%]" aria-label="Open wardrobe">
              <Avatar look={state.character} size={104} className="drop-shadow-[0_14px_30px_rgba(0,0,0,0.5)]" />
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 border-2 border-[#0b0e17] px-2 py-0.5 text-[11px] font-black text-white whitespace-nowrap">
                LV {stats.level}
              </span>
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-display text-xl font-extrabold text-white truncate">{name || 'Your profile'}</p>
              <p className="text-sm text-amber-300 font-semibold">{titleForLevel(stats.level)}</p>
              <div className="mt-2">
                <ProgressBar value={xpIntoLevel} max={xpForNextLevel} heightClass="h-1.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
                {xpIntoLevel}/{xpForNextLevel} XP to level {stats.level + 1}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <Stat icon="🔥" value={stats.currentStreak} label="Streak" color="text-orange-400" />
            <Stat icon="💎" value={stats.availableShards} label="Shards" color="text-amber-300" />
            <Stat icon="🎁" value={stats.chestsAvailable} label="Chests" color="text-violet-300" pulse={stats.chestsAvailable > 0} />
          </div>
          <button
            onClick={() => wardrobe.open()}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl bg-white text-slate-900 font-bold py-3 hover:bg-amber-50"
          >
            <Icon name="👕" size={18} />
            {stats.chestsAvailable > 0 ? `Customize · open ${stats.chestsAvailable} ${stats.chestsAvailable === 1 ? 'chest' : 'chests'}` : 'Customize character'}
          </button>
        </div>

        <Segmented
          value={section}
          onChange={setSection}
          options={[
            { id: 'stats', label: 'Stats', icon: '📊' },
            { id: 'badges', label: 'Badges', icon: '🎖' },
            { id: 'settings', label: 'Settings', icon: '⚙' },
          ]}
        />
      </div>
      <div key={section} className="animate-view-right">
        {section === 'stats' && <StatsView embedded />}
        {section === 'badges' && <AchievementsView embedded />}
        {section === 'settings' && <ManageView embedded />}
      </div>
    </div>
  );
}

function Stat({ icon, value, label, color, pulse }: { icon: string; value: number; label: string; color: string; pulse?: boolean }) {
  return (
    <div className="relative rounded-2xl bg-black/20 border border-white/[0.06] py-2.5 text-center">
      {pulse && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
      <div className={`flex items-center justify-center gap-1.5 ${color}`}>
        <Icon name={icon} size={16} />
        <span className="font-display text-lg font-extrabold text-white tabular-nums">{value}</span>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
