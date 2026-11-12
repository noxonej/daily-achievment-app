import { useState } from 'react';
import { Fire } from '../components/fx/Fire';
import { compactNum } from '../lib/num';
import { locale } from '../lib/locale';
import { InfoTip } from '../components/Guide';
import { useApp } from '../store/AppContext';
import { Segmented } from '../components/Segmented';
import { Avatar } from '../components/Avatar';
import { Coin } from '../components/Coin';
import { RankBadge } from '../components/RankBadge';
import { rankForLevel } from '../lib/ranks';
import { Icon } from '../components/Icon';
import { StatsView } from './StatsView';
import { AchievementsView } from './AchievementsView';
import { DiaryView } from './DiaryView';
import { FriendsView } from './FriendsView';
import { useIntent } from '../lib/intents';
import { useFriends } from '../lib/friends';
import { settings } from '../lib/settingsNav';
import { t } from '../lib/prefs';
import { wardrobe } from '../lib/wardrobe';
import { levelFromTotalXp, titleForLevel } from '../lib/xp';

type Section = 'stats' | 'badges' | 'friends' | 'diary';

/** Profile hub: your character and level up top, then stats, badges and your diary. Settings open from the gear. */
export function YouView() {
  const { state, stats } = useApp();
  const wantFriends = useIntent('you-friends');
  const wantDiary = useIntent('you-diary');
  const [section, setSection] = useState<Section>(wantFriends ? 'friends' : wantDiary ? 'diary' : 'stats');
  const { xpIntoLevel, xpForNextLevel } = levelFromTotalXp(stats.totalXp);
  const friendRequests = useFriends().requests.length;
  const name = state.profile?.name;

  return (
    <div>
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Pearl profile card: the one light panel in the app, so You feels like your own page. */}
        <div className="profile-card relative overflow-hidden rounded-[32px] p-5 pb-4">
          <span className="mood-orb -top-24 -left-20 w-72 h-72 opacity-60" aria-hidden="true" />
          <div className="relative flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="pc-sub flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]">
                <RankBadge rank={rankForLevel(stats.level)} size={18} className="-my-1" />
                {titleForLevel(stats.level)}
              </p>
              <p className="pc-ink font-display text-[28px] font-medium tracking-tight leading-tight truncate">{name || 'Your profile'}</p>
            </div>
            <span className="pc-ink mt-1">
              <InfoTip
                align="right"
                title="You and your progress"
                text="Every quest gives XP. Level up to win chests, then open them to dress up your character. Your stats, badges and private diary are here too."
              />
            </span>
            <button onClick={() => settings.open()} aria-label={t('settings.title')} className="pc-btn w-10 h-10 shrink-0 rounded-full flex items-center justify-center">
              <Icon name="⚙" size={19} />
            </button>
          </div>

          <div className="relative mt-3 flex items-center gap-4">
            <button onClick={() => wardrobe.open()} className="relative shrink-0 rounded-[28%] transition-transform active:scale-95" aria-label="Open wardrobe">
              <Avatar look={state.character} size={112} className="drop-shadow-[0_22px_30px_rgba(40,25,10,0.35)]" />
              <span className="pc-chip absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[11px] font-black whitespace-nowrap tabular-nums">LV {stats.level}</span>
            </button>
            <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-2.5 gap-y-3">
              <BigStat value={stats.currentStreak} label={t('you.streak')} icon={<Fire size={16} lit={stats.currentStreak > 0} intensity={stats.currentStreak >= 30 ? 3 : stats.currentStreak >= 7 ? 2 : 1} />} />
              <BigStat value={stats.availableShards} label={t('you.shards')} icon={<Coin size={13} />} />
              <BigStat value={stats.chestsAvailable} label={t('you.chests')} icon={<Icon name="df:chest" size={14} />} pulse={stats.chestsAvailable > 0} />
              <BigStat value={stats.totalQuestsCompleted} label="quests" icon={<Icon name="✓" size={14} />} />
            </div>
          </div>

          <div className="relative mt-5">
            <div className="flex items-baseline justify-between text-[11px] font-semibold tabular-nums">
              <span className="pc-ink">Level {stats.level + 1}</span>
              <span className="pc-sub">
                {xpIntoLevel.toLocaleString(locale())} / {xpForNextLevel.toLocaleString(locale())} XP
              </span>
            </div>
            <div className="pc-track mt-1.5 h-1.5 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[var(--mood2)] bar-in" style={{ width: `${Math.max(3, (xpIntoLevel / xpForNextLevel) * 100)}%` }} />
            </div>
          </div>

          {((state.streakShields ?? 0) > 0 || (state.questSwaps ?? 0) > 0 || (state.skipPasses ?? 0) > 0) && (
            <div className="relative flex flex-wrap gap-1.5 mt-3 text-[11px] font-semibold">
              {(state.streakShields ?? 0) > 0 && (
                <span className="pc-pill flex items-center gap-1 rounded-full px-2.5 py-1">
                  <Icon name="🛡" size={12} />
                  {state.streakShields} streak {state.streakShields === 1 ? 'shield' : 'shields'}
                </span>
              )}
              {(state.questSwaps ?? 0) > 0 && (
                <span className="pc-pill flex items-center gap-1 rounded-full px-2.5 py-1">
                  <Icon name="🔁" size={12} />
                  {state.questSwaps} quest {state.questSwaps === 1 ? 'swap' : 'swaps'}
                </span>
              )}
              {(state.skipPasses ?? 0) > 0 && (
                <span className="pc-pill flex items-center gap-1 rounded-full px-2.5 py-1">
                  <Icon name="⏭" size={12} />
                  {state.skipPasses} skip {state.skipPasses === 1 ? 'pass' : 'passes'}
                </span>
              )}
            </div>
          )}
          <button onClick={() => wardrobe.open()} className="pc-cta relative mt-4 w-full flex items-center justify-center gap-2 rounded-full font-bold py-3.5">
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
            { id: 'friends', label: 'Friends', icon: '🤝', badge: friendRequests },
            { id: 'diary', label: t('you.diary'), icon: '📕' },
          ]}
        />
      </div>
      <div key={section} className="animate-view-right">
        {section === 'stats' && <StatsView embedded />}
        {section === 'badges' && <AchievementsView embedded />}
        {section === 'diary' && <DiaryView />}
        {section === 'friends' && (
          <div className="max-w-2xl mx-auto px-4 py-4">
            <FriendsView />
          </div>
        )}
      </div>
    </div>
  );
}

function BigStat({ value, label, icon, pulse }: { value: number; label: string; icon: React.ReactNode; pulse?: boolean }) {
  return (
    <div className="relative min-w-0">
      {pulse && <span className="absolute top-0.5 right-0 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
      <p className="pc-ink num-thin text-[32px] truncate" title={value.toLocaleString(locale())}>{compactNum(value)}</p>
      <p className="pc-sub mt-1 flex items-center gap-1 text-[11px] font-semibold truncate">
        <span className="shrink-0 opacity-80 hidden min-[360px]:inline">{icon}</span>
        {label}
      </p>
    </div>
  );
}
