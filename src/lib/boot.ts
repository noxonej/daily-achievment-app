/**
 * Hides the startup screen from index.html once the app has drawn. On the first launch of a
 * session it stays at least ~1 s so the logo animation can finish; otherwise it fades right away.
 */
const SEEN = 'quest-log-splash-seen';
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
  const wait = first && opts.showLogo !== false ? Math.max(0, 1100 - performance.now()) : 0;
  // Two frames so the app has actually painted underneath before the fade starts.
  requestAnimationFrame(() =>
    requestAnimationFrame(() =>
      setTimeout(() => {
        el.classList.add('hide');
        setTimeout(() => el.remove(), 400);
      }, wait),
    ),
  );
}
