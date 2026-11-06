import { useRef, useState } from 'react';
import { Header } from './components/Header';
import { NavTabs, type ViewId } from './components/NavTabs';
import { NewDayBanner } from './components/NewDayBanner';
import { CelebrationOverlay } from './components/CelebrationOverlay';
import { TodayView } from './views/TodayView';
import { WeeklyView } from './views/WeeklyView';
import { PlanView } from './views/PlanView';
import { MoneyView } from './views/MoneyView';
import { PlanReminderToast } from './components/PlanReminderToast';
import { GoalsView } from './views/GoalsView';
import { AchievementsView } from './views/AchievementsView';
import { StatsView } from './views/StatsView';
import { ManageView } from './views/ManageView';
import { SplashScreen } from './components/SplashScreen';

const VIEW_ORDER: ViewId[] = ['today', 'plan', 'money', 'weekly', 'goals', 'achievements', 'stats', 'manage'];

export default function App() {
  const [view, setViewState] = useState<ViewId>('today');
  const directionRef = useRef<'left' | 'right'>('right');

  function setView(next: ViewId) {
    if (next === view) return;
    directionRef.current = VIEW_ORDER.indexOf(next) > VIEW_ORDER.indexOf(view) ? 'right' : 'left';
    setViewState(next);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="min-h-screen flex flex-col bg-grid overflow-x-clip">
      <Header />
      <NewDayBanner />
      <main className="flex-1 pb-4">
        <div key={view} className={directionRef.current === 'right' ? 'animate-view-right' : 'animate-view-left'}>
          {view === 'today' && <TodayView onNavigate={setView} />}
          {view === 'plan' && <PlanView />}
          {view === 'money' && <MoneyView />}
          {view === 'weekly' && <WeeklyView onNavigate={setView} />}
          {view === 'goals' && <GoalsView />}
          {view === 'achievements' && <AchievementsView />}
          {view === 'stats' && <StatsView />}
          {view === 'manage' && <ManageView />}
        </div>
      </main>
      <NavTabs active={view} onChange={setView} />
      <CelebrationOverlay />
      <PlanReminderToast />
      <SplashScreen />
    </div>
  );
}
