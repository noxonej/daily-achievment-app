import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store/AppContext';
import type { PlanItem, WeekdayId } from '../lib/types';
import { WEEKDAYS, checkedPlanIds, formatPlanTime, planItemsForDay, todayWeekday, weekdayLabel } from '../lib/weekPlan';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';

type Mode = 'day' | 'week';

const inputClass =
  'rounded-xl bg-white/5 border border-white/10 px-3 h-11 text-[15px] text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60 focus:bg-white/[0.07] transition';

export function PlanView() {
  const { state } = useApp();
  const today = todayWeekday();
  const [day, setDay] = useState<WeekdayId>(today);
  const [mode, setMode] = useState<Mode>('day');
  const checked = checkedPlanIds(state);

  function openDay(d: WeekdayId) {
    setDay(d);
    setMode('day');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className={`mx-auto px-4 py-4 space-y-4 ${mode === 'week' ? 'max-w-6xl' : 'max-w-2xl'}`}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-slate-400 text-sm">Your routine</p>
          <h1 className="font-display text-2xl font-bold text-white mt-0.5">Week Plan</h1>
        </div>
        <div className="shrink-0 grid grid-cols-2 rounded-xl bg-white/5 border border-white/10 p-1 text-sm font-semibold">
          {(['day', 'week'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                mode === m ? 'bg-amber-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {m === 'day' ? 'Day' : 'Week'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'day' ? (
        <>
          <DayPicker selected={day} today={today} onSelect={setDay} />
          <DayPanel key={day} day={day} isToday={day === today} checked={checked} />
        </>
      ) : (
        <WeekOverview today={today} checked={checked} onOpenDay={openDay} />
      )}
    </div>
  );
}

function DayPicker({
  selected,
  today,
  onSelect,
}: {
  selected: WeekdayId;
  today: WeekdayId;
  onSelect: (d: WeekdayId) => void;
}) {
  const { state } = useApp();
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {WEEKDAYS.map((w) => {
        const count = state.weekPlan?.days?.[w.id]?.length ?? 0;
        const active = w.id === selected;
        return (
          <button
            key={w.id}
            onClick={() => onSelect(w.id)}
            aria-pressed={active}
            className={`relative flex flex-col items-center justify-center rounded-xl border py-2 transition ${
              active
                ? 'bg-amber-500 border-amber-400 text-white shadow-[0_4px_16px_-4px_rgba(245,158,11,0.6)]'
                : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/25'
            }`}
          >
            <span className="text-[13px] font-bold">{w.short}</span>
            <span className={`text-[10px] font-semibold tabular-nums ${active ? 'text-amber-100' : 'text-slate-500'}`}>
              {count > 0 ? count : '–'}
            </span>
            {w.id === today && (
              <span
                className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-amber-400'}`}
                aria-label="Today"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function DayPanel({ day, isToday, checked }: { day: WeekdayId; isToday: boolean; checked: Set<string> }) {
  const { state, dispatch } = useApp();
  const items = planItemsForDay(state, day);
  const doneCount = items.filter((i) => checked.has(i.id)).length;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copyOpen, setCopyOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-bold text-white">{weekdayLabel(day)}</h2>
            {isToday && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5">
                Today
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {items.length === 0
              ? 'Nothing planned yet'
              : `${items.length} ${items.length === 1 ? 'item' : 'items'} · ${doneCount} done this week`}
          </p>
        </div>
        {items.length > 0 && (
          <div className="flex shrink-0 gap-1.5">
            <button
              onClick={() => setCopyOpen(true)}
              className="rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-slate-200 px-2.5 py-1.5 transition"
            >
              Copy to…
            </button>
            <button
              onClick={() => setClearOpen(true)}
              className="rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/15 hover:border-red-500/30 text-xs font-semibold text-slate-400 hover:text-red-300 px-2.5 py-1.5 transition"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-3xl mb-2">🗓️</p>
          <p className="text-sm text-slate-300 font-semibold">Plan your {weekdayLabel(day)}</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Add a time and what you'll do — like <span className="text-slate-300">7:00 Wake up</span>, then{' '}
            <span className="text-slate-300">7:15 Meditation</span>.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {items.map((item) =>
            editingId === item.id ? (
              <EditRow key={item.id} day={day} item={item} onDone={() => setEditingId(null)} />
            ) : (
              <ItemRow
                key={item.id}
                item={item}
                done={checked.has(item.id)}
                onToggle={() => dispatch({ type: 'PLAN_TOGGLE', itemId: item.id })}
                onEdit={() => setEditingId(item.id)}
              />
            ),
          )}
        </ul>
      )}

      <AddRow day={day} />

      <CopyDayModal open={copyOpen} from={day} onClose={() => setCopyOpen(false)} />
      <ConfirmDialog
        open={clearOpen}
        title={`Clear ${weekdayLabel(day)}?`}
        message={`This removes all ${items.length} items from ${weekdayLabel(day)}. Other days stay as they are.`}
        confirmLabel="Clear day"
        danger
        onCancel={() => setClearOpen(false)}
        onConfirm={() => {
          dispatch({ type: 'PLAN_CLEAR_DAY', day });
          setClearOpen(false);
        }}
      />
    </div>
  );
}

function Checkbox({ done, onToggle, small }: { done: boolean; onToggle: () => void; small?: boolean }) {
  return (
    <button
      onClick={onToggle}
      aria-label={done ? 'Mark as not done' : 'Mark as done'}
      aria-pressed={done}
      className={`shrink-0 flex items-center justify-center ${small ? 'w-7 h-7 -m-1' : 'w-10 h-10 -m-2'}`}
    >
      <span
        className={`flex items-center justify-center rounded-md border transition ${small ? 'w-4 h-4 text-[10px]' : 'w-[22px] h-[22px] text-xs'} ${
          done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/25 hover:border-white/50'
        }`}
      >
        {done && '✓'}
      </span>
    </button>
  );
}

function ItemRow({
  item,
  done,
  onToggle,
  onEdit,
}: {
  item: PlanItem;
  done: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  return (
    <li className="group flex items-center gap-3 px-4 py-2.5">
      <Checkbox done={done} onToggle={onToggle} />
      <button onClick={onEdit} className="flex-1 min-w-0 flex items-baseline gap-3 text-left py-1" title="Tap to edit">
        <span
          className={`shrink-0 w-[4.5rem] text-sm font-bold tabular-nums ${done ? 'text-slate-600' : 'text-amber-300'}`}
        >
          {item.time ? formatPlanTime(item.time) : <span className="text-slate-600 font-medium">Any time</span>}
        </span>
        <span
          className={`flex-1 min-w-0 text-[15px] break-words ${done ? 'text-slate-500 line-through' : 'text-slate-100'}`}
        >
          {item.text}
        </span>
      </button>
      <button
        onClick={onEdit}
        aria-label="Edit"
        className="shrink-0 w-8 h-8 -mr-1.5 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
      >
        ✎
      </button>
    </li>
  );
}

function EditRow({ day, item, onDone }: { day: WeekdayId; item: PlanItem; onDone: () => void }) {
  const { dispatch } = useApp();
  const [time, setTime] = useState(item.time ?? '');
  const [text, setText] = useState(item.text);

  function save() {
    if (!text.trim()) return;
    dispatch({ type: 'PLAN_UPDATE', day, itemId: item.id, text, time });
    onDone();
  }

  return (
    <li className="px-4 py-3 bg-amber-500/[0.04]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onDone();
        }}
        className="space-y-2.5"
      >
        <div className="flex gap-2">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-label="Time"
            className={`${inputClass} w-[7.5rem] shrink-0`}
          />
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="What"
            className={`${inputClass} flex-1 min-w-0`}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              dispatch({ type: 'PLAN_DELETE', day, itemId: item.id });
              onDone();
            }}
            className="rounded-lg text-sm font-semibold text-red-300 hover:bg-red-500/15 px-3 py-2 transition"
          >
            Delete
          </button>
          {time && (
            <button
              type="button"
              onClick={() => setTime('')}
              className="rounded-lg text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/10 px-3 py-2 transition"
            >
              No time
            </button>
          )}
          <span className="flex-1" />
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg text-sm font-semibold text-slate-300 hover:bg-white/10 px-3 py-2 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!text.trim()}
            className="rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white text-sm font-bold px-4 py-2 transition"
          >
            Save
          </button>
        </div>
      </form>
    </li>
  );
}

/** Suggest a time 15 minutes after the latest timed item, so building a routine is quick. */
function suggestNextTime(items: PlanItem[]): string {
  const last = [...items].reverse().find((i) => i.time)?.time;
  if (!last) return '';
  const [h, m] = last.split(':').map(Number);
  const total = Math.min(h * 60 + m + 15, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function AddRow({ day }: { day: WeekdayId }) {
  const { state, dispatch } = useApp();
  const items = planItemsForDay(state, day);
  const [time, setTime] = useState(() => suggestNextTime(items));
  const [text, setText] = useState('');
  const textRef = useRef<HTMLInputElement>(null);

  function add() {
    if (!text.trim()) return;
    dispatch({ type: 'PLAN_ADD', day, text, time });
    setText('');
    // Next suggestion builds on what was just added.
    if (time) setTime(suggestNextTime([...items, { id: '', text, time }].sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))));
    textRef.current?.focus();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        add();
      }}
      className="flex gap-2 p-3 border-t border-white/[0.06] bg-black/10 rounded-b-2xl"
    >
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        aria-label="Time (optional)"
        className={`${inputClass} w-[7.5rem] shrink-0`}
      />
      <input
        ref={textRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add something…"
        aria-label="What"
        enterKeyHint="done"
        className={`${inputClass} flex-1 min-w-0`}
      />
      <button
        type="submit"
        disabled={!text.trim()}
        aria-label="Add"
        className="shrink-0 w-11 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-white/10 disabled:text-slate-500 text-white text-xl font-bold transition active:scale-95"
      >
        +
      </button>
    </form>
  );
}

function CopyDayModal({ open, from, onClose }: { open: boolean; from: WeekdayId; onClose: () => void }) {
  const { dispatch } = useApp();
  const others = WEEKDAYS.filter((w) => w.id !== from);
  const [selected, setSelected] = useState<WeekdayId[]>([]);

  useEffect(() => {
    if (open) setSelected([]);
  }, [open]);

  const weekdays: WeekdayId[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
  const presets: Array<{ label: string; days: WeekdayId[] }> = [
    { label: 'Weekdays', days: weekdays.filter((d) => d !== from) },
    { label: 'Weekend', days: (['sat', 'sun'] as WeekdayId[]).filter((d) => d !== from) },
    { label: 'Every day', days: others.map((w) => w.id) },
  ];

  function toggle(d: WeekdayId) {
    setSelected((s) => (s.includes(d) ? s.filter((x) => x !== d) : [...s, d]));
  }

  return (
    <Modal open={open} onClose={onClose} title={`Copy ${weekdayLabel(from)} to…`}>
      <p className="text-sm text-slate-400 mb-4">
        Adds {weekdayLabel(from)}'s items to the days you pick. Anything already there is kept, and exact duplicates are
        skipped.
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => setSelected(p.days)}
            className="rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-slate-200 px-3 py-1.5 transition"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-5">
        {others.map((w) => {
          const on = selected.includes(w.id);
          return (
            <button
              key={w.id}
              onClick={() => toggle(w.id)}
              aria-pressed={on}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-semibold text-left transition ${
                on ? 'bg-amber-500/15 border-amber-400/60 text-white' : 'bg-white/[0.03] border-white/10 text-slate-300'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs ${
                  on ? 'bg-amber-500 border-amber-500 text-white' : 'border-white/25'
                }`}
              >
                {on && '✓'}
              </span>
              {w.long}
            </button>
          );
        })}
      </div>
      <button
        disabled={selected.length === 0}
        onClick={() => {
          dispatch({ type: 'PLAN_COPY_DAY', from, to: selected });
          onClose();
        }}
        className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white font-bold py-3 transition active:scale-[0.98]"
      >
        {selected.length === 0 ? 'Pick at least one day' : `Copy to ${selected.length} ${selected.length === 1 ? 'day' : 'days'}`}
      </button>
    </Modal>
  );
}

function WeekOverview({
  today,
  checked,
  onOpenDay,
}: {
  today: WeekdayId;
  checked: Set<string>;
  onOpenDay: (d: WeekdayId) => void;
}) {
  const { state, dispatch } = useApp();
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {WEEKDAYS.map((w) => {
        const items = planItemsForDay(state, w.id);
        const isToday = w.id === today;
        return (
          <div
            key={w.id}
            className={`flex flex-col rounded-2xl border bg-white/[0.03] ${
              isToday ? 'border-amber-400/50 shadow-[0_0_0_1px_rgba(251,191,36,0.15)]' : 'border-white/10'
            }`}
          >
            <button
              onClick={() => onOpenDay(w.id)}
              className="flex items-center justify-between gap-2 px-3.5 pt-3 pb-2 text-left hover:bg-white/[0.03] rounded-t-2xl transition"
            >
              <span className="flex items-center gap-2">
                <span className="font-display font-bold text-white">{w.long}</span>
                {isToday && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" aria-label="Today" />}
              </span>
              <span className="text-xs font-semibold text-slate-500">Edit →</span>
            </button>
            {items.length === 0 ? (
              <button
                onClick={() => onOpenDay(w.id)}
                className="mx-3.5 mb-3.5 rounded-xl border border-dashed border-white/10 py-4 text-xs text-slate-500 hover:text-slate-300 hover:border-white/25 transition"
              >
                + Add to {w.short}
              </button>
            ) : (
              <ul className="px-3.5 pb-3 space-y-1.5">
                {items.map((item) => {
                  const done = checked.has(item.id);
                  return (
                    <li key={item.id} className="flex items-start gap-2.5 text-sm">
                      <span className="pt-0.5">
                        <Checkbox small done={done} onToggle={() => dispatch({ type: 'PLAN_TOGGLE', itemId: item.id })} />
                      </span>
                      <span className={`shrink-0 w-[3.75rem] font-bold tabular-nums text-xs pt-0.5 ${done ? 'text-slate-600' : 'text-amber-300'}`}>
                        {item.time ? formatPlanTime(item.time) : '—'}
                      </span>
                      <span className={`flex-1 min-w-0 break-words ${done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {item.text}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
