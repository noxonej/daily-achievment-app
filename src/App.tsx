import { Suspense, lazy, useEffect, useRef, useState } from 'react';
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
import { FocusTimer } from './components/FocusTimer';
import { RunTracker } from './components/RunTracker';
import { UndoToast } from './components/UndoToast';
import { useApp } from './store/AppContext';
import { useAuth } from './store/AuthContext';
import { focusTimer } from './lib/focusTimer';
import { useApplyAppearance } from './lib/theme';
import { useWardrobeOpen } from './lib/wardrobe';
import { useApplyPrefs } from './lib/prefs';
import { useGoogleAutoBackup } from './components/GoogleConnect';
import { SettingsScreen } from './components/SettingsScreen';

// Loaded only when needed, so the app opens faster.
const Onboarding = lazy(() => import('./components/Onboarding').then((m) => ({ default: m.Onboarding })));
const Wardrobe = lazy(() => import('./components/Wardrobe').then((m) => ({ default: m.Wardrobe })));

const VIEW_ORDER: ViewId[] = ['today', 'plan', 'money', 'quests', 'you'];

export default function App() {
  const { state, stats, dispatch } = useApp();
  const auth = useAuth();
  // Keep the account picker's picture, name and level current.
  const lookKey = JSON.stringify(state.character);
  useEffect(() => {
    if (!auth) return;
    const { account } = auth;
    const name = state.profile?.name?.trim();
    if (JSON.stringify(account.look) !== lookKey || account.level !== stats.level || (name && name !== account.name)) {
      auth.update({ look: state.character, level: stats.level, ...(name ? { name } : {}) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookKey, stats.level, state.profile?.name]);
  useApplyAppearance(state.appearance);
  useApplyPrefs(state.prefs);
  useGoogleAutoBackup();
  const wardrobeOpen = useWardrobeOpen();
  // Fetch the lazy screens in the background so they're cached for offline use.
  useEffect(() => {
    const t = setTimeout(() => {
      void import('./components/Wardrobe');
      void import('./components/Onboarding');
    }, 2500);
    return () => clearTimeout(t);
  }, []);
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
    dispatch({ type: 'GUIDE_MARK', key: `visit:${next}` });
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
      <RunTracker />
      <SettingsScreen />
      <UndoToast />
      {wardrobeOpen && (
        <Suspense fallback={null}>
          <Wardrobe />
        </Suspense>
      )}
      {!state.onboarded ? (
        <Suspense fallback={<div className="fixed inset-0 z-[90] bg-canvas" />}>
          <Onboarding />
        </Suspense>
      ) : launchedOnboarded && state.prefs?.splash !== false ? (
        <SplashScreen />
      ) : null}
    </div>
  );
}
