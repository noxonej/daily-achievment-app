/** Saving your progress as a file (Settings → Data → Export, and the "Back up your progress" card). */
const LAST_EXPORT = 'dayforge-last-export';

export function exportBackupFile(state: unknown) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `squzo-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  try {
    localStorage.setItem(LAST_EXPORT, new Date().toISOString());
  } catch {
    // storage full: the file is still saved
  }
}

/** When a backup file was last exported on this phone (ISO time), or null. */
export function lastExport(): string | null {
  try {
    return localStorage.getItem(LAST_EXPORT);
  } catch {
    return null;
  }
}
