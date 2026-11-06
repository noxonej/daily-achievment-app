import { useLayoutEffect, useRef, type RefObject } from 'react';

function reducedMotion(): boolean {
  return document.documentElement.dataset.motion === 'reduce' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Smoothly slides list items to their new place when the order changes (e.g. a finished quest
 * moving to the bottom), instead of jumping. Items need a `data-flip` attribute with a stable id.
 */
export function useFlip(container: RefObject<HTMLElement | null>, key: unknown) {
  const last = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    const top = root.getBoundingClientRect().top;
    const next = new Map<string, number>();
    const skip = reducedMotion();
    root.querySelectorAll<HTMLElement>(':scope > [data-flip]').forEach((el) => {
      const id = el.dataset.flip!;
      const y = el.getBoundingClientRect().top - top;
      next.set(id, y);
      const before = last.current.get(id);
      if (skip || before === undefined || Math.abs(before - y) < 2) return;
      el.animate([{ transform: `translateY(${before - y}px)` }, { transform: 'translateY(0)' }], {
        duration: 520,
        easing: 'cubic-bezier(.22,1,.36,1)',
      });
    });
    last.current = next;
  }, [container, key]);
}
