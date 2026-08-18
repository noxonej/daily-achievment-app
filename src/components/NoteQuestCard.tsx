import { useEffect, useRef, useState } from 'react';
import type { Quest } from '../lib/types';
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL } from '../lib/xp';

interface NoteQuestCardProps {
  quest: Quest;
  note: string;
  completed: boolean;
  onChangeNote: (note: string) => void;
}

export function NoteQuestCard({ quest, note, completed, onChangeNote }: NoteQuestCardProps) {
  const [text, setText] = useState(note);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setText(note);
  }, [note]);

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
      className={`rounded-xl border px-4 py-3.5 transition-colors ${
        completed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/[0.03] border-white/10'
      }`}
    >
      <div className="flex items-center gap-3 mb-2.5">
        <div
          className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg ${
            completed ? 'bg-emerald-500/20' : 'bg-white/5'
          }`}
        >
          {completed ? '✅' : quest.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`font-semibold text-[15px] leading-tight ${completed ? 'text-emerald-300' : 'text-white'}`}>
            {quest.title}
          </p>
          {quest.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{quest.description}</p>}
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
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        rows={2}
        placeholder="Write here — this is what marks it done."
        className="w-full rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60 resize-none"
      />
    </div>
  );
}
