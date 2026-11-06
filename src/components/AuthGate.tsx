import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  createAccount,
  deleteAccount,
  getActiveId,
  isUnlocked,
  listAccounts,
  markUnlocked,
  pinFields,
  pinLockedFor,
  recordPinAttempt,
  setActiveId,
  updateAccount,
  verifyPin,
  type Account,
} from '../lib/accounts';
import { AppProvider, LEGACY_STORAGE_KEY } from '../store/AppContext';
import { AuthContext, type AuthValue } from '../store/AuthContext';
import { createInitialState } from '../store/reducer';
import { Logo, Wordmark } from './Logo';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { APP_NAME } from '../lib/brand';

function legacyData(): { name: string } | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.quests) ? { name: parsed.profile?.name ?? '' } : null;
  } catch {
    return null;
  }
}

/** Decides what to show before the app: create an account, pick one, enter a PIN, or open the app. */
export function AuthGate({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(() => listAccounts());
  const [activeId, setActive] = useState<string | null>(() => getActiveId());
  const [, setUnlockedTick] = useState(0);
  const [adding, setAdding] = useState(false);
  const legacy = useMemo(() => (listAccounts().length === 0 ? legacyData() : null), []);

  const refresh = () => setAccounts(listAccounts());
  const active = accounts.find((a) => a.id === activeId) ?? null;

  function open(acc: Account) {
    setActiveId(acc.id);
    setActive(acc.id);
    refresh();
  }

  const auth: AuthValue | null = active
    ? {
        account: active,
        update: (patch) => {
          updateAccount(active.id, patch);
          refresh();
        },
        setPin: async (pin) => {
          updateAccount(active.id, await pinFields(pin));
          if (pin) markUnlocked(active.id);
          refresh();
        },
        signOut: () => {
          setActiveId(null);
          setActive(null);
          refresh();
        },
        remove: () => {
          deleteAccount(active.id);
          setActive(null);
          refresh();
        },
      }
    : null;

  if (accounts.length === 0 || adding) {
    return (
      <CreateAccount
        existing={adding ? null : legacy}
        canCancel={adding}
        onCancel={() => setAdding(false)}
        onCreate={async (name, pin, remember) => {
          const isFirstWithData = !adding && !!legacy;
          const acc = await createAccount({ name, pin, remember, storageKey: isFirstWithData ? LEGACY_STORAGE_KEY : undefined });
          if (!isFirstWithData) {
            // A fresh account starts with the normal first-run setup, with the name already filled in.
            const fresh = createInitialState();
            localStorage.setItem(acc.storageKey, JSON.stringify({ ...fresh, profile: { ...fresh.profile, name: acc.name } }));
          }
          if (pin) markUnlocked(acc.id);
          setAdding(false);
          open(acc);
        }}
      />
    );
  }

  if (!active) {
    return <AccountPicker accounts={accounts} onPick={open} onAdd={() => setAdding(true)} />;
  }

  if (!isUnlocked(active)) {
    return (
      <PinScreen
        account={active}
        onUnlock={() => {
          markUnlocked(active.id);
          setUnlockedTick((n) => n + 1);
        }}
        onSwitch={() => {
          setActiveId(null);
          setActive(null);
        }}
        onForgotRemove={() => {
          deleteAccount(active.id);
          setActive(null);
          refresh();
        }}
      />
    );
  }

  return (
    <AuthContext.Provider value={auth}>
      <AppProvider key={active.id} storageKey={active.storageKey}>
        {children}
      </AppProvider>
    </AuthContext.Provider>
  );
}

/* ---------------- screens ---------------- */

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-grid flex flex-col">
      <div className="flex-1 w-full max-w-sm mx-auto px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col animate-view-right">
        {children}
      </div>
    </div>
  );
}

function CreateAccount({
  existing,
  canCancel,
  onCancel,
  onCreate,
}: {
  existing: { name: string } | null;
  canCancel: boolean;
  onCancel: () => void;
  onCreate: (name: string, pin: string | null, remember: boolean) => Promise<void>;
}) {
  const [name, setName] = useState(existing?.name ?? '');
  const [usePin, setUsePin] = useState(false);
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const pinOk = !usePin || (/^\d{4}$/.test(pin) && pin === pin2);
  const ok = name.trim().length > 0 && pinOk && !busy;

  return (
    <Shell>
      {canCancel && (
        <button onClick={onCancel} aria-label="Back" className="w-10 h-10 -ml-2 mb-2 flex items-center justify-center rounded-full text-slate-300 hover:bg-white/10">
          <Icon name="⬅" size={20} />
        </button>
      )}
      <div className="flex flex-col items-center text-center">
        <Logo size={72} animated className="drop-shadow-[0_12px_32px_rgba(34,211,238,0.3)]" />
        <Wordmark className="text-3xl mt-4" />
        <h1 className="font-display text-xl font-bold text-white mt-6">
          {existing ? 'Save your progress to an account' : canCancel ? 'Add an account' : 'Create your account'}
        </h1>
        <p className="text-sm text-slate-400 mt-1.5">
          {existing
            ? 'Your quests, plan, money and character move into it. Nothing is lost.'
            : 'Plan your week, build habits, grow your money and level up every day.'}
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-slate-300">Your name</span>
          <input
            autoFocus={!existing?.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            autoComplete="given-name"
            placeholder="First name or nickname"
            className="mt-1.5 w-full rounded-2xl bg-white/5 border border-white/10 px-4 h-13 py-3 text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400/60"
          />
        </label>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-white">
                <Icon name="🔒" size="1.1em" className="icon-inline text-amber-300" />
                Protect with a PIN
              </p>
              <p className="text-xs text-slate-400">Handy if someone else uses this phone.</p>
            </div>
            <Toggle on={usePin} onChange={setUsePin} label="Protect with a PIN" />
          </div>
          {usePin && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <PinInput label="4-digit PIN" value={pin} onChange={setPin} />
                <PinInput label="Repeat PIN" value={pin2} onChange={setPin2} invalid={pin2.length === 4 && pin !== pin2} />
              </div>
              <label className="flex items-center gap-2.5 text-sm text-slate-300">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 accent-amber-500" />
                Remember me on this device
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-6" />
      <button
        disabled={!ok}
        onClick={async () => {
          setBusy(true);
          await onCreate(name, usePin ? pin : null, usePin ? remember : true);
        }}
        className="w-full rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:bg-white/10 disabled:text-slate-500 text-white text-base font-bold py-4"
      >
        {existing ? 'Save & continue' : 'Create account'}
      </button>
      <p className="text-center text-[11px] text-slate-500 mt-3 leading-relaxed">
        Your account is saved on this device. To move to another phone, export a backup in Settings.
      </p>
    </Shell>
  );
}

function AccountPicker({ accounts, onPick, onAdd }: { accounts: Account[]; onPick: (a: Account) => void; onAdd: () => void }) {
  return (
    <Shell>
      <div className="flex flex-col items-center text-center">
        <Logo size={56} />
        <h1 className="font-display text-2xl font-bold text-white mt-5">Who's using {APP_NAME}?</h1>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-8">
        {accounts.map((a) => (
          <button key={a.id} onClick={() => onPick(a)} className="relative flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.03] hover:border-amber-400/50 p-3 transition">
            <Avatar look={a.look} size={96} />
            <span className="mt-2 text-sm font-bold text-white truncate max-w-full">{a.name}</span>
            <span className="text-[11px] text-slate-500">{a.level ? `Level ${a.level}` : 'New'}</span>
            {a.pinHash && (
              <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-slate-200">
                <Icon name="🔒" size={12} />
              </span>
            )}
          </button>
        ))}
        <button onClick={onAdd} className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 hover:border-amber-400/50 p-3 text-slate-400 hover:text-white transition min-h-[150px]">
          <span className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-2xl font-light">+</span>
          <span className="mt-2 text-sm font-semibold">Add account</span>
        </button>
      </div>
    </Shell>
  );
}

function PinScreen({ account, onUnlock, onSwitch, onForgotRemove }: { account: Account; onUnlock: () => void; onSwitch: () => void; onForgotRemove: () => void }) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [wait, setWait] = useState(() => pinLockedFor(account.id));
  const [forgot, setForgot] = useState(false);

  useEffect(() => {
    if (!wait) return;
    const t = setInterval(() => setWait(pinLockedFor(account.id)), 500);
    return () => clearInterval(t);
  }, [wait, account.id]);

  async function press(d: string) {
    if (wait) return;
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      const ok = await verifyPin(account, next);
      recordPinAttempt(account.id, ok);
      if (ok) onUnlock();
      else {
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setPin('');
          setWait(pinLockedFor(account.id));
        }, 450);
        try {
          navigator.vibrate?.([40, 40, 40]);
        } catch {
          // optional
        }
      }
    }
  }

  if (forgot) {
    return (
      <Shell>
        <h1 className="font-display text-2xl font-bold text-white">Forgot your PIN?</h1>
        <p className="text-sm text-slate-400 mt-2">
          For your privacy the PIN can't be recovered. You can remove this account from this phone and start again. If you exported a backup, you can
          import it into a new account afterwards.
        </p>
        <div className="flex-1" />
        <button onClick={onForgotRemove} className="w-full rounded-2xl bg-red-500 hover:bg-red-400 text-white font-bold py-3.5">
          Remove {account.name}'s account from this phone
        </button>
        <button onClick={() => setForgot(false)} className="mt-2 py-2.5 text-sm font-semibold text-slate-300">
          Try again
        </button>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col items-center text-center">
        <Avatar look={account.look} size={88} />
        <h1 className="font-display text-xl font-bold text-white mt-4">Hi {account.name}</h1>
        <p className="text-sm text-slate-400">{wait ? `Too many tries. Wait ${wait}s` : 'Enter your PIN'}</p>
        <div className={`flex gap-3 mt-5 ${shake ? 'animate-pin-shake' : ''}`} aria-label={`${pin.length} of 4 digits entered`}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`w-3.5 h-3.5 rounded-full transition ${i < pin.length ? 'bg-amber-400 scale-110' : 'bg-white/15'}`} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-8 max-w-[17rem] mx-auto w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <PadKey key={d} onClick={() => void press(d)} disabled={!!wait}>
            {d}
          </PadKey>
        ))}
        <button onClick={() => setForgot(true)} className="text-xs font-semibold text-slate-500 hover:text-slate-300">
          Forgot?
        </button>
        <PadKey onClick={() => void press('0')} disabled={!!wait}>
          0
        </PadKey>
        <button onClick={() => setPin((p) => p.slice(0, -1))} aria-label="Delete digit" className="flex items-center justify-center text-slate-400 hover:text-white">
          <Icon name="⬅" size={22} />
        </button>
      </div>
      <div className="flex-1" />
      <button onClick={onSwitch} className="py-2.5 text-sm font-semibold text-slate-400 hover:text-white">
        Switch account
      </button>
    </Shell>
  );
}

function PadKey({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="h-16 rounded-2xl bg-white/[0.05] border border-white/10 hover:bg-white/10 disabled:opacity-40 font-display text-2xl font-bold text-white">
      {children}
    </button>
  );
}

function PinInput({ label, value, onChange, invalid }: { label: string; value: string; onChange: (v: string) => void; invalid?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="new-password"
        maxLength={4}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
        className={`mt-1 w-full rounded-xl bg-white/5 border px-3 h-11 text-center text-xl tracking-[0.5em] text-white focus:outline-none focus:border-amber-400/60 ${invalid ? 'border-red-400/60' : 'border-white/10'}`}
      />
    </label>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`shrink-0 w-12 h-7 rounded-full p-0.5 transition ${on ? 'bg-amber-500' : 'bg-white/15'}`}>
      <span className={`block w-6 h-6 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  );
}
