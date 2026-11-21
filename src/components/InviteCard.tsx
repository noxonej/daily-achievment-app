import { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useFriends, inviteLink, friendsSession } from '../lib/friends';
import { INVITE_COINS, INVITE_DAYS, MAX_INVITE_REWARDS, myInvites, type InviteRow } from '../lib/invites';
import { APP_URL } from '../lib/config';
import { logEvent } from '../lib/analytics';
import { L } from '../lib/lang';
import { Icon } from './Icon';
import { Coin } from './Coin';

/** Shares your invite link (or the plain app link when you're not connected yet). Returns a note to show. */
export async function inviteFriends(code?: string): Promise<string | null> {
  const url = code ? inviteLink(code) : APP_URL;
  const text = code
    ? L(`Level up your real life with me on Squzo! My friend code is ${code}.`, `Kelk savo tikro gyvenimo lygį kartu su manimi Squzo! Mano draugo kodas: ${code}.`)
    : L('Level up your real life with me on Squzo!', 'Kelk savo tikro gyvenimo lygį kartu su manimi Squzo!');
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Squzo', text, url });
      logEvent('invite_sent');
      return null;
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return null;
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    logEvent('invite_sent');
    return L('Link copied. Paste it to a friend!', 'Nuoroda nukopijuota. Įklijuok draugui!');
  } catch {
    return url;
  }
}

/** Small "Invite friends" button (level-ups, etc.). */
export function InviteButton({ className }: { className?: string }) {
  const f = useFriends();
  const [note, setNote] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-center">
      <button
        onClick={async (e) => {
          e.stopPropagation();
          setNote(await inviteFriends(f.me?.code));
        }}
        className={className ?? 'flex items-center gap-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] px-3.5 py-2 text-xs font-bold text-white'}
      >
        <Icon name="🤝" size={14} />
        {L('Invite friends', 'Pakviesk draugus')}
      </button>
      {note && <span className="mt-1 text-[11px] text-slate-300 max-w-[220px] break-all text-center">{note}</span>}
    </span>
  );
}

/** You tab: invite friends, see who's on their way to 3 days, and what you've earned. */
export function InviteCard({ onConnect }: { onConnect?: () => void }) {
  const { state } = useApp();
  const f = useFriends();
  const [rows, setRows] = useState<InviteRow[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const paid = state.invite?.claimed?.length ?? 0;
  const uid = f.me?.uid;

  useEffect(() => {
    const s = friendsSession();
    if (!uid || !s) return;
    let live = true;
    myInvites(s.accountId, uid).then((r) => live && setRows(r), () => undefined);
    return () => {
      live = false;
    };
  }, [uid, paid]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 shrink-0 rounded-2xl bg-violet-500/15 text-violet-300 flex items-center justify-center">
          <Icon name="🤝" size={22} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white">{L('Invite friends', 'Pakviesk draugus')}</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            {L(
              `When a friend uses Squzo on ${INVITE_DAYS} different days, you get ${INVITE_COINS} coins and the exclusive Squad cap. They get the cap too.`,
              `Kai draugas naudos Squzo ${INVITE_DAYS} skirtingas dienas, gausi ${INVITE_COINS} monetų ir išskirtinę Būrio kepurę. Draugas irgi gaus kepurę.`,
            )}
          </p>
        </div>
      </div>

      {rows.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {rows.slice(0, 6).map((r) => (
            <li key={r.friend} className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.04] px-3 py-2 text-xs">
              <span className="font-semibold text-white truncate">{r.name}</span>
              {r.days >= INVITE_DAYS ? (
                <span className="flex items-center gap-1 font-bold text-amber-300">
                  <Coin size={12} /> {L('Reward earned', 'Prizas gautas')}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-300 tabular-nums">
                  {Array.from({ length: INVITE_DAYS }, (_, i) => (
                    <span key={i} className={`w-2 h-2 rounded-full ${i < r.days ? 'bg-violet-400' : 'bg-white/15'}`} />
                  ))}
                  {r.days}/{INVITE_DAYS} {L('days', 'd.')}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center gap-2">
        {f.me ? (
          <button
            onClick={async () => setNote(await inviteFriends(f.me?.code))}
            className="flex-1 flex items-center justify-center gap-2 rounded-full bg-violet-500 hover:bg-violet-400 text-white font-bold py-2.5 text-sm"
          >
            <Icon name="🔗" size={16} />
            {L('Share my invite link', 'Dalintis kvietimo nuoroda')}
          </button>
        ) : (
          <button onClick={onConnect} className="flex-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white font-bold py-2.5 text-sm">
            {L('Connect in Friends to earn rewards', 'Prisijunk prie Draugų, kad gautum prizus')}
          </button>
        )}
        <span className="shrink-0 text-[11px] font-semibold text-slate-400 tabular-nums">
          {paid}/{MAX_INVITE_REWARDS}
        </span>
      </div>
      {note && <p className="mt-2 text-[11px] text-slate-300 break-all">{note}</p>}
    </div>
  );
}
