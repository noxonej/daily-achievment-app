/**
 * D1 / D7 / D30 retention from the anonymous usage counts (C1). Pure function, used by
 * scripts/analytics/retention.cjs. An install's "first day" is the first day it was seen; it is
 * "back on day N" if it was seen exactly N days later (the classic definition).
 */
const DAY = 86400000;
const dayNum = (key) => Math.round(Date.parse(`${key}T00:00:00Z`) / DAY);

/** rows: [{ day: '2026-11-21', id: 'abc…', ev: ['open', …] }] → summary per cohort + overall. */
function retention(rows, today) {
  const seen = new Map(); // id → Set of day numbers
  const events = {};
  for (const r of rows) {
    if (!r || typeof r.id !== 'string' || typeof r.day !== 'string') continue;
    if (!seen.has(r.id)) seen.set(r.id, new Set());
    seen.get(r.id).add(dayNum(r.day));
    for (const e of Array.isArray(r.ev) ? r.ev : []) events[e] = (events[e] || 0) + 1;
  }
  const now = dayNum(today);
  const out = { installs: seen.size, events, d1: null, d7: null, d30: null };
  for (const n of [1, 7, 30]) {
    let eligible = 0;
    let back = 0;
    for (const days of seen.values()) {
      const first = Math.min(...days);
      if (first + n > now) continue; // too new to know yet
      eligible++;
      if (days.has(first + n)) back++;
    }
    out[`d${n}`] = eligible ? { eligible, back, pct: Math.round((back / eligible) * 1000) / 10 } : null;
  }
  return out;
}

module.exports = { retention };
