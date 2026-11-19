/**
 * One-time clean-ups that run when the app starts.
 *
 * GitHub sync was removed (2026-11-19): it kept a GitHub personal access token in localStorage,
 * which nobody else needed and which any script on the page could read. Delete the saved token.
 */
const REMOVED_KEYS = ['daily-quest-app-sync-config-v1'];

export function runStartupCleanup() {
  for (const key of REMOVED_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // storage unavailable: nothing saved to remove
    }
  }
}

runStartupCleanup();
