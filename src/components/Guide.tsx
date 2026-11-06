import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useApp } from '../store/AppContext';
import { doneByHand } from '../store/reducer';
import { wardrobe } from '../lib/wardrobe';
import { settings } from '../lib/settingsNav';
import type { ViewId } from './NavTabs';
import { Icon } from './Icon';

/**
 * A small ⓘ button. The explanation only shows when it's tapped (a bubble under it); tap
 * anywhere else, or the button again, to close it.
 */
export function InfoTip({ title, text, align = 'left' }: { title: string; text: string; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);
  // Keep the bubble on screen: slide it left or right if it would stick out.
  useLayoutEffect(() => {
    if (!open || !bubble.current || !ref.current) return;
    const btn = ref.current.getBoundingClientRect();
    const w = bubble.current.offsetWidth;
    const start = align === 'right' ? btn.right - w : btn.left;
    const min = 12;
    const max = window.innerWidth - 12 - w;
    setShift(Math.min(Math.max(start, min), max) - start);
  }, [open, align]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <span ref={ref} className="relative inline-flex align-middle">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`About: ${title}`}
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${open ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500 hover:text-slate-200 hover:bg-white/10'}`}
      >
        <Icon name="ℹ" size={16} />
      </button>
      {open && (
        <span
          ref={bubble}
          style={{ transform: `translateX(${shift}px)` }}
          className={`absolute top-full mt-1.5 z-40 w-[min(17rem,calc(100vw-1.5rem))] ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          <span
            role="dialog"
            aria-label={title}
            className={`block rounded-2xl border border-white/10 bg-raised p-3.5 shadow-2xl text-left font-sans ${align === 'right' ? 'popover-in-right' : 'popover-in'}`}
          >
            <span className="block text-sm font-bold text-white">{title}</span>
            <span className="block text-[13px] font-normal leading-relaxed text-slate-300 mt-1 normal-case tracking-normal">{text}</span>
          </span>
        </span>
      )}
    </span>
  );
}

interface Step {
  id: string;
  icon: string;
  title: string;
  done: boolean;
  go?: () => void;
}

/** First-steps checklist on Today for new users. Disappears once everything is done (or when hidden). */
export function GettingStarted({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { state, dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const guide = state.guide ?? [];
  if (guide.includes('start:hidden')) return null;

  const steps: Step[] = [
    {
      id: 'quest',
      icon: '✅',
      title: 'Finish your first quest',
      done: Object.values(state.dayLogs).some((l) => doneByHand(l) > 0),
    },
    {
      id: 'plan',
      icon: '📅',
      title: 'Look at your week plan',
      done: guide.includes('visit:plan'),
      go: () => onNavigate('plan'),
    },
    {
      id: 'money',
      icon: '💰',
      title: 'Set up your money',
      done: !!state.money?.setupDone,
      go: () => onNavigate('money'),
    },
    {
      id: 'character',
      icon: '👕',
      title: 'Dress up your character',
      done: guide.includes('wardrobe'),
      go: () => wardrobe.open(),
    },
    {
      id: 'box',
      icon: '🎁',
      title: 'Open your daily box',
      done: !!state.dailyBox?.lastOpened,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;
  const next = steps.find((s) => !s.done)!;

  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="flex items-center gap-1 pr-2">
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3 text-left">
          <span className="relative shrink-0 w-9 h-9">
            <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90" aria-hidden="true">
              <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" className="text-white/10" strokeWidth="3.5" />
              <circle
                cx="18"
                cy="18"
                r={r}
                fill="none"
                stroke="var(--color-amber-400)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - doneCount / steps.length)}
                style={{ transition: 'stroke-dashoffset .7s cubic-bezier(.22,1,.36,1)' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white tabular-nums">
              {doneCount}/{steps.length}
            </span>
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold text-white">Getting started</span>
            <span className="block text-xs text-slate-400 truncate">Next: {next.title}</span>
          </span>
          <Icon name="›" size={18} className={`shrink-0 text-slate-500 transition-transform duration-300 ${open ? 'rotate-90' : ''}`} />
        </button>
        <button
          onClick={() => dispatch({ type: 'GUIDE_MARK', key: 'start:hidden' })}
          aria-label="Hide getting started"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10"
        >
          <Icon name="✕" size={15} />
        </button>
      </div>
      <div className="reveal-rows" data-open={open}>
        <div>
          <ul className="px-2 pb-2">
            {steps.map((s) => {
              const isNext = s === next;
              const Row = s.go && !s.done ? 'button' : 'div';
              return (
                <li key={s.id}>
                  <Row
                    {...(Row === 'button' ? { onClick: s.go } : {})}
                    className={`w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-left ${isNext ? 'bg-amber-500/[0.08]' : ''} ${Row === 'button' ? 'hover:bg-white/[0.05]' : ''}`}
                  >
                    <span
                      className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center border transition-colors ${
                        s.done ? 'bg-emerald-500 border-emerald-500 text-[#fff]' : isNext ? 'border-amber-400 text-amber-300' : 'border-white/15 text-slate-500'
                      }`}
                    >
                      <Icon name={s.done ? '✓' : s.icon} size={14} strokeWidth={s.done ? 3 : 2} className={s.done ? 'animate-check' : ''} />
                    </span>
                    <span className={`flex-1 min-w-0 text-sm font-semibold ${s.done ? 'text-slate-500 line-through' : 'text-white'}`}>{s.title}</span>
                    {Row === 'button' && <Icon name="›" size={18} className="shrink-0 text-slate-500" />}
                  </Row>
                </li>
              );
            })}
          </ul>
          <button onClick={() => settings.open('help')} className="w-full border-t border-white/[0.06] py-2.5 text-xs font-semibold text-amber-300 hover:bg-white/[0.03]">
            How does the app work?
          </button>
        </div>
      </div>
    </div>
  );
}
