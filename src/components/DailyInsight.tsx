import { useApp } from '../store/AppContext';
import { getDailyInsight } from '../lib/insights';

interface DailyInsightProps {
  activeDailyCount: number;
  doneCount: number;
}

const TONE_CLASS: Record<string, string> = {
  hype: 'from-amber-500/15 to-rose-500/15 border-amber-400/30',
  nudge: 'from-sky-500/10 to-indigo-500/10 border-sky-400/20',
  info: 'from-white/[0.04] to-white/[0.02] border-white/10',
};

export function DailyInsight({ activeDailyCount, doneCount }: DailyInsightProps) {
  const { stats } = useApp();
  const insight = getDailyInsight(activeDailyCount, doneCount, stats);

  return (
    <div className={`rounded-2xl border bg-gradient-to-r ${TONE_CLASS[insight.tone]} px-4 py-3 flex items-center gap-3`}>
      <span className="text-xl shrink-0">{insight.icon}</span>
      <p className="text-sm text-slate-200 leading-snug">{insight.text}</p>
    </div>
  );
}
