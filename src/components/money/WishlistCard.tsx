import { useEffect, useState } from 'react';
import type { WishItem } from '../../lib/types';
import { todayKey } from '../../lib/date';
import { centsToInput, dailyLimit, parseMoney, totalByKind } from '../../lib/money';
import { Icon, IconGrid } from '../Icon';
import { Modal } from '../Modal';
import { AmountInput, Field, card, inputClass, primaryBtn, secondaryBtn, useMoney } from './ui';

const WISH_ICONS = ['🎁', '👟', '🎮', '📱', '🎧', '💻', '👕', '🚗', '🏍', '✈', '🎸', '⌚'];

/**
 * Wishlist (like the wishlist apps topping the Lifestyle chart), joined up with your money:
 * how long each thing takes to afford, a one-day "do I still want it?" wait, one tap to turn it
 * into a savings goal, and a list you can share before your birthday.
 */
export function WishlistCard() {
  const { money, dispatch, fmt } = useMoney();
  const [editing, setEditing] = useState<WishItem | 'new' | null>(null);
  const [shared, setShared] = useState(false);
  const list = money.wishlist ?? [];
  const today = todayKey();
  const perDay = dailyLimit(money.categories);
  const savePerWeek = money.income ? Math.round((money.income.monthly * (money.saveRate ?? 0.3) * 12) / 52) : 0;
  const spending = totalByKind(money.accounts, 'spending');

  function afford(price: number): string {
    if (spending >= price) return `You could buy it now, but would you rather keep ${fmt(price)}?`;
    if (savePerWeek > 0) {
      const weeks = Math.ceil((price - Math.max(0, spending)) / savePerWeek);
      return `About ${weeks} ${weeks === 1 ? 'week' : 'weeks'} of saving with your plan`;
    }
    if (perDay > 0) {
      const days = Math.ceil(price / perDay);
      return `As much as ${days} days of your daily limit`;
    }
    return 'Set up a money plan to see how long it takes';
  }

  async function share() {
    const text = ['My wishlist 🎁', ...list.map((w) => `• ${w.name} (${fmt(w.price)})${w.link ? ` ${w.link}` : ''}`)].join('\n');
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 1500);
      }
    } catch {
      // cancelled
    }
  }

  return (
    <div className={card}>
      <div className="flex flex-wrap items-start justify-between gap-2 px-5 pt-4 pb-2">
        <div>
          <p className="text-sm font-semibold text-white">
            <Icon name="🎁" size="1.15em" className="icon-inline text-pink-300" />
            Wishlist
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{list.length ? `${list.length} ${list.length === 1 ? 'thing' : 'things'} · ${fmt(list.reduce((n, w) => n + w.price, 0), true)} in total` : 'Things you want one day. Add them here instead of buying on impulse.'}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 [&>button]:whitespace-nowrap">
          {list.length > 0 && (
            <button onClick={share} className={`${secondaryBtn} px-2.5 py-1.5 text-xs`}>
              <Icon name={shared ? '✓' : '📤'} size="1.1em" className="icon-inline" />
              {shared ? 'Copied' : 'Share'}
            </button>
          )}
          <button onClick={() => setEditing('new')} className={`${secondaryBtn} px-2.5 py-1.5 text-xs`}>
            + Add
          </button>
        </div>
      </div>
      {list.length > 0 && (
        <ul className="px-2 pb-3 space-y-1">
          {list.map((w) => {
            const fresh = w.addedAt >= today;
            return (
              <li key={w.id} className="rounded-xl px-3 py-2.5 hover:bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <button onClick={() => setEditing(w)} className="shrink-0 w-10 h-10 rounded-xl bg-pink-500/10 text-pink-300 flex items-center justify-center" aria-label={`Edit ${w.name}`}>
                    <Icon name={w.icon} size={19} />
                  </button>
                  <button onClick={() => setEditing(w)} className="flex-1 min-w-0 text-left">
                    <span className="block text-[15px] font-semibold text-white truncate">{w.name}</span>
                    <span className="block text-xs text-slate-400 truncate">{afford(w.price)}</span>
                  </button>
                  <span className="shrink-0 font-bold text-white tabular-nums">{fmt(w.price)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2 pl-[52px]">
                  {fresh ? (
                    <span className="rounded-full bg-amber-500/10 border border-amber-400/30 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                      <Icon name="⏳" size={11} className="icon-inline" />
                      Wait a day: still want it tomorrow?
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        dispatch({ type: 'MONEY_UPSERT_GOAL', goal: { name: w.name, icon: w.icon, target: w.price, weekly: savePerWeek || undefined }, newAccount: { name: w.name, amount: 0 } });
                        dispatch({ type: 'MONEY_DELETE_WISH', wishId: w.id });
                      }}
                      className="rounded-full bg-emerald-500/15 border border-emerald-400/40 px-2.5 py-1 text-[11px] font-bold text-emerald-200"
                    >
                      <Icon name="🐷" size={11} className="icon-inline" />
                      Start saving for it
                    </button>
                  )}
                  {w.link && (
                    <a href={w.link} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                      Open link
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <WishModal wish={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function WishModal({ wish, onClose }: { wish: WishItem | 'new' | null; onClose: () => void }) {
  const { dispatch, fmt } = useMoney();
  const existing = wish && wish !== 'new' ? wish : null;
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [link, setLink] = useState('');
  const [icon, setIcon] = useState('🎁');

  useEffect(() => {
    if (!wish) return;
    setName(existing?.name ?? '');
    setAmount(existing ? centsToInput(existing.price) : '');
    setLink(existing?.link ?? '');
    setIcon(existing?.icon ?? '🎁');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wish]);

  const cents = parseMoney(amount);
  const valid = name.trim().length > 0 && cents !== null && cents > 0;

  return (
    <Modal open={!!wish} onClose={onClose} title={existing ? 'Edit wish' : 'Add to your wishlist'}>
      <div className="space-y-4">
        <Field label="What is it?">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New sneakers" maxLength={40} className={inputClass} />
        </Field>
        <Field label="Price">
          <AmountInput value={amount} onChange={setAmount} invalid={amount !== '' && cents === null} />
        </Field>
        <Field label="Link (optional)">
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="shop.com/…" inputMode="url" className={inputClass} />
        </Field>
        <IconGrid options={WISH_ICONS} value={icon} onChange={setIcon} size="sm" />
        {cents !== null && cents > 0 && <p className="text-sm text-slate-400">Tip: wait a day before buying anything over {fmt(2000)}. Half the time, you won't want it any more.</p>}
        <div className="flex gap-2">
          {existing && (
            <button
              onClick={() => {
                dispatch({ type: 'MONEY_DELETE_WISH', wishId: existing.id });
                onClose();
              }}
              className={`${secondaryBtn} px-4 py-3 text-rose-200`}
            >
              Remove
            </button>
          )}
          <button
            disabled={!valid}
            onClick={() => {
              if (!valid || cents === null) return;
              dispatch({ type: 'MONEY_UPSERT_WISH', wish: { id: existing?.id, name, price: cents, icon, link } });
              onClose();
            }}
            className={`${primaryBtn} flex-1 py-3`}
          >
            {existing ? 'Save' : 'Add to wishlist'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
