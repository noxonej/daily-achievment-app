import { useEffect, useRef } from 'react';

/**
 * Open screens (Settings, the wardrobe, pop-ups…) form a stack. The phone's Back button and the
 * Escape key close only the top one, like a normal app, instead of leaving the app.
 */
interface Entry {
  id: number;
  back: () => void;
}

const stack: Entry[] = [];
let nextId = 1;
let ignorePops = 0;
let installed = false;

function install() {
  if (installed) return;
  installed = true;
  window.addEventListener('popstate', () => {
    if (ignorePops > 0) {
      ignorePops--;
      return;
    }
    const top = stack[stack.length - 1];
    if (!top) return;
    top.back();
    // Still open (e.g. Settings went from a sub-page back to its main list): keep a history step for it.
    setTimeout(() => {
      if (stack.includes(top)) history.pushState({ dayforgeOverlay: top.id }, '');
    }, 0);
  });
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    const top = stack[stack.length - 1];
    if (top) {
      e.preventDefault();
      top.back();
    }
  });
}

/** While `open`, Back / Escape call `onBack` (which usually closes the screen). */
export function useBackToClose(open: boolean, onBack: () => void) {
  const cb = useRef(onBack);
  cb.current = onBack;
  useEffect(() => {
    if (!open) return;
    install();
    const entry: Entry = { id: nextId++, back: () => cb.current() };
    stack.push(entry);
    history.pushState({ dayforgeOverlay: entry.id }, '');
    return () => {
      const i = stack.indexOf(entry);
      if (i >= 0) stack.splice(i, 1);
      // Closed with a button: remove the history step we added, without closing anything else.
      if (history.state?.dayforgeOverlay === entry.id) {
        ignorePops++;
        history.back();
      }
    };
  }, [open]);
}
