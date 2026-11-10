import { useState } from 'react';
import { Icon } from '../Icon';
import { Modal } from '../Modal';
import { Segmented } from '../Segmented';
import { APP_NAME } from '../../lib/brand';

/**
 * "Scroll lock": TikTok, Instagram and YouTube stay closed until you finish a few quests.
 *
 * A web app is not allowed to block other apps (only real phone apps get that permission), so the
 * lock itself is set up in the phone's own tools, and this card tells you when you've earned it.
 */
export function ScrollLockCard({ done, need }: { done: number; need: number }) {
  const [guide, setGuide] = useState(false);
  const open = done >= need;
  return (
    <section
      className={`rounded-2xl border p-4 ${open ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-rose-400/25 bg-rose-500/[0.07]'}`}
      aria-label="Scroll lock"
    >
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${open ? 'bg-emerald-400/20 text-emerald-200' : 'bg-rose-400/15 text-rose-200'}`}>
          <Icon name={open ? '🔓' : '🔒'} size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white">{open ? 'Scroll time earned' : 'Social apps are locked'}</p>
          <p className="text-sm text-slate-300 mt-0.5 leading-snug">
            {open
              ? 'You did your quests first. Enjoy it, and maybe set a 20 minute timer so it doesn’t eat your evening.'
              : `Finish ${need - done} more ${need - done === 1 ? 'quest' : 'quests'} to unlock TikTok, Instagram and YouTube.`}
          </p>
          <div className="flex items-center gap-1.5 mt-2.5" aria-label={`${Math.min(done, need)} of ${need} quests done`}>
            {Array.from({ length: need }, (_, i) => (
              <span key={i} className={`h-2 flex-1 max-w-10 rounded-full ${i < done ? (open ? 'bg-emerald-400' : 'bg-rose-300') : 'bg-white/10'}`} />
            ))}
            <span className="ml-1.5 text-xs font-bold tabular-nums text-slate-300">
              {Math.min(done, need)}/{need}
            </span>
          </div>
        </div>
      </div>
      <button type="button" onClick={() => setGuide(true)} className="mt-3 text-xs font-semibold text-slate-300 underline underline-offset-2 hover:text-white">
        How to lock the apps on my phone
      </button>
      <ScrollLockGuide open={guide} onClose={() => setGuide(false)} />
    </section>
  );
}

type Phone = 'iphone' | 'android';

const APP_URL = typeof window !== 'undefined' ? window.location.origin + import.meta.env.BASE_URL : '';

export function ScrollLockGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phone, setPhone] = useState<Phone>(() => (/iPhone|iPad/i.test(navigator.userAgent) ? 'iphone' : 'android'));
  return (
    <Modal open={open} onClose={onClose} title="Lock social apps">
      <p className="text-sm text-slate-300 leading-relaxed">
        Phones only let their own settings block other apps, so {APP_NAME} can’t do it by itself. These free tools take 2 minutes to set up and
        do the real blocking. {APP_NAME} shows you when you’ve earned the time.
      </p>
      <div className="mt-4">
        <Segmented
          value={phone}
          onChange={setPhone}
          options={[
            { id: 'iphone', label: 'iPhone' },
            { id: 'android', label: 'Android' },
          ]}
        />
      </div>
      {phone === 'iphone' ? (
        <>
          <Steps
            title="Send yourself here when you open them"
            steps={[
              'Open the Shortcuts app and tap Automation, then the + button.',
              'Pick “App”, choose TikTok, Instagram and YouTube, tick “Is Opened” and “Run Immediately”.',
              `Add the action “Open URLs” and paste: ${APP_URL}`,
              'Now every time you open one of them, your quests pop up first. Turn the automation off when the card says you earned it.',
            ]}
          />
          <Steps
            title="Or a hard daily limit"
            steps={[
              'Settings → Screen Time → App Limits → Add Limit.',
              'Pick Social and Entertainment, set something like 30 minutes a day.',
              'Use a Screen Time passcode that a parent or friend types, so you can’t just skip it.',
            ]}
          />
        </>
      ) : (
        <>
          <Steps
            title="Focus mode (pause the apps)"
            steps={[
              'Settings → Digital Wellbeing & parental controls → Focus mode.',
              'Pick TikTok, Instagram and YouTube as distracting apps.',
              'Turn Focus mode on in the morning (or schedule it). Turn it off when the card says you earned it.',
            ]}
          />
          <Steps
            title="Or a daily timer"
            steps={['Digital Wellbeing → Dashboard → tap an app → App timer.', 'Set 30 minutes. When it runs out, the app is paused until midnight.']}
          />
        </>
      )}
      <p className="text-xs text-slate-500 mt-4 leading-relaxed">
        Tip: the trick isn’t willpower, it’s friction. Every extra tap between you and the scroll makes it easier to say no.
      </p>
    </Modal>
  );
}

function Steps({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
      <p className="text-sm font-bold text-white">{title}</p>
      <ol className="mt-2 space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-slate-300 leading-snug">
            <span className="shrink-0 w-5 h-5 rounded-full bg-white/10 text-[11px] font-bold text-white flex items-center justify-center tabular-nums">{i + 1}</span>
            <span className="min-w-0 break-words">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
