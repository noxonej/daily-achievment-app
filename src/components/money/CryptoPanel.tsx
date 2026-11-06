import { useEffect, useMemo, useState } from 'react';
import type { CryptoHolding } from '../../lib/types';
import {
  COINS,
  STABLECOINS,
  coinMeta,
  coinPrice,
  cryptoChange24h,
  cryptoTotal,
  fetchCryptoPrices,
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
import { AmountInput, Field, card, inputClass, primaryBtn, secondaryBtn, useMoney } from './ui';

const STALE_MS = 5 * 60 * 1000;

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

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(iso).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
}

/** Crypto holdings with live prices, profit / loss, and the basics to know before buying. */
export function CryptoPanel() {
  const { money, dispatch, fmt } = useMoney();
  const holdings = useMemo(() => money.crypto ?? [], [money.crypto]);
  const [editing, setEditing] = useState<CryptoHolding | 'new' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lessonsOpen, setLessonsOpen] = useState(false);
  const prices = money.cryptoPrices;
  const ids = useMemo(() => [...new Set(holdings.map((h) => h.coinId))].sort().join(','), [holdings]);

  async function refresh() {
    const list = ids.split(',').filter((id) => COINS.some((c) => c.id === id));
    if (list.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      dispatch({ type: 'MONEY_SET_CRYPTO_PRICES', prices: await fetchCryptoPrices(list, money.currency) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Prices are unavailable right now.');
    } finally {
      setLoading(false);
    }
  }

  // Fetch fresh prices when the tab opens (or the coins / currency change) if the saved ones are old.
  useEffect(() => {
    if (!ids) return;
    const missing = ids.split(',').some((id) => COINS.some((c) => c.id === id) && !prices?.prices[id]);
    const stale = !prices || prices.currency !== money.currency || Date.now() - new Date(prices.fetchedAt).getTime() > STALE_MS;
    if (missing || stale) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, money.currency]);

  const total = cryptoTotal(money);
  const change = cryptoChange24h(money);
  const invested = holdings.reduce((s, h) => s + (h.invested ?? 0), 0);
  const investedValue = holdings.filter((h) => h.invested).reduce((s, h) => s + holdingValue(money, h), 0);
  const pnl = investedValue - invested;
  const everything = totalByKind(money.accounts, 'spending') + totalByKind(money.accounts, 'savings') + totalByKind(money.accounts, 'investing') + total;
  const share = everything > 0 ? Math.round((total / everything) * 100) : 0;
  const sorted = [...holdings].sort((a, b) => holdingValue(money, b) - holdingValue(money, a));

  return (
    <div className="space-y-4">
      <div className={`${card} p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-300">
              <Icon name="₿" size="1.15em" className="icon-inline text-orange-400" />
              Your crypto
            </p>
            <p className="font-display text-3xl font-extrabold text-white tabular-nums mt-1">{fmt(total)}</p>
            {holdings.length > 0 && (
              <p className="text-sm mt-0.5 flex flex-wrap gap-x-3">
                {change !== 0 && (
                  <span className={change > 0 ? 'text-emerald-300' : 'text-red-300'}>
                    {change > 0 ? '▲' : '▼'} {fmt(Math.abs(change))} today
                  </span>
                )}
                {invested > 0 && (
                  <span className={pnl >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                    {pnl >= 0 ? '+' : '−'}
                    {fmt(Math.abs(pnl))} ({invested > 0 ? Math.round((pnl / invested) * 100) : 0}%) overall
                  </span>
                )}
              </p>
            )}
          </div>
          {holdings.length > 0 && (
            <button onClick={refresh} disabled={loading} aria-label="Refresh prices" className={`${secondaryBtn} shrink-0 w-10 h-10 flex items-center justify-center`}>
              <Icon name="🔄" size={17} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
        {holdings.length > 0 && (
          <p className="text-[11px] text-slate-500 mt-2">
            {loading ? 'Checking prices…' : prices?.fetchedAt ? `Live prices · updated ${timeAgo(prices.fetchedAt)}` : 'No live prices yet'}
            {share > 0 && ` · ${share}% of all your money`}
          </p>
        )}
        {error && <p className="text-xs text-amber-300 mt-2">{error}</p>}
        <button onClick={() => setEditing('new')} className={`${primaryBtn} w-full py-3 mt-4`}>
          + Add a coin
        </button>
      </div>

      {sorted.length > 0 && (
        <div className={card}>
          <ul className="divide-y divide-white/[0.06]">
            {sorted.map((h) => {
              const meta = coinMeta(h);
              const price = coinPrice(money, h);
              const value = holdingValue(money, h);
              const live = prices?.currency === money.currency ? prices.prices[h.coinId] : undefined;
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
                        {live?.change24h !== undefined && (
                          <span className={live.change24h >= 0 ? ' text-emerald-300' : ' text-red-300'}>
                            {' '}
                            {live.change24h >= 0 ? '+' : ''}
                            {live.change24h.toFixed(1)}%
                          </span>
                        )}
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
          <span className="flex-1 text-sm font-bold text-white">Know this before you buy crypto</span>
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
      <p className="text-center text-[11px] text-slate-500 px-6">Prices by CoinGecko · not financial advice</p>

      <CoinModal holding={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function CoinModal({ holding, onClose }: { holding: CryptoHolding | 'new' | null; onClose: () => void }) {
  const { money, dispatch, fmt, undoable } = useMoney();
  const existing = holding && holding !== 'new' ? holding : null;
  const [coinId, setCoinId] = useState('bitcoin');
  const [customName, setCustomName] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [invested, setInvested] = useState('');
  const [manual, setManual] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!holding) return;
    setCoinId(existing?.coinId ?? 'bitcoin');
    setCustomName(existing && !COINS.some((c) => c.id === existing.coinId) ? existing.name : '');
    setCustomSymbol(existing && !COINS.some((c) => c.id === existing.coinId) ? existing.symbol : '');
    setAmount(existing ? String(existing.amount) : '');
    setInvested(existing?.invested ? centsToInput(existing.invested) : '');
    setManual(existing?.manualPrice ? String(existing.manualPrice / 100) : '');
    setQ('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holding]);

  const custom = coinId === 'custom' || (!!coinId && !COINS.some((c) => c.id === coinId));
  const [priceState, setPriceState] = useState<'idle' | 'loading' | 'failed'>('idle');

  // Picked a coin we don't have a live price for yet? Fetch it (with the ones already held).
  useEffect(() => {
    if (!holding || custom) return;
    const have = money.cryptoPrices?.currency === money.currency && money.cryptoPrices.prices[coinId];
    if (have) return;
    let cancelled = false;
    setPriceState('loading');
    const ids = [...new Set([...(money.crypto ?? []).map((c) => c.coinId), coinId])].filter((id) => COINS.some((c) => c.id === id));
    fetchCryptoPrices(ids, money.currency)
      .then((p) => {
        if (cancelled) return;
        dispatch({ type: 'MONEY_SET_CRYPTO_PRICES', prices: p });
        setPriceState('idle');
      })
      .catch(() => !cancelled && setPriceState('failed'));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coinId, holding]);
  const meta = custom ? { symbol: customSymbol.toUpperCase() || '?', name: customName || 'Other coin', color: '#64748b' } : COINS.find((c) => c.id === coinId)!;
  const amt = parseCoinAmount(amount);
  const investedCents = invested.trim() ? parseMoney(invested) : undefined;
  const manualNum = manual.trim() ? parseCoinAmount(manual) : undefined;
  const live = !custom && money.cryptoPrices?.currency === money.currency ? money.cryptoPrices.prices[coinId]?.price : undefined;
  const price = live ?? (manualNum != null ? manualNum * 100 : undefined);
  const valid = amt !== null && amt > 0 && investedCents !== null && manualNum !== null && (!custom || customName.trim().length > 0);
  const filtered = COINS.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.symbol.toLowerCase().includes(q.toLowerCase()));

  function save() {
    if (!valid || amt === null) return;
    const id = custom ? (existing && !COINS.some((c) => c.id === existing.coinId) ? existing.coinId : `custom-${Date.now()}`) : coinId;
    dispatch({
      type: 'MONEY_UPSERT_CRYPTO',
      holding: {
        id: existing?.id,
        coinId: id,
        symbol: meta.symbol,
        name: meta.name,
        amount: amt,
        invested: investedCents ?? undefined,
        manualPrice: manualNum != null ? Math.round(manualNum * 100 * 1e6) / 1e6 : undefined,
      },
    });
    onClose();
  }

  return (
    <Modal open={!!holding} onClose={onClose} title={existing ? `Edit ${existing.name}` : 'Add a coin'}>
      <div className="space-y-4">
        {!existing && (
          <div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search coins" type="search" className={inputClass} />
            <div className="grid grid-cols-4 gap-2 mt-2 max-h-48 overflow-y-auto p-0.5" role="radiogroup" aria-label="Coin">
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
                aria-checked={custom}
                onClick={() => setCoinId('custom')}
                className={`flex flex-col items-center gap-1 rounded-xl border py-2 transition ${custom ? 'border-amber-400 bg-amber-500/10' : 'border-white/10 hover:border-white/25'}`}
              >
                <CoinBadge symbol="?" color="#64748b" size={30} />
                <span className="text-[11px] font-bold text-white">Other</span>
              </button>
            </div>
          </div>
        )}
        {custom && (
          <div className="grid grid-cols-[1fr_6rem] gap-2">
            <Field label="Coin name">
              <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Render" maxLength={30} className={inputClass} />
            </Field>
            <Field label="Symbol">
              <input value={customSymbol} onChange={(e) => setCustomSymbol(e.target.value.slice(0, 6))} placeholder="RNDR" className={inputClass} />
            </Field>
          </div>
        )}
        <Field label={`How many ${meta.symbol} do you have?`} hint="Fractions are fine, e.g. 0.0025">
          <input autoFocus={!!existing} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={`${inputClass} ${amount && amt === null ? '!border-red-400/60' : ''}`} />
        </Field>
        <Field label="What you paid in total (optional)" hint="Used to show your profit or loss">
          <AmountInput value={invested} onChange={setInvested} invalid={investedCents === null} />
        </Field>
        {!custom && live === undefined && priceState === 'loading' && <p className="text-xs text-slate-400">Loading the live price…</p>}
        {(custom || (live === undefined && priceState === 'failed')) && (
          <Field label={`Price of 1 ${meta.symbol} (${money.currency})`} hint={custom ? 'Type the current price; update it now and then.' : "Couldn't load the live price (offline?). This is used until it loads."}>
            <input inputMode="decimal" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="0.00" className={`${inputClass} ${manualNum === null ? '!border-red-400/60' : ''}`} />
          </Field>
        )}
        {amt !== null && amt > 0 && price !== undefined && (
          <p className="text-sm text-slate-300">
            Worth about <b className="text-white">{fmt(Math.round(price * amt))}</b> right now
            {live !== undefined && <span className="text-slate-500"> (1 {meta.symbol} = {formatCoinPrice(live, money.currency, locale())})</span>}
            {STABLECOINS.has(coinId) && <span className="block text-xs text-slate-500 mt-0.5">A stablecoin: meant to stay at about 1 US dollar.</span>}
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
            {existing ? 'Save' : 'Add coin'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
