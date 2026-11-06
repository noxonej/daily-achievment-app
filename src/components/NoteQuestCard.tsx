import { useEffect, useRef, useState } from 'react';
import type { Quest } from '../lib/types';
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL } from '../lib/xp';
import { InfoDisclosure } from './InfoDisclosure';
import { FloatingReward } from './FloatingReward';
import { useCompletionFx } from '../lib/useCompletionFx';
import { questReward } from '../lib/rewards';
import { Icon } from './Icon';
import { checkNote, noteRule, splitEntries } from '../lib/questRules';

const LIST_PLACEHOLDERS = ['Something that made you smile', 'Someone who helped you', 'A small win today', 'Something you learned', 'Something you have'];

interface NoteQuestCardProps {
  quest: Quest;
  note: string;
  completed: boolean;
  onChangeNote: (note: string) => void;
  periodKey: string;
}

export function NoteQuestCard({ quest, note, completed, onChangeNote, periodKey }: NoteQuestCardProps) {
  const [text, setText] = useState(note);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { justCompleted } = useCompletionFx(completed);
  const { xp, crit } = questReward(periodKey, quest.id, quest.xp);

  useEffect(() => {
    setText(note);
  }, [note]);

  const rule = noteRule(quest);
  const check = checkNote(quest, text);
  const entries = splitEntries(text);

  function setEntry(i: number, value: string) {
    const next = Array.from({ length: rule.kind === 'list' ? rule.count : 1 }, (_, j) => (j === i ? value.replace(/\n/g, ' ') : (entries[j] ?? '')));
    handleChange(next.join('\n').replace(/\n+$/, ''));
  }

  function handleChange(value: string) {
    setText(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChangeNote(value), 400);
  }

  function handleBlur() {
    if (timerRef.current) clearTimeout(timerRef.current);
    onChangeNote(text);
  }

  return (
    <div
      className={`relative rounded-xl border px-4 py-3.5 transition-colors ${
        completed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/[0.03] border-white/10'
      }`}
    >
      <div className="flex items-center gap-3 mb-2.5">
        <div
          className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg ${
            completed ? 'bg-emerald-500/20' : 'bg-white/5'
          } ${justCompleted ? 'animate-pop-in' : ''}`}
        >
          {completed ? <Icon name="✅" size={20} className="text-emerald-300 animate-check" /> : <Icon name={quest.icon} size={19} className="text-slate-200" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`font-semibold text-[15px] leading-tight ${completed ? 'text-emerald-300' : 'text-white'}`}>
            {quest.title}
          </p>
          {quest.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{quest.description}</p>}
          {quest.details && (
            <div className="mt-1">
              <InfoDisclosure text={quest.details} />
            </div>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span
            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${DIFFICULTY_COLOR[quest.difficulty]}`}
          >
            {DIFFICULTY_LABEL[quest.difficulty]}
          </span>
          <span className="text-[11px] font-display font-bold text-amber-300">+{quest.xp} XP</span>
        </div>
      </div>
      {rule.kind === 'list' ? (
        <div className="space-y-2">
          {Array.from({ length: rule.count }, (_, i) => {
            const ok = check.entryOk?.[i];
            return (
              <div key={i} className="flex items-center gap-2">
                <span
                  className={`shrink-0 w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center transition ${
                    ok ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-400 border border-white/10'
                  }`}
                >
                  {ok ? <Icon name="✓" size={12} strokeWidth={3} className="animate-check" /> : i + 1}
                </span>
                <input
                  value={entries[i] ?? ''}
                  onChange={(e) => setEntry(i, e.target.value)}
                  onBlur={handleBlur}
                  placeholder={LIST_PLACEHOLDERS[i % LIST_PLACEHOLDERS.length]}
                  maxLength={140}
                  className="flex-1 min-w-0 rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
                />
              </div>
            );
          })}
        </div>
      ) : (
        <textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          rows={3}
          placeholder="Write here. A few real sentences mark it done."
          className="w-full rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60 resize-none"
        />
      )}
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${check.done ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${(check.have / check.need) * 100}%` }} />
        </div>
        <span className={`text-[11px] font-semibold tabular-nums ${check.done ? 'text-emerald-300' : 'text-slate-400'}`}>
          {check.done ? 'Done!' : rule.kind === 'list' ? `${check.have}/${check.need}` : `${check.have}/${check.need} words`}
        </span>
      </div>
      {!check.done && check.hint && text.trim() && <p className="text-[11px] text-slate-500 mt-1">{check.hint}</p>}
      {justCompleted && (
        <span className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none" aria-hidden="true">
          <span className="complete-sweep" />
        </span>
      )}
      {justCompleted && <FloatingReward xp={xp} crit={crit} />}
    </div>
  );
}
