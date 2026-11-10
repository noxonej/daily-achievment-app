import { useMemo, useState, type ReactNode } from 'react';
import { useApp } from '../store/AppContext';
import type { Appearance, FocusArea } from '../lib/types';
import { FOCUS_AREAS, buildRoutine } from '../lib/routine';
import { formatPlanTime, planCategory } from '../lib/weekPlan';
import { Logo, Wordmark } from './Logo';
import { Icon } from './Icon';
import { Avatar } from './Avatar';
import { AccentPicker } from './ProfileSettings';
import { AVATAR_ITEMS, isOwned, normalizeLook, RARITY } from '../data/avatar';
import { ownership } from '../store/reducer';
import type { AvatarSlot } from '../lib/types';

// Kept short on purpose: goals (and your name, if needed), your day, your character and colour, then the plan.
type Step = 'welcome' | 'focus' | 'day' | 'avatar' | 'fair' | 'preview';
const STEPS: Step[] = ['welcome', 'focus', 'day', 'avatar', 'fair', 'preview'];

/**
 * The app's look follows what you want to work on: the first goal you pick sets the colour and
 * background (you can still change them on the character step or in Settings).
 */
const LOOK_FOR_AREA: Record<FocusArea, { accent: Appearance['accent']; background: Appearance['background']; mood: string }> = {
  health: { accent: 'emerald', background: 'aurora', mood: 'fresh and energetic' },
  mind: { accent: 'violet', background: 'candy', mood: 'calm and soft' },
  study: { accent: 'ocean', background: 'deepsea', mood: 'clear and focused' },
  money: { accent: 'amber', background: 'graphite', mood: 'sharp and golden' },
  work: { accent: 'sunset', background: 'ember', mood: 'bold and driven' },
  sleep: { accent: 'indigo', background: 'midnight', mood: 'dark and restful' },
};

const timeInput =
  'time-input block w-full min-w-0 max-w-full rounded-xl bg-white/5 border border-white/10 px-3 h-12 text-base text-white focus:outline-none focus:border-amber-400/60';

/** First-run setup: a few questions, then a personal week plan is built and the app opens. */
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
  const [matchedLook, setMatchedLook] = useState<string | null>(null);

  const index = STEPS.indexOf(step);
  const routine = useMemo(
    () => buildRoutine({ focusAreas: areas, wakeTime: wake, bedTime: bed, busy: hasBusy ? { start: busyStart, end: busyEnd } : null }),
    [areas, wake, bed, hasBusy, busyStart, busyEnd],
  );

  function go(next: Step) {
    setDir(STEPS.indexOf(next) > index ? 'right' : 'left');
    setStep(next);
  }

  /** Colours that match the goals picked (only until the person picks a colour themselves). */
  function matchLook() {
    const first = areas[0];
    if (!first) return;
    const look = LOOK_FOR_AREA[first];
    dispatch({ type: 'SET_APPEARANCE', appearance: { accent: look.accent, background: look.background } });
    setMatchedLook(look.mood);
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
    dispatch({
      type: 'COMPLETE_ONBOARDING',
      profile: { name: name.trim(), focusAreas: areas, wakeTime: wake, bedTime: bed },
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
                  <Feature icon="📅" title="Plan your week" text="A simple routine for every day" />
                  <Feature icon="🎯" title="Build habits" text="Daily quests, streaks and levels" />
                  <Feature icon="💰" title="Grow your money" text="Daily limits and savings goals" />
                  <Feature icon="⏳" title="Focus timer" text="Get deep work done, distraction free" />
                </ul>
              </div>
              <Primary onClick={() => go('focus')}>Let's set it up</Primary>
              <p className="text-center text-xs text-slate-500 mt-3">Takes about a minute. Everything stays on your phone.</p>
            </>
          )}

          {step === 'focus' && (
            <>
              <Title
                title={name.trim() ? `What do you want to get better at, ${name.trim()}?` : 'What do you want to get better at?'}
                sub="Pick as many as you like. Your plan is built around them."
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
                  <button
                    role="switch"
                    aria-checked={hasBusy}
                    aria-label="School or work on weekdays"
                    onClick={() => setHasBusy(!hasBusy)}
                    className={`shrink-0 w-12 h-7 rounded-full p-0.5 transition ${hasBusy ? 'bg-amber-500' : 'bg-white/15'}`}
                  >
                    <span className={`block w-6 h-6 rounded-full bg-[#fff] shadow transition-transform ${hasBusy ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
                {hasBusy && (
                  <div className="time-grid mt-4">
                    <TimeField label="Starts" value={busyStart} onChange={setBusyStart} />
                    <TimeField label="Ends" value={busyEnd} onChange={setBusyEnd} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-h-6" />
              <Primary onClick={() => go('avatar')}>Continue</Primary>
            </>
          )}

          {step === 'avatar' && (
            <>
              <Title title={name.trim() ? `Create your character, ${name.trim()}` : 'Create your character'} sub="This is you in the app. Win more clothes and faces as you level up." />
              <AvatarStep />
              <section className="mt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">App colour</p>
                {matchedLook && <p className="text-xs text-slate-400 -mt-1 mb-2.5">Picked to match your goals: {matchedLook}. Tap another if you like.</p>}
                <AccentPicker />
                <p className="text-xs text-slate-500 mt-2">More looks (light mode, backgrounds) are in Settings → Appearance.</p>
              </section>
              <div className="flex-1 min-h-6" />
              <Primary onClick={() => go('fair')}>Continue</Primary>
            </>
          )}

          {step === 'fair' && (
            <>
              <Title title="Two quick things" sub="Then your week is ready." />
              <div className="rounded-2xl border border-amber-400/30 bg-amber-500/[0.07] p-4">
                <p className="flex items-center gap-2 text-base font-bold text-white">
                  <Icon name="🏆" size={20} className="shrink-0 text-amber-300" />
                  Play fair
                </p>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  Only tick a quest when you really did it. Nobody checks, because the only person you'd fool is you. Your
                  streak, level and badges mean the most when they're honest, and that's what actually changes your life.
                </p>
              </div>
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-base font-bold text-white">
                      <Icon name="🔔" size={18} className="shrink-0 text-amber-300" />
                      Reminders
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      One or two a day: a morning boost and an evening check. A few more on days you forget to open the app, so
                      your streak survives.
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={remind}
                    aria-label="Reminders"
                    onClick={() => setRemind(!remind)}
                    className={`shrink-0 w-12 h-7 rounded-full p-0.5 transition ${remind ? 'bg-amber-500' : 'bg-white/15'}`}
                  >
                    <span className={`block w-6 h-6 rounded-full bg-[#fff] shadow transition-transform ${remind ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
                {remind && <p className="text-xs text-slate-500 mt-2">Your phone will ask once if Squzo may send notifications. Tap Allow.</p>}
              </div>
              <div className="flex-1 min-h-6" />
              <Primary onClick={() => go('preview')}>I'll play fair, build my week</Primary>
            </>
          )}

          {step === 'preview' && (
            <>
              <Title title="Here's your Monday" sub="Every day of the week is planned like this. Tap anything later to change it." />
              <ul className="rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/[0.06] rows-stagger">
                {routine.mon.map((i) => (
                  <li key={i.time + i.text} className="flex items-center gap-3 px-4 py-2.5">
                    <span className={`w-1 self-stretch rounded-full ${planCategory(i.category)?.bar ?? 'bg-slate-600'}`} />
                    <span className="w-[4.5rem] shrink-0 text-sm font-bold tabular-nums text-amber-300">{formatPlanTime(i.time!)}</span>
                    <span className="text-[15px] text-slate-100">{i.text}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500 mt-3 text-center">Weekends get a later start, free time and a Sunday review.</p>
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

const CREATOR_SLOTS: Array<{ id: AvatarSlot; label: string }> = [
  { id: 'skin', label: 'Skin' },
  { id: 'expression', label: 'Face' },
  { id: 'hair', label: 'Hair' },
  { id: 'hairColor', label: 'Hair colour' },
  { id: 'outfit', label: 'Outfit' },
  { id: 'backdrop', label: 'Scene' },
];

function AvatarStep() {
  const { state, stats, dispatch } = useApp();
  const [slot, setSlot] = useState<AvatarSlot>('skin');
  const look = normalizeLook(state.character);
  const ctx = ownership(state, stats);
  const owned = (s: AvatarSlot) => AVATAR_ITEMS.filter((i) => i.slot === s && isOwned(i, ctx));
  // A couple of locked items per row, so it's clear there's more to win later.
  const teasers = AVATAR_ITEMS.filter((i) => i.slot === slot && !isOwned(i, ctx) && i.unlock.kind !== 'box').slice(0, 3);

  function shuffle() {
    for (const s of CREATOR_SLOTS) {
      const list = owned(s.id);
      if (list.length) dispatch({ type: 'EQUIP_COSMETIC', slot: s.id, itemId: list[Math.floor(Math.random() * list.length)].id });
    }
  }

  return (
    <div>
      <div className="relative flex justify-center">
        <div key={JSON.stringify(look)} className="animate-pop-in">
          <Avatar look={look} size={170} />
        </div>
        <button
          onClick={shuffle}
          aria-label="Shuffle"
          className="absolute right-0 bottom-2 w-12 h-12 rounded-full bg-white/5 border border-white/10 text-amber-300 flex items-center justify-center hover:bg-white/10 active:rotate-180 transition-transform duration-300"
        >
          <Icon name="🎲" size={22} />
        </button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-5 px-5 mt-4" role="tablist" aria-label="Part">
        {CREATOR_SLOTS.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={slot === s.id}
            onClick={() => setSlot(s.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold border transition ${
              slot === s.id ? 'bg-amber-500 border-amber-500 text-white' : 'border-white/10 text-slate-400'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div key={slot} className="grid grid-cols-4 gap-2 mt-3 animate-view-in" role="radiogroup" aria-label={CREATOR_SLOTS.find((s) => s.id === slot)?.label}>
        {owned(slot).map((item) => {
          const on = look[slot] === item.id;
          return (
            <button
              key={item.id}
              role="radio"
              aria-checked={on}
              aria-label={item.name}
              onClick={() => dispatch({ type: 'EQUIP_COSMETIC', slot, itemId: item.id })}
              className={`relative rounded-2xl border-2 p-1 transition ${on ? 'border-amber-400 bg-amber-500/10 scale-[1.03]' : 'border-white/10'}`}
            >
              <Avatar look={{ ...look, [slot]: item.id }} size={64} className="mx-auto" />
              {on && (
                <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                  <Icon name="✓" size={12} strokeWidth={3} className="animate-check" />
                </span>
              )}
            </button>
          );
        })}
        {teasers.map((item) => (
          <div key={item.id} className="relative rounded-2xl border-2 border-dashed border-white/10 p-1 opacity-60" title={`${RARITY[item.rarity].label}: unlock it later`}>
            <Avatar look={{ ...look, [slot]: item.id }} size={64} className="mx-auto saturate-50" />
            <span className="absolute inset-0 flex items-end justify-center pb-1">
              <span className="rounded-full bg-black/60 text-[#fff] px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-0.5">
                <Icon name="🔒" size={9} />
                Later
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
