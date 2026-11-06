import { useState } from 'react';
import { t } from '../lib/prefs';
import { Segmented } from '../components/Segmented';
import { WeeklyView } from './WeeklyView';
import { GoalsView } from './GoalsView';
import { takeIntent } from '../lib/intents';
import type { ViewId } from '../components/NavTabs';

type Section = 'weekly' | 'goals';

/** Weekly quests and long-term (monthly / yearly) goals in one place. */
export function QuestsView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const [section, setSection] = useState<Section>(() => (takeIntent('quests-goals') ? 'goals' : 'weekly'));
  return (
    <div>
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <p className="text-slate-400 text-sm">Challenges and dreams</p>
        <h1 className="font-display text-2xl font-bold text-white mt-0.5 mb-4">Quests</h1>
        <Segmented
          value={section}
          onChange={setSection}
          options={[
            { id: 'weekly', label: t('quests.week'), icon: '🗡' },
            { id: 'goals', label: t('quests.goals'), icon: '🏆' },
          ]}
        />
      </div>
      <div key={section} className="animate-view-right">
        {section === 'weekly' ? <WeeklyView onNavigate={onNavigate} embedded /> : <GoalsView embedded />}
      </div>
    </div>
  );
}
