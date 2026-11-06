import { useState } from 'react';
import { InfoTip } from '../components/Guide';
import { useApp } from '../store/AppContext';
import { Segmented } from '../components/Segmented';
import { Avatar } from '../components/Avatar';
import { ProgressBar } from '../components/ProgressBar';
import { Icon } from '../components/Icon';
import { StatsView } from './StatsView';
import { AchievementsView } from './AchievementsView';
import { DiaryView } from './DiaryView';
import { settings } from '../lib/settingsNav';
import { t } from '../lib/prefs';
import { wardrobe } from '../lib/wardrobe';
import { levelFromTotalXp, titleForLevel } from '../lib/xp';

type Section = 'stats' | 'badges' | 'diary';

/** Profile hub: your character and level up top, then stats, badges and your diary. Settings open from the gear. */
export function YouView() {
  const { state, stats } = useApp();
  const [section, setSection] = useState<Section>('stats');
  const { xpIntoLevel, xpForNextLevel } = levelFromTotalXp(stats.totalXp);
  const name = state.profile?.name;

  return (
    <div>
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <span className="absolute top-[18px] right-14">
            <InfoTip
              align="right"
              title="You and your progress"
              text="Every quest gives XP. Level up to win chests, then open them to dress up your character. Your stats, badges and private diary are here too."
            />
          </span>
          <button
            onClick={() => settings.open()}
            aria-label={t('settings.title')}
            className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
          >
            <Icon name="⚙" size={20} />
          </button>
          <div className="flex items-center gap-4">
            <button onClick={() => wardrobe.open()} className="relative shrink-0 rounded-[28%]" aria-label="Open wardrobe">
              <Avatar look={state.character} size={104} className="drop-shadow-[0_14px_30px_rgba(0,0,0,0.5)]" />
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 border-2 border-canvas px-2 py-0.5 text-[11px] font-black text-white whitespace-nowrap">
                LV {stats.level}
              </span>
            </button>
            <div className="flex-1 min-w-0 pr-16">
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
            <Stat icon="🔥" value={stats.currentStreak} label={t('you.streak')} color="text-orange-400" />
            <Stat icon="💎" value={stats.availableShards} label={t('you.shards')} color="text-amber-300" />
            <Stat icon="🎁" value={stats.chestsAvailable} label={t('you.chests')} color="text-violet-300" pulse={stats.chestsAvailable > 0} />
          </div>
          {((state.streakShields ?? 0) > 0 || (state.questSwaps ?? 0) > 0 || (state.skipPasses ?? 0) > 0) && (
            <div className="flex flex-wrap gap-2 mt-2 text-[11px] font-semibold">
              {(state.streakShields ?? 0) > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-400/10 border border-emerald-400/25 px-2.5 py-1 text-emerald-200">
                  <Icon name="🛡" size={12} />
                  {state.streakShields} streak {state.streakShields === 1 ? 'shield' : 'shields'}
                </span>
              )}
              {(state.questSwaps ?? 0) > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-sky-400/10 border border-sky-400/25 px-2.5 py-1 text-sky-200">
                  <Icon name="🔁" size={12} />
                  {state.questSwaps} quest {state.questSwaps === 1 ? 'swap' : 'swaps'}
                </span>
              )}
              {(state.skipPasses ?? 0) > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-teal-400/10 border border-teal-400/25 px-2.5 py-1 text-teal-200">
                  <Icon name="⏭" size={12} />
                  {state.skipPasses} skip {state.skipPasses === 1 ? 'pass' : 'passes'}
                </span>
              )}
            </div>
          )}
          <button
            onClick={() => wardrobe.open()}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl bg-white text-slate-900 font-bold py-3 hover:bg-amber-50"
          >
            <Icon name="👕" size={18} />
            {stats.chestsAvailable > 0 ? `Customize · open ${stats.chestsAvailable} ${stats.chestsAvailable === 1 ? 'chest' : 'chests'}` : t('you.customize')}
          </button>
        </div>

        <Segmented
          value={section}
          onChange={setSection}
          options={[
            { id: 'stats', label: t('you.stats'), icon: '📊' },
            { id: 'badges', label: t('you.badges'), icon: '🎖' },
            { id: 'diary', label: t('you.diary'), icon: '📕' },
          ]}
        />
      </div>
      <div key={section} className="animate-view-right">
        {section === 'stats' && <StatsView embedded />}
        {section === 'badges' && <AchievementsView embedded />}
        {section === 'diary' && <DiaryView />}
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
