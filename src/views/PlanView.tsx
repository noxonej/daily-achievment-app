import { useEffect, useRef, useState } from 'react';
import { InfoTip } from '../components/Guide';
import { t, useSimple } from '../lib/prefs';
import { useApp } from '../store/AppContext';
import type { PlanCategory, PlanItem, WeekdayId } from '../lib/types';
import {
  PLAN_CATEGORIES,
  STARTER_ROUTINE,
  WEEKDAYS,
  checkedPlanIds,
  dateOfWeekday,
  formatEventDate,
  formatPlanTime,
  planCategory,
  planItemsForDay,
  todayWeekday,
  upcomingEvents,
  weekdayLabel,
  weekdayOfDate,
  weekdayShort,
} from '../lib/weekPlan';
import { addDaysToKey, parseKey, todayKey } from '../lib/date';
import { locale } from '../lib/locale';
import {
  countTimedItems,
  downloadPlanIcs,
  loadLiveRemindersEnabled,
  notificationsSupported,
  saveLiveRemindersEnabled,
} from '../lib/planReminders';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Icon } from '../components/Icon';

type Mode = 'day' | 'week';

const inputClass =
  'rounded-xl bg-white/5 border border-white/10 px-3 h-11 text-[15px] text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60 focus:bg-white/[0.07] transition';

export function PlanView() {
  const { state } = useApp();
  const today = todayWeekday();
  const [day, setDay] = useState<WeekdayId>(today);
  const [mode, setMode] = useState<Mode>('day');
  const checked = checkedPlanIds(state);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [starterOpen, setStarterOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const emptyDays = WEEKDAYS.filter((w) => (state.weekPlan?.days?.[w.id]?.length ?? 0) === 0);
  const weekIsEmpty = emptyDays.length === WEEKDAYS.length;

  function openDay(d: WeekdayId) {
    setDay(d);
    setMode('day');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className={`mx-auto px-4 py-4 space-y-4 stagger ${mode === 'week' ? 'max-w-6xl' : 'max-w-2xl'}`}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-slate-400 text-sm">Your routine</p>
          <h1 className="font-display text-2xl font-bold text-white mt-0.5 flex items-center gap-1">
            {t('plan.title')}
            <InfoTip title="Your week, Monday to Sunday" text="Add what you do each day, like 7:00 Wake up. It repeats every week, and you tick things off as you do them. For a one-time thing, like the dentist, choose Only once: it disappears after that day." />
          </h1>
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
              {m === 'day' ? t('plan.day') : t('plan.week')}
            </button>
          ))}
        </div>
      </div>

      {weekIsEmpty ? (
        <button
          onClick={() => setStarterOpen(true)}
          className="w-full flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/[0.06] px-4 py-3.5 text-left hover:border-amber-400/60 transition"
        >
          <span className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center"><Icon name="✨" size={20} /></span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold text-white">Start with a ready-made routine</span>
            <span className="block text-xs text-slate-400">Fills your week with a sample plan you can change however you like</span>
          </span>
          <span className="text-amber-300 font-bold">→</span>
        </button>
      ) : (
        <div className="flex flex-wrap gap-2">
          <ToolbarButton onClick={() => setEventOpen(true)}><Icon name="📆" size="1.15em" className="icon-inline" />One-time event</ToolbarButton>
          <ToolbarButton onClick={() => setRemindersOpen(true)}><Icon name="🔔" size="1.15em" className="icon-inline" />Reminders</ToolbarButton>
          {emptyDays.length > 0 && <ToolbarButton onClick={() => setStarterOpen(true)}><Icon name="✨" size="1.15em" className="icon-inline" />Fill empty days</ToolbarButton>}
          <CategoryLegend />
        </div>
      )}

      {mode === 'day' ? (
        <>
          <DayPicker selected={day} today={today} onSelect={setDay} />
          <DayPanel key={day} day={day} isToday={day === today} checked={checked} />
        </>
      ) : (
        <WeekOverview today={today} checked={checked} onOpenDay={openDay} />
      )}

      <UpcomingCard onAdd={() => setEventOpen(true)} onOpenDay={openDay} />
      <EventModal open={eventOpen} onClose={() => setEventOpen(false)} defaultDate={dateOfWeekday(day) >= todayKey() ? dateOfWeekday(day) : todayKey()} />

      <RemindersModal open={remindersOpen} onClose={() => setRemindersOpen(false)} />
      <StarterModal open={starterOpen} emptyDays={emptyDays.map((w) => w.id)} onClose={() => setStarterOpen(false)} />
    </div>
  );
}

function ToolbarButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-semibold text-slate-200 px-3 py-2 transition"
    >
      {children}
    </button>
  );
}

function CategoryLegend() {
  return (
    <div className="hidden sm:flex items-center gap-3 ml-auto text-xs text-slate-400">
      {PLAN_CATEGORIES.map((c) => (
        <span key={c.id} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${c.dot}`} />
          {c.label}
        </span>
      ))}
    </div>
  );
}

function CategoryPicker({ value, onChange }: { value?: PlanCategory; onChange: (c?: PlanCategory) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Category">
      {PLAN_CATEGORIES.map((c) => {
        const on = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(on ? undefined : c.id)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
              on ? c.chip : 'border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/25'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

function StarterModal({ open, emptyDays, onClose }: { open: boolean; emptyDays: WeekdayId[]; onClose: () => void }) {
  const { dispatch } = useApp();
  const all = emptyDays.length === WEEKDAYS.length;
  return (
    <Modal open={open} onClose={onClose} title="Starter routine">
      <p className="text-sm text-slate-300 mb-3">
        {all
          ? 'A balanced week to start from: early mornings, meditation, reading, a daily hour on a skill, workouts, a Saturday side project, and a Sunday review.'
          : `This fills only your empty days (${emptyDays.map(weekdayLabel).join(', ')}). Days you've already planned stay exactly as they are.`}
      </p>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 mb-5 space-y-1.5 max-h-56 overflow-y-auto">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Monday–Friday sample</p>
        {STARTER_ROUTINE.mon.map((i) => (
          <div key={i.text} className="flex items-center gap-2.5 text-sm">
            <span className={`w-2 h-2 rounded-full shrink-0 ${planCategory(i.category)?.dot ?? 'bg-slate-600'}`} />
            <span className="w-16 shrink-0 text-xs font-bold tabular-nums text-amber-300">{formatPlanTime(i.time!)}</span>
            <span className="text-slate-200">{i.text}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 mb-4">You can edit, delete, or add to anything afterwards. It's just a starting point.</p>
      <button
        onClick={() => {
          dispatch({ type: 'PLAN_LOAD_STARTER', days: STARTER_ROUTINE });
          onClose();
        }}
        className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold py-3 transition active:scale-[0.98]"
      >
        {all ? 'Use this routine' : `Fill ${emptyDays.length} empty ${emptyDays.length === 1 ? 'day' : 'days'}`}
      </button>
    </Modal>
  );
}

function RemindersModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useApp();
  const [before, setBefore] = useState(5);
  const [live, setLive] = useState(loadLiveRemindersEnabled);
  const [permission, setPermission] = useState(() => (notificationsSupported() ? Notification.permission : 'unsupported'));
  const timed = countTimedItems(state);

  async function toggleLive() {
    const next = !live;
    if (next && notificationsSupported() && Notification.permission === 'default') {
      try {
        setPermission(await Notification.requestPermission());
      } catch {
        // permission prompt unavailable; the in-app banner still works
      }
    }
    setLive(next);
    saveLiveRemindersEnabled(next);
  }

  return (
    <Modal open={open} onClose={onClose} title="Reminders">
      <div className="space-y-5">
        <section>
          <p className="text-sm font-bold text-white">Phone alarms (recommended)</p>
          <p className="text-sm text-slate-400 mt-1">
            Adds every timed item to your phone's calendar as a weekly repeating event with an alert, so your phone reminds
            you even when this app is closed.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <label htmlFor="remind-before" className="text-sm text-slate-300">
              Remind me
            </label>
            <select
              id="remind-before"
              value={before}
              onChange={(e) => setBefore(Number(e.target.value))}
              className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-amber-400/60"
            >
              <option value={0}>at the time</option>
              <option value={5}>5 min before</option>
              <option value={10}>10 min before</option>
              <option value={15}>15 min before</option>
              <option value={30}>30 min before</option>
            </select>
          </div>
          <button
            disabled={timed === 0}
            onClick={() => downloadPlanIcs(state, before)}
            className="mt-3 w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white font-bold py-3 transition active:scale-[0.98]"
          >
            {timed === 0 ? 'Add times to your items first' : `Add ${timed} reminders to my calendar`}
          </button>
          <ul className="text-xs text-slate-500 mt-2.5 space-y-1 list-disc pl-4">
            <li>iPhone: tap “Add All” when Calendar opens.</li>
            <li>Android: open the downloaded file with Google Calendar, or import it at calendar.google.com → Settings → Import.</li>
            <li>Changed your plan? Delete the old “Week Plan” events and add them again, so you don't get double alerts.</li>
          </ul>
        </section>

        <section className="border-t border-white/10 pt-5">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Alerts while the app is open</p>
              <p className="text-sm text-slate-400 mt-1">
                Pops up a reminder (and buzzes) when an item's time comes, while this app is open on your screen.
              </p>
              {live && permission === 'denied' && (
                <p className="text-xs text-amber-300 mt-1.5">
                  Notifications are blocked in your browser settings, so you'll only see the in-app pop-up.
                </p>
              )}
            </div>
            <button
              role="switch"
              aria-checked={live}
              aria-label="Alerts while the app is open"
              onClick={toggleLive}
              className={`shrink-0 mt-0.5 w-12 h-7 rounded-full p-0.5 transition ${live ? 'bg-emerald-500' : 'bg-white/15'}`}
            >
              <span className={`block w-6 h-6 rounded-full bg-[#fff] shadow transition-transform ${live ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </section>
      </div>
    </Modal>
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
        const items = planItemsForDay(state, w.id);
        const count = items.length;
        const hasEvent = items.some((i) => i.date);
        const date = parseKey(dateOfWeekday(w.id));
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
            <span className={`text-[11px] font-bold ${active ? 'text-white/85' : 'text-slate-400'}`}>{weekdayShort(w.id)}</span>
            <span className="font-display text-[17px] font-extrabold leading-tight tabular-nums">{date.getDate()}</span>
            <span className={`text-[10px] font-semibold tabular-nums ${active ? 'text-white/85' : 'text-slate-500'}`}>
              {count > 0 ? count : '–'}
            </span>
            {hasEvent && (
              <span className={`absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-rose-400'}`} aria-label="One-time event" />
            )}
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
  const { state, dispatch, undoable } = useApp();
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
            <span className="text-sm text-slate-500 font-semibold">
              {parseKey(dateOfWeekday(day)).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })}
            </span>
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
          <div className="flex justify-center mb-2 text-slate-500"><Icon name="🗓" size={30} strokeWidth={1.8} /></div>
          <p className="text-sm text-slate-300 font-semibold">Plan your {weekdayLabel(day)}</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Add a time and what you'll do — like <span className="text-slate-300">7:00 Wake up</span>, then{' '}
            <span className="text-slate-300">7:15 Meditation</span>.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.06] rows-stagger">
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
          undoable({ type: 'PLAN_CLEAR_DAY', day }, `${weekdayLabel(day)} cleared`);
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
        {done && <Icon name="✓" size={small ? 11 : 14} strokeWidth={3} className="animate-check" />}
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
    <li className="group relative flex items-center gap-3 px-4 py-2.5">
      {planCategory(item.category) && (
        <span
          className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full ${planCategory(item.category)!.bar} ${done ? 'opacity-30' : ''}`}
          aria-label={planCategory(item.category)!.label}
        />
      )}
      <Checkbox done={done} onToggle={onToggle} />
      <button onClick={onEdit} className="flex-1 min-w-0 flex items-baseline gap-3 text-left py-1" title="Tap to edit">
        <span
          className={`shrink-0 w-[4.5rem] text-sm font-bold tabular-nums ${done ? 'text-slate-600' : 'text-amber-300'}`}
        >
          {item.time ? formatPlanTime(item.time) : <span className="text-slate-600 font-medium">Any time</span>}
        </span>
        <span className="flex-1 min-w-0">
          <span className={`block text-[15px] break-words ${done ? 'text-slate-500 line-through' : 'text-slate-100'}`}>{item.text}</span>
          {(item.date || item.note) && (
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
              {item.date && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-400/30 px-1.5 py-px font-bold text-rose-300">
                  <Icon name="📆" size={11} />
                  Only once
                </span>
              )}
              {item.note && <span className="text-slate-400 break-words">{item.note}</span>}
            </span>
          )}
        </span>
      </button>
      <button
        onClick={onEdit}
        aria-label="Edit"
        className="shrink-0 w-8 h-8 -mr-1.5 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
      >
        <Icon name="✎" size={15} />
      </button>
    </li>
  );
}

function EditRow({ day, item, onDone }: { day: WeekdayId; item: PlanItem; onDone: () => void }) {
  const { dispatch, undoable } = useApp();
  const [time, setTime] = useState(item.time ?? '');
  const [text, setText] = useState(item.text);
  const [category, setCategory] = useState<PlanCategory | undefined>(item.category);
  const [date, setDate] = useState(item.date ?? '');
  const [note, setNote] = useState(item.note ?? '');

  function save() {
    if (!text.trim()) return;
    dispatch({ type: 'PLAN_UPDATE', day, itemId: item.id, text, time, category, note, date: item.date ? date || item.date : undefined });
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
        {item.date && (
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <Icon name="📆" size={15} className="text-rose-300" />
            Only on
            <input type="date" value={date} min={todayKey()} onChange={(e) => setDate(e.target.value)} className={`${inputClass} flex-1 min-w-0`} />
          </label>
        )}
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional), e.g. address or what to bring" aria-label="Note" maxLength={120} className={`${inputClass} w-full`} />
        <CategoryPicker value={category} onChange={setCategory} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              undoable({ type: 'PLAN_DELETE', day, itemId: item.id }, `${item.text} removed`);
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
  const [category, setCategory] = useState<PlanCategory | undefined>();
  const [once, setOnce] = useState(false);
  const simple = useSimple();
  const [showCat, setShowCat] = useState(false);
  const thisWeek = dateOfWeekday(day);
  const [date, setDate] = useState(() => (thisWeek >= todayKey() ? thisWeek : addDaysToKey(thisWeek, 7)));
  const textRef = useRef<HTMLInputElement>(null);

  function add() {
    if (!text.trim()) return;
    dispatch({ type: 'PLAN_ADD', day, text, time, category, date: once ? date : undefined });
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
      className="p-3 border-t border-white/[0.06] bg-black/10 rounded-b-2xl space-y-2.5"
    >
      <div className="flex gap-2">
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
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="grid grid-cols-2 rounded-lg bg-white/5 border border-white/10 p-0.5 text-xs font-bold" role="radiogroup" aria-label="Repeat">
          {([false, true] as const).map((v) => (
            <button
              key={String(v)}
              type="button"
              role="radio"
              aria-checked={once === v}
              onClick={() => setOnce(v)}
              className={`flex items-center justify-center gap-1 rounded-md px-2.5 py-1.5 transition ${once === v ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Icon name={v ? '📆' : '🔁'} size={13} />
              {v ? 'Only once' : 'Every week'}
            </button>
          ))}
        </div>
        {simple && !showCat && (
          <button type="button" onClick={() => setShowCat(true)} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200">
            + Colour
          </button>
        )}
        {once && (
          <input
            type="date"
            value={date}
            min={todayKey()}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            aria-label="Date"
            className="rounded-lg bg-white/5 border border-white/10 px-2.5 h-9 text-sm text-white focus:outline-none focus:border-amber-400/60"
          />
        )}
      </div>
      {(!simple || showCat) && <CategoryPicker value={category} onChange={setCategory} />}
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
                {on && <Icon name="✓" size={13} strokeWidth={3} className="animate-check" />}
              </span>
              {weekdayLabel(w.id)}
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
                <span className="font-display font-bold text-white">{weekdayLabel(w.id)}</span>
                {isToday && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" aria-label="Today" />}
              </span>
              <span className="text-xs font-semibold text-slate-500">Edit →</span>
            </button>
            {items.length === 0 ? (
              <button
                onClick={() => onOpenDay(w.id)}
                className="mx-3.5 mb-3.5 rounded-xl border border-dashed border-white/10 py-4 text-xs text-slate-500 hover:text-slate-300 hover:border-white/25 transition"
              >
                + {weekdayShort(w.id)}
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
                        {planCategory(item.category) && (
                          <span
                            className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle ${planCategory(item.category)!.dot}`}
                          />
                        )}
                        {item.text}
                        {item.date && <Icon name="📆" size={12} className="inline ml-1 -mt-0.5 text-rose-300" aria-label="Only once" />}
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

/** One-time things coming up (dentist, exams, birthdays): they vanish after their day. */
function UpcomingCard({ onAdd, onOpenDay }: { onAdd: () => void; onOpenDay: (d: WeekdayId) => void }) {
  const { state, undoable } = useApp();
  const events = upcomingEvents(state);
  const today = todayKey();
  const weekEnd = dateOfWeekday('sun');

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
        <div>
          <p className="text-sm font-bold text-white">
            <Icon name="📆" size="1.1em" className="icon-inline text-rose-300" />
            Coming up
          </p>
        </div>
        <button onClick={onAdd} className="shrink-0 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-slate-200 px-2.5 py-1.5">
          + Add
        </button>
      </div>
      {events.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-slate-400">
          Nothing yet. Add things like <span className="text-slate-200">Dentist, Thu 15:30</span> or a test at school.
        </p>
      ) : (
        <ul className="px-2 pb-2">
          {events.map((e) => {
            const d = parseKey(e.date!);
            const soon = e.date! <= weekEnd;
            return (
              <li key={e.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.03]">
                <button
                  onClick={() => soon && onOpenDay(weekdayOfDate(e.date!))}
                  className="flex-1 min-w-0 flex items-center gap-3 text-left"
                  disabled={!soon}
                >
                  <span className={`w-11 shrink-0 rounded-xl border text-center py-1 ${e.date === today ? 'border-amber-400/60 bg-amber-500/10' : 'border-white/10 bg-white/[0.03]'}`}>
                    <span className="block text-[10px] font-bold uppercase text-slate-500">{d.toLocaleDateString(locale(), { month: 'short' })}</span>
                    <span className="block font-display text-lg font-extrabold text-white leading-none pb-0.5">{d.getDate()}</span>
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-semibold text-slate-100 truncate">{e.text}</span>
                    <span className="block text-xs text-slate-400 truncate">
                      {formatEventDate(e.date!)}
                      {e.time ? ` · ${formatPlanTime(e.time)}` : ''}
                      {e.note ? ` · ${e.note}` : ''}
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => undoable({ type: 'PLAN_DELETE', day: weekdayOfDate(e.date!), itemId: e.id }, `${e.text} removed`)}
                  aria-label={`Remove ${e.text}`}
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Icon name="🗑" size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const EVENT_IDEAS = ['Dentist', 'Doctor', 'Haircut', 'Test at school', 'Birthday party', 'Job interview', 'Driving lesson', 'Pay a bill'];

function EventModal({ open, onClose, defaultDate }: { open: boolean; onClose: () => void; defaultDate: string }) {
  const { dispatch } = useApp();
  const [text, setText] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<PlanCategory | undefined>('personal');

  useEffect(() => {
    if (!open) return;
    setText('');
    setDate(defaultDate);
    setTime('');
    setNote('');
    setCategory('personal');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function save() {
    if (!text.trim() || !date) return;
    dispatch({ type: 'PLAN_ADD', day: weekdayOfDate(date), text, time, category, date, note });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="One-time event">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="space-y-3"
      >
        <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="What is it?" aria-label="What" maxLength={80} className={`${inputClass} w-full`} />
        <div className="flex flex-wrap gap-1.5">
          {EVENT_IDEAS.map((idea) => (
            <button key={idea} type="button" onClick={() => setText(idea)} className="rounded-full bg-white/5 border border-white/10 hover:border-white/25 px-2.5 py-1 text-xs font-semibold text-slate-300">
              {idea}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">Date</span>
            <input type="date" value={date} min={todayKey()} onChange={(e) => e.target.value && setDate(e.target.value)} className={`${inputClass} w-full mt-1`} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">Time (optional)</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${inputClass} w-full mt-1`} />
          </label>
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional): address, what to bring…" aria-label="Note" maxLength={120} className={`${inputClass} w-full`} />
        <CategoryPicker value={category} onChange={setCategory} />
        <button type="submit" disabled={!text.trim()} className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white font-bold py-3">
          Add for {formatEventDate(date)}
        </button>
      </form>
    </Modal>
  );
}
