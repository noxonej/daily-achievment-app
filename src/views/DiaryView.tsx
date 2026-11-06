import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../store/AppContext';
import { todayKey, parseKey } from '../lib/date';
import { locale } from '../lib/locale';
import { t } from '../lib/prefs';
import { MOODS } from '../lib/mood';
import type { NoteEntry } from '../lib/types';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';

type Tab = 'diary' | 'notes';

function words(s: string): number {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

/** Private writing space: a diary page for every day, plus free-form notes. */
export function DiaryView() {
  const [tab, setTab] = useState<Tab>('diary');
  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <div className="flex gap-2" role="tablist">
        {(['diary', 'notes'] as const).map((id) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold border transition ${
              tab === id ? 'bg-amber-500/15 border-amber-400/60 text-amber-200' : 'border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon name={id === 'diary' ? '📕' : '🗒'} size={15} />
            {t(id === 'diary' ? 'diary.title' : 'diary.notes')}
          </button>
        ))}
      </div>
      <div key={tab} className="animate-view-in">
        {tab === 'diary' ? <Diary /> : <Notes />}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------- Diary */

function longDate(key: string) {
  return parseKey(key).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function Diary() {
  const { state } = useApp();
  const today = todayKey();
  const [date, setDate] = useState(today);
  const pages = useMemo(
    () =>
      Object.entries(state.dayLogs)
        .filter(([k, l]) => k !== date && l.freeNote?.trim())
        .sort(([a], [b]) => (a < b ? 1 : -1))
        .map(([k, l]) => ({ date: k, text: l.freeNote!.trim() })),
    [state.dayLogs, date],
  );
  const totalPages = Object.values(state.dayLogs).filter((l) => l.freeNote?.trim()).length;
  const totalWords = Object.values(state.dayLogs).reduce((n, l) => n + words(l.freeNote ?? ''), 0);

  // Group earlier pages by month.
  const months: Array<{ label: string; items: typeof pages }> = [];
  for (const p of pages) {
    const label = parseKey(p.date).toLocaleDateString(locale(), { month: 'long', year: 'numeric' });
    const last = months[months.length - 1];
    if (last?.label === label) last.items.push(p);
    else months.push({ label, items: [p] });
  }

  return (
    <div className="space-y-5">
      <DiaryPage key={date} date={date} isToday={date === today} onToday={() => setDate(today)} />

      {totalPages > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <MiniStat icon="📕" value={totalPages} label={t('diary.title')} />
          <MiniStat icon="✍" value={totalWords} label={t('diary.words', { n: '' }).replace(/[:：]/g, '').trim() || 'words'} />
        </div>
      )}

      {months.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-4">{t('diary.empty')}</p>
      ) : (
        months.map((m) => (
          <section key={m.label}>
            <p className="px-1 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 first-letter:uppercase">{m.label}</p>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/[0.06] overflow-hidden">
              {m.items.map((p) => {
                const d = parseKey(p.date);
                const mood = MOODS.find((x) => x.value === state.moods?.[p.date]);
                return (
                  <button
                    key={p.date}
                    onClick={() => {
                      setDate(p.date);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full flex gap-3 px-4 py-3 text-left hover:bg-white/[0.04]"
                  >
                    <span className="w-11 shrink-0 text-center">
                      <span className="block font-display text-xl font-extrabold text-white leading-none">{d.getDate()}</span>
                      <span className="block text-[10px] font-bold uppercase text-slate-500 mt-1">
                        {d.toLocaleDateString(locale(), { weekday: 'short' })}
                      </span>
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-slate-200 line-clamp-2 whitespace-pre-line">{p.text}</span>
                      <span className="block text-[11px] text-slate-500 mt-1">{t('diary.words', { n: words(p.text) })}</span>
                    </span>
                    {mood && <Icon name={mood.icon} size={18} className={`shrink-0 mt-0.5 ${mood.color}`} />}
                  </button>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function MiniStat({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3 flex items-center gap-3">
      <Icon name={icon} size={18} className="text-amber-300" />
      <span>
        <span className="block font-display text-lg font-extrabold text-white tabular-nums leading-none">{value}</span>
        <span className="block text-[11px] text-slate-500 mt-1 first-letter:uppercase">{label}</span>
      </span>
    </div>
  );
}

const PROMPTS = ['prompt.1', 'prompt.2', 'prompt.3', 'prompt.4'] as const;

function DiaryPage({ date, isToday, onToday }: { date: string; isToday: boolean; onToday: () => void }) {
  const { state, dispatch } = useApp();
  const stored = state.dayLogs[date]?.freeNote ?? '';
  const [text, setText] = useState(stored);
  const [saved, setSaved] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const mood = MOODS.find((x) => x.value === state.moods?.[date]);

  // Grow the page with the text.
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(220, el.scrollHeight)}px`;
  }, [text]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function save(value: string) {
    if (timer.current) clearTimeout(timer.current);
    dispatch({ type: 'SET_DIARY', date, text: value });
    setSaved(true);
  }

  function change(value: string) {
    setText(value);
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(value), 600);
  }

  function addPrompt(key: (typeof PROMPTS)[number]) {
    const q = t(key);
    const next = text.trim() ? `${text.replace(/\s+$/, '')}\n\n${q}\n` : `${q}\n`;
    change(next);
    requestAnimationFrame(() => {
      const el = area.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(next.length, next.length);
    });
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="flex items-start gap-3 px-4 pt-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">{isToday ? t('diary.today') : t('diary.title')}</p>
          <p className="font-display text-lg font-bold text-white mt-0.5 first-letter:uppercase">{longDate(date)}</p>
        </div>
        {mood && (
          <span className={`flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-xs font-semibold ${mood.color}`}>
            <Icon name={mood.icon} size={14} />
            {t(`mood.${mood.value}` as 'mood.1')}
          </span>
        )}
        {!isToday && (
          <button onClick={onToday} className="shrink-0 rounded-full bg-amber-500 text-white text-xs font-bold px-3 py-1.5">
            {t('nav.today')}
          </button>
        )}
      </div>
      <textarea
        ref={area}
        value={text}
        onChange={(e) => change(e.target.value)}
        onBlur={() => !saved && save(text)}
        placeholder={t('diary.write')}
        aria-label={longDate(date)}
        className="diary-paper block w-full resize-none bg-transparent px-4 pt-2 pb-4 text-[16px] leading-8 text-white placeholder:text-slate-500 focus:outline-none"
      />
      <div className="px-4 pb-4">
        {isToday && (
          <div className="mb-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{t('diary.prompts')}</p>
            <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 no-scrollbar">
              {PROMPTS.map((k) => (
                <button
                  key={k}
                  onClick={() => addPrompt(k)}
                  className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-amber-400/50 hover:text-white"
                >
                  {t(k)}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="tabular-nums">{t('diary.words', { n: words(text) })}</span>
          <span className="flex items-center gap-1">
            <Icon name={saved ? '✓' : '✎'} size={12} className={saved ? 'text-emerald-400' : ''} />
            <Icon name="🔒" size={11} />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------- Notes */

const NOTE_COLORS: Array<{ id: NoteEntry['color']; dot: string; bar: string }> = [
  { id: 'none', dot: 'bg-slate-500', bar: 'bg-transparent' },
  { id: 'amber', dot: 'bg-yellow-400', bar: 'bg-yellow-400' },
  { id: 'sky', dot: 'bg-sky-400', bar: 'bg-sky-400' },
  { id: 'emerald', dot: 'bg-emerald-400', bar: 'bg-emerald-400' },
  { id: 'violet', dot: 'bg-violet-400', bar: 'bg-violet-400' },
  { id: 'rose', dot: 'bg-rose-400', bar: 'bg-rose-400' },
];

function Notes() {
  const { state } = useApp();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<NoteEntry | 'new' | null>(null);
  const notes = useMemo(() => state.notes ?? [], [state.notes]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return notes
      .filter((n) => !s || n.title.toLowerCase().includes(s) || n.body.toLowerCase().includes(s))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [notes, q]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {notes.length > 0 && (
          <label className="relative flex-1">
            <Icon name="🔍" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('notes.search')}
              className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 h-11 text-[15px] text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
            />
          </label>
        )}
        <button
          onClick={() => setEditing('new')}
          className={`${notes.length ? '' : 'flex-1'} shrink-0 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm px-4 flex items-center justify-center gap-1.5`}
        >
          <Icon name="＋" size={17} />
          {t('notes.new')}
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
          <div className="flex justify-center mb-2 text-slate-500">
            <Icon name="🗒" size={30} strokeWidth={1.8} />
          </div>
          <p className="text-sm text-slate-400 px-6">{t('notes.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {list.map((n) => {
            const c = NOTE_COLORS.find((x) => x.id === n.color) ?? NOTE_COLORS[0];
            return (
              <button
                key={n.id}
                onClick={() => setEditing(n)}
                className="relative text-left rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 pt-4 min-h-[7.5rem] overflow-hidden hover:border-white/25"
              >
                <span className={`absolute inset-x-0 top-0 h-1 ${c.bar}`} />
                {n.pinned && <Icon name="📌" size={13} className="absolute top-3 right-3 text-amber-300" />}
                <span className="block text-sm font-bold text-white line-clamp-2 pr-4">{n.title || n.body.split('\n')[0] || '…'}</span>
                {n.title && n.body && <span className="block text-xs text-slate-400 mt-1 line-clamp-4 whitespace-pre-line">{n.body}</span>}
                <span className="block text-[10px] text-slate-500 mt-2">
                  {new Date(n.updatedAt).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <NoteEditor note={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function NoteEditor({ note, onClose }: { note: NoteEntry | 'new' | null; onClose: () => void }) {
  const { dispatch, undoable } = useApp();
  const existing = note && note !== 'new' ? note : null;
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [color, setColor] = useState<NoteEntry['color']>('none');
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (!note) return;
    setTitle(existing?.title ?? '');
    setBody(existing?.body ?? '');
    setColor(existing?.color ?? 'none');
    setPinned(existing?.pinned ?? false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note]);

  function close() {
    const changed = !existing || existing.title !== title || existing.body !== body || existing.color !== color || existing.pinned !== pinned;
    if (changed && (title.trim() || body.trim())) {
      dispatch({ type: 'UPSERT_NOTE', note: { ...(existing ? { id: existing.id } : {}), title: title.trim(), body, color, pinned } });
    }
    onClose();
  }

  return (
    <Modal open={!!note} onClose={close} title={existing ? existing.title || t('diary.notes') : t('notes.new')}>
      <div className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('notes.titlePh')}
          maxLength={80}
          className="w-full bg-transparent text-xl font-bold text-white placeholder:text-slate-600 focus:outline-none"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('notes.bodyPh')}
          rows={9}
          autoFocus={!existing}
          className="w-full resize-none rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-[15px] leading-relaxed text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
        />
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 flex-1" role="radiogroup" aria-label="Colour">
            {NOTE_COLORS.map((c) => (
              <button
                key={c.id}
                role="radio"
                aria-checked={color === c.id}
                aria-label={c.id}
                onClick={() => setColor(c.id)}
                className={`w-7 h-7 rounded-full ${c.dot} ${c.id === 'none' ? 'opacity-40' : ''} ${color === c.id ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''}`}
              />
            ))}
          </div>
          <button
            onClick={() => setPinned(!pinned)}
            aria-pressed={pinned}
            aria-label={pinned ? t('common.unpin') : t('common.pin')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${pinned ? 'border-amber-400/60 bg-amber-500/15 text-amber-300' : 'border-white/10 text-slate-400'}`}
          >
            <Icon name="📌" size={17} />
          </button>
          {existing && (
            <button
              onClick={() => {
                undoable({ type: 'DELETE_NOTE', noteId: existing.id }, `${existing.title || t('diary.notes')} · ${t('common.delete')}`);
                onClose();
              }}
              aria-label={t('common.delete')}
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-red-500/30 text-red-300 hover:bg-red-500/10"
            >
              <Icon name="🗑" size={17} />
            </button>
          )}
        </div>
        <button onClick={close} className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold py-3">
          {t('common.done')}
        </button>
      </div>
    </Modal>
  );
}
