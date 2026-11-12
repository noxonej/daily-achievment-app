import { useEffect, useState } from 'react';
import { useApp } from '../../store/AppContext';
import { fullPrefs } from '../../lib/prefs';
import { Icon } from '../Icon';
import { isStandalone } from '../../lib/install';

const HIDE_KEY = 'dayforge-reminder-prompt-hidden';

function permission(): NotificationPermission | 'unsupported' {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

/**
 * Reminders are on by default, but the phone only lets an app notify after one tap on "Allow".
 * This card asks for that tap. If the phone blocked it, it says where to fix it.
 */
export function ReminderPrompt() {
  const { state } = useApp();
  const on = fullPrefs(state.prefs).nudges;
  const [perm, setPerm] = useState(permission);
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(HIDE_KEY) === permission();
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const onVis = () => setPerm(permission());
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  // iPhone only allows notifications for apps added to the home screen.
  const iosNeedsInstall = ios && !isStandalone();
  if (!on || hidden || perm === 'granted' || (perm === 'unsupported' && !iosNeedsInstall)) return null;

  function hide() {
    try {
      localStorage.setItem(HIDE_KEY, permission());
    } catch {
      // ignore
    }
    setHidden(true);
  }

  async function allow() {
    try {
      setPerm(await Notification.requestPermission());
    } catch {
      setPerm(permission());
    }
  }

  return (
    <div className="reminder-prompt relative rounded-2xl p-4 flex items-start gap-3" role="region" aria-label="Turn on reminders">
      <span className="shrink-0 w-10 h-10 rounded-xl bg-cyan-400/15 text-cyan-200 flex items-center justify-center">
        <Icon name="🛎" size={20} />
      </span>
      <div className="flex-1 min-w-0">
        {iosNeedsInstall ? (
          <>
            <p className="font-display font-semibold text-white">Get your reminders on iPhone</p>
            <p className="text-xs text-slate-300 mt-0.5">
              Tap <b>Share</b> → <b>Add to Home Screen</b>, then open Squzo from there and tap Allow. iPhone only sends notifications to apps on the home screen.
            </p>
          </>
        ) : perm === 'denied' ? (
          <>
            <p className="font-display font-semibold text-white">Notifications are blocked</p>
            <p className="text-xs text-slate-300 mt-0.5">Open your phone's settings → Apps (or Notifications) → Squzo or your browser, and allow notifications. Then come back.</p>
          </>
        ) : (
          <>
            <p className="font-display font-semibold text-white">Allow reminders</p>
            <p className="text-xs text-slate-300 mt-0.5">Morning boost, a push at lunch and in the afternoon, and a streak save at night. One tap.</p>
            <button onClick={allow} className="mt-2.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-[#04232b] text-sm font-bold px-4 py-2">
              Allow notifications
            </button>
          </>
        )}
      </div>
      <button onClick={hide} aria-label="Hide" className="shrink-0 -mr-1 -mt-1 w-8 h-8 rounded-full text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center">
        <Icon name="✕" size={14} />
      </button>
    </div>
  );
}
