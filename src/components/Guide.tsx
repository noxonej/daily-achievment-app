import { useApp } from '../store/AppContext';
import { doneByHand } from '../store/reducer';
import { wardrobe } from '../lib/wardrobe';
import { settings } from '../lib/settingsNav';
import type { ViewId } from './NavTabs';
import { Icon } from './Icon';

/** A one-time explainer at the top of a tab: what it's for, in one sentence. "Got it" hides it for good. */
export function TabHint({ id, icon, title, text }: { id: string; icon: string; title: string; text: string }) {
  const { state, dispatch } = useApp();
  if ((state.guide ?? []).includes(`hint:${id}`)) return null;
  return (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-500/[0.07] p-4 flex gap-3">
      <span className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
        <Icon name={icon} size={20} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="text-[13px] text-slate-300 leading-relaxed mt-0.5">{text}</p>
        <button
          onClick={() => dispatch({ type: 'GUIDE_MARK', key: `hint:${id}` })}
          className="mt-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold px-3.5 py-1.5"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

interface Step {
  id: string;
  icon: string;
  title: string;
  hint: string;
  done: boolean;
  go?: () => void;
}

/** First-steps checklist on Today for new users. Disappears once everything is done (or when hidden). */
export function GettingStarted({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { state, dispatch } = useApp();
  const guide = state.guide ?? [];
  if (guide.includes('start:hidden')) return null;

  const steps: Step[] = [
    {
      id: 'quest',
      icon: '✅',
      title: 'Finish your first quest',
      hint: 'Did one of the quests below? Tap it to tick it off.',
      done: Object.values(state.dayLogs).some((l) => doneByHand(l) > 0),
    },
    {
      id: 'plan',
      icon: '📅',
      title: 'Look at your week plan',
      hint: 'Your routine for every day of the week.',
      done: guide.includes('visit:plan'),
      go: () => onNavigate('plan'),
    },
    {
      id: 'money',
      icon: '💰',
      title: 'Set up your money',
      hint: 'Type how much you have. Takes 30 seconds.',
      done: !!state.money?.setupDone,
      go: () => onNavigate('money'),
    },
    {
      id: 'character',
      icon: '👕',
      title: 'Dress up your character',
      hint: 'Pick a face, hair and clothes.',
      done: guide.includes('wardrobe'),
      go: () => wardrobe.open(),
    },
    {
      id: 'box',
      icon: '🎁',
      title: 'Open your daily box',
      hint: 'It unlocks after your first quest of the day.',
      done: !!state.dailyBox?.lastOpened,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;
  const next = steps.find((s) => !s.done)!;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <div>
          <p className="text-sm font-bold text-white">
            <Icon name="🚀" size="1.1em" className="icon-inline text-amber-300" />
            Getting started
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {doneCount} of {steps.length} done · a minute each
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => settings.open('help')} className="rounded-lg px-2 py-1 text-xs font-semibold text-amber-300 hover:bg-white/5">
            How it works
          </button>
          <button
            onClick={() => dispatch({ type: 'GUIDE_MARK', key: 'start:hidden' })}
            aria-label="Hide getting started"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10"
          >
            <Icon name="✕" size={16} />
          </button>
        </div>
      </div>
      <div className="mx-4 mt-3 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
        <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <ul className="p-2 mt-1">
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
                  className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center border ${
                    s.done ? 'bg-emerald-500 border-emerald-500 text-[#fff]' : isNext ? 'border-amber-400 text-amber-300' : 'border-white/15 text-slate-500'
                  }`}
                >
                  <Icon name={s.done ? '✓' : s.icon} size={14} strokeWidth={s.done ? 3 : 2} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className={`block text-sm font-semibold ${s.done ? 'text-slate-500 line-through' : 'text-white'}`}>{s.title}</span>
                  {isNext && <span className="block text-xs text-slate-400">{s.hint}</span>}
                </span>
                {Row === 'button' && <Icon name="›" size={18} className="shrink-0 text-slate-500" />}
              </Row>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
