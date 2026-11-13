import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useBackToClose } from '../lib/backstack';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { settings, useSettingsPage, type SettingsPage } from '../lib/settingsNav';
import { fullPrefs, t } from '../lib/prefs';
import { LANGUAGES, type TKey } from '../lib/i18n';
import { locale, hour12 } from '../lib/locale';
import type { Prefs } from '../lib/types';
import { titleForLevel } from '../lib/xp';
import { isStandalone } from '../lib/install';
import { loadLiveRemindersEnabled, notificationsSupported, saveLiveRemindersEnabled } from '../lib/planReminders';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { Toggle } from './AuthGate';
import { AccountSettings } from './AccountSettings';
import { GoogleCard, GoogleG } from './GoogleConnect';
import { googleConfigured } from '../lib/google';
import { ProfileCard } from './ProfileSettings';
import { AboutPage } from './AboutPage';
import { InstallCard } from './InstallCard';
import { ManageView } from '../views/ManageView';
import { NUDGE_COUNT, backgroundRemindersSupported, randomNudge } from '../lib/nudges';
import { showSystemNotification } from '../lib/notify';

const TITLES: Record<SettingsPage, TKey> = {
  home: 'settings.title',
  profile: 'settings.profile',
  account: 'settings.account',
  appearance: 'settings.appearance',
  language: 'settings.language',
  notifications: 'settings.notifications',
  sounds: 'settings.sounds',
  quests: 'settings.quests',
  data: 'settings.data',
  install: 'settings.install',
  about: 'settings.about',
  help: 'settings.help',
};

/** Full-screen Settings, laid out like a phone's settings app: grouped rows that open sub-pages. */
export function SettingsScreen() {
  const page = useSettingsPage();
  const prevRef = useRef<SettingsPage | null>(null);
  const dir = prevRef.current === null ? 'up' : page === 'home' ? 'left' : 'right';
  useEffect(() => {
    prevRef.current = page;
  }, [page]);

  useEffect(() => {
    if (!page) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [page]);

  // Phone Back button / Escape: from a sub-page go back to the list, from the list close Settings.
  useBackToClose(!!page, () => (page === 'home' ? settings.close() : settings.open('home')));

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [page]);

  if (!page) return null;

  return (
    <div
      ref={scrollRef}
      data-overlay
      role="dialog"
      aria-modal="true"
      aria-label={t(TITLES[page])}
      className={`fixed inset-0 z-[70] bg-canvas bg-grid overflow-y-auto overscroll-contain ${dir === 'up' ? 'sheet-in' : ''}`}
    >
      <div className="sticky top-0 z-10 bg-canvas/[0.97] border-b border-white/10 pt-[env(safe-area-inset-top)]">
        <div className="max-w-2xl mx-auto px-2 h-14 flex items-center gap-1">
          <button
            onClick={() => (page === 'home' ? settings.close() : settings.open('home'))}
            aria-label={page === 'home' ? t('common.done') : t('common.back')}
            className="h-10 min-w-10 px-2 flex items-center gap-1 rounded-full text-amber-300 font-semibold hover:bg-white/10"
          >
            {page === 'home' ? <Icon name="✕" size={20} /> : <Icon name="⬅" size={20} />}
            <span className="text-sm hidden min-[380px]:inline">{page === 'home' ? '' : t('settings.title')}</span>
          </button>
          <h1 className="flex-1 text-center font-display text-[17px] font-bold text-white truncate pr-12 min-[380px]:pr-24">
            {t(TITLES[page])}
          </h1>
        </div>
      </div>
      <div
        key={page}
        className={`max-w-2xl mx-auto px-4 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))] ${
          dir === 'right' ? 'animate-view-right' : dir === 'left' ? 'animate-view-left' : ''
        }`}
      >
        {page === 'home' && <Home />}
        {page === 'profile' && <ProfileCard />}
        {page === 'account' && (
          <>
            <GoogleCard />
            <AccountSettings />
          </>
        )}
        {page === 'appearance' && <AppearancePage />}
        {page === 'language' && <LanguagePage />}
        {page === 'notifications' && <NotificationsPage />}
        {page === 'sounds' && <SoundsPage />}
        {page === 'quests' && <ManageView part="quests" />}
        {page === 'data' && <ManageView part="data" />}
        {page === 'install' && <InstallCard always />}
        {page === 'about' && <AboutPage />}
        {page === 'help' && <HelpPage />}
      </div>
    </div>
  );
}

function usePrefs(): [Prefs, (p: Partial<Prefs>) => void] {
  const { state, dispatch } = useApp();
  return [fullPrefs(state.prefs), (p) => dispatch({ type: 'SET_PREFS', prefs: p })];
}

function Home() {
  const { state, stats } = useApp();
  const auth = useAuth();
  const [prefs, setPrefs] = usePrefs();
  const lang = LANGUAGES.find((l) => l.code === prefs.language);
  const themeLabel = t(prefs.theme === 'light' ? 'appearance.light' : prefs.theme === 'system' ? 'appearance.system' : 'appearance.dark');

  return (
    <div className="space-y-6 stagger">
      <button
        onClick={() => settings.open('profile')}
        className="w-full flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-left hover:border-white/20"
      >
        <Avatar look={state.character} size={56} />
        <span className="flex-1 min-w-0">
          <span className="block font-display text-lg font-bold text-white truncate">{state.profile?.name || auth?.account.name || t('settings.profile')}</span>
          <span className="block text-xs text-slate-400">
            LV {stats.level} · {titleForLevel(stats.level)}
          </span>
        </span>
        <Icon name="›" size={20} className="text-slate-500" />
      </button>

      {auth && !auth.account.google && googleConfigured() && (
        <button
          onClick={() => settings.open('account')}
          className="w-full flex items-center gap-3 rounded-2xl border border-sky-400/30 bg-sky-500/[0.07] p-3.5 text-left hover:border-sky-400/60"
        >
          <span className="shrink-0 w-10 h-10 rounded-full bg-[#fff] flex items-center justify-center">
            <GoogleG size={20} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold text-white">Save your progress</span>
            <span className="block text-xs text-slate-400">Connect Google to keep it safe and use it on any phone.</span>
          </span>
          <Icon name="›" size={18} className="text-slate-500" />
        </button>
      )}

      <Group>
        <SwitchRow label={t('settings.simple')} hint={t('settings.simpleHint')} on={prefs.simple} onChange={(v) => setPrefs({ simple: v })} />
        <Row icon="💡" tint="bg-yellow-500" label={t('settings.help')} to="help" />
      </Group>

      <Group title="Daily boost">
        <div className="px-4 py-3.5">
          <p className="text-[15px] font-semibold text-white">On the Today screen, show</p>
          <p className="text-xs text-slate-400 mt-0.5">A new one every day, from over 1,000 quotes with a few famous Bible verses mixed in. Tap Skip for another one.</p>
          <div className="mt-3 grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Daily boost">
            {(
              [
                ['quotes', 'Quotes'],
                ['off', 'Nothing'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                role="radio"
                aria-checked={id === 'off' ? prefs.daily === 'off' : prefs.daily !== 'off'}
                onClick={() => setPrefs({ daily: id })}
                className={`rounded-lg py-2 text-xs font-semibold border ${
                  (id === 'off' ? prefs.daily === 'off' : prefs.daily !== 'off') ? 'bg-amber-500/20 border-amber-400 text-amber-100' : 'bg-white/5 border-white/10 text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Group>

      <Group title={t('settings.general')}>
        <Row icon="🌗" tint="bg-violet-500" label={t('settings.appearance')} value={themeLabel} to="appearance" />
        <Row icon="🔤" tint="bg-sky-500" label={t('settings.language')} value={lang?.native} to="language" />
        <Row icon="🔔" tint="bg-rose-500" label={t('settings.notifications')} to="notifications" />
        <Row icon="🔊" tint="bg-orange-500" label={t('settings.sounds')} to="sounds" />
      </Group>

      <Group>
        <Row icon="🎯" tint="bg-amber-500" label={t('settings.quests')} value={String(state.quests.filter((q) => !q.archived && !q.wildcardDate && !q.wildcardWeekKey).length)} to="quests" />
        {auth && <Row icon="🔐" tint="bg-emerald-500" label={t('settings.account')} value={auth.account.google?.email ?? (auth.account.pinHash ? 'PIN' : undefined)} to="account" />}
        <Row icon="💾" tint="bg-cyan-500" label={t('settings.data')} to="data" />
      </Group>

      <Group>
        {!isStandalone() && <Row icon="📱" tint="bg-fuchsia-500" label={t('settings.install')} to="install" />}
        <Row icon="ℹ" tint="bg-slate-500" label={t('settings.about')} value="Terms & privacy" to="about" />
      </Group>
    </div>
  );
}

function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section>
      {title && <p className="px-1 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/[0.06] overflow-hidden">{children}</div>
    </section>
  );
}

function Row({ icon, tint, label, value, to }: { icon: string; tint: string; label: string; value?: string; to: SettingsPage }) {
  return (
    <button onClick={() => settings.open(to)} className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-white/[0.04]">
      <span className={`w-8 h-8 shrink-0 rounded-[10px] ${tint} text-white flex items-center justify-center`}>
        <Icon name={icon} size={17} />
      </span>
      <span className="flex-1 min-w-0 text-[15px] font-semibold text-white truncate">{label}</span>
      {value && <span className="text-sm text-slate-400 truncate max-w-[40%]">{value}</span>}
      <Icon name="›" size={18} className="shrink-0 text-slate-500" />
    </button>
  );
}

function SwitchRow({ label, hint, on, onChange }: { label: string; hint?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-semibold text-white">{label}</span>
        {hint && <span className="block text-xs text-slate-400 mt-0.5">{hint}</span>}
      </span>
      <Toggle on={on} onChange={onChange} label={label} />
    </div>
  );
}

const THEME_CARDS: Array<{ id: Prefs['theme']; key: TKey; bg: string; card: string; line: string }> = [
  { id: 'dark', key: 'appearance.dark', bg: '#0b0d11', card: '#1b1e23', line: '#3a3f47' },
  { id: 'light', key: 'appearance.light', bg: '#f4f6f8', card: '#ffffff', line: '#cfd5de' },
  { id: 'system', key: 'appearance.system', bg: 'linear-gradient(135deg, #f4f6f8 50%, #0b0d11 50%)', card: '', line: '' },
];

function AppearancePage() {
  const [prefs, setPrefs] = usePrefs();
  return (
    <div className="space-y-6">
      <section>
        <p className="px-1 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{t('appearance.theme')}</p>
        <ThemePicker />
      </section>

      <section>
        <p className="px-1 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Easy reading</p>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Easy reading">
            {(
              [
                ['normal', 'Normal', 'Aa'],
                ['roomy', 'Roomy', 'Aa'],
                ['extra', 'Extra', 'Aa'],
              ] as const
            ).map(([id, label, aa], i) => {
              const on = (prefs.reading ?? 'normal') === id;
              return (
                <button
                  key={id}
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPrefs({ reading: id })}
                  className={`rounded-xl border-2 py-2.5 transition ${on ? 'border-amber-400 bg-amber-500/10' : 'border-white/10 hover:border-white/25'}`}
                >
                  <span className="block font-display font-bold text-white" style={{ fontSize: 16 + i * 4 }}>{aa}</span>
                  <span className="block text-xs font-semibold text-slate-300 mt-0.5">{label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 mt-3 leading-relaxed">
            Bigger gaps, bigger text and more space between lines. Good if busy screens are hard to read, or for dyslexia.
          </p>
        </div>
      </section>

      <Group>
        <SwitchRow label={t('prefs.reduceMotion')} on={prefs.reduceMotion} onChange={(v) => setPrefs({ reduceMotion: v })} />
        <SwitchRow label={t('prefs.splash')} on={prefs.splash} onChange={(v) => setPrefs({ splash: v })} />
      </Group>
    </div>
  );
}

function LanguagePage() {
  const [prefs, setPrefs] = usePrefs();
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? LANGUAGES.filter((l) => l.name.toLowerCase().includes(s) || l.native.toLowerCase().includes(s) || l.code === s) : LANGUAGES;
  }, [q]);
  const now = new Date();
  const preview = `${now.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })} · ${now.toLocaleTimeString(locale(), {
    hour: 'numeric',
    minute: '2-digit',
    hour12: hour12(),
  })}`;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
        <p className="text-xs font-semibold text-slate-400">{t('nav.today')}</p>
        <p className="text-[15px] font-bold text-white mt-0.5 first-letter:uppercase">{preview}</p>
      </div>

      <section>
        <p className="px-1 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{t('prefs.timeFormat')}</p>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-white/[0.04] border border-white/10 p-1" role="radiogroup" aria-label={t('prefs.timeFormat')}>
          {(['auto', '12', '24'] as const).map((f) => (
            <button
              key={f}
              role="radio"
              aria-checked={prefs.timeFormat === f}
              onClick={() => setPrefs({ timeFormat: f })}
              className={`rounded-xl py-2.5 text-sm font-bold transition ${prefs.timeFormat === f ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {t(f === 'auto' ? 'prefs.auto' : f === '12' ? 'prefs.h12' : 'prefs.h24')}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="px-1 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          {t('settings.language')} · {LANGUAGES.length}
        </p>
        <label className="relative block mb-3">
          <Icon name="🔍" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('lang.search')}
            type="search"
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-3 h-11 text-[15px] text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
          />
        </label>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/[0.06] overflow-hidden" role="radiogroup" aria-label={t('settings.language')}>
          {list.map((l) => {
            const on = prefs.language === l.code;
            return (
              <button
                key={l.code}
                role="radio"
                aria-checked={on}
                lang={l.code}
                onClick={() => setPrefs({ language: l.code })}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.04]"
              >
                <span className="flex-1 min-w-0">
                  <span className={`block text-[15px] font-semibold ${on ? 'text-amber-300' : 'text-white'}`}>{l.native}</span>
                  {l.native !== l.name && <span className="block text-xs text-slate-500">{l.name}</span>}
                </span>
                {on && <Icon name="✓" size={18} strokeWidth={3} className="text-amber-400 animate-check" />}
              </button>
            );
          })}
          {list.length === 0 && <p className="px-4 py-6 text-center text-sm text-slate-500">—</p>}
        </div>
      </section>
    </div>
  );
}

function NotificationsPage() {
  const { state, stats } = useApp();
  const [prefs, setPrefs] = usePrefs();
  const [live, setLive] = useState(loadLiveRemindersEnabled);
  const [permission, setPermission] = useState(() => (notificationsSupported() ? Notification.permission : 'unsupported'));
  const [background, setBackground] = useState<boolean | null>(null);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    void backgroundRemindersSupported().then(setBackground);
  }, []);

  async function ask() {
    if (notificationsSupported() && Notification.permission === 'default') {
      try {
        const p = await Notification.requestPermission();
        setPermission(p);
        return p;
      } catch {
        // the in-app banner still works
      }
    }
    return notificationsSupported() ? Notification.permission : 'unsupported';
  }

  async function toggle(next: boolean) {
    if (next) await ask();
    setLive(next);
    saveLiveRemindersEnabled(next);
  }

  async function toggleNudges(next: boolean) {
    if (next) await ask();
    setPrefs({ nudges: next });
  }

  async function test() {
    const p = await ask();
    if (p !== 'granted') return;
    const n = randomNudge(stats.currentStreak, state.profile?.name ?? '');
    showSystemNotification(n.title, n.body, 'nudge-test');
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  }

  return (
    <div className="space-y-4">
      <Group title="Motivation">
        <SwitchRow
          label="Motivation reminders"
          hint={`Up to 5 a day: a morning boost with your daily quote, a push at lunch and in the afternoon if nothing is done yet, the evening streak check and a last call before midnight. ${NUDGE_COUNT}+ different messages. Once you finish a quest, the pushes stop for the day.`}
          on={prefs.nudges}
          onChange={toggleNudges}
        />
        {prefs.nudges && (
          <>
            <label className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex-1 text-[15px] font-semibold text-white">Evening check</span>
              <input
                type="time"
                value={prefs.nudgeTime}
                onChange={(e) => e.target.value && setPrefs({ nudgeTime: e.target.value })}
                className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-white text-base"
              />
            </label>
            <div className="px-4 py-3">
              <button onClick={test} className="rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/10 px-3.5 py-2 text-sm font-semibold text-white">
                <Icon name={sent ? '✓' : '🛎'} size={15} className="icon-inline" />
                {sent ? 'Sent' : 'Send me one now'}
              </button>
            </div>
          </>
        )}
      </Group>
      {prefs.nudges && permission === 'denied' && (
        <p className="px-1 text-xs text-amber-300">Notifications are blocked for this app in your phone's settings. Allow them there to get reminders.</p>
      )}
      {prefs.nudges && permission !== 'denied' && (
        <p className="px-1 text-xs text-slate-400">
          {background && isStandalone()
            ? 'Your phone supports reminders even when the app is closed. Android decides the exact moment, so one may come a bit late.'
            : !isStandalone()
              ? 'Install the app on your home screen (Settings → Install) so reminders can also come when the app is closed.'
              : 'On this phone, reminders come while the app is open or in the background. For alarms with the app fully closed, add your plan to your calendar (below).'}
        </p>
      )}

      <Group title="Week plan">
        <SwitchRow
          label="Plan reminders"
          hint="A pop-up and a buzz when something in your week plan starts, while the app is open."
          on={live}
          onChange={toggle}
        />
      </Group>
      {live && permission === 'denied' && (
        <p className="px-1 text-xs text-amber-300">Notifications are blocked in your phone's settings, so you'll only see the in-app pop-up.</p>
      )}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex gap-3">
        <Icon name="📅" size={20} className="shrink-0 text-amber-300 mt-0.5" />
        <p className="text-sm text-slate-300">
          <b className="text-white">Want alarms even when the app is closed?</b> Open the Plan tab, tap the bell, and add your plan to your
          phone's calendar. Your phone then reminds you at every time you set.
        </p>
      </div>
    </div>
  );
}

function SoundsPage() {
  const [prefs, setPrefs] = usePrefs();
  return (
    <Group>
      <SwitchRow label={t('prefs.sounds')} hint="A pling when you tick a quest, and a chime when a focus session ends." on={prefs.sounds} onChange={(v) => setPrefs({ sounds: v })} />
      <SwitchRow
        label={t('prefs.haptics')}
        hint="Little buzzes when you finish quests and open boxes (Android)."
        on={prefs.haptics}
        onChange={(v) => setPrefs({ haptics: v })}
      />
    </Group>
  );
}

const HELP: Array<{ icon: string; title: string; text: string }> = [
  { icon: '🎯', title: 'Quests', text: 'Small things to do every day (daily quests) or during the week (weekly quests). Tap one when you have done it. Daily quests start fresh every midnight, weekly ones every Monday.' },
  { icon: '⚡', title: 'XP and levels', text: 'Every quest gives XP (points). Harder quests give more. Collect enough XP and you reach the next level.' },
  { icon: '🔥', title: 'Streak', text: 'How many days in a row you finished at least one quest. Do one quest every day to keep the fire going. Finish all of them for a perfect day, which also wins you a chest.' },
  { icon: '🌙', title: 'Rest day', text: 'Life happens. Miss one day in a week and your streak carries on: that day becomes a rest day. Miss two days in a row and it starts again, unless a Streak Shield saves it.' },
  { icon: 'df:chest', title: 'Chests', text: 'You win a chest for every perfect day, every perfect week and every new level. Open them in the wardrobe (tap your character) to win clothes, faces and more.' },
  { icon: 'df:chest', title: 'Rewards', text: 'Quests → Rewards is your own shop. Add real treats (like 30 minutes of gaming) with a price in coins, then buy them when you have earned enough. Treats feel better when they are earned.' },
  { icon: '🧮', title: 'Monthly budget', text: 'In Money, give every euro a job: split what you get this month (after bills and saving) into envelopes like Food and Fun, and see what is left in each as you spend.' },
  { icon: '💎', title: 'Shards', text: 'The app\'s coins. You get them from chests and the daily box, and spend them on items in the wardrobe.' },
  { icon: '📦', title: 'Daily box', text: 'Finish one quest and the daily box on Today unlocks. Open it once a day for a prize. Very rarely it has a Mythic item you can\'t get anywhere else.' },
  { icon: '🌙', title: 'Sleep', text: 'Tap Sleep on Today. Plan: your ideal sleep for your age (change it with − and +) and a calculator that tells you when to go to bed for your wake-up time, in 90-minute sleep cycles. Sounds: rain, waves, fan or noise with a timer. Log: tap “Going to sleep”, then “I’m awake” in the morning to see your week. Tips: habits that really help.' },
  { icon: '🐷', title: 'Money modes & saving', text: 'Money → Save: pick what your money focuses on (Balanced, Save hard, Big goal, Safety net, Pay off debt, Grow it, Enjoy now). It sets how much you save first. Below are proven ways to save, with buttons that set them up, and scam warning signs.' },
  { icon: '🎁', title: 'Daily rewards', text: 'Open the app every day and tap Claim on Today. Seven rewards in a row: coins, a Quest Swap, a Streak Shield and a prize chest on day 7. Missed a day? You keep your progress. All 7 days in a row adds 50 bonus coins.' },
  { icon: '🔤', title: 'Easy reading', text: 'Settings → Appearance → Easy reading makes gaps, text and line spacing bigger, and shows full names instead of cutting them off. Good if busy screens are hard to read.' },
  { icon: '🔁', title: 'Quest Swap', text: 'Trade one of today\'s quests for a different one. Back to normal tomorrow.' },
  { icon: '🛡', title: 'Streak Shield', text: 'Saves your streak automatically if you miss a day.' },
  { icon: '⏭', title: 'Skip Pass', text: 'A rare prize. Skip one quest on a busy or sick day: it counts as done (also for your streak) but gives no XP.' },
  { icon: '📅', title: 'Week Plan', text: 'Your routine from Monday to Sunday, like 7:00 Wake up. It repeats every week. Choose "Only once" for one-time things like a dentist visit; they disappear after the day.' },
  { icon: '💰', title: 'Money', text: 'Type in how much you have. Each time you buy something, tap "I spent money". The daily limit shows how much you can still spend today. Add goals (like a car) to save for.' },
  { icon: '📕', title: 'Diary', text: 'In the You tab. A private page for every day, plus notes. Nobody else can see it.' },
  { icon: '🔐', title: 'Your data', text: 'Everything stays on your phone. Make a backup in Settings → Data & backup so you never lose it.' },
];

function HelpPage() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400 px-1">Everything in the app, in plain words.</p>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/[0.06]">
        {HELP.map((h) => (
          <div key={h.title} className="flex gap-3 px-4 py-3.5">
            <span className="shrink-0 w-9 h-9 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
              <Icon name={h.icon} size={18} />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold text-white">{h.title}</span>
              <span className="block text-[13px] text-slate-300 leading-relaxed mt-0.5">{h.text}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Light / Dark / Automatic cards with a mini preview of each. */
export function ThemePicker() {
  const [prefs, setPrefs] = usePrefs();
  return (
        <div className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label={t('appearance.theme')}>
      {THEME_CARDS.map((c) => {
        const on = prefs.theme === c.id;
        return (
          <button
            key={c.id}
            role="radio"
            aria-checked={on}
            onClick={() => setPrefs({ theme: c.id })}
            className={`rounded-2xl border-2 p-2 transition ${on ? 'border-amber-400' : 'border-white/10 hover:border-white/25'}`}
          >
            <span className="block h-20 rounded-xl p-2 space-y-1.5 overflow-hidden" style={{ background: c.bg }}>
              {c.card ? (
                <>
                  <span className="block h-4 rounded-md" style={{ background: c.card }} />
                  <span className="block h-1.5 w-3/4 rounded" style={{ background: c.line }} />
                  <span className="block h-1.5 w-1/2 rounded" style={{ background: c.line }} />
                </>
              ) : null}
            </span>
            <span className="mt-2 flex items-center justify-center gap-1.5 text-sm font-bold text-white">
              {on && <Icon name="✓" size={14} strokeWidth={3} className="text-amber-400" />}
              {t(c.key)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
