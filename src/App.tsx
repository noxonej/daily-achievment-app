import { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { NavTabs, type ViewId } from './components/NavTabs';
import { NewDayBanner } from './components/NewDayBanner';
import { CelebrationOverlay } from './components/CelebrationOverlay';
import { TodayView } from './views/TodayView';
import { PlanView } from './views/PlanView';
import { MoneyView } from './views/MoneyView';
import { QuestsView } from './views/QuestsView';
import { YouView } from './views/YouView';
import { PlanReminderToast } from './components/PlanReminderToast';
import { SplashScreen } from './components/SplashScreen';
import { Onboarding } from './components/Onboarding';
import { FocusTimer } from './components/FocusTimer';
import { UndoToast } from './components/UndoToast';
import { Wardrobe } from './components/Wardrobe';
import { useApp } from './store/AppContext';
import { focusTimer } from './lib/focusTimer';
import { useApplyAppearance } from './lib/theme';

const VIEW_ORDER: ViewId[] = ['today', 'plan', 'money', 'quests', 'you'];

export default function App() {
  const { state } = useApp();
  useApplyAppearance(state.appearance);
  // The launch animation is for returning users; someone finishing setup has just seen the logo.
  const [launchedOnboarded] = useState(() => state.onboarded);
  // Home-screen shortcuts open straight into a tab (?view=plan) or the focus timer (?focus=1).
  const [view, setViewState] = useState<ViewId>(() => {
    const v = new URLSearchParams(window.location.search).get('view') as ViewId | null;
    return v && VIEW_ORDER.includes(v) ? v : 'today';
  });
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('focus') === '1') focusTimer.open();
    if (params.has('view') || params.has('focus') || params.has('source')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);
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
          {view === 'quests' && <QuestsView onNavigate={setView} />}
          {view === 'you' && <YouView />}
        </div>
      </main>
      <NavTabs active={view} onChange={setView} />
      <CelebrationOverlay />
      <PlanReminderToast />
      <FocusTimer />
      <UndoToast />
      <Wardrobe />
      {!state.onboarded ? <Onboarding /> : launchedOnboarded ? <SplashScreen /> : null}
    </div>
  );
}
