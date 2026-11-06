import { useRef, type MouseEvent } from 'react';

/**
 * Ignores a second tap on the same button within a moment (an accidental double-tap), so a save
 * button can't save twice, e.g. adding the same expense twice. Use as `onClickCapture`.
 */
export function useNoDoubleTap(ms = 400) {
  const last = useRef<{ t: number; el: Element | null }>({ t: 0, el: null });
  return (e: MouseEvent) => {
    const btn = (e.target as HTMLElement).closest?.('button, [role=button], input[type=submit]');
    if (!btn) return;
    const now = performance.now();
    if (last.current.el === btn && now - last.current.t < ms) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    last.current = { t: now, el: btn };
  };
}
