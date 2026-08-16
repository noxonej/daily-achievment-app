import { useState } from 'react';
import { Header } from './components/Header';
import { NavTabs, type ViewId } from './components/NavTabs';
import { NewDayBanner } from './components/NewDayBanner';
import { CelebrationOverlay } from './components/CelebrationOverlay';
import { TodayView } from './views/TodayView';
import { WeeklyView } from './views/WeeklyView';
import { GoalsView } from './views/GoalsView';
import { AchievementsView } from './views/AchievementsView';
import { StatsView } from './views/StatsView';
import { ManageView } from './views/ManageView';

export default function App() {
  const [view, setView] = useState<ViewId>('today');

  return (
    <div className="min-h-screen flex flex-col bg-grid">
      <Header />
      <NewDayBanner />
      <main className="flex-1 pb-4">
        {view === 'today' && <TodayView onNavigate={setView} />}
        {view === 'weekly' && <WeeklyView onNavigate={setView} />}
        {view === 'goals' && <GoalsView />}
        {view === 'achievements' && <AchievementsView />}
        {view === 'stats' && <StatsView />}
        {view === 'manage' && <ManageView />}
      </main>
      <NavTabs active={view} onChange={setView} />
      <CelebrationOverlay />
    </div>
  );
}
