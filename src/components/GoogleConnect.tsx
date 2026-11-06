import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import type { AppState } from '../lib/types';
import {
  downloadBackup,
  findBackup,
  googleConfigured,
  googleProfile,
  googleSignIn,
  googleSignOut,
  hasValidToken,
  isBackup,
  uploadBackup,
} from '../lib/google';
import { locale } from '../lib/locale';
import { ConfirmDialog } from './ConfirmDialog';
import { Toggle } from './AuthGate';

/** Google's "G" mark, for the sign-in buttons. */
export function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/** White "Continue with Google" button (Google's sign-in button style). */
export function GoogleButton({ onClick, busy, label = 'Continue with Google' }: { onClick: () => void; busy?: boolean; label?: string }) {
  const ready = googleConfigured();
  return (
    <button
      onClick={onClick}
      disabled={!ready || busy}
      className="w-full h-12 rounded-2xl bg-[#fff] border border-[#dadce0] text-[#1f1f1f] font-semibold text-[15px] flex items-center justify-center gap-3 hover:bg-[#f8f9fa] disabled:opacity-60 transition"
    >
      {busy ? <span className="w-5 h-5 rounded-full border-2 border-[#dadce0] border-t-[#4285F4] animate-spin" /> : <GoogleG />}
      {ready ? label : `${label} · coming soon`}
    </button>
  );
}

function ago(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`;
  return new Date(iso).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
}

/** Settings card: link a Google account, back up to it, restore from it. */
export function GoogleCard() {
  const auth = useAuth();
  const { state, dispatch } = useApp();
  const linked = auth?.account.google;
  const [busy, setBusy] = useState<null | 'connect' | 'backup' | 'restore'>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState<{ data: AppState; when?: string } | null>(null);
  if (!auth) return null;

  async function run(kind: 'connect' | 'backup' | 'restore', fn: () => Promise<void>) {
    setBusy(kind);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Something went wrong.' });
    } finally {
      setBusy(null);
    }
  }

  const connect = () =>
    run('connect', async () => {
      await googleSignIn();
      const profile = await googleProfile();
      const file = await findBackup();
      if (file) {
        // There's already a backup on this Google account: offer it instead of overwriting it.
        const data = await downloadBackup(file.id);
        auth.update({ google: { ...profile, fileId: file.id, lastBackup: file.modifiedTime, auto: true } });
        if (isBackup(data)) setPending({ data: data as unknown as AppState, when: file.modifiedTime });
        setMsg({ ok: true, text: `Connected to ${profile.email}.` });
        return;
      }
      const saved = await uploadBackup(state);
      auth.update({ google: { ...profile, fileId: saved.id, lastBackup: saved.modifiedTime, auto: true } });
      setMsg({ ok: true, text: 'Connected and backed up.' });
    });

  const backup = () =>
    run('backup', async () => {
      await googleSignIn(linked?.email);
      const id = linked?.fileId ?? (await findBackup())?.id;
      const saved = await uploadBackup(state, id);
      auth.update({ google: { ...linked!, fileId: saved.id, lastBackup: saved.modifiedTime } });
      setMsg({ ok: true, text: 'Backed up to Google.' });
    });

  const restore = () =>
    run('restore', async () => {
      await googleSignIn(linked?.email);
      const file = await findBackup();
      if (!file) throw new Error('No backup on this Google account yet.');
      const data = await downloadBackup(file.id);
      if (!isBackup(data)) throw new Error("That backup couldn't be read.");
      setPending({ data: data as unknown as AppState, when: file.modifiedTime });
    });

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-4">
      {linked ? (
        <>
          <div className="flex items-center gap-3">
            {linked.picture ? (
              <img src={linked.picture} alt="" referrerPolicy="no-referrer" className="w-11 h-11 rounded-full object-cover" />
            ) : (
              <span className="w-11 h-11 rounded-full bg-[#fff] flex items-center justify-center">
                <GoogleG size={22} />
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                <GoogleG size={14} /> {linked.name || 'Google account'}
              </p>
              <p className="text-xs text-slate-400 truncate">{linked.email}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">{linked.lastBackup ? `Last backup ${ago(linked.lastBackup)}` : 'Not backed up yet'}</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button onClick={backup} disabled={!!busy} className="rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white text-sm font-bold py-2.5">
              {busy === 'backup' ? 'Backing up…' : 'Back up now'}
            </button>
            <button onClick={restore} disabled={!!busy} className="rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 text-sm font-semibold text-slate-200 py-2.5">
              {busy === 'restore' ? 'Loading…' : 'Restore'}
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 mt-3">
            <span className="text-sm text-slate-300">Back up automatically</span>
            <Toggle on={linked.auto !== false} onChange={(v) => auth.update({ google: { ...linked, auto: v } })} label="Back up automatically" />
          </div>
          <button
            onClick={() => {
              void googleSignOut();
              auth.update({ google: undefined });
              setMsg(null);
            }}
            className="mt-2 text-xs font-semibold text-slate-500 hover:text-red-300"
          >
            Disconnect Google
          </button>
        </>
      ) : (
        <>
          <p className="text-sm font-bold text-white">Google account</p>
          <p className="text-xs text-slate-400 mt-0.5 mb-3">Keep your progress safe and get it back on any phone.</p>
          <GoogleButton onClick={connect} busy={busy === 'connect'} />
        </>
      )}
      {msg && <p className={`text-xs mt-2.5 ${msg.ok ? 'text-emerald-300' : 'text-amber-300'}`}>{msg.text}</p>}
      <ConfirmDialog
        open={!!pending}
        title="Restore from Google?"
        message={`This replaces what's on this phone with your Google backup${pending?.when ? ` from ${new Date(pending.when).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}` : ''}.`}
        confirmLabel="Restore"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) dispatch({ type: 'IMPORT_STATE', state: pending.data });
          setPending(null);
          setMsg({ ok: true, text: 'Restored from Google.' });
        }}
      />
    </div>
  );
}

/**
 * Backs up quietly when you leave the app (at most every 2 minutes), while the Google sign-in
 * from earlier is still fresh. Never opens a pop-up on its own.
 */
export function useGoogleAutoBackup() {
  const auth = useAuth();
  const { state } = useApp();
  const stateRef = useRef(state);
  stateRef.current = state;
  const authRef = useRef(auth);
  authRef.current = auth;
  const lastSent = useRef<string>('');

  useEffect(() => {
    const onHide = () => {
      const a = authRef.current;
      const g = a?.account.google;
      if (document.visibilityState !== 'hidden' || !a || !g || g.auto === false || !hasValidToken()) return;
      if (g.lastBackup && Date.now() - new Date(g.lastBackup).getTime() < 2 * 60_000) return;
      const json = JSON.stringify(stateRef.current);
      if (json === lastSent.current) return;
      lastSent.current = json;
      uploadBackup(stateRef.current, g.fileId)
        .then((r) => a.update({ google: { ...g, fileId: r.id, lastBackup: r.modifiedTime } }))
        .catch(() => {
          lastSent.current = '';
        });
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);
}
