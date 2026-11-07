import { useEffect, useMemo, useState } from 'react';
import type { CryptoHolding } from '../../lib/types';
import {
  ASSET_TYPES,
  COINS,
  STABLECOINS,
  coinMeta,
  coinPrice,
  cryptoTotal,
  formatCoinAmount,
  formatCoinPrice,
  holdingValue,
  parseCoinAmount,
} from '../../lib/crypto';
import { CRYPTO_LESSONS } from '../../lib/moneyTips';
import { centsToInput, parseMoney, totalByKind } from '../../lib/money';
import { locale } from '../../lib/locale';
import { Icon } from '../Icon';
import { Modal } from '../Modal';
import { AmountInput, Field, card, inputClass, primaryBtn, useMoney } from './ui';


/** Dark text on bright coin colours (like Bitcoin orange), white on dark ones, so it's always readable. */
function readableOn(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const lum = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  return lum > 0.3 ? '#111827' : '#ffffff';
}

function CoinBadge({ symbol, color, size = 40 }: { symbol: string; color: string; size?: number }) {
  return (
    <span
      className="shrink-0 rounded-full flex items-center justify-center font-display font-extrabold"
      style={{ width: size, height: size, background: color, color: readableOn(color), fontSize: symbol.length > 3 ? size * 0.26 : size * 0.32 }}
    >
      {symbol.slice(0, 4)}
    </span>
  );
}

/**
 * Assets you track by hand: crypto, stocks and ETFs, gold, anything else. You type the amount and
 * the current price; the app shows the total, profit or loss, and how it's split. No accounts,
 * exchanges or wallets are connected.
 */
export function CryptoPanel() {
  const { money, fmt } = useMoney();
  const holdings = useMemo(() => money.crypto ?? [], [money.crypto]);
  const [editing, setEditing] = useState<CryptoHolding | 'new' | null>(null);
  const [lessonsOpen, setLessonsOpen] = useState(false);

  const total = cryptoTotal(money);
  const invested = holdings.reduce((s, h) => s + (h.invested ?? 0), 0);
  const investedValue = holdings.filter((h) => h.invested).reduce((s, h) => s + holdingValue(money, h), 0);
  const pnl = investedValue - invested;
  const everything = totalByKind(money.accounts, 'spending') + totalByKind(money.accounts, 'savings') + totalByKind(money.accounts, 'investing') + total;
  const share = everything > 0 ? Math.round((total / everything) * 100) : 0;
  const sorted = [...holdings].sort((a, b) => holdingValue(money, b) - holdingValue(money, a));
  const oldest = holdings.map((h) => h.priceAt).filter((d): d is string => !!d).sort()[0];
  const stale = oldest ? Date.now() - new Date(oldest).getTime() > 7 * 86400000 : false;
  const byType = ASSET_TYPES.map((t) => ({ ...t, value: holdings.filter((h) => (h.assetType ?? 'crypto') === t.id).reduce((s, h) => s + holdingValue(money, h), 0) })).filter((t) => t.value > 0);

  return (
    <div className="space-y-4">
      <div className={`${card} p-5`}>
        <p className="text-sm font-semibold text-slate-300">
          <Icon name="📈" size="1.15em" className="icon-inline text-sky-300" />
          Your assets
        </p>
        <p className="font-display text-3xl font-extrabold text-white tabular-nums mt-1">{fmt(total)}</p>
        {holdings.length > 0 && (
          <p className="text-sm mt-0.5 flex flex-wrap gap-x-3">
            {invested > 0 && (
              <span className={pnl >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                {pnl >= 0 ? '+' : '−'}
                {fmt(Math.abs(pnl))} ({Math.round((pnl / invested) * 100)}%) since you bought
              </span>
            )}
            {share > 0 && <span className="text-slate-400">{share}% of all your money</span>}
          </p>
        )}
        {byType.length > 1 && (
          <div className="mt-3">
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5" aria-label="How your assets are split">
              {byType.map((t) => (
                <span key={t.id} style={{ width: `${(t.value / total) * 100}%`, background: t.color }} />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[11px] text-slate-400">
              {byType.map((t) => (
                <span key={t.id} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                  {t.label} {Math.round((t.value / total) * 100)}%
                </span>
              ))}
            </div>
          </div>
        )}
        {holdings.length > 0 && (
          <p className={`text-[11px] mt-2 ${stale ? 'text-amber-300' : 'text-slate-500'}`}>
            Prices you entered{oldest ? ` · oldest from ${new Date(oldest).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })}` : ''}
            {stale ? ' · tap one to update its price' : ''}
          </p>
        )}
        <button onClick={() => setEditing('new')} className={`${primaryBtn} w-full py-3 mt-4`}>
          + Add an asset
        </button>
      </div>

      {sorted.length > 0 && (
        <div className={card}>
          <ul className="divide-y divide-white/[0.06]">
            {sorted.map((h) => {
              const meta = coinMeta(h);
              const price = coinPrice(money, h);
              const value = holdingValue(money, h);
              const gain = h.invested ? value - h.invested : null;
              return (
                <li key={h.id}>
                  <button onClick={() => setEditing(h)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03]">
                    <CoinBadge symbol={meta.symbol} color={meta.color} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[15px] font-semibold text-white truncate">{meta.name}</span>
                      <span className="block text-xs text-slate-400 tabular-nums truncate">
                        {formatCoinAmount(h.amount, locale())} {meta.symbol}
                        {price !== null && ` · ${formatCoinPrice(price, money.currency, locale())}`}
                      </span>
                    </span>
                    <span className="text-right shrink-0">
                      <span className="block font-bold text-white tabular-nums">{price === null ? '—' : fmt(value)}</span>
                      {gain !== null && (
                        <span className={`block text-xs tabular-nums ${gain >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                          {gain >= 0 ? '+' : '−'}
                          {fmt(Math.abs(gain), true)}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {total > 0 && sorted.length > 1 && (
            <div className="px-4 pb-4 pt-1">
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5" aria-label="How your crypto is split">
                {sorted.map((h) => {
                  const v = holdingValue(money, h);
                  return v > 0 ? <span key={h.id} style={{ width: `${(v / total) * 100}%`, background: coinMeta(h).color }} title={coinMeta(h).symbol} /> : null;
                })}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-400">
                {sorted.map((h) => {
                  const v = holdingValue(money, h);
                  return v > 0 ? (
                    <span key={h.id} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: coinMeta(h).color }} />
                      {coinMeta(h).symbol} {Math.round((v / total) * 100)}%
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className={card}>
        <button onClick={() => setLessonsOpen((o) => !o)} aria-expanded={lessonsOpen} className="w-full flex items-center gap-2 p-4 text-left">
          <Icon name="💡" size={17} className="text-yellow-300" />
          <span className="flex-1 text-sm font-bold text-white">Know this before you invest</span>
          <Icon name="›" size={18} className={`text-slate-500 transition-transform duration-300 ${lessonsOpen ? 'rotate-90' : ''}`} />
        </button>
        <div className="reveal-rows" data-open={lessonsOpen}>
        <div>
        <ul className="space-y-3 px-4 pb-4">
          {CRYPTO_LESSONS.map((l) => (
            <li key={l.title} className="flex gap-3">
              <span className="shrink-0 w-8 h-8 rounded-lg bg-white/5 text-amber-300 flex items-center justify-center">
                <Icon name={l.icon} size={16} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">{l.title}</span>
                <span className="block text-xs text-slate-400 leading-relaxed">{l.text}</span>
              </span>
            </li>
          ))}
        </ul>
        </div>
        </div>
      </div>
      <p className="text-center text-[11px] text-slate-500 px-6">Values use the prices you type in · not financial advice</p>

      <CoinModal holding={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function CoinModal({ holding, onClose }: { holding: CryptoHolding | 'new' | null; onClose: () => void }) {
  const { money, dispatch, fmt, undoable } = useMoney();
  const existing = holding && holding !== 'new' ? holding : null;
  const [type, setType] = useState<NonNullable<CryptoHolding['assetType']>>('crypto');
  const [coinId, setCoinId] = useState('bitcoin');
  const [customName, setCustomName] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [invested, setInvested] = useState('');
  const [manual, setManual] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!holding) return;
    const t = existing?.assetType ?? 'crypto';
    const known = existing && t === 'crypto' && COINS.some((c) => c.id === existing.coinId);
    setType(t);
    setCoinId(existing ? (known ? existing.coinId : 'custom') : 'bitcoin');
    setCustomName(existing && !known ? existing.name : '');
    setCustomSymbol(existing && !known ? existing.symbol : '');
    setAmount(existing ? String(existing.amount) : '');
    setInvested(existing?.invested ? centsToInput(existing.invested) : '');
    const p = existing ? coinPrice(money, existing) : null;
    setManual(p !== null ? String(Math.round(p) / 100) : '');
    setQ('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holding]);

  const pickCoin = type === 'crypto' && coinId !== 'custom';
  const meta = pickCoin ? COINS.find((c) => c.id === coinId)! : { symbol: customSymbol.toUpperCase() || (type === 'metal' ? 'oz' : ''), name: customName, color: ASSET_TYPES.find((t) => t.id === type)!.color };
  const amt = parseCoinAmount(amount);
  const investedCents = invested.trim() ? parseMoney(invested) : undefined;
  const manualNum = manual.trim() ? parseCoinAmount(manual) : null;
  const price = manualNum != null ? manualNum * 100 : undefined;
  const valid = amt !== null && amt > 0 && investedCents !== null && manualNum !== null && (pickCoin || customName.trim().length > 0);
  const filtered = COINS.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.symbol.toLowerCase().includes(q.toLowerCase()));
  const unit = meta.symbol || 'unit';

  function save() {
    if (!valid || amt === null || manualNum === null) return;
    // Known coins keep their id (handy for a future live-price option); everything else gets its own.
    const id = pickCoin ? coinId : existing && !COINS.some((c) => c.id === existing.coinId) ? existing.coinId : `asset-${Date.now()}`;
    const newPrice = Math.round(manualNum * 100 * 1e6) / 1e6;
    dispatch({
      type: 'MONEY_UPSERT_CRYPTO',
      holding: {
        id: existing?.id,
        coinId: id,
        symbol: meta.symbol,
        name: meta.name.trim() || meta.symbol,
        amount: amt,
        invested: investedCents ?? undefined,
        manualPrice: newPrice,
        assetType: type,
        priceAt: existing && existing.manualPrice === newPrice && existing.priceAt ? existing.priceAt : new Date().toISOString(),
      },
    });
    onClose();
  }

  return (
    <Modal open={!!holding} onClose={onClose} title={existing ? `Edit ${existing.name}` : 'Add an asset'}>
      <div className="space-y-4">
        {!existing && (
          <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Asset type">
            {ASSET_TYPES.map((t) => (
              <button
                key={t.id}
                role="radio"
                aria-checked={type === t.id}
                onClick={() => {
                  setType(t.id);
                  setCoinId(t.id === 'crypto' ? 'bitcoin' : 'custom');
                }}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${type === t.id ? 'border-amber-400 bg-amber-500/10 text-white' : 'border-white/10 text-slate-300 hover:border-white/25'}`}
              >
                <Icon name={t.icon} size={16} style={{ color: t.color }} />
                {t.label}
              </button>
            ))}
          </div>
        )}
        {!existing && type === 'crypto' && (
          <div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search coins" type="search" className={inputClass} />
            <div className="grid grid-cols-4 gap-2 mt-2 max-h-44 overflow-y-auto p-0.5" role="radiogroup" aria-label="Coin">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  role="radio"
                  aria-checked={coinId === c.id}
                  onClick={() => setCoinId(c.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl border py-2 transition ${coinId === c.id ? 'border-amber-400 bg-amber-500/10' : 'border-white/10 hover:border-white/25'}`}
                >
                  <CoinBadge symbol={c.symbol} color={c.color} size={30} />
                  <span className="text-[11px] font-bold text-white">{c.symbol}</span>
                </button>
              ))}
              <button
                role="radio"
                aria-checked={coinId === 'custom'}
                onClick={() => setCoinId('custom')}
                className={`flex flex-col items-center gap-1 rounded-xl border py-2 transition ${coinId === 'custom' ? 'border-amber-400 bg-amber-500/10' : 'border-white/10 hover:border-white/25'}`}
              >
                <CoinBadge symbol="?" color="#64748b" size={30} />
                <span className="text-[11px] font-bold text-white">Other</span>
              </button>
            </div>
          </div>
        )}
        {!pickCoin && (
          <div className="grid grid-cols-[1fr_6.5rem] gap-2">
            <Field label="Name">
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={type === 'stock' ? 'e.g. S&P 500 ETF' : type === 'metal' ? 'e.g. Gold coin' : type === 'crypto' ? 'e.g. Render' : 'e.g. Pokémon cards'}
                maxLength={30}
                className={inputClass}
              />
            </Field>
            <Field label={type === 'stock' ? 'Ticker' : type === 'metal' ? 'Unit' : 'Symbol'}>
              <input value={customSymbol} onChange={(e) => setCustomSymbol(e.target.value.slice(0, 6))} placeholder={type === 'stock' ? 'VOO' : type === 'metal' ? 'oz' : 'ABC'} className={inputClass} />
            </Field>
          </div>
        )}
        <Field label={`How many ${unit} do you have?`} hint="Fractions are fine, e.g. 0.0025">
          <input autoFocus={!!existing} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={`${inputClass} ${amount && amt === null ? '!border-red-400/60' : ''}`} />
        </Field>
        <Field label={`Price of 1 ${unit} now (${money.currency})`} hint="Check it in your banking or exchange app, then update it here now and then.">
          <input inputMode="decimal" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="0.00" className={`${inputClass} ${manual && manualNum === null ? '!border-red-400/60' : ''}`} />
        </Field>
        <Field label="What you paid in total (optional)" hint="Used to show your profit or loss">
          <AmountInput value={invested} onChange={setInvested} invalid={investedCents === null} />
        </Field>
        {amt !== null && amt > 0 && price !== undefined && (
          <p className="text-sm text-slate-300">
            Worth about <b className="text-white">{fmt(Math.round(price * amt))}</b>
            {STABLECOINS.has(coinId) && type === 'crypto' && <span className="block text-xs text-slate-500 mt-0.5">A stablecoin: meant to stay at about 1 US dollar.</span>}
          </p>
        )}
        <div className="flex gap-2">
          {existing && (
            <button
              onClick={() => {
                undoable({ type: 'MONEY_DELETE_CRYPTO', holdingId: existing.id }, `${existing.name} removed`);
                onClose();
              }}
              className="rounded-xl px-4 text-sm font-semibold text-red-300 hover:bg-red-500/10"
            >
              Delete
            </button>
          )}
          <button onClick={save} disabled={!valid} className={`${primaryBtn} flex-1 py-3`}>
            {existing ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
