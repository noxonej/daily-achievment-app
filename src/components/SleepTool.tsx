import { useEffect, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { useBackToClose } from '../lib/backstack';
import { useApp } from '../store/AppContext';
import { Icon } from './Icon';
import { Segmented } from './Segmented';
import { formatPlanTime } from '../lib/weekPlan';
import { addDaysToKey, todayKey } from '../lib/date';
import {
  AGE_BANDS,
  SLEEP_TIPS,
  bandOf,
  bedtimeForNeed,
  bedtimesFor,
  fallAsleepMin,
  formatHours,
  sleepNeed,
  sleepSummary,
  needSuggestion,
  wakeTimesFor,
  type SleepOption,
} from '../lib/sleep';
import { SOUNDS, sleepSound, useSleepSound, type SoundId } from '../lib/sleepSounds';

/* Sleep: calculator, your sleep need, sleep sounds, a sleep log and tips, in one calm night screen. */
let openTab: Tab | null = null;
const listeners = new Set<() => void>();
type Tab = 'plan' | 'sounds' | 'log' | 'tips';
export const sleepTool = {
  open(tab: Tab = 'plan') {
    openTab = tab;
    listeners.forEach((l) => l());
  },
  close() {
    openTab = null;
    listeners.forEach((l) => l());
  },
};
function useOpenTab() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => openTab,
  );
}

export function SleepOverlay() {
  const tab = useOpenTab();
  if (!tab) return null;
  return <SleepScreen initial={tab} />;
}

function SleepScreen({ initial }: { initial: Tab }) {
  const { state } = useApp();
  const [tab, setTab] = useState<Tab>(initial);
  useBackToClose(true, () => sleepTool.close());
  const need = sleepNeed(state.sleep);
  const sleeping = state.sleep?.sleepingSince;

  return (
    <div
      data-overlay
      role="dialog"
      aria-label="Sleep"
      className="theme-dark fixed inset-0 z-[75] overflow-y-auto overscroll-contain bg-[#070a1c] backdrop-in"
      style={{ '--color-amber-500': '#6366f1', '--color-amber-400': '#818cf8', '--color-amber-300': '#a5b4fc' } as CSSProperties}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(70%_40%_at_80%_0%,rgba(129,140,248,0.25),transparent_70%),radial-gradient(60%_40%_at_0%_100%,rgba(56,189,248,0.12),transparent_70%)]" />
      <Stars />
      <div className="relative max-w-lg mx-auto px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3 py-2">
          <span className="w-11 h-11 rounded-2xl bg-indigo-400/15 text-indigo-200 flex items-center justify-center">
            <Icon name="🌙" size={22} className="moon-rock" />
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl font-bold text-white">Sleep</h1>
            <p className="text-xs text-indigo-200/70">Your ideal: {formatHours(need)} a night</p>
          </div>
          <button onClick={() => sleepTool.close()} aria-label="Close" className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:bg-white/10">
            <Icon name="✕" size={20} />
          </button>
        </div>

        {sleeping ? <WakeUpCard since={sleeping} /> : null}

        <div className="mt-3">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { id: 'plan', label: 'Plan', icon: '⏰' },
              { id: 'sounds', label: 'Sounds', icon: '🎧' },
              { id: 'log', label: 'Log', icon: '📊' },
              { id: 'tips', label: 'Tips', icon: '💡' },
            ]}
          />
        </div>
        <div key={tab} className="mt-4 space-y-4 animate-view-in">
          {tab === 'plan' && <PlanTab />}
          {tab === 'sounds' && <SoundsTab />}
          {tab === 'log' && <LogTab />}
          {tab === 'tips' && <TipsTab />}
        </div>
      </div>
    </div>
  );
}

const box = 'rounded-2xl border border-white/10 bg-white/[0.04] p-4';
const chip = (on: boolean) =>
  `rounded-full px-3.5 py-2 text-sm font-bold border transition ${on ? 'bg-indigo-400/25 border-indigo-300 text-white' : 'border-white/15 text-slate-300 hover:border-white/30'}`;

function Stars() {
  // A few soft twinkling stars, fixed behind everything.
  const stars = [
    [8, 12], [22, 6], [37, 15], [55, 8], [71, 18], [86, 9], [93, 26], [14, 30], [63, 28], [44, 4],
  ];
  return (
    <div className="pointer-events-none fixed inset-0" aria-hidden="true">
      {stars.map(([x, y], i) => (
        <span key={i} className="absolute w-[3px] h-[3px] rounded-full bg-white star-twinkle" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 5) * 0.7}s` }} />
      ))}
    </div>
  );
}

/* ---------- Plan: your need + the calculator ---------- */

function PlanTab() {
  const { state, dispatch } = useApp();
  const need = sleepNeed(state.sleep);
  const fall = fallAsleepMin(state.sleep);
  const band = bandOf(state.sleep);
  const [mode, setMode] = useState<'wake' | 'now'>('wake');
  const [wake, setWake] = useState(state.profile?.wakeTime || '07:00');
  const [nowMin, setNowMin] = useState(() => new Date().getHours() * 60 + new Date().getMinutes());
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setNowMin(new Date().getHours() * 60 + new Date().getMinutes()), 30000);
    return () => clearInterval(t);
  }, []);
  const options = mode === 'wake' ? bedtimesFor(wake, need, fall) : wakeTimesFor(nowMin, need, fall);
  const best = options.find((o) => o.best)!;
  const exact = bedtimeForNeed(wake, need, fall);

  return (
    <>
      <section className={box}>
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-200/80">Your ideal sleep</p>
        <div className="mt-2 flex items-center gap-3">
          <button aria-label="Less sleep" onClick={() => dispatch({ type: 'SLEEP_SET', sleep: { needHours: need - 0.25 } })} className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xl font-bold">
            −
          </button>
          <p className="flex-1 text-center font-display text-4xl font-extrabold text-white tabular-nums">{formatHours(need)}</p>
          <button aria-label="More sleep" onClick={() => dispatch({ type: 'SLEEP_SET', sleep: { needHours: need + 0.25 } })} className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xl font-bold">
            +
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-1.5">
          Experts recommend {band.min}–{band.max} hours for ages {band.ages}.
          {state.sleep?.needHours !== undefined && state.sleep.needHours !== band.ideal && (
            <button onClick={() => dispatch({ type: 'SLEEP_SET', sleep: { needHours: band.ideal } })} className="ml-1 font-semibold text-indigo-200 underline underline-offset-2">
              Reset
            </button>
          )}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5" role="radiogroup" aria-label="Age">
          {AGE_BANDS.map((b) => (
            <button
              key={b.id}
              role="radio"
              aria-checked={band.id === b.id}
              onClick={() => dispatch({ type: 'SLEEP_SET', sleep: { band: b.id, needHours: b.ideal } })}
              className={`rounded-full px-3 py-1.5 text-xs font-bold border ${band.id === b.id ? 'bg-indigo-400/25 border-indigo-300 text-white' : 'border-white/15 text-slate-400'}`}
            >
              {b.ages}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 text-sm text-slate-300 border-t border-white/[0.06] pt-3">
          <span>Takes me about {fall} min to fall asleep</span>
          <span className="flex gap-1">
            <button aria-label="Fall asleep faster" onClick={() => dispatch({ type: 'SLEEP_SET', sleep: { fallAsleep: fall - 5 } })} className="w-8 h-8 rounded-lg bg-white/[0.06] text-white font-bold">
              −
            </button>
            <button aria-label="Fall asleep slower" onClick={() => dispatch({ type: 'SLEEP_SET', sleep: { fallAsleep: fall + 5 } })} className="w-8 h-8 rounded-lg bg-white/[0.06] text-white font-bold">
              +
            </button>
          </span>
        </div>
      </section>

      <section className={box}>
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-200/80">Sleep calculator</p>
        <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-white/[0.04] border border-white/10 p-1" role="radiogroup" aria-label="Calculator mode">
          {(
            [
              ['wake', 'I want to wake at'],
              ['now', 'I go to bed now'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} role="radio" aria-checked={mode === id} onClick={() => setMode(id)} className={`rounded-lg py-2 text-sm font-bold ${mode === id ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>
              {label}
            </button>
          ))}
        </div>
        {mode === 'wake' && (
          <input
            type="time"
            value={wake}
            onChange={(e) => e.target.value && setWake(e.target.value)}
            aria-label="Wake-up time"
            className="mt-3 block w-full rounded-xl bg-white/5 border border-white/10 px-3 h-12 text-lg font-bold text-white focus:outline-none focus:border-indigo-300/60"
          />
        )}
        <p className="text-sm text-slate-300 mt-3">{mode === 'wake' ? 'Go to bed at one of these times:' : `Lights off now (${formatPlanTime(toTime(nowMin))}): set your alarm for`}</p>
        <ul className="mt-2 space-y-2">
          {options.map((o) => (
            <OptionRow key={o.cycles} o={o} />
          ))}
        </ul>
        {mode === 'wake' && (
          <p className="text-xs text-slate-400 mt-3">
            For exactly {formatHours(need)}: in bed by <b className="text-white">{formatPlanTime(exact)}</b>. Waking at the end of a ~90-minute cycle usually feels easier
            than in the middle of one.
          </p>
        )}
        {mode === 'wake' && (
          <button
            onClick={() => {
              dispatch({ type: 'SET_PROFILE', profile: { wakeTime: wake, bedTime: best.time } });
              setSaved(true);
            }}
            className="mt-3 w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3"
          >
            {saved ? 'Saved as my sleep times ✓' : `Use ${formatPlanTime(best.time)} – ${formatPlanTime(wake)} as my sleep times`}
          </button>
        )}
      </section>

      <GoToSleepButton />
    </>
  );
}

const toTime = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

function OptionRow({ o }: { o: SleepOption }) {
  return (
    <li className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 ${o.best ? 'border-indigo-300/70 bg-indigo-400/15' : 'border-white/10 bg-white/[0.03]'}`}>
      <span className="font-display text-xl min-[400px]:text-2xl font-extrabold text-white tabular-nums w-[5.6rem] min-[400px]:w-[6.5rem] shrink-0">{formatPlanTime(o.time)}</span>
      <span className="flex-1 min-w-0 text-xs text-slate-300">
        <b className="text-slate-100">{formatHours(o.hours)}</b> · {o.cycles} cycles
      </span>
      {o.best ? (
        <span className="shrink-0 rounded-full bg-indigo-400 text-[#0b1030] text-[10px] font-black uppercase px-2 py-0.5">Best for you</span>
      ) : o.short ? (
        <span className="shrink-0 rounded-full bg-orange-400/15 text-orange-200 text-[10px] font-bold uppercase px-2 py-0.5">Short</span>
      ) : null}
    </li>
  );
}

function GoToSleepButton() {
  const { state, dispatch } = useApp();
  if (state.sleep?.sleepingSince) return null;
  return (
    <button
      onClick={() => dispatch({ type: 'SLEEP_START', at: new Date().toISOString() })}
      className="w-full rounded-2xl bg-gradient-to-b from-indigo-400 to-indigo-600 text-white font-display text-lg font-bold py-4 shadow-[0_12px_30px_-12px_rgba(129,140,248,0.8)]"
    >
      <Icon name="🌙" size="1.1em" className="icon-inline" />
      Going to sleep now
    </button>
  );
}

/* ---------- Morning: log the night ---------- */

function WakeUpCard({ since }: { since: string }) {
  const { dispatch, state } = useApp();
  const [feel, setFeel] = useState<1 | 2 | 3 | undefined>();
  const start = new Date(since);
  const hours = Math.max(0, (Date.now() - start.getTime()) / 3600000 - fallAsleepMin(state.sleep) / 60);
  const tooShort = Date.now() - start.getTime() < 30 * 60000;
  return (
    <section className="mt-2 rounded-2xl border border-indigo-300/40 bg-indigo-400/10 p-4 animate-pop-in">
      <p className="font-display text-lg font-bold text-white">{tooShort ? 'Sleep tracking is on' : 'Good morning!'}</p>
      <p className="text-sm text-slate-300 mt-0.5">
        In bed since {formatPlanTime(toTime(start.getHours() * 60 + start.getMinutes()))}
        {!tooShort && <> · about {formatHours(hours)} of sleep</>}
      </p>
      {tooShort ? (
        <p className="text-xs text-slate-400 mt-2">Put the phone away. In the morning, open Sleep and tap “I’m awake”.</p>
      ) : (
        <>
          <p className="text-sm font-semibold text-white mt-3">How do you feel?</p>
          <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="How do you feel">
            {(
              [
                [1, '😞', 'Tired'],
                [2, '😐', 'Okay'],
                [3, '😄', 'Rested'],
              ] as const
            ).map(([v, ic, label]) => (
              <button key={v} role="radio" aria-checked={feel === v} onClick={() => setFeel(v)} className={`rounded-xl border py-2 text-xs font-bold flex flex-col items-center gap-1 ${feel === v ? 'border-indigo-300 bg-indigo-400/20 text-white' : 'border-white/10 text-slate-300'}`}>
                <Icon name={ic} size={20} />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="mt-3 flex gap-2">
        {!tooShort && (
          <button onClick={() => dispatch({ type: 'SLEEP_LOG', start: since, end: new Date().toISOString(), feel })} className="flex-1 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3">
            I’m awake
          </button>
        )}
        <button onClick={() => dispatch({ type: 'SLEEP_CANCEL' })} className={`${tooShort ? 'flex-1' : ''} rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 bg-white/[0.06]`}>
          {tooShort ? 'Cancel' : 'Don’t save'}
        </button>
      </div>
    </section>
  );
}

/* ---------- Sounds ---------- */

const TIMERS: Array<number | null> = [15, 30, 60, null];

function SoundsTab() {
  const playing = useSleepSound();
  const [minutes, setMinutes] = useState<number | null>(30);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!playing?.endsAt) return;
    const t = setInterval(() => tick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, [playing?.endsAt]);
  const leftMin = playing?.endsAt ? Math.max(0, Math.ceil((playing.endsAt - Date.now()) / 60000)) : null;
  return (
    <>
      <section className={box}>
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-200/80">Sleep sounds</p>
        <p className="text-sm text-slate-300 mt-1">Steady sound covers noise from outside and gives your mind something calm to listen to.</p>
        <div className="mt-3 grid grid-cols-2 min-[400px]:grid-cols-3 gap-2">
          {SOUNDS.map((s) => {
            const on = playing?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => (on ? sleepSound.stop() : sleepSound.play(s.id as SoundId, minutes))}
                aria-pressed={on}
                className={`relative rounded-2xl border p-3 text-left transition ${on ? 'border-indigo-300 bg-indigo-400/20' : 'border-white/10 bg-white/[0.03] hover:border-white/25'}`}
              >
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${on ? 'bg-indigo-400 text-[#0b1030]' : 'bg-white/[0.06] text-indigo-200'}`}>
                  <Icon name={on ? '⏸' : s.icon} size={18} />
                </span>
                <span className="block text-sm font-bold text-white mt-2">{s.label}</span>
                <span className="block text-[11px] text-slate-400">{s.hint}</span>
                {on && <SoundBars />}
              </button>
            );
          })}
        </div>
        <p className="text-sm font-semibold text-white mt-4">Stop after</p>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Stop after">
          {TIMERS.map((m) => (
            <button key={String(m)} role="radio" aria-checked={minutes === m} onClick={() => setMinutes(m)} className={chip(minutes === m)}>
              {m ? `${m} min` : 'Never'}
            </button>
          ))}
        </div>
        {playing && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-indigo-400/10 border border-indigo-300/30 px-3.5 py-2.5">
            <span className="text-sm text-white">
              Playing {SOUNDS.find((s) => s.id === playing.id)?.label.toLowerCase()}
              {leftMin !== null && <span className="text-slate-400"> · stops in {leftMin} min</span>}
            </span>
            <button onClick={() => sleepSound.stop()} className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-bold text-white">
              Stop
            </button>
          </div>
        )}
        <p className="text-xs text-slate-500 mt-3">Keeps playing when the screen locks. Use your phone’s volume buttons, and keep it quiet.</p>
      </section>
      <GoToSleepButton />
    </>
  );
}

function SoundBars() {
  return (
    <span className="absolute top-3 right-3 flex items-end gap-[2px] h-4" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-[3px] rounded-full bg-indigo-200 sound-bar" style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
    </span>
  );
}

/* ---------- Log ---------- */

function LogTab() {
  const { state, dispatch } = useApp();
  const need = sleepNeed(state.sleep);
  const sum = sleepSummary(state);
  const tip = needSuggestion(state);
  const [adding, setAdding] = useState(false);
  const max = Math.max(need + 1, ...sum.nights.map((n) => n.hours));
  const today = todayKey();
  const byDate = new Map((state.sleep?.log ?? []).map((e) => [e.date, e]));
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDaysToKey(today, i - 6);
    return { date, entry: byDate.get(date) };
  });
  return (
    <>
      <GoToSleepButton />
      <section className={box}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-200/80">Last 7 nights</p>
          {sum.avg !== null && (
            <p className="text-xs text-slate-400">
              Average <b className="text-white">{formatHours(sum.avg)}</b> · {sum.enough}/{sum.nights.length} enough
            </p>
          )}
        </div>
        {sum.nights.length > 0 && (
          <>
            <div className="relative mt-5 h-32 grid grid-cols-7 gap-1.5 items-end">
              <div className="absolute inset-x-0 border-t border-dashed border-indigo-300/60" style={{ bottom: `${(need / max) * 100}%` }}>
                <span className="absolute right-0 -top-4 text-[10px] font-bold text-indigo-200">{formatHours(need)}</span>
              </div>
              {week.map((d) => (
                <div key={d.date} className="flex flex-col items-center justify-end h-full">
                  {d.entry ? (
                    <div
                      className={`w-full rounded-t-md bar-grow-y ${d.entry.hours >= need - 0.25 ? 'bg-indigo-400' : 'bg-orange-300/80'}`}
                      style={{ height: `${Math.max(4, (d.entry.hours / max) * 100)}%` }}
                      title={formatHours(d.entry.hours)}
                    />
                  ) : (
                    <div className="w-full h-1 rounded-full bg-white/10" />
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5 mt-1">
              {week.map((d) => (
                <span key={d.date} className={`text-center text-[10px] ${d.date === today ? 'text-indigo-200 font-bold' : 'text-slate-500'}`}>
                  {new Date(d.date + 'T12:00').toLocaleDateString(undefined, { weekday: 'narrow' })}
                </span>
              ))}
            </div>
          </>
        )}
        <p className="text-sm text-slate-300 mt-3 leading-relaxed">{sum.advice}</p>
      </section>

      {tip && (
        <section className="rounded-2xl border border-indigo-300/30 bg-indigo-500/10 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-200/80">Tip from your nights</p>
          <p className="font-bold text-white mt-1">{tip.title}</p>
          <p className="text-sm text-slate-300 mt-1 leading-relaxed">{tip.text}</p>
          <button
            onClick={() => dispatch({ type: 'SLEEP_SET', sleep: { needHours: tip.hours } })}
            className="mt-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold px-4 py-2.5"
          >
            Set my need to {formatHours(tip.hours)}
          </button>
        </section>
      )}

      {adding ? (
        <AddNight onDone={() => setAdding(false)} />
      ) : (
        <button onClick={() => setAdding(true)} className="w-full rounded-xl border border-dashed border-white/20 py-3 text-sm font-semibold text-slate-300 hover:border-indigo-300/60">
          + Add a night by hand
        </button>
      )}

      {sum.nights.length > 0 && (
        <ul className="rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/[0.06]">
          {[...sum.nights].reverse().map((n) => (
            <li key={n.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-white">{new Date(n.date + 'T12:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                <span className="block text-xs text-slate-400">
                  {formatPlanTime(isoToTime(n.start))} – {formatPlanTime(isoToTime(n.end))}
                  {n.feel && <> · {n.feel === 3 ? 'rested' : n.feel === 2 ? 'okay' : 'tired'}</>}
                </span>
              </span>
              <span className={`font-display font-bold tabular-nums ${n.hours >= need - 0.25 ? 'text-indigo-200' : 'text-orange-200'}`}>{formatHours(n.hours)}</span>
              <button onClick={() => dispatch({ type: 'SLEEP_DELETE', entryId: n.id })} aria-label="Delete night" className="p-1.5 text-slate-500 hover:text-red-300">
                <Icon name="✕" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const isoToTime = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

function AddNight({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useApp();
  const [bed, setBed] = useState(state.profile?.bedTime || '22:30');
  const [wake, setWake] = useState(state.profile?.wakeTime || '07:00');
  const [feel, setFeel] = useState<1 | 2 | 3 | undefined>();
  function save() {
    const today = todayKey();
    // Went to bed in the evening → that was yesterday; after midnight → today.
    const bedDay = bed > wake ? addDaysToKey(today, -1) : today;
    const start = new Date(`${bedDay}T${bed}`);
    const end = new Date(`${today}T${wake}`);
    dispatch({ type: 'SLEEP_LOG', start: start.toISOString(), end: end.toISOString(), feel });
    onDone();
  }
  return (
    <section className={box}>
      <p className="text-sm font-bold text-white">Last night</p>
      <div className="time-grid mt-3">
        <Labeled label="Went to bed">
          <input type="time" value={bed} onChange={(e) => e.target.value && setBed(e.target.value)} className="block w-full rounded-xl bg-white/5 border border-white/10 px-3 h-11 text-base text-white" />
        </Labeled>
        <Labeled label="Woke up">
          <input type="time" value={wake} onChange={(e) => e.target.value && setWake(e.target.value)} className="block w-full rounded-xl bg-white/5 border border-white/10 px-3 h-11 text-base text-white" />
        </Labeled>
      </div>
      <div className="mt-3 flex gap-2" role="radiogroup" aria-label="How did you feel">
        {(
          [
            [1, 'Tired'],
            [2, 'Okay'],
            [3, 'Rested'],
          ] as const
        ).map(([v, label]) => (
          <button key={v} role="radio" aria-checked={feel === v} onClick={() => setFeel(v)} className={chip(feel === v)}>
            {label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={save} className="flex-1 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3">
          Save night
        </button>
        <button onClick={onDone} className="rounded-xl px-4 text-sm font-semibold text-slate-300 bg-white/[0.06]">
          Cancel
        </button>
      </div>
    </section>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="block text-xs font-semibold text-slate-400 mb-1">{label}</span>
      {children}
    </label>
  );
}

/* ---------- Tips ---------- */

function TipsTab() {
  return (
    <ul className="space-y-2.5 stagger">
      {SLEEP_TIPS.map((t) => (
        <li key={t.title} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <span className="shrink-0 w-10 h-10 rounded-xl bg-indigo-400/15 text-indigo-200 flex items-center justify-center">
            <Icon name={t.icon} size={19} />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-bold text-white">{t.title}</span>
            <span className="block text-[13px] text-slate-300 leading-relaxed mt-0.5">{t.text}</span>
          </span>
        </li>
      ))}
      <li className="text-xs text-slate-500 px-1">These are general tips, not medical advice.</li>
    </ul>
  );
}
