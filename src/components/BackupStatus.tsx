import { useAuth } from '../store/AuthContext';
import { usePersistState } from '../lib/persist';
import { lastExport } from '../lib/backupFile';
import { locale } from '../lib/locale';
import { backupProblem } from '../lib/firebase';

function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'unknown';
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`;
  return d.toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Settings → Data: when your progress was last backed up, and whether the phone keeps it safe. */
export function BackupStatus() {
  const auth = useAuth();
  const persist = usePersistState();
  const cloud = auth?.account.google?.lastBackup;
  const file = lastExport();
  const problem = auth ? backupProblem(auth.account.id) : null;
  const latest = [cloud, file].filter((x): x is string => !!x).sort().pop();
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-1.5 text-sm">
      <p className="flex justify-between gap-3">
        <span className="text-slate-300">Last backup</span>
        <b className={latest ? 'text-white' : 'text-amber-300'}>{latest ? when(latest) : 'Never'}</b>
      </p>
      {cloud && <p className="text-xs text-slate-400">Cloud (Google): {when(cloud)}</p>}
      {file && <p className="text-xs text-slate-400">Backup file: {when(file)}</p>}
      {problem && (
        <p role="alert" className="text-xs text-amber-300">
          ⚠ The cloud backup stopped {when(problem.at)}: your data is too big for it ({problem.kb} KB, the limit is about 880 KB).
          Save a backup file in Advanced below. Deleting old diary pages or notes makes it smaller.
        </p>
      )}
      <p className="text-xs text-slate-400">
        {persist === 'persisted'
          ? '✓ This phone keeps Squzo’s data even when space runs low.'
          : persist === 'not-persisted'
            ? '⚠ This browser may delete Squzo’s data if you don’t open it for a while. Keep a backup (add Squzo to your home screen to help).'
            : persist === 'unsupported'
              ? 'This browser can’t promise to keep the data for good. Keep a backup.'
              : 'Checking whether this phone keeps Squzo’s data…'}
      </p>
    </div>
  );
}
