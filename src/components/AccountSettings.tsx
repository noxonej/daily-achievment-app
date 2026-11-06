import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { ConfirmDialog } from './ConfirmDialog';
import { Toggle } from './AuthGate';

/** Account card in Settings: PIN, remember-me, switch / sign out, delete. */
export function AccountSettings() {
  const auth = useAuth();
  const { state } = useApp();
  const [pinOpen, setPinOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!auth) return null;
  const { account } = auth;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-3">
        <Avatar look={state.character} size={52} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{account.name}</p>
          <p className="text-xs text-slate-400">
            Account on this device · {account.pinHash ? 'PIN on' : 'No PIN'} · since {new Date(account.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="mt-4 divide-y divide-white/[0.06] rounded-xl border border-white/[0.06] overflow-hidden">
        <button onClick={() => setPinOpen(true)} className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-white/[0.03]">
          <Icon name="🔒" size={17} className="text-amber-300" />
          <span className="flex-1 text-sm text-slate-200">{account.pinHash ? 'Change or remove PIN' : 'Add a PIN'}</span>
          <span className="text-slate-500">›</span>
        </button>
        {account.pinHash && (
          <div className="flex items-center gap-3 px-3.5 py-3">
            <Icon name="📱" size={17} className="text-amber-300" />
            <span className="flex-1 text-sm text-slate-200">
              Remember me on this device
              <span className="block text-[11px] text-slate-500">Off = ask for your PIN each time the app opens</span>
            </span>
            <Toggle on={account.remember} onChange={(v) => auth.update({ remember: v })} label="Remember me on this device" />
          </div>
        )}
        <button onClick={() => auth.signOut()} className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-white/[0.03]">
          <Icon name="🔄" size={17} className="text-amber-300" />
          <span className="flex-1 text-sm text-slate-200">Switch account or sign out</span>
          <span className="text-slate-500">›</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
        Accounts live on this phone. To use yours on another device, export a backup below and import it there.
      </p>
      <button onClick={() => setConfirmDelete(true)} className="mt-2 text-xs font-semibold text-red-300/80 hover:text-red-300">
        Delete this account
      </button>

      <PinModal open={pinOpen} hasPin={!!account.pinHash} onClose={() => setPinOpen(false)} onSave={async (pin) => {
        await auth.setPin(pin);
        setPinOpen(false);
      }} />
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${account.name}'s account?`}
        message="This removes the account and all its quests, plan, money and character from this phone. Export a backup first if you might want it back. This can't be undone."
        confirmLabel="Delete forever"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => auth.remove()}
      />
    </div>
  );
}

function PinModal({ open, hasPin, onClose, onSave }: { open: boolean; hasPin: boolean; onClose: () => void; onSave: (pin: string | null) => Promise<void> }) {
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const ok = /^\d{4}$/.test(pin) && pin === pin2;
  const field = 'w-full rounded-xl bg-white/5 border border-white/10 px-3 h-12 text-center text-2xl tracking-[0.5em] text-white focus:outline-none focus:border-amber-400/60';
  return (
    <Modal open={open} onClose={onClose} title={hasPin ? 'Change PIN' : 'Add a PIN'}>
      <div className="space-y-3">
        <input type="password" inputMode="numeric" autoComplete="new-password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" aria-label="New PIN" className={field} />
        <input type="password" inputMode="numeric" autoComplete="new-password" maxLength={4} value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" aria-label="Repeat new PIN" className={field} />
        {pin2.length === 4 && pin !== pin2 && <p className="text-xs text-red-300">The PINs don't match.</p>}
        <button disabled={!ok} onClick={() => void onSave(pin).then(() => { setPin(''); setPin2(''); })} className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white font-bold py-3">
          Save PIN
        </button>
        {hasPin && (
          <button onClick={() => void onSave(null)} className="w-full py-2 text-sm font-semibold text-red-300">
            Remove PIN
          </button>
        )}
      </div>
    </Modal>
  );
}
