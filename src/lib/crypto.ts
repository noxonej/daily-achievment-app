import type { CryptoHolding, MoneyState } from './types';

/** Popular coins people hold, with their CoinGecko ids (used for live prices). */
export const COINS: Array<{ id: string; symbol: string; name: string; color: string }> = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', color: '#f7931a' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', color: '#627eea' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', color: '#14f195' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', color: '#f3ba2f' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', color: '#23292f' },
  { id: 'tether', symbol: 'USDT', name: 'Tether', color: '#26a17b' },
  { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin', color: '#2775ca' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', color: '#0033ad' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', color: '#c2a633' },
  { id: 'tron', symbol: 'TRX', name: 'TRON', color: '#ff060a' },
  { id: 'the-open-network', symbol: 'TON', name: 'Toncoin', color: '#0098ea' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', color: '#e84142' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', color: '#2a5ada' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', color: '#e6007a' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', color: '#345d9d' },
  { id: 'bitcoin-cash', symbol: 'BCH', name: 'Bitcoin Cash', color: '#8dc351' },
  { id: 'stellar', symbol: 'XLM', name: 'Stellar', color: '#7d00ff' },
  { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu', color: '#ffa409' },
  { id: 'pepe', symbol: 'PEPE', name: 'Pepe', color: '#3d9a3d' },
  { id: 'sui', symbol: 'SUI', name: 'Sui', color: '#4da2ff' },
  { id: 'near', symbol: 'NEAR', name: 'NEAR', color: '#00c08b' },
  { id: 'polygon-ecosystem-token', symbol: 'POL', name: 'Polygon', color: '#8247e5' },
];

export function coinMeta(h: Pick<CryptoHolding, 'coinId' | 'symbol' | 'name'> & { assetType?: CryptoHolding['assetType'] }) {
  const coin = (h.assetType ?? 'crypto') === 'crypto' ? COINS.find((c) => c.id === h.coinId) : undefined;
  return coin ?? { id: h.coinId, symbol: h.symbol, name: h.name, color: assetTypeOf(h).color };
}

export const STABLECOINS = new Set(['tether', 'usd-coin']);

/**
 * Price per unit in cents. Prices are entered by hand (manual tracking); a price saved from the old
 * live-price feature is only used for holdings that never had one typed in. Live price fetching
 * (fetchCryptoPrices below) is kept for a future opt-in integration but isn't called any more.
 */
export function coinPrice(money: MoneyState, h: CryptoHolding): number | null {
  if (h.manualPrice !== undefined) return h.manualPrice;
  const saved = money.cryptoPrices?.currency === money.currency ? money.cryptoPrices.prices[h.coinId]?.price : undefined;
  return saved ?? null;
}

export const ASSET_TYPES: Array<{ id: NonNullable<CryptoHolding['assetType']>; label: string; icon: string; color: string }> = [
  { id: 'crypto', label: 'Crypto', icon: '₿', color: '#f7931a' },
  { id: 'stock', label: 'Stock / ETF', icon: '📈', color: '#38bdf8' },
  { id: 'metal', label: 'Gold & metals', icon: '🪙', color: '#eab308' },
  { id: 'other', label: 'Other', icon: '💠', color: '#a78bfa' },
];

export function assetTypeOf(h: Pick<CryptoHolding, 'assetType'>) {
  return ASSET_TYPES.find((t) => t.id === (h.assetType ?? 'crypto'))!;
}

export function holdingValue(money: MoneyState, h: CryptoHolding): number {
  const p = coinPrice(money, h);
  return p === null ? 0 : Math.round(p * h.amount);
}

export function cryptoTotal(money: MoneyState): number {
  return (money.crypto ?? []).reduce((s, h) => s + holdingValue(money, h), 0);
}

/** Value change over the last 24 hours, in cents (only for coins with a live price). */
export function cryptoChange24h(money: MoneyState): number {
  let change = 0;
  for (const h of money.crypto ?? []) {
    const live = money.cryptoPrices?.currency === money.currency ? money.cryptoPrices.prices[h.coinId] : undefined;
    if (!live || live.change24h === undefined) continue;
    const now = live.price * h.amount;
    change += now - now / (1 + live.change24h / 100);
  }
  return Math.round(change);
}

/**
 * Live prices from CoinGecko's free public API (no key needed). Prices come back per coin in the
 * chosen currency and are stored in cents. Throws if offline or the currency isn't supported.
 */
export async function fetchCryptoPrices(ids: string[], currency: string): Promise<NonNullable<MoneyState['cryptoPrices']>> {
  const known = ids.filter((id) => COINS.some((c) => c.id === id));
  const vs = currency.toLowerCase();
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(known.join(','))}&vs_currencies=${vs}&include_24hr_change=true`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(res.status === 429 ? 'Too many price checks. Try again in a minute.' : 'Prices are unavailable right now.');
    const data = (await res.json()) as Record<string, Record<string, number>>;
    const prices: Record<string, { price: number; change24h?: number }> = {};
    for (const id of known) {
      const p = data[id]?.[vs];
      if (typeof p === 'number') prices[id] = { price: p * 100, change24h: data[id]?.[`${vs}_24h_change`] };
    }
    if (known.length > 0 && Object.keys(prices).length === 0) throw new Error(`Live prices aren't available in ${currency}. Type a price instead.`);
    return { currency, fetchedAt: new Date().toISOString(), prices };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') throw new Error('Price check timed out. Check your internet.');
    if (e instanceof TypeError) throw new Error("Couldn't reach the price service. Are you online?");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** Coin amounts: up to 8 decimals, no trailing zeros, grouped for the language. */
export function formatCoinAmount(n: number, loc: string): string {
  const digits = n >= 1000 ? 2 : n >= 1 ? 4 : 8;
  return n.toLocaleString(loc, { maximumFractionDigits: digits });
}

export function parseCoinAmount(input: string): number | null {
  const cleaned = input.replace(/\s/g, '').replace(',', '.');
  if (!/^\d*\.?\d*$/.test(cleaned) || cleaned === '' || cleaned === '.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** A coin's price, with more decimals for very cheap coins (e.g. 0.00001234). */
export function formatCoinPrice(cents: number, currency: string, loc: string): string {
  const v = cents / 100;
  const digits = v >= 1 ? 2 : v >= 0.01 ? 4 : 8;
  try {
    return new Intl.NumberFormat(loc, { style: 'currency', currency, minimumFractionDigits: v >= 1 ? 2 : 2, maximumFractionDigits: digits }).format(v);
  } catch {
    return `${v.toFixed(digits)} ${currency}`;
  }
}
