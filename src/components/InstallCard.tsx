import { useState } from 'react';
import { dismissInstall, installDismissed, isStandalone, platform, useInstall } from '../lib/install';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { APP_NAME } from '../lib/brand';

/** Explains how to put the app on the home screen (where it opens full-screen and works offline). */
export function InstallCard({ always = false }: { always?: boolean }) {
  const { canPrompt, prompt } = useInstall();
  const [hidden, setHidden] = useState(() => !always && installDismissed());
  if (hidden || isStandalone()) return null;
  const os = platform();

  return (
    <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/10 to-indigo-500/10 p-4">
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
      <div className="flex items-center gap-3 pr-8">
        <Logo size={44} />
        <div>
          <p className="text-sm font-bold text-white">Put {APP_NAME} on your home screen</p>
          <p className="text-xs text-slate-400">Opens full-screen like a real app and works without internet.</p>
        </div>
      </div>
      {canPrompt ? (
        <button
          onClick={() => void prompt()}
          className="mt-3.5 w-full rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold py-2.5 text-sm"
        >
          Install app
        </button>
      ) : os === 'ios' ? (
        <ol className="mt-3.5 space-y-2 text-sm text-slate-200">
          <li className="flex items-center gap-2.5">
            <Step n={1} />
            Tap <Icon name="📤" size={16} className="text-sky-300" /> <b>Share</b> at the bottom of Safari
          </li>
          <li className="flex items-center gap-2.5">
            <Step n={2} />
            Choose <Icon name="➕" size={16} className="text-sky-300" /> <b>Add to Home Screen</b>
          </li>
        </ol>
      ) : (
        <ol className="mt-3.5 space-y-2 text-sm text-slate-200">
          <li className="flex items-center gap-2.5">
            <Step n={1} />
            Open the browser menu <Icon name="⋮" size={16} className="text-sky-300" />
          </li>
          <li className="flex items-center gap-2.5">
            <Step n={2} />
            Tap <b>Install app</b> or <b>Add to Home screen</b>
          </li>
        </ol>
      )}
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="shrink-0 w-5 h-5 rounded-full bg-white/10 text-[11px] font-bold text-white flex items-center justify-center">{n}</span>
  );
}
