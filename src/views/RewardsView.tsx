import { useState } from 'react';
import { useApp } from '../store/AppContext';
import type { CustomReward } from '../lib/types';
import { Icon, IconGrid } from '../components/Icon';
import { Modal } from '../components/Modal';
import { Burst } from '../components/fx/Burst';

const SUGGESTIONS: Array<Omit<CustomReward, 'id'>> = [
  { title: '30 minutes of gaming', icon: '🎮', cost: 60 },
  { title: 'Favourite snack', icon: '🍔', cost: 80 },
  { title: 'An episode of a series', icon: '🎬', cost: 90 },
  { title: 'Sleep in an extra hour', icon: '😴', cost: 120 },
  { title: 'Movie night', icon: '🍿', cost: 250 },
  { title: 'Day off from one chore', icon: '🧹', cost: 300 },
  { title: 'Buy something from my wishlist', icon: '🛍', cost: 1500 },
];
const ICONS = ['🎮', '🍔', '🎬', '😴', '🍿', '🧹', '🛍', '☕', '🎵', '📱', '⚽', '🎁'];

/**
 * Your own rewards shop: real-life treats you set yourself and "buy" with the shards your quests
 * earn. It turns effort into something you actually want, and makes treats feel earned.
 */
export function RewardsView() {
  const { state, stats, dispatch, undoable } = useApp();
  const rewards = state.rewards ?? [];
  const [editing, setEditing] = useState<CustomReward | 'new' | null>(null);
  const [bought, setBought] = useState<string | null>(null);
  const shards = stats.availableShards;
  const history = [...(state.redemptions ?? [])].reverse().slice(0, 8);
  // Rough guide: a quest gives about 15 XP (and as many shards).
  const questsFor = (cost: number) => Math.max(1, Math.ceil((cost - shards) / 15));

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-violet-400/25 bg-gradient-to-br from-violet-500/15 via-white/[0.03] to-transparent p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-200">Your shards</p>
        <p className="font-display text-4xl font-black text-white tabular-nums mt-1 flex items-center gap-2">
          <Icon name="💎" size={30} className="text-cyan-300" fill="currentColor" />
          {shards}
        </p>
        <p className="text-sm text-slate-300 mt-1">Every quest earns shards. Spend them on treats you choose, or on outfits in the wardrobe.</p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-white">Treats you can buy</p>
        <button onClick={() => setEditing('new')} className="rounded-full bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold px-3 py-1.5">
          + New reward
        </button>
      </div>

      {rewards.length === 0 && <p className="text-sm text-slate-300">Pick a few treats to start. You can change the prices any time.</p>}
      {rewards.length === 0 ? null : (
        <ul className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2.5">
          {rewards.map((r) => {
            const can = shards >= r.cost;
            return (
              <li key={r.id} className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                {bought === r.id && <Burst x="28px" y="28px" color="var(--color-violet-400)" size={1.4} sparks={12} />}
                <div className="flex items-start gap-3">
                  <button onClick={() => setEditing(r)} aria-label={`Edit ${r.title}`} className="shrink-0 w-11 h-11 rounded-xl bg-violet-500/15 text-violet-200 flex items-center justify-center">
                    <Icon name={r.icon} size={21} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-white leading-snug">{r.title}</p>
                    <p className="text-xs text-cyan-300 font-bold mt-0.5 flex items-center gap-1">
                      <Icon name="💎" size={12} /> {r.cost}
                    </p>
                  </div>
                </div>
                <button
                  disabled={!can}
                  onClick={() => {
                    undoable({ type: 'REDEEM_REWARD', rewardId: r.id }, `Enjoy: ${r.title}`);
                    setBought(r.id);
                    setTimeout(() => setBought(null), 900);
                    try {
                      navigator.vibrate?.([20, 30, 40]);
                    } catch {
                      // optional
                    }
                  }}
                  className={`mt-3 w-full rounded-xl py-2 text-sm font-bold transition ${can ? 'bg-violet-500 hover:bg-violet-400 text-white' : 'bg-white/5 text-slate-500'}`}
                >
                  {can ? 'Buy it' : `About ${questsFor(r.cost)} more ${questsFor(r.cost) === 1 ? 'quest' : 'quests'}`}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {SUGGESTIONS.some((x) => !rewards.some((r) => r.title === x.title)) && (
        <div className="flex flex-wrap gap-2" aria-label="Reward ideas">
          {rewards.length > 0 && <p className="w-full text-xs font-bold uppercase tracking-wider text-slate-500">Ideas</p>}
          {SUGGESTIONS.filter((x) => !rewards.some((r) => r.title === x.title)).map((x) => (
            <button
              key={x.title}
              onClick={() => dispatch({ type: 'UPSERT_REWARD', reward: x })}
              className="flex items-center gap-1.5 rounded-full border border-dashed border-white/15 bg-white/[0.03] hover:border-amber-400/50 px-3 py-1.5 text-xs font-semibold text-slate-300"
            >
              <Icon name={x.icon} size={13} />+ {x.title} · {x.cost}
            </button>
          ))}
        </div>
      )}
      {history.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-bold text-white mb-2">Recently enjoyed</p>
          <ul className="space-y-1.5">
            {history.map((h) => (
              <li key={h.id} className="flex items-center gap-2 text-sm">
                <Icon name={h.icon} size={15} className="text-violet-300" />
                <span className="flex-1 truncate text-slate-200">{h.title}</span>
                <span className="text-xs text-slate-500">{new Date(h.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                <span className="text-xs text-cyan-300 tabular-nums">−{h.cost}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RewardModal reward={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function RewardModal({ reward, onClose }: { reward: CustomReward | 'new' | null; onClose: () => void }) {
  const { dispatch } = useApp();
  const existing = reward && reward !== 'new' ? reward : null;
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState('');
  const [icon, setIcon] = useState('🎁');
  const [key, setKey] = useState<unknown>(null);
  if (reward !== key) {
    setKey(reward);
    setTitle(existing?.title ?? '');
    setCost(existing ? String(existing.cost) : '');
    setIcon(existing?.icon ?? '🎁');
  }
  const n = Number(cost);
  const valid = title.trim().length > 0 && Number.isFinite(n) && n > 0;
  return (
    <Modal open={!!reward} onClose={onClose} title={existing ? 'Edit reward' : 'New reward'}>
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-slate-300">What's the treat?</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder="e.g. 1 hour of gaming" className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-3 h-11 text-base text-white focus:outline-none focus:border-amber-400/60" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-300">Price in shards</span>
          <input value={cost} onChange={(e) => setCost(e.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" placeholder="100" className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-3 h-11 text-base text-white focus:outline-none focus:border-amber-400/60" />
          <span className="block text-xs text-slate-500 mt-1">A quest gives about 10 to 30 shards. Small treats 50–150, big ones 500+.</span>
        </label>
        <IconGrid options={ICONS} value={icon} onChange={setIcon} size="sm" />
        <div className="flex gap-2">
          {existing && (
            <button
              onClick={() => {
                dispatch({ type: 'DELETE_REWARD', rewardId: existing.id });
                onClose();
              }}
              className="rounded-xl px-4 text-sm font-semibold text-red-300 hover:bg-red-500/10"
            >
              Delete
            </button>
          )}
          <button
            disabled={!valid}
            onClick={() => {
              dispatch({ type: 'UPSERT_REWARD', reward: { id: existing?.id, title, cost: n, icon } });
              onClose();
            }}
            className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white font-bold py-3"
          >
            {existing ? 'Save' : 'Add reward'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
