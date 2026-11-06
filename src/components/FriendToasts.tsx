import { dismissFriendToast, useFriends } from '../lib/friends';
import { normalizeLook } from '../data/avatar';
import { Avatar } from './Avatar';
import { Icon } from './Icon';

/** Little banners when a friend does something ("Lukas: Ran 5.0 km"), a cheer, or a request. */
export function FriendToasts({ onOpen }: { onOpen: () => void }) {
  const { toasts } = useFriends();
  if (!toasts.length) return null;
  return (
    <div className="fixed top-[calc(env(safe-area-inset-top)+0.75rem)] left-0 right-0 z-[65] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((t) => {
        let look;
        try {
          look = t.look ? normalizeLook(JSON.parse(t.look)) : undefined;
        } catch {
          look = undefined;
        }
        return (
          <button
            key={t.id}
            onClick={() => {
              dismissFriendToast(t.id);
              onOpen();
            }}
            className="pointer-events-auto toast-drop flex items-center gap-3 bg-raised border border-white/10 shadow-xl shadow-black/40 rounded-2xl pl-2 pr-4 py-2 max-w-sm w-full text-left"
          >
            <span className="relative w-10 h-10 shrink-0">
              {look ? (
                <span className="absolute inset-0 rounded-full overflow-hidden bg-surface">
                  <Avatar look={look} size={40} className="scale-[1.15] translate-y-[2px]" />
                </span>
              ) : (
                <span className="absolute inset-0 rounded-full bg-amber-500/15 text-amber-300 flex items-center justify-center">
                  <Icon name={t.icon} size={18} />
                </span>
              )}
            </span>
            <span className="flex-1 min-w-0 text-sm text-white leading-snug line-clamp-2">{t.text}</span>
            {look && <Icon name={t.icon} size={18} className="shrink-0 text-amber-300" />}
          </button>
        );
      })}
    </div>
  );
}
