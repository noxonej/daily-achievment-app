import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

// Captured as early as possible: the browser fires this once, shortly after load.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

export function isStandalone(): boolean {
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}

export function platform(): 'ios' | 'android' | 'other' {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return {
    canPrompt: !!deferred,
    async prompt(): Promise<boolean> {
      if (!deferred) return false;
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      deferred = null;
      listeners.forEach((l) => l());
      return outcome === 'accepted';
    },
  };
}

const DISMISS_KEY = 'questlog-install-dismissed';
export function installDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}
export function dismissInstall() {
  try {
    localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // ignore
  }
}
