import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { SleepOverlay, sleepTool } from './components/SleepTool';
import { Header } from './components/Header';
import { NavTabs, type ViewId } from './components/NavTabs';
import { NewDayBanner } from './components/NewDayBanner';
import { CelebrationOverlay } from './components/CelebrationOverlay';
import { StreakCelebration } from './components/StreakCelebration';
import { TodayView } from './views/TodayView';
import { PlanReminderToast } from './components/PlanReminderToast';
import { hideBoot } from './lib/boot';
import { FocusTimer } from './components/FocusTimer';
import { RunTracker } from './components/RunTracker';
import { BreatheOverlay, breathe } from './components/Breathe';
import { UndoToast } from './components/UndoToast';
import { useApp } from './store/AppContext';
import { useAuth } from './store/AuthContext';
import { focusTimer } from './lib/focusTimer';
import { useApplyAppearance } from './lib/theme';
import { useWardrobeOpen } from './lib/wardrobe';
import { useApplyPrefs } from './lib/prefs';
import { useNudges } from './lib/nudges';
import { useGoogleAutoBackup } from './components/GoogleConnect';
import { AutoSteps } from './components/AutoSteps';
import { rememberInvite, useFriendsEngine } from './lib/friends';
import { FriendToasts } from './components/FriendToasts';
import { setIntent } from './lib/intents';
import { useSettingsPage } from './lib/settingsNav';

// Loaded only when needed, so the app opens faster (Today is in the first download; the rest
// is fetched quietly right after, so switching tabs is still instant).
const PlanView = lazy(() => import('./views/PlanView').then((m) => ({ default: m.PlanView })));
const MoneyView = lazy(() => import('./views/MoneyView').then((m) => ({ default: m.MoneyView })));
const QuestsView = lazy(() => import('./views/QuestsView').then((m) => ({ default: m.QuestsView })));
const YouView = lazy(() => import('./views/YouView').then((m) => ({ default: m.YouView })));
const SettingsScreen = lazy(() => import('./components/SettingsScreen').then((m) => ({ default: m.SettingsScreen })));
const Onboarding = lazy(() => import('./components/Onboarding').then((m) => ({ default: m.Onboarding })));
const Wardrobe = lazy(() => import('./components/Wardrobe').then((m) => ({ default: m.Wardrobe })));

const VIEW_ORDER: ViewId[] = ['today', 'plan', 'money', 'quests', 'you'];

export default function App() {
  const { state, stats, dispatch, saveFailed } = useApp();
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
  useNudges(state, stats);
  useGoogleAutoBackup();
  useFriendsEngine({
    accountId: auth?.account.id ?? null,
    name: state.profile?.name || auth?.account.name || 'Friend',
    picture: auth?.account.google?.picture,
    state,
    level: stats.level,
    streak: stats.currentStreak,
  });
  const wardrobeOpen = useWardrobeOpen();
  const settingsPage = useSettingsPage();
  // Fetch the lazy screens in the background so they're cached for offline use.
  useEffect(() => {
    const t = setTimeout(() => {
      void import('./views/PlanView');
      void import('./views/MoneyView');
      void import('./views/QuestsView');
      void import('./views/YouView');
      void import('./components/SettingsScreen');
      void import('./components/Wardrobe');
      void import('./components/Onboarding');
    }, 1200);
    return () => clearTimeout(t);
  }, []);
  // The launch animation is for returning users; someone finishing setup has just seen the logo.
  const [launchedOnboarded] = useState(() => state.onboarded);
  // The startup screen (in index.html) fades once Today has drawn.
  useEffect(() => {
    hideBoot({ showLogo: launchedOnboarded && state.prefs?.splash !== false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Home-screen shortcuts open straight into a tab (?view=plan) or the focus timer (?focus=1).
  const [view, setViewState] = useState<ViewId>(() => {
    const v = new URLSearchParams(window.location.search).get('view') as ViewId | null;
    return v && VIEW_ORDER.includes(v) ? v : 'today';
  });
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('focus') === '1') focusTimer.open();
    if (params.get('breathe') === '1') breathe.open();
    if (params.get('sleep') === '1') sleepTool.open();
    // "Quick add" shortcut on the app icon: jump into the quick-add box.
    if (params.get('add') === '1') setTimeout(() => document.querySelector<HTMLInputElement>('input[aria-label^="Quick add"]')?.focus(), 500);
    // Opened from a friend's invite link: remember their code and show Friends.
    const invite = params.get('invite');
    if (invite) {
      rememberInvite(invite);
      setIntent('you-friends');
      setViewState('you');
    }
    if (params.has('view') || params.has('focus') || params.has('breathe') || params.has('add') || params.has('source') || invite) {
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
        <Suspense fallback={<div className="min-h-[70vh]" />}>
          <div key={view} className={directionRef.current === 'right' ? 'animate-view-right' : 'animate-view-left'}>
            {view === 'today' && <TodayView onNavigate={setView} />}
            {view === 'plan' && <PlanView />}
            {view === 'money' && <MoneyView />}
            {view === 'quests' && <QuestsView onNavigate={setView} />}
            {view === 'you' && <YouView />}
          </div>
        </Suspense>
      </main>
      <NavTabs active={view} onChange={setView} />
      <CelebrationOverlay />
      <StreakCelebration />
      <AutoSteps />
      <PlanReminderToast />
      <FocusTimer />
      <RunTracker />
      <BreatheOverlay />
      <SleepOverlay />
      {settingsPage && (
        <Suspense fallback={null}>
          <SettingsScreen />
        </Suspense>
      )}
      <UndoToast />
      {saveFailed && (
        <div role="alert" className="fixed z-[90] left-3 right-3 top-[max(0.75rem,env(safe-area-inset-top))] rounded-2xl border border-red-400/50 bg-red-950/95 px-4 py-3 text-sm text-red-100 shadow-xl">
          <b>Couldn't save on this phone.</b> Its storage is full. Your changes work for now, but export a backup in Settings → Data and free some space.
        </div>
      )}
      <FriendToasts
        onOpen={() => {
          setIntent('you-friends');
          setView('you');
        }}
      />
      {wardrobeOpen && (
        <Suspense fallback={null}>
          <Wardrobe />
        </Suspense>
      )}
      {!state.onboarded ? (
        <Suspense fallback={<div className="fixed inset-0 z-[90] bg-canvas" />}>
          <Onboarding />
        </Suspense>
      ) : null}
    </div>
  );
}
