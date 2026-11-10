import { useEffect, useState } from 'react';
import type { QuestMeasure } from '../lib/types';
import { useApp } from '../store/AppContext';
import { Modal } from './Modal';
import type { Quest } from '../lib/types';
import { UNIT_META } from '../lib/measure';
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL } from '../lib/xp';
import { useCompletionFx } from '../lib/useCompletionFx';
import { questReward } from '../lib/rewards';
import { runTracker } from '../lib/runTracker';
import { FloatingReward } from './FloatingReward';
import { InfoDisclosure } from './InfoDisclosure';
import { Icon } from './Icon';
import { locale } from '../lib/locale';


function fmt(n: number, decimals?: boolean) {
  return decimals ? (Math.round(n * 100) / 100).toLocaleString(locale(), { maximumFractionDigits: 2 }) : Math.round(n).toLocaleString(locale());
}

/** A quest with a number goal (steps, km, glasses of water…): log progress, it completes at the target. */
export function MeasureQuestCard({
  quest,
  value,
  completed,
  onSet,
  periodKey,
}: {
  quest: Quest;
  value: number;
  completed: boolean;
  onSet: (v: number) => void;
  periodKey: string;
}) {
  const m = quest.measure!;
  const meta = UNIT_META[m.unit];
  const { justCompleted } = useCompletionFx(completed);
  const { xp, crit } = questReward(periodKey, quest.id, quest.xp);
  const [entry, setEntry] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const size = m.size ?? 250;
  const quick = m.quick?.length ? m.quick : meta.quick;
  const litres = (n: number) => (n * size) / 1000;
  const pct = Math.min(100, (value / m.target) * 100);
  const entryNum = Number(entry.replace(/[\s,]/g, m.unit === 'km' ? '.' : ''));

  return (
    <div className={`relative rounded-xl border px-4 py-3.5 transition-colors ${completed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/[0.03] border-white/10'}`}>
      <div className="flex items-center gap-3">
        <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${completed ? 'bg-emerald-500/20' : 'bg-white/5'} ${justCompleted ? 'animate-pop-in' : ''}`}>
          {completed ? <Icon name="✅" size={20} className="text-emerald-300 animate-check" /> : <Icon name={quest.icon} size={19} className="text-slate-200" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`font-semibold text-[15px] leading-tight ${completed ? 'text-emerald-300' : 'text-white'}`}>{quest.title}</p>
          {quest.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{quest.description}</p>}
          {quest.details && (
            <div className="mt-1">
              <InfoDisclosure text={quest.details} />
            </div>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${DIFFICULTY_COLOR[quest.difficulty]}`}>{DIFFICULTY_LABEL[quest.difficulty]}</span>
          <span className="text-[11px] font-display font-bold text-amber-300">+{quest.xp} XP</span>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between gap-2 text-sm">
          {m.unit === 'glasses' ? (
            <span className="min-w-0 font-display font-bold text-white tabular-nums">
              {fmt(litres(value), true)} L<span className="text-slate-500 font-medium"> / {fmt(litres(m.target), true)} L</span>
              <span className="ml-2 text-[11px] font-sans font-semibold text-slate-500 whitespace-nowrap">
                {value}/{m.target} × {size} ml
              </span>
            </span>
          ) : (
            <span className="min-w-0 font-display font-bold text-white tabular-nums">
              {fmt(value, meta.decimals)}
              <span className="text-slate-500 font-medium"> / {fmt(m.target, meta.decimals)} {meta.label}</span>
            </span>
          )}
          <span className="shrink-0 flex items-center gap-1.5">
            <span className={`text-xs font-bold tabular-nums ${completed ? 'text-emerald-300' : 'text-slate-400'}`}>{Math.floor(pct)}%</span>
            {/* Down here, the settings button no longer squeezes the quest's name on small phones. */}
            <button onClick={() => setAdjusting(true)} aria-label={`Adjust ${quest.title}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10">
              <Icon name="⚙" size={16} />
            </button>
          </span>
        </div>
        {m.unit === 'glasses' ? (
          <div className={`mt-2 grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${Math.min(m.target, 10)}, minmax(0, 1fr))` }}>
            {Array.from({ length: m.target }, (_, i) => (
              <button
                key={i}
                onClick={() => onSet(i < value ? i : i + 1)}
                aria-label={`${i + 1} ${i ? 'glasses' : 'glass'}`}
                className={`flex-1 h-8 rounded-lg flex items-center justify-center transition ${i < value ? 'bg-sky-500/80 text-white' : 'bg-white/5 text-slate-600 border border-white/10'}`}
              >
                <Icon name="💧" size={14} fill={i < value ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        ) : (
          <div className="h-2 rounded-full bg-white/10 overflow-hidden mt-2">
            <div className={`h-full rounded-full transition-all duration-500 ${completed ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      {m.unit !== 'glasses' && (
        <div className="flex flex-wrap gap-2 mt-3">
          {m.unit === 'km' && (
            <button onClick={() => runTracker.open()} className="flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold px-3 py-2">
              <Icon name="▶" size={14} fill="currentColor" />
              Start run
            </button>
          )}
          {m.unit !== 'km' &&
            quick.map((q) => (
              <button key={q} onClick={() => onSet(value + q)} className="rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-semibold text-slate-200 px-3 py-2 tabular-nums">
                +{fmt(q)}
              </button>
            ))}
          <form
            className="flex flex-1 min-w-[9rem] gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!(entryNum >= 0)) return;
              onSet(m.unit === 'steps' ? entryNum : value + entryNum);
              setEntry('');
            }}
          >
            <input
              inputMode={meta.decimals ? 'decimal' : 'numeric'}
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder={m.unit === 'steps' ? "Today's total" : m.unit === 'km' ? 'Add km' : `Add ${meta.label}`}
              aria-label={m.unit === 'steps' ? "Today's step total" : `Add ${meta.label}`}
              className="flex-1 min-w-0 rounded-lg bg-black/20 border border-white/10 px-3 h-9 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
            />
            <button type="submit" disabled={!entry || !(entryNum >= 0)} className="shrink-0 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white text-sm font-bold px-3">
              {m.unit === 'steps' ? 'Set' : 'Add'}
            </button>
          </form>
          {value > 0 && (
            <button onClick={() => onSet(0)} aria-label="Reset" className="rounded-lg text-xs text-slate-500 hover:text-slate-300 px-2">
              Reset
            </button>
          )}
        </div>
      )}
      {justCompleted && (
        <span className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none" aria-hidden="true">
          <span className="complete-sweep" />
        </span>
      )}
      {justCompleted && <FloatingReward xp={xp} crit={crit} />}
      <AdjustMeasure open={adjusting} onClose={() => setAdjusting(false)} questId={quest.id} title={quest.title} measure={m} />
    </div>
  );
}

const SIZES: Array<{ ml: number; label: string }> = [
  { ml: 150, label: 'Small cup' },
  { ml: 200, label: 'Cup' },
  { ml: 250, label: 'Glass' },
  { ml: 330, label: 'Can' },
  { ml: 500, label: 'Bottle' },
  { ml: 750, label: 'Sport bottle' },
  { ml: 1000, label: '1 L bottle' },
];
const GOALS = [1.5, 2, 2.5, 3, 3.5];

/** Change a number quest: for water, the glass size and daily litres; for others, the goal and quick buttons. */
function AdjustMeasure({ open, onClose, questId, title, measure }: { open: boolean; onClose: () => void; questId: string; title: string; measure: QuestMeasure }) {
  const { dispatch } = useApp();
  const meta = UNIT_META[measure.unit];
  const water = measure.unit === 'glasses';
  const [size, setSize] = useState(measure.size ?? 250);
  const [goalL, setGoalL] = useState(((measure.size ?? 250) * measure.target) / 1000);
  const [target, setTarget] = useState(String(measure.target));
  const [q1, setQ1] = useState(String((measure.quick ?? meta.quick)[0] ?? ''));
  const [q2, setQ2] = useState(String((measure.quick ?? meta.quick)[1] ?? ''));

  useEffect(() => {
    if (!open) return;
    setSize(measure.size ?? 250);
    setGoalL(((measure.size ?? 250) * measure.target) / 1000);
    setTarget(String(measure.target));
    setQ1(String((measure.quick ?? meta.quick)[0] ?? ''));
    setQ2(String((measure.quick ?? meta.quick)[1] ?? ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const glasses = Math.max(1, Math.round((goalL * 1000) / size));
  const num = (v: string) => Number(v.replace(',', '.'));
  const t = num(target);
  const valid = water ? goalL > 0 : t > 0;

  function save() {
    if (!valid) return;
    if (water) dispatch({ type: 'SET_MEASURE', questId, measure: { ...measure, size, target: glasses } });
    else {
      const qs = [num(q1), num(q2)].filter((v) => v > 0);
      dispatch({ type: 'SET_MEASURE', questId, measure: { ...measure, target: meta.decimals ? t : Math.round(t), quick: qs.length ? qs : undefined } });
    }
    onClose();
  }

  const chip = (on: boolean) => `rounded-xl border px-3 py-2 text-sm font-semibold transition ${on ? 'border-amber-400 bg-amber-500/15 text-white' : 'border-white/10 text-slate-300'}`;
  return (
    <Modal open={open} onClose={onClose} title={`Adjust: ${title}`}>
      <div className="space-y-5">
        {water ? (
          <>
            <section>
              <p className="text-sm font-semibold text-slate-300 mb-2">What do you drink from?</p>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Glass size">
                {SIZES.map((g) => (
                  <button key={g.ml} role="radio" aria-checked={size === g.ml} onClick={() => setSize(g.ml)} className={chip(size === g.ml)}>
                    <span className="block">{g.label}</span>
                    <span className="block text-[11px] text-slate-400 tabular-nums">{g.ml} ml</span>
                  </button>
                ))}
              </div>
            </section>
            <section>
              <p className="text-sm font-semibold text-slate-300 mb-2">Daily goal</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Daily goal">
                {GOALS.map((g) => (
                  <button key={g} role="radio" aria-checked={goalL === g} onClick={() => setGoalL(g)} className={chip(goalL === g)}>
                    {g.toLocaleString(locale())} L
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">Most people need about 2–2.5 L a day, more when it's hot or you train.</p>
            </section>
            <p className="text-sm text-slate-300">
              That's <b className="text-white">{glasses}</b> × {size} ml a day.
            </p>
          </>
        ) : (
          <>
            <label className="block">
              <span className="text-sm font-semibold text-slate-300">Goal ({meta.label})</span>
              <input inputMode={meta.decimals ? 'decimal' : 'numeric'} value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-3 h-11 text-[15px] text-white focus:outline-none focus:border-amber-400/60" />
            </label>
            {measure.unit !== 'km' && (
              <div>
                <span className="text-sm font-semibold text-slate-300">Quick-add buttons</span>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {[
                    [q1, setQ1],
                    [q2, setQ2],
                  ].map(([v, set], i) => (
                    <input
                      key={i}
                      inputMode="decimal"
                      value={v as string}
                      onChange={(e) => (set as (x: string) => void)(e.target.value)}
                      aria-label={`Quick button ${i + 1}`}
                      placeholder="+"
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-3 h-11 text-[15px] text-white focus:outline-none focus:border-amber-400/60"
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        <button onClick={save} disabled={!valid} className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white font-bold py-3">
          Save
        </button>
      </div>
    </Modal>
  );
}
