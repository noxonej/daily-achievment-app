import { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { settings } from '../../lib/settingsNav';
import { exportBackupFile, lastExport } from '../../lib/backupFile';
import { googleConfigured } from '../../lib/google';
import { Icon } from '../Icon';

const SNOOZE_KEY = 'dayforge-backup-nudge';
const WEEK = 7 * 86400000;

function snoozed(): boolean {
  try {
    const at = Number(localStorage.getItem(SNOOZE_KEY) ?? 0);
    return Date.now() - at < WEEK;
  } catch {
    return false;
  }
}

/**
 * A calm reminder on Today for people with more than a week of progress and no backup: a phone
 * browser can clear a website's data, and then a long streak would be gone. Shows at most once a week.
 */
export function BackupNudge() {
  const { state, stats } = useApp();
  const auth = useAuth();
  const [hidden, setHidden] = useState(snoozed);
  const recentFile = (() => {
    const f = lastExport();
    return !!f && Date.now() - new Date(f).getTime() < WEEK;
  })();
  if (hidden || auth?.account.google || recentFile || stats.daysActive <= 7) return null;

  function snooze() {
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setHidden(true);
  }

  return (
    <div className="reminder-prompt relative rounded-2xl p-4 flex items-start gap-3" role="region" aria-label="Back up your progress">
      <span className="shrink-0 w-10 h-10 rounded-xl bg-cyan-400/15 text-cyan-200 flex items-center justify-center">
        <Icon name="💾" size={20} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-white">Back up your progress</p>
        <p className="text-xs text-slate-300 mt-0.5">
          {stats.daysActive} days of progress live only on this phone. A browser can clear them if it needs space. Keep a copy.
        </p>
        <div className="flex flex-wrap gap-2 mt-2.5">
          {googleConfigured() && (
            <button onClick={() => settings.open('data')} className="rounded-full bg-cyan-400 hover:bg-cyan-300 text-[#04232b] text-sm font-bold px-4 py-2">
              Continue with Google
            </button>
          )}
          <button
            onClick={() => {
              exportBackupFile(state);
              snooze();
            }}
            className="rounded-full border border-white/15 text-white text-sm font-semibold px-4 py-2"
          >
            Save a file
          </button>
        </div>
      </div>
      <button onClick={snooze} aria-label="Not now" className="shrink-0 -mr-1 -mt-1 w-8 h-8 rounded-full text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center">
        <Icon name="✕" size={14} />
      </button>
    </div>
  );
}
