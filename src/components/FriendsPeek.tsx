import { friendsConfigured } from '../lib/firebase';
import { useFriends } from '../lib/friends';
import { FeedRow } from '../views/FriendsView';
import { Icon } from './Icon';

/** On Today: the latest two things friends did, so you see them the moment you open the app. */
export function FriendsPeek({ onOpen }: { onOpen: () => void }) {
  const f = useFriends();
  if (!friendsConfigured()) return null;
  if (f.status !== 'ready') {
    if (f.status !== 'signed-out') return null;
    return (
      <button onClick={onOpen} className="w-full flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left hover:border-white/20">
        <span className="shrink-0 w-9 h-9 rounded-xl bg-sky-500/15 text-sky-300 flex items-center justify-center">
          <Icon name="🤝" size={18} />
        </span>
        <span className="flex-1 min-w-0 text-sm font-semibold text-white">Add friends and race them this week</span>
        <Icon name="›" size={18} className="text-slate-500" />
      </button>
    );
  }
  const byUid = new Map(f.friends.map((p) => [p.uid, p]));
  const latest = f.feed.slice(0, 2);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
      <button onClick={onOpen} className="w-full flex items-center justify-between px-4 pt-3.5 pb-1 text-left">
        <span className="text-sm font-bold text-white">
          <Icon name="🤝" size="1.1em" className="icon-inline text-sky-300" />
          Friends
          {f.requests.length > 0 && <span className="ml-2 rounded-full bg-sky-500 text-white text-[10px] font-bold px-1.5 py-0.5">{f.requests.length} new</span>}
        </span>
        <Icon name="›" size={18} className="text-slate-500" />
      </button>
      {latest.length === 0 ? (
        <p className="px-4 pb-3.5 text-xs text-slate-400">{f.friends.length ? 'Nothing from friends yet today.' : 'Invite a friend with your code.'}</p>
      ) : (
        <ul className="px-2 pb-1.5">
          {latest.map((i) => (
            <FeedRow key={i.id} item={i} who={byUid.get(i.uid)} compact />
          ))}
        </ul>
      )}
    </div>
  );
}
