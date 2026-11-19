import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { InfoTip } from '../components/Guide';
import { t } from '../lib/prefs';
import { Segmented } from '../components/Segmented';
import { WeeklyView } from './WeeklyView';
import { GoalsView } from './GoalsView';
import { RewardsView } from './RewardsView';
import { useIntent } from '../lib/intents';
import { GoalsHero } from '../components/GoalsHero';
import type { ViewId } from '../components/NavTabs';

type Section = 'weekly' | 'goals' | 'rewards';

/** Weekly quests and long-term (monthly / yearly) goals in one place. */
export function QuestsView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const wantGoals = useIntent('quests-goals');
  const { state } = useApp();
  // Long-term goals come first: open on them whenever you have one.
  const hasGoals = state.goals.some((g) => !g.completedAt);
  const [section, setSection] = useState<Section>(wantGoals || hasGoals ? 'goals' : 'weekly');
  return (
    <div>
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <h1 className="font-display text-[30px] leading-tight font-medium tracking-tight text-white mb-4 flex items-center gap-1">
          {t('nav.quests')}
          <InfoTip title={t('goals.infoTitle')} text={t('goals.infoText')} />
        </h1>
        <GoalsHero onOpen={setSection} />
        <div className="h-4" />
        <Segmented
          value={section}
          onChange={setSection}
          options={[
            { id: 'goals', label: t('goals.yearGoals'), icon: '🏆' },
            { id: 'weekly', label: t('goals.thisWeek'), icon: '🗡' },
            { id: 'rewards', label: t('goals.rewards'), icon: 'df:chest' },
          ]}
        />
      </div>
      <div key={section} className="animate-view-right">
        {section === 'weekly' ? <WeeklyView onNavigate={onNavigate} embedded /> : section === 'goals' ? <GoalsView embedded /> : <RewardsView />}
      </div>
    </div>
  );
}
