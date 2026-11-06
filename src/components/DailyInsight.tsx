import { useApp } from '../store/AppContext';
import { getDailyInsight } from '../lib/insights';
import { Icon } from './Icon';

interface DailyInsightProps {
  activeDailyCount: number;
  doneCount: number;
}

const TONE_CLASS: Record<string, string> = {
  hype: 'border-amber-400/30',
  nudge: 'border-white/10',
  info: 'border-white/10',
};

export function DailyInsight({ activeDailyCount, doneCount }: DailyInsightProps) {
  const { stats } = useApp();
  const insight = getDailyInsight(activeDailyCount, doneCount, stats);

  return (
    <div className={`rounded-2xl border bg-white/[0.03] ${TONE_CLASS[insight.tone]} px-4 py-3 flex items-center gap-3`}>
      <span className="shrink-0 w-9 h-9 rounded-lg bg-white/5 text-amber-300 flex items-center justify-center"><Icon name={insight.icon} size={19} /></span>
      <p className="text-sm text-slate-200 leading-snug">{insight.text}</p>
    </div>
  );
}
