import { useState, type ReactNode } from 'react';
import { useApp } from '../store/AppContext';
import { Modal } from './Modal';
import { Check, Copy } from 'lucide-react';
import { inboxUrl, newStepsToken, readInbox } from '../lib/healthSteps';

/**
 * Step-by-step guide for the iPhone Shortcut that sends Apple Health steps to Squzo, plus a test button.
 * Android has no Shortcut that can read steps, so there the in-app counter and typing the total stay.
 */
export function HealthStepsSetup({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useApp();
  const [token] = useState(() => state.stepsToken ?? newStepsToken());
  const [copied, setCopied] = useState(false);
  const [test, setTest] = useState<'idle' | 'checking' | 'none' | number>('idle');
  const url = inboxUrl(token);
  const save = () => {
    if (!state.stepsToken) dispatch({ type: 'SET_STEPS_TOKEN', token });
  };
  const copy = async () => {
    save();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked: the link is shown below so it can be selected by hand.
    }
  };
  const check = async () => {
    save();
    setTest('checking');
    const n = await readInbox(token);
    if (n) dispatch({ type: 'SYNC_STEPS_TOTAL', steps: n });
    setTest(n ?? 'none');
  };
  const synced = state.stepSync;

  return (
    <Modal open={open} onClose={onClose} title="Steps from Apple Health">
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <p>
          Squzo counts steps while it's open. To get <b className="text-white">every step from your whole day</b>, even with Squzo closed, let your
          iPhone send the number from Apple Health. You set this up once (about 3 minutes).
        </p>

        <ol className="space-y-3">
          <Step n={1}>
            Open the <b className="text-white">Shortcuts</b> app, tap <b className="text-white">+</b> and name it <i>Squzo steps</i>.
          </Step>
          <Step n={2}>
            Add <b className="text-white">Find Health Samples</b>: Type <i>Steps</i>, Start Date <i>is today</i>, Group By <i>Day</i>.
          </Step>
          <Step n={3}>
            Add <b className="text-white">Calculate Statistics</b>: <i>Sum</i> of Health Samples.
          </Step>
          <Step n={4}>
            Add <b className="text-white">Get Contents of URL</b> and paste your link:
            <button onClick={copy} className="mt-2 w-full flex items-center gap-2 rounded-xl bg-amber-500 text-white font-bold px-3 py-2.5 justify-center">
              {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              {copied ? 'Link copied' : 'Copy my link'}
            </button>
            <span className="mt-1.5 block text-[11px] text-slate-500 break-all select-all">{url}</span>
            Then tap <i>Show More</i>: Method <b className="text-white">PATCH</b>, Request Body <b className="text-white">JSON</b>. Add a field <code className="text-white">fields</code> (Dictionary), inside it{' '}
            <code className="text-white">steps</code> (Dictionary), inside that <code className="text-white">doubleValue</code> (Number) and pick <i>Statistics</i>.
          </Step>
          <Step n={5}>Tap ▶ once. Allow Health when iPhone asks, then come back and test it below.</Step>
          <Step n={6}>
            Make it automatic: <b className="text-white">Automation</b> tab → <b className="text-white">+</b> → <i>Time of Day</i>, pick a time, choose{' '}
            <i>Run Immediately</i> and your shortcut. Add a few (for example 12:00, 17:00 and 21:00).
          </Step>
        </ol>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <button onClick={check} disabled={test === 'checking'} className="w-full rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-white font-bold py-2 disabled:opacity-60">
            {test === 'checking' ? 'Checking…' : 'Test: get my steps now'}
          </button>
          <p className="mt-2 text-xs text-slate-400" aria-live="polite">
            {typeof test === 'number'
              ? `It works: ${test.toLocaleString()} steps today.`
              : test === 'none'
                ? 'Nothing from today yet. Run the shortcut once, then test again.'
                : synced
                  ? `Last synced ${new Date(synced.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}: ${synced.steps.toLocaleString()} steps.`
                  : 'Not connected yet.'}
          </p>
        </div>

        <p className="text-xs text-slate-500">
          On Android, Squzo counts while it's open. For the full day, type the total from Google Fit or Samsung Health into the box on the quest.
        </p>
      </div>
    </Modal>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500/15 text-amber-300 text-xs font-bold flex items-center justify-center tabular-nums">{n}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  );
}
