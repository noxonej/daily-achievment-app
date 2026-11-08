import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { friendsConfigured } from '../lib/firebase';
import { googleProfile } from '../lib/google';
import {
  DEFAULT_SHARING,
  acceptRequest,
  addFriendByCode,
  cheer,
  connectFriends,
  declineRequest,
  disconnectFriends,
  hasCheered,
  inviteLink,
  refreshFriends,
  removeFriend,
  useFriends,
  weekXp,
  type ActivityItem,
  type FriendProfile,
} from '../lib/friends';
import { normalizeLook } from '../data/avatar';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { GoogleButton } from '../components/GoogleConnect';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Character, Sharing } from '../lib/types';

function lookOf(p: { look?: string } | undefined): Character {
  try {
    return normalizeLook(p?.look ? JSON.parse(p.look) : undefined);
  } catch {
    return normalizeLook(undefined);
  }
}

export function timeAgo(at: number): string {
  const m = Math.round((Date.now() - at) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

/** Friends: your code, requests, this week's leaderboard and what your friends got done. */
export function FriendsView() {
  const f = useFriends();
  if (!friendsConfigured()) return <Pitch soon />;
  if (f.status === 'off' || f.status === 'signed-out' || (f.status === 'error' && !f.me)) return <Pitch error={f.error} />;
  if (!f.me) return <p className="text-center text-sm text-slate-400 py-10">Loading friends…</p>;
  return <Connected />;
}

function Pitch({ soon, error }: { soon?: boolean; error?: string }) {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    if (!auth) return;
    setBusy(true);
    setErr(null);
    try {
      await connectFriends(auth.account.id, auth.account.google?.email);
      if (!auth.account.google) {
        const p = await googleProfile();
        auth.update({ google: { ...p, auto: true } });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-center">
      <div className="flex justify-center -space-x-3">
        {['#22d3ee', '#a78bfa', '#fb7185'].map((c, i) => (
          <span key={c} className="w-14 h-14 rounded-full border-4 border-canvas flex items-center justify-center text-[#fff] friends-bob" style={{ background: c, animationDelay: `${i * 0.2}s` }}>
            <Icon name={['🏃', '🔥', '🏆'][i]} size={22} />
          </span>
        ))}
      </div>
      <p className="font-display text-xl font-extrabold text-white mt-4">Better with friends</p>
      <p className="text-sm text-slate-400 mt-1.5 max-w-xs mx-auto">
        See when friends finish quests, run or keep their streak, race them on the weekly leaderboard and cheer each other on.
      </p>
      <p className="text-xs text-slate-500 mt-3">
        <Icon name="🔒" size="1.1em" className="icon-inline" />
        Your money, plans, diary and notes are never shared.
      </p>
      <div className="mt-5">
        {soon ? (
          <p className="rounded-xl bg-white/5 border border-white/10 py-3 text-sm font-semibold text-slate-300">Coming soon</p>
        ) : (
          <GoogleButton onClick={go} busy={busy} label="Connect with Google" />
        )}
        {(err || error) && <p className="text-xs text-amber-300 mt-2">{err || error}</p>}
      </div>
    </div>
  );
}

function Connected() {
  const f = useFriends();
  const { state, stats, dispatch } = useApp();
  const auth = useAuth();
  const me = f.me!;
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [removing, setRemoving] = useState<FriendProfile | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const share: Sharing = { ...DEFAULT_SHARING, ...(state.sharing ?? {}) };
  const byUid = new Map(f.friends.map((p) => [p.uid, p]));

  async function add() {
    setBusy(true);
    setMsg(null);
    try {
      setMsg({ ok: true, text: await addFriendByCode(code) });
      setCode('');
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Something went wrong.' });
    } finally {
      setBusy(false);
    }
  }

  async function invite() {
    const url = inviteLink(me.code);
    const text = `Join me on Dayforge! My friend code is ${me.code}.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Dayforge', text, url });
        return;
      }
    } catch {
      // cancelled: fall back to copying
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setMsg({ ok: true, text: url });
    }
  }

  const board = [
    { ...me, weekXp: weekXp(state), streak: stats.currentStreak, level: stats.level, isMe: true },
    ...f.friends.map((p) => ({ ...p, isMe: false })),
  ].sort((a, b) => (b.weekXp ?? 0) - (a.weekXp ?? 0));

  return (
    <div className="space-y-4">
      {/* Your code */}
      <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.10] to-transparent p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Your friend code</p>
            <p className="font-display text-2xl font-extrabold text-white tracking-wider mt-0.5">{me.code}</p>
          </div>
          <button onClick={invite} className="shrink-0 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold px-4 py-2.5 flex items-center gap-1.5">
            <Icon name="📤" size={16} />
            {copied ? 'Copied!' : 'Invite'}
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void add();
          }}
          className="flex gap-2 mt-3"
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Friend's code, e.g. TOM-4821"
            aria-label="Friend's code"
            autoCapitalize="characters"
            maxLength={9}
            className="flex-1 min-w-0 rounded-xl bg-white/5 border border-white/10 px-3 h-11 text-[15px] text-white tracking-wide placeholder:text-slate-500 placeholder:tracking-normal focus:outline-none focus:border-amber-400/60"
          />
          <button type="submit" disabled={busy || code.trim().length < 7} className="shrink-0 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white text-sm font-bold px-4">
            {busy ? '…' : 'Add'}
          </button>
        </form>
        {msg && <p className={`text-xs mt-2 ${msg.ok ? 'text-emerald-300' : 'text-amber-300'}`}>{msg.text}</p>}
      </div>

      {/* Requests */}
      {f.requests.length > 0 && (
        <section className="rounded-2xl border border-sky-400/30 bg-sky-500/[0.06] p-2">
          <p className="px-2 pt-1.5 pb-1 text-xs font-bold uppercase tracking-wider text-sky-300">Friend requests</p>
          {f.requests.map((r) => (
            <div key={r.uid} className="flex items-center gap-3 px-2 py-2 animate-row-in">
              <span className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-200 flex items-center justify-center font-display font-bold">{r.name.slice(0, 1).toUpperCase()}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-white truncate">{r.name}</span>
                <span className="block text-xs text-slate-400">{r.code}</span>
              </span>
              <button onClick={() => void acceptRequest(r.uid)} className="rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold px-3 py-2">
                Accept
              </button>
              <button onClick={() => void declineRequest(r.uid)} aria-label={`Decline ${r.name}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10">
                <Icon name="✕" size={15} />
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Leaderboard */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <p className="text-sm font-bold text-white">
            <Icon name="🏆" size="1.1em" className="icon-inline text-yellow-300" />
            This week
          </p>
          <button onClick={() => void refreshFriends()} aria-label="Refresh" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10">
            <Icon name="🔄" size={15} className={f.status === 'loading' ? 'animate-spin' : ''} />
          </button>
        </div>
        <ol className="px-2 pb-2 rows-stagger">
          {board.map((p, i) => (
            <li
              key={p.uid}
              className={`flex items-center gap-3 rounded-xl px-2 py-2 ${p.isMe ? 'bg-amber-500/[0.08]' : ''}`}
              onContextMenu={(e) => {
                if (p.isMe) return;
                e.preventDefault();
                setRemoving(p);
              }}
            >
              <span className={`w-6 text-center font-display font-extrabold tabular-nums ${i === 0 ? 'text-yellow-300' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-300' : 'text-slate-500'}`}>{i + 1}</span>
              <span className="w-10 h-10 rounded-full overflow-hidden bg-raised shrink-0">
                <Avatar look={p.isMe ? state.character : lookOf(p)} size={40} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-white truncate">{p.isMe ? `${p.name} (you)` : p.name}</span>
                <span className="block text-xs text-slate-400">
                  {p.level ? `LV ${p.level}` : ''}
                  {(p.streak ?? 0) > 0 && (
                    <span className="text-orange-300">
                      {p.level ? ' · ' : ''}
                      <Icon name="🔥" size="1em" className="icon-inline !mr-0.5" fill="currentColor" />
                      {p.streak}
                    </span>
                  )}
                </span>
              </span>
              <span className="font-display font-bold text-white tabular-nums">{p.weekXp ?? 0} XP</span>
              {!p.isMe && (
                <button onClick={() => setRemoving(p)} aria-label={`Options for ${p.name}`} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-300">
                  <Icon name="⋮" size={15} />
                </button>
              )}
            </li>
          ))}
        </ol>
        {f.friends.length === 0 && (
          <p className="px-4 pb-4 -mt-1 text-xs text-slate-400">Add a friend with their code, or tap Invite and send them your link.</p>
        )}
      </section>

      {/* Feed */}
      {f.feed.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03]">
          <p className="px-4 pt-4 pb-1 text-sm font-bold text-white">What friends did</p>
          <ul className="px-2 pb-2 rows-stagger">
            {f.feed.map((item) => (
              <FeedRow key={item.id} item={item} who={byUid.get(item.uid)} />
            ))}
          </ul>
        </section>
      )}

      {/* Cheers received */}
      {f.cheers.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-bold text-white mb-2">
            <Icon name="🙌" size="1.1em" className="icon-inline text-amber-300" />
            Cheers for you
          </p>
          <ul className="space-y-1.5">
            {f.cheers.slice(0, 6).map((c) => (
              <li key={c.id} className="text-sm text-slate-300">
                <b className="text-white">{c.fromName}</b> cheered “{c.text.replace(/^Finished “|”$/g, '')}” <span className="text-slate-500 text-xs">· {timeAgo(c.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Privacy */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03]">
        <button onClick={() => setPrivacyOpen((o) => !o)} aria-expanded={privacyOpen} className="w-full flex items-center gap-2 p-4 text-left">
          <Icon name="🔒" size={16} className="text-emerald-300" />
          <span className="flex-1 text-sm font-bold text-white">What friends can see</span>
          <Icon name="›" size={18} className={`text-slate-500 transition-transform duration-300 ${privacyOpen ? 'rotate-90' : ''}`} />
        </button>
        <div className="reveal-rows" data-open={privacyOpen}>
          <div>
            <div className="px-4 pb-2 divide-y divide-white/[0.06]">
              {(
                [
                  ['quests', 'Finished quests and weekly XP'],
                  ['runs', 'Runs'],
                  ['streak', 'Streak'],
                  ['level', 'Level'],
                  ['badges', 'New badges'],
                ] as Array<[keyof Sharing, string]>
              ).map(([k, label]) => (
                <label key={k} className="flex items-center justify-between gap-3 py-2.5 text-sm text-slate-200">
                  {label}
                  <input type="checkbox" checked={share[k]} onChange={(e) => dispatch({ type: 'SET_SHARING', sharing: { [k]: e.target.checked } })} className="w-5 h-5 accent-amber-500" />
                </label>
              ))}
            </div>
            <p className="px-4 pb-3 text-xs text-slate-500">Never shared: your money, savings, investments, crypto, week plan, diary and notes.</p>
            {auth && (
              <button onClick={() => disconnectFriends(auth.account.id)} className="w-full border-t border-white/[0.06] py-3 text-xs font-semibold text-slate-500 hover:text-red-300">
                Disconnect from friends
              </button>
            )}
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={!!removing}
        title={`Remove ${removing?.name}?`}
        message="You'll stop seeing each other's activity. You can add each other again with your codes."
        confirmLabel="Remove friend"
        danger
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) void removeFriend(removing.uid);
          setRemoving(null);
        }}
      />
    </div>
  );
}

export function FeedRow({ item, who, compact }: { item: ActivityItem; who?: FriendProfile; compact?: boolean }) {
  const [done, setDone] = useState(() => hasCheered(item.id));
  return (
    <li className="flex items-center gap-3 rounded-xl px-2 py-2">
      <span className="relative w-10 h-10 shrink-0">
        <span className="absolute inset-0 rounded-full overflow-hidden bg-raised">
          <Avatar look={lookOf(who)} size={40} />
        </span>
        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-raised border border-white/10 text-amber-300 flex items-center justify-center">
          <Icon name={item.icon} size={11} />
        </span>
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block text-sm text-slate-200 ${compact ? 'truncate' : ''}`}>
          <b className="text-white">{who?.name ?? 'Friend'}</b> {item.text.charAt(0).toLowerCase() + item.text.slice(1)}
        </span>
        <span className="block text-[11px] text-slate-500">{timeAgo(item.at)} ago</span>
      </span>
      {!compact && (
        <button
          onClick={() => {
            setDone(true);
            void cheer(item);
          }}
          disabled={done}
          aria-label={done ? 'Cheered' : `Cheer ${who?.name ?? 'friend'}`}
          className={`shrink-0 h-9 px-3 rounded-full border text-sm font-bold transition ${done ? 'border-amber-400/40 bg-amber-500/15 text-amber-200 cheer-pop' : 'border-white/10 text-slate-300 hover:border-amber-400/50 hover:text-white'}`}
        >
          👏{done ? '' : ' Cheer'}
        </button>
      )}
    </li>
  );
}
