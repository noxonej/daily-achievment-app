import { useEffect, useState } from 'react';
import { useApp } from '../../store/AppContext';
import { fullPrefs } from '../../lib/prefs';
import { loadQuotes, poolFor, quoteOfDay, randomQuote, type DailyKind, type Quote } from '../../lib/quotes';
import { Icon } from '../Icon';

const KINDS: Array<{ id: DailyKind; label: string }> = [
  { id: 'quotes', label: 'Show' },
  { id: 'off', label: 'Hide' },
];

/**
 * "Daily boost": one quote for today (now and then a famous Bible verse), the same all day.
 * Don't like it? Tap "Skip" to go to a different one. The 1,000+ lines download only when this card first shows.
 */
export function DailyBoost() {
  const { state, dispatch } = useApp();
  const kind = fullPrefs(state.prefs).daily;
  const [all, setAll] = useState<Awaited<ReturnType<typeof loadQuotes>> | null>(null);
  const [extra, setExtra] = useState<Quote | null>(null);
  const [anim, setAnim] = useState(0);
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (kind === 'off') return;
    let alive = true;
    loadQuotes().then((q) => alive && setAll(q)).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [kind]);

  useEffect(() => setExtra(null), [kind]);

  if (kind === 'off') return null;
  const pool = all ? poolFor(all, kind) : [];
  const q = extra ?? quoteOfDay(pool);

  async function share() {
    if (!q) return;
    const text = `“${q.text}” — ${q.by}`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // cancelled
    }
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.09] via-white/[0.02] to-transparent p-4" aria-label="Daily boost">
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-300 flex items-center justify-center">
          <Icon name={q?.kind === 'verse' ? '✝' : '💬'} size={15} />
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-amber-200/90 flex-1">Daily boost</span>
        <button
          onClick={() => setMenu((m) => !m)}
          aria-expanded={menu}
          aria-label="Choose what to show"
          className="h-8 px-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 flex items-center gap-1 text-xs font-semibold"
        >
          Options
          <Icon name="▾" size={12} />
        </button>
      </div>

      {menu && (
        <div className="mt-3 grid grid-cols-2 gap-1.5 fade-up">
          {KINDS.map((k) => (
            <button
              key={k.id}
              onClick={() => {
                dispatch({ type: 'SET_PREFS', prefs: { daily: k.id } });
                setMenu(false);
              }}
              className={`rounded-lg py-2 text-[11px] font-semibold border ${
                k.id !== 'off' ? 'bg-amber-500/20 border-amber-400 text-amber-100' : 'bg-white/5 border-white/10 text-slate-300'
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-[76px] mt-3">
        {q ? (
          <figure key={anim} className="fade-up">
            <blockquote className="font-display text-[17px] leading-snug font-semibold text-white">“{q.text}”</blockquote>
            <figcaption className="mt-1.5 text-sm text-amber-200/80">— {q.by}</figcaption>
          </figure>
        ) : (
          <div className="space-y-2 animate-pulse" aria-hidden="true">
            <div className="h-4 rounded bg-white/10 w-11/12" />
            <div className="h-4 rounded bg-white/10 w-8/12" />
            <div className="h-3 rounded bg-white/5 w-4/12 mt-3" />
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          disabled={!q}
          onClick={() => {
            setExtra(randomQuote(pool, q));
            setAnim((a) => a + 1);
          }}
          className="flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200"
        >
          <Icon name="⏭" size={13} />
          Skip
        </button>
        <button
          disabled={!q}
          onClick={share}
          className="flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200"
        >
          <Icon name={copied ? '✓' : '📤'} size={13} />
          {copied ? 'Copied' : 'Share'}
        </button>
      </div>
    </section>
  );
}
