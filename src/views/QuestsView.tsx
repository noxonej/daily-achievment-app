import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { InfoTip } from '../components/Guide';
import { t } from '../lib/prefs';
import { Segmented } from '../components/Segmented';
import { WeeklyView } from './WeeklyView';
import { GoalsView } from './GoalsView';
import { RewardsView } from './RewardsView';
import { useIntent } from '../lib/intents';
import { QuestPrograms } from '../components/QuestPrograms';
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
        <p className="eyebrow">Goals, weekly quests and rewards</p>
        <h1 className="font-display text-[30px] leading-tight font-medium tracking-tight text-white mt-1 mb-4 flex items-center gap-1">
          {t('nav.quests')}
          <InfoTip title="Bigger challenges" text="Daily quests are on Today. Here are the bigger ones: weekly quests take all week, long-term goals are for big things like saving for a car, and Rewards is your own shop of treats you buy with coins." />
        </h1>
        <QuestPrograms onOpen={setSection} />
        <div className="h-4" />
        <Segmented
          value={section}
          onChange={setSection}
          options={[
            { id: 'goals', label: t('quests.goals'), icon: '🏆' },
            { id: 'weekly', label: t('quests.week'), icon: '🗡' },
            { id: 'rewards', label: 'Rewards', icon: 'df:chest' },
          ]}
        />
      </div>
      <div key={section} className="animate-view-right">
        {section === 'weekly' ? <WeeklyView onNavigate={onNavigate} embedded /> : section === 'goals' ? <GoalsView embedded /> : <RewardsView />}
      </div>
    </div>
  );
}
