import { useState } from 'react';
import { dismissInstall, installDismissed, isStandalone, platform, useInstall } from '../lib/install';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { APP_NAME } from '../lib/brand';

/** Explains how to put the app on the home screen (where it opens full-screen and works offline). */
export function InstallCard({ always = false }: { always?: boolean }) {
  const { canPrompt, prompt } = useInstall();
  const [hidden, setHidden] = useState(() => !always && installDismissed());
  // On Today it's one tidy row; the how-to only opens when tapped.
  const [open, setOpen] = useState(always);
  if (hidden || isStandalone()) return null;
  const os = platform();

  return (
    <div className={`relative rounded-2xl border border-white/10 bg-white/[0.03] ${always ? "p-4" : "px-4 py-3"}`}>
      {!always && (
        <button
          onClick={() => {
            dismissInstall();
            setHidden(true);
          }}
          aria-label="Dismiss"
          className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10"
        >
          <Icon name="✕" size={16} />
        </button>
      )}
      <button onClick={() => setOpen((o) => always || !o)} aria-expanded={open} className="w-full flex items-center gap-3 pr-8 text-left">
        <Logo size={always ? 44 : 36} />
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-white">Put {APP_NAME} on your home screen</span>
          {(always || open) && <span className="block text-xs text-slate-400">Opens full-screen like a real app and works without internet.</span>}
        </span>
        {!always && <Icon name="›" size={18} className={`shrink-0 text-slate-500 transition-transform duration-300 ${open ? 'rotate-90' : ''}`} />}
      </button>
      <div className="reveal-rows" data-open={open}>
      <div>
      {canPrompt ? (
        <button
          onClick={() => void prompt()}
          className="mt-3.5 w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold py-2.5 text-sm"
        >
          Install app
        </button>
      ) : os === 'ios' ? (
        <ol className="mt-3.5 space-y-2 text-sm text-slate-200">
          <li className="flex items-center gap-2.5">
            <Step n={1} />
            Tap <Icon name="📤" size={16} className="text-amber-300" /> <b>Share</b> at the bottom of Safari
          </li>
          <li className="flex items-center gap-2.5">
            <Step n={2} />
            Choose <Icon name="➕" size={16} className="text-amber-300" /> <b>Add to Home Screen</b>
          </li>
        </ol>
      ) : (
        <ol className="mt-3.5 space-y-2 text-sm text-slate-200">
          <li className="flex items-center gap-2.5">
            <Step n={1} />
            Open the browser menu <Icon name="⋮" size={16} className="text-amber-300" />
          </li>
          <li className="flex items-center gap-2.5">
            <Step n={2} />
            Tap <b>Install app</b> or <b>Add to Home screen</b>
          </li>
        </ol>
      )}
      </div>
      </div>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="shrink-0 w-5 h-5 rounded-full bg-white/10 text-[11px] font-bold text-white flex items-center justify-center">{n}</span>
  );
}
