import { useMemo, useState } from 'react';
import type { DayLog } from '../lib/types';
import { todayKey } from '../lib/date';

interface DayCell {
  key: string;
  level: number;
  count: number;
  total: number;
  inFuture: boolean;
}

const LEVEL_CLASSES = [
  'bg-white/[0.06]',
  'bg-emerald-900/70',
  'bg-emerald-700/80',
  'bg-emerald-500/90',
  'bg-emerald-400',
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildWeeks(dayLogs: Record<string, DayLog>, weeksToShow: number): DayCell[][] {
  const today = new Date();
  const endDow = (today.getDay() + 6) % 7; // 0 = Monday
  const currentWeekMonday = new Date(today);
  currentWeekMonday.setDate(today.getDate() - endDow);
  const startMonday = new Date(currentWeekMonday);
  startMonday.setDate(currentWeekMonday.getDate() - (weeksToShow - 1) * 7);

  const weeks: DayCell[][] = [];
  for (let w = 0; w < weeksToShow; w++) {
    const week: DayCell[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(startMonday);
      day.setDate(startMonday.getDate() + w * 7 + d);
      const key = todayKey(day);
      const inFuture = day > today;
      const log = dayLogs[key];
      const count = log?.completedQuestIds.length ?? 0;
      const total = log?.dailyQuestCount ?? 0;
      let level = 0;
      if (total > 0) {
        const ratio = count / total;
        if (ratio >= 1) level = 4;
        else if (ratio >= 0.66) level = 3;
        else if (ratio >= 0.33) level = 2;
        else if (count > 0) level = 1;
      } else if (count > 0) {
        level = 2;
      }
      week.push({ key, level, count, total, inFuture });
    }
    weeks.push(week);
  }
  return weeks;
}

export function HeatmapCalendar({ dayLogs }: { dayLogs: Record<string, DayLog> }) {
  const [weeksToShow] = useState(18);
  const weeks = useMemo(() => buildWeeks(dayLogs, weeksToShow), [dayLogs, weeksToShow]);

  const monthLabels = useMemo(() => {
    const labels: Array<{ index: number; label: string }> = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const firstDay = week[0];
      if (!firstDay) return;
      const month = Number(firstDay.key.slice(5, 7)) - 1;
      if (month !== lastMonth) {
        labels.push({ index: i, label: MONTH_NAMES[month] });
        lastMonth = month;
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="inline-block min-w-full">
        <div className="relative h-4 mb-1" style={{ width: weeks.length * 16 }}>
          {monthLabels.map((m) => (
            <span
              key={m.index}
              className="absolute text-[10px] text-slate-500"
              style={{ left: m.index * 16 }}
            >
              {m.label}
            </span>
          ))}
        </div>
        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <div
                  key={day.key}
                  title={
                    day.inFuture
                      ? undefined
                      : `${day.key}: ${day.count}${day.total ? `/${day.total}` : ''} quests`
                  }
                  className={`w-[13px] h-[13px] rounded-[3px] ${
                    day.inFuture ? 'bg-transparent' : LEVEL_CLASSES[day.level]
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500">
        <span>Less</span>
        {LEVEL_CLASSES.map((c, i) => (
          <div key={i} className={`w-[11px] h-[11px] rounded-[3px] ${c}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
