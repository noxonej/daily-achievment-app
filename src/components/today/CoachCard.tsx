import { useMemo, useState } from 'react';
import { useApp } from '../../store/AppContext';
import { coachTips, hideTip, rotate, visibleTips, type CoachTip } from '../../lib/coach';
import { focusTimer } from '../../lib/focusTimer';
import { setIntent } from '../../lib/intents';
import { settings } from '../../lib/settingsNav';
import type { ViewId } from '../NavTabs';
import { QuestLibraryModal } from '../QuestLibraryModal';
import { Icon } from '../Icon';

/** Personal tips from how your days actually went, each with a one-tap fix. */
export function CoachCard({ onNavigate, max = 2 }: { onNavigate: (v: ViewId) => void; max?: number }) {
  const { state, stats, dispatch } = useApp();
  const [, bump] = useState(0);
  const [added, setAdded] = useState<string | null>(null);
  const [library, setLibrary] = useState(false);
  const all = useMemo(() => coachTips(state, stats), [state, stats]);
  const tips = rotate(visibleTips(all), undefined, max);
  if (!tips.length && !added) return null;

  function act(tip: CoachTip) {
    const a = tip.action;
    if (!a) return;
    if (a.kind === 'add') {
      const q = a.quest;
      dispatch({
        type: 'ADD_QUEST',
        quest: {
          title: q.title,
          description: q.description,
          frequency: q.frequency,
          difficulty: q.difficulty,
          icon: q.icon,
          category: q.category,
          promptForNote: q.promptForNote,
          measure: q.measure,
          noteList: q.noteList,
        },
      });
      setAdded(q.title);
      setTimeout(() => setAdded(null), 2600);
      return;
    }
    if (a.to === 'plan' || a.to === 'money') onNavigate(a.to);
    else if (a.to === 'quests') settings.open('quests');
    else if (a.to === 'library') setLibrary(true);
    else if (a.to === 'focus') focusTimer.open();
    else if (a.to === 'diary') {
      setIntent('you-diary');
      onNavigate('you');
    }
  }

  return (
    <section aria-label="Coach" className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-300 flex items-center justify-center">
          <Icon name="🧠" size={15} />
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-sky-200/90">Your coach</span>
      </div>
      {added && (
        <p className="mb-3 rounded-xl bg-emerald-500/10 border border-emerald-400/30 px-3 py-2 text-xs font-semibold text-emerald-200 fade-up">
          <Icon name="✓" size={13} className="icon-inline" /> Added “{added}” to your quests
        </p>
      )}
      <div className="space-y-3">
        {tips.map((tip) => (
          <div key={tip.id} className="flex gap-3 fade-up">
            <span className="shrink-0 w-9 h-9 rounded-xl bg-white/5 text-amber-300 flex items-center justify-center">
              <Icon name={tip.icon} size={18} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">{tip.title}</p>
              <p className="text-[13px] text-slate-300 leading-snug mt-0.5">{tip.text}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {tip.action && (
                  <button
                    onClick={() => act(tip)}
                    className="rounded-full bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold px-3 py-1.5"
                  >
                    {tip.action.label}
                  </button>
                )}
                <button
                  onClick={() => {
                    hideTip(tip.id);
                    bump((n) => n + 1);
                  }}
                  className="rounded-full border border-white/10 text-slate-400 hover:text-white text-xs font-semibold px-3 py-1.5"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <QuestLibraryModal open={library} onClose={() => setLibrary(false)} />
    </section>
  );
}
