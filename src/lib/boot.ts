/**
 * Hides the startup screen from index.html once the app has drawn. On the first launch of a
 * session it plays the full logo intro (~2.3 s: the S draws itself, the arrow and sparkle pop,
 * the name slides in); tap to skip. Reopening within the same session fades right away.
 */
const SEEN = 'quest-log-splash-seen';
const INTRO_MS = 2300;
let done = false;

export function hideBoot(opts: { showLogo?: boolean } = {}) {
  if (done) return;
  done = true;
  const el = document.getElementById('boot');
  if (!el) return;
  let first = false;
  try {
    first = sessionStorage.getItem(SEEN) !== '1';
    sessionStorage.setItem(SEEN, '1');
  } catch {
    // ignore
  }
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = first && opts.showLogo !== false ? Math.max(0, (reduced ? 600 : INTRO_MS) - performance.now()) : 0;
  let gone = false;
  const hide = () => {
    if (gone) return;
    gone = true;
    el.classList.add('hide');
    setTimeout(() => el.remove(), 400);
  };
  if (wait > 0) el.addEventListener('pointerdown', hide, { once: true });
  // Two frames so the app has actually painted underneath before the fade starts.
  requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(hide, wait)));
}
