import { useState } from 'react';
import type { Quest } from '../lib/types';
import { FloatingReward } from './FloatingReward';
import { useCompletionFx } from '../lib/useCompletionFx';
import { questReward } from '../lib/rewards';
import { Icon } from './Icon';
import { CompleteBurst } from './fx/CompleteBurst';
import { t } from '../lib/prefs';
import { useApp } from '../store/AppContext';
import { wildcardOptionsFor, wildcardThemeFor } from '../lib/wildcard';
import { DIFFICULTY_XP } from '../lib/xp';
import { addDaysToKey } from '../lib/date';
import { shownLanguage } from '../lib/i18n';
import { locale } from '../lib/locale';

interface WildcardQuestCardProps {
  quest: Quest;
  completed: boolean;
  onToggle: () => void;
  periodKey: string;
}

/**
 * Today's bonus quest (2026-11-22): each weekday has a theme (Money Monday, Training Tuesday…)
 * and three quests to choose from, so no two days feel the same.
 */
export function WildcardQuestCard({ quest, completed, onToggle, periodKey }: WildcardQuestCardProps) {
  const { dispatch } = useApp();
  const { justCompleted } = useCompletionFx(completed);
  const { xp, crit } = questReward(periodKey, quest.id, quest.xp);
  const [choosing, setChoosing] = useState(false);
  const date = quest.wildcardDate ?? periodKey;
  const theme = wildcardThemeFor(date);
  const options = wildcardOptionsFor(date);
  const lt = shownLanguage(locale()) === 'lt';
  const tomorrow = wildcardThemeFor(addDaysToKey(date, 1));

  return (
    <div className="wild-card relative rounded-2xl">
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-3 rounded-2xl px-4 pt-3.5 ${completed ? 'pb-3.5' : 'pb-2'} text-left transition-all active:scale-[0.99]`}
      >
        <div
          className={`relative shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${completed ? 'bg-emerald-500/20' : 'wild-icon'} ${justCompleted ? 'animate-pop-in' : ''}`}
        >
          {justCompleted && <CompleteBurst />}
          {completed ? <Icon name="✅" size={20} className="text-emerald-300 animate-check" /> : <Icon name={quest.icon} size={20} className={theme.tone} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`px-label text-[8.5px] mb-1 flex items-center gap-1 ${theme.tone}`}>
            <Icon name={theme.icon} size={11} />
            {lt ? theme.lt : theme.name}
          </p>
          <p className={`font-semibold text-[15px] leading-tight ${completed ? 'text-emerald-300 line-through decoration-2' : 'text-white'}`}>{quest.title}</p>
          {quest.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{quest.description}</p>}
        </div>
        <span className="shrink-0 self-start mt-1 num-px text-[15px] text-amber-300">+{quest.xp}</span>
      </button>

      {!completed && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setChoosing((c) => !c)}
            aria-expanded={choosing}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-400 hover:text-slate-200 py-1"
          >
            <Icon name="🔀" size={13} />
            {t('wild.options')}
            <Icon name="▾" size={13} className={`transition-transform ${choosing ? 'rotate-180' : ''}`} />
          </button>
          {choosing && (
            <div className="mt-1.5 space-y-1.5 fade-up" role="radiogroup" aria-label={t('wild.pick')}>
              {options.map((o, i) => {
                const on = o.title === quest.title;
                return (
                  <button
                    key={o.title}
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      dispatch({ type: 'PICK_WILDCARD', pick: i });
                      setChoosing(false);
                    }}
                    className={`wild-opt w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left ${on ? 'is-on' : ''}`}
                  >
                    <Icon name={o.icon} size={16} className={on ? theme.tone : 'text-slate-400'} />
                    <span className="flex-1 min-w-0 text-[13px] font-semibold text-slate-200 truncate">{o.title}</span>
                    <span className="num-px text-[13px] text-slate-400">+{DIFFICULTY_XP[o.difficulty]}</span>
                  </button>
                );
              })}
              <p className="text-[11px] text-slate-500 pt-0.5">{t('wild.tomorrow', { x: lt ? tomorrow.lt : tomorrow.name })}</p>
            </div>
          )}
        </div>
      )}
      {justCompleted && <FloatingReward xp={xp} crit={crit} />}
    </div>
  );
}
