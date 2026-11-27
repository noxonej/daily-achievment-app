import { useState } from 'react';
import type { Quest } from '../lib/types';
import { swapOptions, type Replacement } from '../lib/questSwap';
import { useApp } from '../store/AppContext';
import { Modal } from './Modal';
import { Icon } from './Icon';

/** Pick one of today's daily quests to trade for a different simple quest (today only). */
export function QuestSwapModal({
  open,
  onClose,
  candidates,
  onSwap,
  mode = 'swap',
}: {
  open: boolean;
  onClose: () => void;
  candidates: Quest[];
  onSwap: (questId: string, replacement: { title: string; description?: string; icon: string }) => void;
  /** "skip": pick a quest to skip with a Skip Pass instead of swapping it. */
  mode?: 'swap' | 'skip';
}) {
  const skip = mode === 'skip';
  const { state } = useApp();

  // Step 2 of a swap: pick one of three genuinely different quests (2026-11-27).
  const [picking, setPicking] = useState<{ quest: Quest; options: Replacement[] } | null>(null);
  const close = () => {
    setPicking(null);
    onClose();
  };
  const WHY: Record<Replacement['why'], string> = { 'same-area': 'Same area, different goal', easier: 'A bit easier', fresh: 'Something new' };

  if (picking && !skip) {
    return (
      <Modal open={open} onClose={close} title="Pick your new quest">
        <p className="text-sm text-slate-400 mb-4">
          Instead of <b className="text-slate-200">{picking.quest.title}</b>. None of these are the same goal again, and none are harder. Same XP as the original.
        </p>
        <div className="space-y-2">
          {picking.options.map((o) => (
            <button
              key={o.title}
              onClick={() => {
                onSwap(picking.quest.id, { title: o.title, description: o.description, icon: o.icon });
                setPicking(null);
              }}
              className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-left transition hover:border-sky-400/50"
            >
              <span className="shrink-0 w-9 h-9 rounded-lg bg-white/5 text-slate-200 flex items-center justify-center">
                <Icon name={o.icon} size={18} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-white">{o.title}</span>
                {o.description && <span className="block text-xs text-slate-400 leading-snug">{o.description}</span>}
                <span className="block text-[11px] font-semibold text-sky-300 mt-0.5">{WHY[o.why]}</span>
              </span>
            </button>
          ))}
        </div>
        <button onClick={() => setPicking(null)} className="mt-3 w-full text-center text-xs font-semibold text-slate-400 hover:text-white py-2">
          Back
        </button>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={close} title={skip ? 'Skip a quest' : 'Swap a quest'}>
      <p className="text-sm text-slate-400 mb-4">
        {skip
          ? "Busy or sick? Skip one of today's quests. It counts as done for your streak and perfect day, but gives no XP. Save it for days you really need it."
          : "Not feeling one of today's quests? Trade it for a different one. It's back to normal tomorrow, and finishing the new one counts just the same."}
      </p>
      {candidates.length === 0 ? (
        <p className="text-sm text-slate-300">{skip ? 'Nothing left to skip today. Every daily quest is already done.' : 'Nothing left to swap today. Every daily quest is done or already swapped.'}</p>
      ) : (
        <div className="space-y-2">
          {candidates.map((q) => (
            <button
              key={q.id}
              onClick={() => (skip ? onSwap(q.id, { title: q.title, icon: q.icon }) : setPicking({ quest: q, options: swapOptions(state, q) }))}
              className={`w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-left transition ${skip ? 'hover:border-teal-400/50' : 'hover:border-sky-400/50'}`}
            >
              <span className="shrink-0 w-9 h-9 rounded-lg bg-white/5 text-slate-200 flex items-center justify-center">
                <Icon name={q.icon} size={18} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-white truncate">{q.title}</span>
                <span className="block text-xs text-slate-500">+{q.xp} XP</span>
              </span>
              <span className={`flex items-center gap-1 text-xs font-bold ${skip ? 'text-teal-300' : 'text-sky-300'}`}>
                <Icon name={skip ? '⏭' : '🔁'} size={14} />
                {skip ? 'Skip' : 'Swap'}
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
