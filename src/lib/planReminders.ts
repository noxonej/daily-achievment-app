import { useEffect, useRef, useState } from 'react';
import type { AppState, WeekdayId } from './types';
import { WEEKDAYS, checkedPlanIds, formatPlanTime, planItemsForDay, recurringItemsForDay, todayWeekday, upcomingEvents } from './weekPlan';
import { todayKey } from './date';
import { showSystemNotification } from './notify';

const ICS_DAY: Record<WeekdayId, string> = { mon: 'MO', tue: 'TU', wed: 'WE', thu: 'TH', fri: 'FR', sat: 'SA', sun: 'SU' };

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function icsLocal(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function icsUtc(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** RFC 5545 lines must be folded at 75 octets; continuation lines start with a space. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = '';
  let size = 0;
  for (const ch of line) {
    const len = new TextEncoder().encode(ch).length;
    if (size + len > (parts.length === 0 ? 75 : 74)) {
      parts.push(current);
      current = '';
      size = 0;
    }
    current += ch;
    size += len;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

export function countTimedItems(state: AppState): number {
  return (
    WEEKDAYS.reduce((n, w) => n + recurringItemsForDay(state, w.id).filter((i) => i.time).length, 0) +
    upcomingEvents(state).filter((e) => e.time).length
  );
}

/**
 * A calendar file with one weekly-repeating event per timed plan item, each with an alarm.
 * Importing it into Google/Apple Calendar gives real phone reminders even when the app is closed.
 */
export function buildPlanIcs(state: AppState, minutesBefore: number, now: Date = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dayforge//Week Plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Week Plan',
  ];
  const stamp = icsUtc(now);
  const todayIndex = (now.getDay() + 6) % 7;

  WEEKDAYS.forEach((w, index) => {
    const timed = recurringItemsForDay(state, w.id).filter((i) => i.time);
    timed.forEach((item, i) => {
      const [h, m] = item.time!.split(':').map(Number);
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + ((index - todayIndex + 7) % 7), h, m);
      // Each block lasts until the next planned item (between 5 and 60 minutes), 15 minutes for the last one.
      const next = timed[i + 1]?.time;
      let minutes = 15;
      if (next) {
        const [nh, nm] = next.split(':').map(Number);
        minutes = Math.min(60, Math.max(5, nh * 60 + nm - (h * 60 + m)));
      }
      const end = new Date(start.getTime() + minutes * 60000);
      const summary = escapeText(item.text);
      lines.push(
        'BEGIN:VEVENT',
        `UID:${item.id}-${w.id}@quest-log-week-plan`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${icsLocal(start)}`,
        `DTEND:${icsLocal(end)}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${ICS_DAY[w.id]}`,
        fold(`SUMMARY:${summary}`),
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        fold(`DESCRIPTION:${summary}`),
        `TRIGGER:${minutesBefore > 0 ? `-PT${minutesBefore}M` : 'PT0S'}`,
        'END:VALARM',
        'END:VEVENT',
      );
    });
  });

  // One-time items (appointments) are single events on their date.
  for (const e of upcomingEvents(state, todayKey(now)).filter((x) => x.time)) {
    const [y, mo, d] = e.date!.split('-').map(Number);
    const [h, m] = e.time!.split(':').map(Number);
    const start = new Date(y, mo - 1, d, h, m);
    const end = new Date(start.getTime() + 60 * 60000);
    const summary = escapeText(e.text);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.id}@quest-log-week-plan`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsLocal(start)}`,
      `DTEND:${icsLocal(end)}`,
      fold(`SUMMARY:${summary}`),
      ...(e.note ? [fold(`DESCRIPTION:${escapeText(e.note)}`)] : []),
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      fold(`DESCRIPTION:${summary}`),
      `TRIGGER:${minutesBefore > 0 ? `-PT${minutesBefore}M` : 'PT0S'}`,
      'END:VALARM',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

export function downloadPlanIcs(state: AppState, minutesBefore: number) {
  const blob = new Blob([buildPlanIcs(state, minutesBefore)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'week-plan.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ---- In-app reminders (while the app is open) ----

const ENABLED_KEY = 'week-plan-live-reminders';

export function loadLiveRemindersEnabled(): boolean {
  try {
    return localStorage.getItem(ENABLED_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveLiveRemindersEnabled(on: boolean) {
  try {
    localStorage.setItem(ENABLED_KEY, on ? '1' : '0');
  } catch {
    // storage unavailable; the setting just won't survive a reload
  }
  window.dispatchEvent(new Event('week-plan-reminders-changed'));
}

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export interface LiveReminder {
  id: string;
  text: string;
  time: string;
}

/** Watches the clock while the app is open and surfaces today's plan items when their time arrives. */
export function useLivePlanReminders(state: AppState): { reminder: LiveReminder | null; dismiss: () => void } {
  const [enabled, setEnabled] = useState(loadLiveRemindersEnabled);
  const [reminder, setReminder] = useState<LiveReminder | null>(null);
  const firedRef = useRef<Set<string>>(new Set());
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const onChange = () => setEnabled(loadLiveRemindersEnabled());
    window.addEventListener('week-plan-reminders-changed', onChange);
    return () => window.removeEventListener('week-plan-reminders-changed', onChange);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    function check() {
      const now = new Date();
      const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const s = stateRef.current;
      const checked = checkedPlanIds(s);
      for (const item of planItemsForDay(s, todayWeekday(now))) {
        const key = `${todayKey(now)}|${item.id}`;
        if (item.time !== hhmm || checked.has(item.id) || firedRef.current.has(key)) continue;
        firedRef.current.add(key);
        setReminder({ id: item.id, text: item.text, time: item.time });
        try {
          navigator.vibrate?.([120, 60, 120]);
        } catch {
          // vibration not supported
        }
        showSystemNotification(`${formatPlanTime(item.time)} · ${item.text}`, 'From your Week Plan', key);
      }
    }
    check();
    const t = setInterval(check, 15000);
    return () => clearInterval(t);
  }, [enabled]);

  return { reminder, dismiss: () => setReminder(null) };
}
