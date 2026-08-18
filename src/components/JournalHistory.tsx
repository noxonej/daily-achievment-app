import type { DayLog, Quest, WeekLog } from '../lib/types';
import { formatShortDate } from '../lib/date';

interface JournalEntry {
  sortKey: string;
  dateLabel: string;
  icon: string;
  source: string;
  text: string;
}

interface JournalHistoryProps {
  dayLogs: Record<string, DayLog>;
  weekLogs: Record<string, WeekLog>;
  quests: Quest[];
}

function questInfo(quests: Quest[], id: string): { title: string; icon: string } {
  const q = quests.find((x) => x.id === id);
  return { title: q?.title ?? 'Quest', icon: q?.icon ?? '📝' };
}

export function JournalHistory({ dayLogs, weekLogs, quests }: JournalHistoryProps) {
  const entries: JournalEntry[] = [];

  for (const [dateKey, log] of Object.entries(dayLogs)) {
    if (log.freeNote?.trim()) {
      entries.push({
        sortKey: `${dateKey}~0`,
        dateLabel: formatShortDate(dateKey),
        icon: '📓',
        source: "Today's Note",
        text: log.freeNote,
      });
    }
    for (const [questId, note] of Object.entries(log.notes ?? {})) {
      if (!note.trim()) continue;
      const { title, icon } = questInfo(quests, questId);
      entries.push({ sortKey: `${dateKey}~1`, dateLabel: formatShortDate(dateKey), icon, source: title, text: note });
    }
  }

  for (const [weekKeyValue, log] of Object.entries(weekLogs)) {
    for (const [questId, note] of Object.entries(log.notes ?? {})) {
      if (!note.trim()) continue;
      const { title, icon } = questInfo(quests, questId);
      entries.push({ sortKey: `${weekKeyValue}~1`, dateLabel: weekKeyValue, icon, source: title, text: note });
    }
  }

  entries.sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1));
  const recent = entries.slice(0, 15);

  if (recent.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-semibold text-white mb-1">Recent Notes</p>
        <p className="text-xs text-slate-500">
          Notes from Journal, Gratitude, and your daily note will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-semibold text-white mb-3">Recent Notes</p>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-0.5">
        {recent.map((e, i) => (
          <div key={i} className="rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{e.icon}</span>
              <span className="text-xs font-semibold text-slate-300">{e.source}</span>
              <span className="text-[10px] text-slate-500 ml-auto">{e.dateLabel}</span>
            </div>
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-snug">{e.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
