import { Switch } from './Switch';
import { useMemo, useState, type ReactNode } from 'react';
import { useApp } from '../store/AppContext';
import type { FocusArea, Profile } from '../lib/types';
import { FOCUS_AREAS, buildRoutine } from '../lib/routine';
import { formatPlanTime, planCategory } from '../lib/weekPlan';
import { Logo, Wordmark } from './Logo';
import { Icon } from './Icon';
import { DEFAULT_LOOK, normalizeLook } from '../data/avatar';

// Kept short on purpose: about you, your day, then your plan. The character and colours are picked
// for you (change them any time in Rewards and Settings).
type Step = 'welcome' | 'focus' | 'day' | 'preview';
const STEPS: Step[] = ['welcome', 'focus', 'day', 'preview'];

/**
 * The app's look follows what you want to work on: the first goal you pick sets the colour and
 * background (you can still change them on the character step or in Settings).
 */
const timeInput =
  'time-input block w-full min-w-0 max-w-full rounded-xl bg-white/5 border border-white/10 px-3 h-12 text-base text-white focus:outline-none focus:border-amber-400/60';

/** First-run setup: a few questions, then a personal week plan is built and the app opens. */
const GENDERS: Array<{ id: NonNullable<Profile['gender']>; label: string }> = [
  { id: 'female', label: 'Girl' },
  { id: 'male', label: 'Guy' },
  { id: 'unsaid', label: 'Rather not say' },
];

export function Onboarding() {
  const { state, dispatch } = useApp();
  // If the name was already given when the account was created, skip straight to the goals.
  const [step, setStep] = useState<Step>(() => (state.profile?.name ? 'focus' : 'welcome'));
  const [dir, setDir] = useState<'right' | 'left'>('right');
  const [name, setName] = useState(state.profile?.name ?? '');
  // Only ask for a name if the account didn't already give one.
  const [askName] = useState(() => !state.profile?.name);
  const [areas, setAreas] = useState<FocusArea[]>([]);
  const [wake, setWake] = useState('07:00');
  const [bed, setBed] = useState('22:30');
  const [hasBusy, setHasBusy] = useState(true);
  const [busyStart, setBusyStart] = useState('08:00');
  const [busyEnd, setBusyEnd] = useState('15:00');
  const [remind, setRemind] = useState(true);
  const [lockApps, setLockApps] = useState(false);
  const [gender, setGender] = useState<NonNullable<Profile['gender']> | undefined>(state.profile?.gender);

  const index = STEPS.indexOf(step);
  const routine = useMemo(
    () => buildRoutine({ focusAreas: areas, wakeTime: wake, bedTime: bed, busy: hasBusy ? { start: busyStart, end: busyEnd } : null }),
    [areas, wake, bed, hasBusy, busyStart, busyEnd],
  );

  function go(next: Step) {
    setDir(STEPS.indexOf(next) > index ? 'right' : 'left');
    setStep(next);
  }

  /** Small touches that match the answers (starting hair). */
  function matchLook() {
    // A girl's starting character gets a ponytail instead of the default twists (only if untouched).
    if (gender === 'female' && normalizeLook(state.character).hair === DEFAULT_LOOK.hair) {
      dispatch({ type: 'EQUIP_COSMETIC', slot: 'hair', itemId: 'hair-ponytail' });
    }
    // Colours: every new account starts on the Squzo look (Obsidian + Flame), where each tab has its own glow.
  }

  function finish(withPlan: boolean, askReminders = true) {
    // Reminders are on by default: ask the phone for permission now (this tap counts as the
    // person's go-ahead), and switch the app's reminders on if they said yes.
    if (askReminders && remind && typeof Notification !== 'undefined') {
      try {
        if (Notification.permission === 'granted') dispatch({ type: 'SET_PREFS', prefs: { nudges: true } });
        else if (Notification.permission === 'default')
          void Notification.requestPermission().then((p) => {
            if (p === 'granted') dispatch({ type: 'SET_PREFS', prefs: { nudges: true } });
          });
      } catch {
        // notifications are optional
      }
    }
    if (lockApps) dispatch({ type: 'SET_PREFS', prefs: { scrollLock: 3 } });
    dispatch({
      type: 'COMPLETE_ONBOARDING',
      profile: { name: name.trim(), focusAreas: areas, wakeTime: wake, bedTime: bed, ...(gender ? { gender } : {}) },
      plan: withPlan ? routine : { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
    });
  }

  function toggleArea(a: FocusArea) {
    setAreas((xs) => (xs.includes(a) ? xs.filter((x) => x !== a) : [...xs, a]));
  }

  return (
    <div className="fixed inset-0 z-[90] bg-canvas bg-grid overflow-y-auto">
      <div className="min-h-full max-w-md mx-auto px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col">
        {step !== 'welcome' && (
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => go(STEPS[Math.max(0, index - 1)])}
              aria-label="Back"
              className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full text-slate-300 hover:bg-white/10"
            >
              <Icon name="⬅" size={20} />
            </button>
            <div className="flex-1 flex gap-1.5" aria-label={`Step ${index} of ${STEPS.length - 1}`}>
              {STEPS.slice(1).map((s, i) => (
                <span
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${i < index ? 'bg-amber-400' : 'bg-white/10'}`}
                />
              ))}
            </div>
            <button onClick={() => finish(false, false)} className="text-sm font-semibold text-slate-500 hover:text-slate-300 px-1">
              Skip
            </button>
          </div>
        )}

        <div key={step} className={`flex-1 flex flex-col ${dir === 'right' ? 'animate-view-right' : 'animate-view-left'}`}>
          {step === 'welcome' && (
            <>
              <div className="flex-1 flex flex-col items-center justify-center text-center pt-10">
                <Logo size={84} animated className="drop-shadow-[0_12px_32px_rgba(245,158,11,0.35)]" />
                <Wordmark className="text-3xl mt-5" />
                <p className="text-slate-300 mt-3 text-lg leading-snug max-w-xs">
                  Become a better you, one day at a time.
                </p>
                <ul className="mt-8 space-y-3 text-left w-full max-w-xs stagger">
                  <Feature icon="🎯" title="Daily quests" text="Small wins, streaks and levels" />
                  <Feature icon="📅" title="A plan for your week" text="Made for you in 3 taps" />
                  <Feature icon="💰" title="Money and big goals" text="Save, read, train, learn" />
                </ul>
              </div>
              <Primary onClick={() => go('focus')}>Start</Primary>
              <p className="text-center text-xs text-slate-500 mt-3">3 quick questions, about 30 seconds.</p>
            </>
          )}

          {step === 'focus' && (
            <>
              <Title
                title={name.trim() ? `What do you want to get better at, ${name.trim()}?` : 'What do you want to get better at?'}
                sub="Pick one or more."
              />
              {askName && (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your first name (optional)"
                  aria-label="Your first name"
                  maxLength={24}
                  autoComplete="given-name"
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 h-12 text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60 mb-4"
                />
              )}
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">I'm a</p>
                <div className="grid grid-cols-3 gap-2">
                  {GENDERS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGender(g.id)}
                      aria-pressed={gender === g.id}
                      className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${
                        gender === g.id ? 'border-amber-400 bg-amber-500/10 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {FOCUS_AREAS.map((a) => {
                  const on = areas.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggleArea(a.id)}
                      aria-pressed={on}
                      className={`relative text-left rounded-2xl border p-3.5 transition ${
                        on ? 'border-amber-400 bg-amber-500/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                      }`}
                    >
                      <span
                        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition ${
                          on ? 'bg-amber-500 text-white' : 'bg-white/5 text-amber-300'
                        }`}
                      >
                        <Icon name={a.icon} size={20} />
                      </span>
                      <span className="block text-sm font-bold text-white leading-tight">{a.label}</span>
                      <span className="block text-xs text-slate-400 mt-0.5">{a.hint}</span>
                      {on && (
                        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                          <Icon name="✓" size={12} strokeWidth={3} className="animate-check" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex-1 min-h-6" />
              <Primary
                onClick={() => {
                  matchLook();
                  go('day');
                }}
                disabled={areas.length === 0}
              >
                {areas.length === 0 ? 'Pick at least one' : 'Continue'}
              </Primary>
            </>
          )}

          {step === 'day' && (
            <>
              <Title title="What does your day look like?" sub="Rough times are fine. You can change everything later." />
              <div className="time-grid">
                <TimeField label="I wake up at" icon="🌅" value={wake} onChange={setWake} />
                <TimeField label="I go to bed at" icon="🌙" value={bed} onChange={setBed} />
              </div>
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">School or work on weekdays?</p>
                    <p className="text-xs text-slate-400">We'll plan around it.</p>
                  </div>
                  <Switch on={hasBusy} onChange={setHasBusy} label="School or work on weekdays" />
                </div>
                {hasBusy && (
                  <div className="time-grid mt-4">
                    <TimeField label="Starts" value={busyStart} onChange={setBusyStart} />
                    <TimeField label="Ends" value={busyEnd} onChange={setBusyEnd} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-h-6" />
              <Primary onClick={() => go('preview')}>Continue</Primary>
            </>
          )}

          {step === 'preview' && (
            <>
              <Title title="Your week is ready" sub="Here's Monday. Tap anything later to change it." />
              <ul className="rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/[0.06] rows-stagger">
                {routine.mon.map((i) => (
                  <li key={i.time + i.text} className="flex items-center gap-3 px-4 py-2.5">
                    <span className={`w-1 self-stretch rounded-full ${planCategory(i.category)?.bar ?? 'bg-slate-600'}`} />
                    <span className="w-[4.5rem] shrink-0 text-sm font-bold tabular-nums text-amber-300">{formatPlanTime(i.time!)}</span>
                    <span className="text-[15px] text-slate-100">{i.text}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500 mt-3 text-center">Weekends get a later start and free time.</p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/[0.06]">
                <SwitchRow icon="🔔" title="Reminders" text="A morning boost and an evening check." on={remind} onChange={setRemind} />
                <SwitchRow icon="🔒" title="Quests before scrolling" text="Social apps only after 3 quests." on={lockApps} onChange={setLockApps} />
              </div>
              <p className="text-xs text-slate-500 mt-3 text-center leading-relaxed">
                <Icon name="🏆" size={12} className="inline -mt-0.5 mr-1 text-amber-300" />
                Play fair: only tick a quest when you really did it. The only person you'd fool is you.
              </p>
              <div className="flex-1 min-h-6" />
              <Primary onClick={() => finish(true)}>Start my week</Primary>
              <button onClick={() => finish(false)} className="mt-2 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200">
                I'll make my own plan
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
        <Icon name={icon} size={20} />
      </span>
      <span>
        <span className="block text-sm font-bold text-white">{title}</span>
        <span className="block text-xs text-slate-400">{text}</span>
      </span>
    </li>
  );
}

function Title({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-[26px] leading-tight font-extrabold text-white">{title}</h1>
      <p className="text-slate-400 mt-2">{sub}</p>
    </div>
  );
}

function Primary({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:bg-white/10 disabled:text-slate-500 text-white text-base font-bold py-4 shadow-[0_10px_30px_-10px_rgba(245,158,11,0.6)] disabled:shadow-none transition"
    >
      {children}
    </button>
  );
}

function TimeField({ label, icon, value, onChange }: { label: string; icon?: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block min-w-0">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-300 mb-1.5">
        {icon && <Icon name={icon} size={15} className="text-amber-300" />}
        {label}
      </span>
      <input type="time" value={value} onChange={(e) => onChange(e.target.value || value)} className={timeInput} />
    </label>
  );
}

function SwitchRow({ icon, title, text, on, onChange }: { icon: string; title: string; text: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-bold text-white">
          <Icon name={icon} size={16} className="shrink-0 text-amber-300" />
          {title}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{text}</p>
      </div>
      <Switch on={on} onChange={onChange} label={title} />
    </div>
  );
}
