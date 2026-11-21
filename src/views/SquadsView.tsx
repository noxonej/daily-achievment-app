import { ShareButton } from '../components/ShareButton';
import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { connectFriends, hasCheered, cheer, useFriends } from '../lib/friends';
import { friendsConfigured } from '../lib/firebase';
import { createSquad, joinSquad, leaveSquad, loadSquad, squadLink, type Squad } from '../lib/squads';
import { challengeBoard, challengeLink, createChallenge, fetchChallenge, submitScore, type BoardRow } from '../lib/challenges';
import { challengeDay, fullDays, isFinished, MAX_CHALLENGE_QUESTS, MAX_SQUAD, ticks } from '../lib/social';
import { takePendingLink, type PendingLink } from '../lib/links';
import { addDaysToKey, todayKey } from '../lib/date';
import { parseLook } from '../data/avatar';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { Fire } from '../components/fx/Fire';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { L } from '../lib/lang';
import { timeAgo } from './FriendsView';
import type { Challenge, JoinedChallenge } from '../lib/types';
import { premiumLocked } from '../lib/premium';
import { paywall } from '../lib/paywall';

const card = 'rounded-[24px] border border-white/10 bg-white/[0.03] p-4';
const input = 'w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-[var(--mood2)]';
const primary = 'rounded-xl bg-[var(--mood2)] text-slate-950 font-bold px-4 py-2.5 disabled:opacity-50';
const ghost = 'rounded-xl bg-white/[0.07] hover:bg-white/[0.12] text-white font-semibold px-4 py-2.5 disabled:opacity-50';

async function copy(text: string): Promise<boolean> {
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return true;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** You → Squads: challenges (anyone, even without an account) and squads (needs the friends sign-in). */
export function SquadsView() {
  const [pending] = useState<PendingLink | null>(() => takePendingLink());
  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
      <div className="px-1">
        <p className="font-display text-2xl font-bold text-white">{L('Squads & challenges', 'Komandos ir iššūkiai')}</p>
        <p className="text-sm text-slate-400">{L('Compete with your people, right inside Squzo. No Discord needed.', 'Varžykis su savo žmonėmis tiesiog Squzo. Discord nereikia.')}</p>
      </div>
      <Challenges pending={pending?.kind === 'challenge' ? pending.code : undefined} />
      <Squads pending={pending?.kind === 'squad' ? pending.code : undefined} />
    </div>
  );
}

/* ---------------------------------------------------------------- challenges */

function Challenges({ pending }: { pending?: string }) {
  const { state, dispatch } = useApp();
  const [code, setCode] = useState('');
  const [found, setFound] = useState<Challenge | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const joined = state.challenges ?? [];

  const look = useCallback(
    async (raw: string) => {
      setErr(null);
      setBusy(true);
      try {
        const c = await fetchChallenge(raw);
        if (!c) setErr(L('No challenge with that code.', 'Tokio iššūkio nėra.'));
        else setFound(c);
      } catch {
        setErr(L("Couldn't reach the server. Are you online?", 'Nepavyko pasiekti serverio. Ar esi prisijungęs prie interneto?'));
      } finally {
        setBusy(false);
      }
    },
    [],
  );
  useEffect(() => {
    if (pending && !joined.some((c) => c.code === pending)) void look(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <section className="space-y-3">
      <h2 className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{L('Challenges', 'Iššūkiai')}</h2>
      {found && (
        <div className={`${card} border-[var(--mood2)]/40`}>
          <ChallengeHead c={found} />
          <ul className="mt-3 space-y-1.5">
            {found.quests.map((q, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-200">
                <Icon name={q.icon} size={15} className="text-slate-400" />
                {q.title}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <button
              className={`${primary} flex-1`}
              onClick={() => {
                dispatch({ type: 'CHALLENGE_JOIN', challenge: found });
                setFound(null);
                setCode('');
              }}
            >
              {L('Join challenge', 'Prisijungti')}
            </button>
            <button className={ghost} onClick={() => setFound(null)}>
              {L('Not now', 'Ne dabar')}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">{L('No account needed. Sign in with Google later to appear on the leaderboard.', 'Paskyros nereikia. Prisijunk su Google vėliau, kad būtum lyderių lentelėje.')}</p>
        </div>
      )}

      {joined.map((c) => (
        <JoinedChallengeCard key={c.code} c={c} />
      ))}

      <div className={card}>
        <p className="text-sm font-bold text-white">{L('Join a challenge', 'Prisijunk prie iššūkio')}</p>
        <div className="mt-2 flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABCD2345" maxLength={12} className={`${input} uppercase tracking-widest`} aria-label={L('Challenge code', 'Iššūkio kodas')} />
          <button className={primary} disabled={busy || code.trim().length < 8} onClick={() => void look(code)}>
            {busy ? '…' : L('Find', 'Rasti')}
          </button>
        </div>
        {err && <p className="mt-2 text-xs text-rose-300">{err}</p>}
        <button
          className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-2.5 text-sm font-semibold text-slate-300 hover:text-white"
          onClick={() => (premiumLocked('create-challenge') ? paywall.open('create-challenge') : setCreating(true))}
        >
          <Icon name="➕" size={15} />
          {L('Host your own challenge', 'Sukurk savo iššūkį')}
        </button>
      </div>
      <CreateChallenge open={creating} onClose={() => setCreating(false)} onMade={(c) => dispatch({ type: 'CHALLENGE_JOIN', challenge: c })} />
    </section>
  );
}

function ChallengeHead({ c }: { c: Challenge }) {
  const day = challengeDay(c);
  return (
    <div className="flex items-start gap-3">
      <span className="w-11 h-11 rounded-2xl bg-[color-mix(in_srgb,var(--mood2)_18%,transparent)] text-[var(--mood2)] flex items-center justify-center text-xl shrink-0">
        <Icon name={c.badge} size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-bold text-white leading-tight">{c.title}</p>
        <p className="text-xs text-slate-400">
          {L('by', 'veda')} {c.hostName} · {c.days} {L('days', 'd.')} ·{' '}
          {day === 0 ? L(`starts ${c.start}`, `prasideda ${c.start}`) : day > c.days ? L('ended', 'baigėsi') : L(`day ${day} of ${c.days}`, `${day} diena iš ${c.days}`)}
        </p>
      </div>
    </div>
  );
}

function JoinedChallengeCard({ c }: { c: JoinedChallenge }) {
  const { dispatch } = useApp();
  const f = useFriends();
  const [board, setBoard] = useState<BoardRow[] | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const today = todayKey();
  const day = challengeDay(c);
  const live = day >= 1 && day <= c.days && !c.finishedAt;
  const doneToday = new Set(c.done[today] ?? []);
  const finished = isFinished(c);

  useEffect(() => {
    if (f.me) submitScore(c);
  }, [c, f.me]);

  return (
    <div className={`${card} ${finished ? 'border-amber-300/40 bg-amber-400/[0.06]' : ''}`}>
      <ChallengeHead c={c} />
      <div className="mt-3 flex gap-1" aria-label={L(`${fullDays(c)} of ${c.days} days done`, `Atlikta ${fullDays(c)} iš ${c.days} d.`)}>
        {Array.from({ length: c.days }, (_, i) => {
          const d = addDaysToKey(c.start, i);
          const full = new Set(c.done[d] ?? []).size >= c.quests.length;
          const part = (c.done[d] ?? []).length > 0;
          return <span key={i} className={`h-2 flex-1 rounded-full ${full ? 'bg-[var(--mood2)]' : part ? 'bg-[var(--mood2)]/40' : d === today ? 'bg-white/25' : 'bg-white/[0.08]'}`} />;
        })}
      </div>
      {finished ? (
        <div className="mt-3 flex items-center gap-3">
          <p className="flex-1 text-sm font-bold text-amber-200">
            {L('Challenge finished! Badge earned', 'Iššūkis įveiktas! Ženklelis gautas')} <Icon name={c.badge} size={15} className="icon-inline" />
          </p>
          <ShareButton kind="challenge" challenge={c} />
        </div>
      ) : live ? (
        <ul className="mt-3 space-y-1.5">
          {c.quests.map((q, i) => {
            const on = doneToday.has(i);
            return (
              <li key={i}>
                <button
                  onClick={() => dispatch({ type: 'CHALLENGE_TICK', code: c.code, index: i })}
                  aria-pressed={on}
                  className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${on ? 'border-[var(--mood2)]/50 bg-[var(--mood2)]/10' : 'border-white/10 bg-white/[0.02]'}`}
                >
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${on ? 'bg-[var(--mood2)] border-[var(--mood2)] text-slate-950' : 'border-white/25'}`}>{on && <Icon name="✓" size={14} />}</span>
                  <Icon name={q.icon} size={16} className="text-slate-400" />
                  <span className={`flex-1 text-sm font-semibold ${on ? 'text-white' : 'text-slate-200'}`}>{q.title}</span>
                  <span className="text-[11px] font-bold text-[var(--mood2)]">+10</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-slate-400">{day === 0 ? L('It starts soon. Get ready!', 'Netrukus prasidės. Pasiruošk!') : L('This challenge has ended.', 'Šis iššūkis baigėsi.')}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <button className="rounded-full bg-white/[0.07] px-3 py-1.5 font-semibold text-white" onClick={async () => setBoard(await challengeBoard(c.code))}>
          <Icon name="🏆" size={12} className="icon-inline" />
          {L('Leaderboard', 'Lyderiai')}
        </button>
        <button
          className="rounded-full bg-white/[0.07] px-3 py-1.5 font-semibold text-white"
          onClick={async () => setCopied(await copy(`${L('Join my challenge on Squzo', 'Prisijunk prie mano iššūkio Squzo')}: ${c.title} ${challengeLink(c.code)}`))}
        >
          <Icon name="📤" size={12} className="icon-inline" />
          {copied ? L('Link ready', 'Nuoroda paruošta') : L('Invite', 'Pakviesti')}
        </button>
        <span className="rounded-full bg-white/[0.04] px-3 py-1.5 font-mono tracking-widest text-slate-400 select-all">{c.code}</span>
        <button className="ml-auto rounded-full px-2 py-1.5 text-slate-500 hover:text-rose-300" onClick={() => setLeaving(true)}>
          {L('Leave', 'Palikti')}
        </button>
      </div>
      {board && (
        <ol className="mt-3 space-y-1">
          {board.length === 0 && <li className="text-xs text-slate-400">{L('Nobody on the board yet. Sign in (You → Friends) to be first.', 'Lentelėje dar nieko nėra. Prisijunk (Tu → Draugai) ir būk pirmas.')}</li>}
          {board.map((r, i) => (
            <li key={r.uid} className={`flex items-center gap-3 rounded-xl px-2 py-1.5 ${r.uid === f.me?.uid ? 'bg-white/[0.06]' : ''}`}>
              <span className="w-5 text-center font-display font-extrabold text-slate-400 tabular-nums">{i + 1}</span>
              <span className="flex-1 text-sm font-semibold text-white truncate">
                {r.name}
                {r.finished && <Icon name={c.badge} size={13} className="icon-inline ml-1 text-amber-300" />}
              </span>
              <span className="text-xs text-slate-400 tabular-nums">
                {r.fullDays}/{c.days} {L('days', 'd.')}
              </span>
              <span className="font-display font-bold text-white tabular-nums text-sm">{r.score}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-2 text-[11px] text-slate-500 tabular-nums">
        {ticks(c)} {L('quests ticked', 'užduočių atlikta')} · {fullDays(c)}/{c.days} {L('full days', 'pilnų dienų')}
      </p>
      <ConfirmDialog
        open={leaving}
        title={L('Leave this challenge?', 'Palikti iššūkį?')}
        message={L('Your progress in it will be removed from this phone.', 'Tavo pažanga jame bus ištrinta iš šio telefono.')}
        confirmLabel={L('Leave', 'Palikti')}
        danger
        onCancel={() => setLeaving(false)}
        onConfirm={() => {
          dispatch({ type: 'CHALLENGE_LEAVE', code: c.code });
          setLeaving(false);
        }}
      />
    </div>
  );
}

const BADGES = ['🏅', '🏆', '🔥', '⚔', '💪', '🧠', '💰', '⭐'];

function CreateChallenge({ open, onClose, onMade }: { open: boolean; onClose: () => void; onMade: (c: Challenge) => void }) {
  const { state } = useApp();
  const f = useFriends();
  const [title, setTitle] = useState('');
  const [host, setHost] = useState(state.profile?.name ?? '');
  const [days, setDays] = useState<7 | 14 | 30>(7);
  const [start, setStart] = useState(() => addDaysToKey(todayKey(), 1));
  const [quests, setQuests] = useState<string[]>(['', '']);
  const [badge, setBadge] = useState('🏅');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [made, setMade] = useState<Challenge | null>(null);

  async function go() {
    setErr(null);
    setBusy(true);
    try {
      const c = await createChallenge({ title, hostName: host, days, start, quests: quests.map((t) => ({ title: t, icon: '✅' })), badge });
      onMade(c);
      setMade(c);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={L('Host a challenge', 'Sukurk iššūkį')}>
      {made ? (
        <div className="space-y-3 text-center">
          <Icon name={made.badge} size={40} className="mx-auto text-[var(--mood2)]" />
          <p className="font-display text-xl font-bold text-white">{made.title}</p>
          <p className="text-sm text-slate-300">{L('Share this link. People can join without an account.', 'Pasidalink nuoroda. Prisijungti galima ir be paskyros.')}</p>
          <p className="rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-200 break-all select-all">{challengeLink(made.code)}</p>
          <button className={`${primary} w-full`} onClick={() => void copy(`${made.title}: ${challengeLink(made.code)}`)}>
            {L('Share link', 'Dalintis nuoroda')}
          </button>
          <button className={`${ghost} w-full`} onClick={() => { setMade(null); onClose(); }}>
            {L('Done', 'Baigta')}
          </button>
        </div>
      ) : !f.me ? (
        <p className="text-sm text-slate-300">{L('Connect with Google first (You → Friends). Hosting needs an account so nobody else can change your challenge.', 'Pirmiausia prisijunk su Google (Tu → Draugai). Kurti reikia paskyros, kad niekas kitas negalėtų pakeisti tavo iššūkio.')}</p>
      ) : (
        <div className="space-y-3">
          <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder={L('e.g. 7 days of discipline', 'pvz. 7 disciplinos dienos')} aria-label={L('Name', 'Pavadinimas')} />
          <input className={input} value={host} onChange={(e) => setHost(e.target.value)} maxLength={40} placeholder={L('Host name', 'Vedėjo vardas')} aria-label={L('Host name', 'Vedėjo vardas')} />
          <div className="grid grid-cols-3 gap-2">
            {([7, 14, 30] as const).map((d) => (
              <button key={d} onClick={() => setDays(d)} aria-pressed={days === d} className={`rounded-xl border py-2 text-sm font-bold ${days === d ? 'border-[var(--mood2)] bg-[var(--mood2)]/15 text-white' : 'border-white/10 text-slate-300'}`}>
                {d} {L('days', 'd.')}
              </button>
            ))}
          </div>
          <label className="block text-xs font-semibold text-slate-400">
            {L('Starts', 'Pradžia')}
            <input type="date" className={`${input} mt-1`} value={start} min={todayKey()} onChange={(e) => setStart(e.target.value)} />
          </label>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400">{L('Quests every day', 'Kasdienės užduotys')}</p>
            {quests.map((q, i) => (
              <input key={i} className={input} value={q} maxLength={60} placeholder={[L('e.g. 10,000 steps', 'pvz. 10 000 žingsnių'), L('e.g. Read 10 pages', 'pvz. Perskaityk 10 psl.')][i] ?? ''} onChange={(e) => setQuests(quests.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`${L('Quest', 'Užduotis')} ${i + 1}`} />
            ))}
            {quests.length < MAX_CHALLENGE_QUESTS && (
              <button className="text-xs font-semibold text-[var(--mood2)]" onClick={() => setQuests([...quests, ''])}>
                + {L('Add a quest', 'Pridėti užduotį')}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={L('Finish badge', 'Ženklelis')}>
            {BADGES.map((b) => (
              <button key={b} role="radio" aria-checked={badge === b} onClick={() => setBadge(b)} className={`w-10 h-10 rounded-xl border flex items-center justify-center ${badge === b ? 'border-[var(--mood2)] bg-[var(--mood2)]/15 text-white' : 'border-white/10 text-slate-300'}`}>
                <Icon name={b} size={18} />
              </button>
            ))}
          </div>
          {err && <p className="text-xs text-rose-300">{err}</p>}
          <button className={`${primary} w-full`} disabled={busy} onClick={() => void go()}>
            {busy ? '…' : L('Create challenge', 'Sukurti iššūkį')}
          </button>
        </div>
      )}
    </Modal>
  );
}

/* ---------------------------------------------------------------- squads */

function Squads({ pending }: { pending?: string }) {
  const { state, dispatch } = useApp();
  const auth = useAuth();
  const f = useFriends();
  const [name, setName] = useState('');
  const [code, setCode] = useState(pending ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const codes = state.squads ?? [];
  const connected = !!f.me;

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{L('Squads', 'Komandos')}</h2>
      {!connected ? (
        <div className={card}>
          <p className="text-sm font-bold text-white">{L(`Squads: up to ${MAX_SQUAD} friends, one streak`, `Komandos: iki ${MAX_SQUAD} draugų, vienas ugnelės ruožas`)}</p>
          <p className="mt-1 text-xs text-slate-400">{L("The squad streak only grows when everyone does at least one quest. There's a weekly squad board and a squad feed.", 'Komandos ruožas auga tik tada, kai kiekvienas atlieka bent vieną užduotį. Yra savaitės lentelė ir komandos naujienos.')}</p>
          {friendsConfigured() && auth && (
            <button className={`${primary} mt-3 w-full`} disabled={busy} onClick={() => void run(() => connectFriends(auth.account.id, auth.account.google?.email))}>
              {L('Connect with Google', 'Prisijungti su Google')}
            </button>
          )}
          {msg && <p className="mt-2 text-xs text-rose-300">{msg}</p>}
        </div>
      ) : (
        <>
          {codes.map((c) => (
            <SquadCard key={c} code={c} onGone={() => dispatch({ type: 'SQUAD_REMOVE', code: c })} />
          ))}
          <div className={card}>
            <p className="text-sm font-bold text-white">{L('Join a squad', 'Prisijunk prie komandos')}</p>
            <div className="mt-2 flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABCD2345" maxLength={12} className={`${input} uppercase tracking-widest`} aria-label={L('Squad code', 'Komandos kodas')} />
              <button
                className={primary}
                disabled={busy || code.trim().length < 8}
                onClick={() =>
                  void run(async () => {
                    const r = await joinSquad(code);
                    dispatch({ type: 'SQUAD_ADD', code: r.code });
                    setCode('');
                  })
                }
              >
                {L('Join', 'Jungtis')}
              </button>
            </div>
            <p className="mt-4 text-sm font-bold text-white">{L('Start a squad', 'Sukurk komandą')}</p>
            <div className="mt-2 flex gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder={L('Squad name', 'Komandos pavadinimas')} className={input} aria-label={L('Squad name', 'Komandos pavadinimas')} />
              <button
                className={primary}
                disabled={busy || !name.trim() || codes.length >= 10}
                onClick={() =>
                  premiumLocked('create-squad')
                    ? paywall.open('create-squad')
                    : void run(async () => {
                        const c = await createSquad(name);
                        dispatch({ type: 'SQUAD_ADD', code: c });
                        setName('');
                      })
                }
              >
                {L('Create', 'Kurti')}
              </button>
            </div>
            {msg && <p className="mt-2 text-xs text-rose-300">{msg}</p>}
          </div>
        </>
      )}
    </section>
  );
}

function SquadCard({ code, onGone }: { code: string; onGone: () => void }) {
  const f = useFriends();
  const [s, setS] = useState<Squad | null | 'loading' | 'error'>('loading');
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [cheered, setCheered] = useState<Set<string>>(() => new Set());
  const load = useCallback(async () => {
    try {
      const r = await loadSquad(code);
      setS(r);
    } catch {
      setS('error');
    }
  }, [code]);
  useEffect(() => {
    void load();
  }, [load]);

  if (s === 'loading') return <div className={`${card} text-sm text-slate-400`}>{L('Loading squad…', 'Kraunama…')}</div>;
  if (s === 'error') return <div className={`${card} text-sm text-slate-400`}>{L("Couldn't load this squad. Pull to refresh later.", 'Nepavyko įkelti komandos.')}</div>;
  if (!s) {
    return (
      <div className={`${card} text-sm text-slate-400 flex items-center justify-between`}>
        {L("You're not in this squad any more.", 'Tu nebe šioje komandoje.')}
        <button className="text-xs font-semibold text-white" onClick={onGone}>
          {L('Remove', 'Pašalinti')}
        </button>
      </div>
    );
  }
  const me = f.me?.uid;
  return (
    <div className={card}>
      <div className="flex items-center gap-3">
        <span className="relative w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
          <Fire size={26} lit={s.streak.days > 0} intensity={s.streak.days >= 30 ? 3 : s.streak.days >= 7 ? 2 : 1} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-display text-lg font-bold text-white truncate">{s.name}</p>
          <p className="text-xs text-slate-400">
            <b className="text-orange-300 tabular-nums">{s.streak.days}</b> {L('day squad streak', 'd. komandos ruožas')} · {s.streak.doneToday}/{s.streak.total} {L('done today', 'atliko šiandien')}
          </p>
        </div>
      </div>
      <div className="mt-3 flex -space-x-2" aria-label={L('Who did a quest today', 'Kas šiandien atliko užduotį')}>
        {s.members.map((m) => {
          const today = (m.profile?.active ?? '').split(',').includes(todayKey());
          return (
            <span key={m.uid} title={m.name} className={`w-9 h-9 rounded-full overflow-hidden border-2 bg-raised ${today ? 'border-emerald-400' : 'border-white/10 opacity-60'}`}>
              <Avatar look={parseLook(m.profile?.look)} size={32} />
            </span>
          );
        })}
      </div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{L('This week', 'Ši savaitė')}</p>
      <ol className="mt-1 space-y-0.5">
        {s.members.map((m, i) => (
          <li key={m.uid} className={`flex items-center gap-3 rounded-xl px-2 py-1.5 ${m.uid === me ? 'bg-white/[0.06]' : ''}`}>
            <span className={`w-5 text-center font-display font-extrabold tabular-nums ${i === 0 ? 'text-yellow-300' : 'text-slate-500'}`}>{i + 1}</span>
            <span className="flex-1 text-sm font-semibold text-white truncate">{m.uid === me ? `${m.name} (${L('you', 'tu')})` : m.name}</span>
            <span className="font-display font-bold text-white tabular-nums text-sm">{m.weekXp} XP</span>
          </li>
        ))}
      </ol>
      {s.feed.length > 0 && (
        <>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{L('Squad feed', 'Komandos naujienos')}</p>
          <ul className="mt-1 space-y-0.5">
            {s.feed.slice(0, 12).map((it) => {
              const done = cheered.has(it.id) || hasCheered(it.id);
              return (
                <li key={it.id} className="flex items-center gap-2.5 py-1.5">
                  <Icon name={it.icon} size={15} className="text-amber-300 shrink-0" />
                  <span className="flex-1 min-w-0 text-[13px] text-slate-200">
                    <b className="text-white">{it.name}</b> {it.text.charAt(0).toLowerCase() + it.text.slice(1)} <span className="text-slate-500">· {timeAgo(it.at)}</span>
                  </span>
                  {it.uid !== me && (
                    <button
                      disabled={done}
                      onClick={() => {
                        setCheered(new Set([...cheered, it.id]));
                        void cheer(it, code);
                      }}
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${done ? 'border-amber-400/40 bg-amber-500/15 text-amber-200' : 'border-white/10 text-slate-300'}`}
                    >
                      {done ? '🙌' : L('Cheer', 'Palaikyti')}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <button className="rounded-full bg-white/[0.07] px-3 py-1.5 font-semibold text-white" onClick={async () => setCopied(await copy(`${L('Join my squad on Squzo', 'Prisijunk prie mano komandos Squzo')}: ${s.name} ${squadLink(code)}`))}>
          <Icon name="📤" size={12} className="icon-inline" />
          {copied ? L('Link ready', 'Nuoroda paruošta') : L('Invite', 'Pakviesti')}
        </button>
        <span className="rounded-full bg-white/[0.04] px-3 py-1.5 font-mono tracking-widest text-slate-400 select-all">{code}</span>
        <span className="text-slate-500">
          {s.members.length}/{MAX_SQUAD}
        </span>
        <button className="ml-auto rounded-full px-2 py-1.5 text-slate-500 hover:text-rose-300" onClick={() => setLeaving(true)}>
          {L('Leave', 'Palikti')}
        </button>
      </div>
      <ConfirmDialog
        open={leaving}
        title={L(`Leave ${s.name}?`, `Palikti ${s.name}?`)}
        message={L('You can join again with the code.', 'Galėsi vėl prisijungti su kodu.')}
        confirmLabel={L('Leave', 'Palikti')}
        danger
        onCancel={() => setLeaving(false)}
        onConfirm={() => {
          setLeaving(false);
          void leaveSquad(code).finally(onGone);
        }}
      />
    </div>
  );
}
