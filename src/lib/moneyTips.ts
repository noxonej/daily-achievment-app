import type { MoneyState } from './types';
import { addDaysToKey, parseKey, todayKey } from './date';
import { dailyLimit, formatMoney, lastNDays, spentOn, totalByKind } from './money';
import { cryptoTotal } from './crypto';
import { hashString } from './hash';

export interface MoneyTip {
  id: string;
  icon: string;
  title: string;
  text: string;
  tone: 'good' | 'warn' | 'idea';
}

/** Monthly cost of bills and subscriptions, in cents. */
export function billsPerMonth(money: MoneyState): number {
  return (money.bills ?? []).reduce((s, b) => s + b.amount, 0);
}

/** Spending per category over a date range (inclusive), biggest first. */
export function spendByCategory(money: MoneyState, from: string, to: string) {
  const totals = new Map<string, number>();
  for (const e of money.expenses) {
    if (e.date < from || e.date > to) continue;
    totals.set(e.categoryId, (totals.get(e.categoryId) ?? 0) + e.amount);
  }
  return [...totals.entries()]
    .map(([categoryId, amount]) => ({ categoryId, amount, category: money.categories.find((c) => c.id === categoryId) }))
    .sort((a, b) => b.amount - a.amount);
}

export function monthStart(today: string = todayKey()): string {
  return `${today.slice(0, 8)}01`;
}

/**
 * Tips based on the person's own numbers: where money goes, limits, savings, bills and risk.
 * Ordered most useful first. Amounts are formatted in their currency.
 */
export function smartTips(money: MoneyState, today: string = todayKey()): MoneyTip[] {
  const fmt = (c: number) => formatMoney(c, money.currency, { compact: true });
  const tips: MoneyTip[] = [];
  const spending = totalByKind(money.accounts, 'spending');
  const savings = totalByKind(money.accounts, 'savings');
  const investing = totalByKind(money.accounts, 'investing');
  const crypto = cryptoTotal(money);
  const total = spending + savings + investing + crypto;
  const limit = dailyLimit(money.categories);
  const week = lastNDays(7, today);
  const weekSpent = week.reduce((s, d) => s + spentOn(money.expenses, d), 0);
  const overDays = limit > 0 ? week.filter((d) => spentOn(money.expenses, d) > limit).length : 0;
  const month = spendByCategory(money, addDaysToKey(today, -29), today);
  const monthSpent = month.reduce((s, x) => s + x.amount, 0);
  const bills = billsPerMonth(money);

  if (money.expenses.length === 0) {
    tips.push({
      id: 'track',
      icon: '✍',
      title: 'Write down every spend for a week',
      text: "Tap \"I spent money\" each time you buy something, even small things. After a week you'll see exactly where your money goes. Most people are surprised.",
      tone: 'idea',
    });
  }

  if (overDays >= 3) {
    tips.push({
      id: 'over',
      icon: '⚠',
      title: `Over your limit ${overDays} of the last 7 days`,
      text: 'Either the limit is too tight or spending crept up. Pick one: lower one category you can live without, or raise the limit to something honest you can actually stick to.',
      tone: 'warn',
    });
  } else if (limit > 0 && weekSpent > 0 && overDays === 0) {
    tips.push({
      id: 'under',
      icon: '🏆',
      title: 'Under your limit all week',
      text: `Nice discipline. You could save the difference: at this pace that's about ${fmt(Math.max(0, limit * 7 - weekSpent))} a week you didn't need.`,
      tone: 'good',
    });
  }

  const top = month[0];
  if (top && monthSpent > 0 && top.amount / monthSpent >= 0.35 && month.length > 1) {
    const share = Math.round((top.amount / monthSpent) * 100);
    tips.push({
      id: 'top',
      icon: top.category?.icon ?? '💸',
      title: `${share}% of your spending is ${top.category?.name ?? 'one category'}`,
      text: `That's ${fmt(top.amount)} in 30 days. Cutting it by a quarter would free up about ${fmt(Math.round(top.amount / 4))} a month, or ${fmt(Math.round((top.amount / 4) * 12))} a year.`,
      tone: 'idea',
    });
  }

  const recent = money.expenses.filter((e) => e.date >= week[0]);
  const small = recent.filter((e) => limit > 0 && e.amount <= limit * 0.25);
  if (small.length >= 6) {
    const sum = small.reduce((s, e) => s + e.amount, 0);
    tips.push({
      id: 'small',
      icon: '☕',
      title: `${small.length} small buys this week added up to ${fmt(sum)}`,
      text: 'Little things (snacks, drinks, apps) are the easiest to cut because you barely notice them. Try a "no small buys" day twice a week.',
      tone: 'idea',
    });
  }

  if (bills > 0) {
    tips.push({
      id: 'bills',
      icon: '🧾',
      title: `Bills & subscriptions: ${fmt(bills)} a month`,
      text: `That's ${fmt(bills * 12)} a year. Go through them once: cancel anything you didn't use in the last month. You can always sign up again.`,
      tone: 'idea',
    });
  }

  if (savings === 0 && spending > 0) {
    tips.push({
      id: 'pay-yourself',
      icon: '🐷',
      title: 'Pay yourself first',
      text: `Every time money comes in, move 10–20% to savings before you spend anything. With ${fmt(spending)} now, 10% is ${fmt(Math.round(spending / 10))}.`,
      tone: 'warn',
    });
  }

  const monthlySpend = monthSpent + bills;
  if (monthlySpend > 0 && savings < monthlySpend * 3) {
    tips.push({
      id: 'emergency',
      icon: '🛟',
      title: 'Build a safety cushion',
      text: `Aim for about 3 months of spending in savings (${fmt(monthlySpend * 3)} for you). It turns emergencies into small problems instead of big ones.`,
      tone: 'idea',
    });
  }

  if (money.goals.length === 0) {
    tips.push({
      id: 'goal',
      icon: '🎯',
      title: 'Give your savings a job',
      text: 'Money saved "for nothing" gets spent. Add a goal (a car, a laptop, a trip) and you will save faster because you can see it growing.',
      tone: 'idea',
    });
  }

  // Bills coming out in the next 3 days.
  for (const b of money.bills ?? []) {
    const due = nextDue(b.day, today);
    const days = Math.round((parseKey(due).getTime() - parseKey(today).getTime()) / 86400000);
    if (days <= 3) {
      tips.push({
        id: `due-${b.id}`,
        icon: '🧾',
        title: `${b.name} (${fmt(b.amount)}) comes out ${days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`}`,
        text: 'Keep that much in your spending money so it does not catch you by surprise.',
        tone: 'warn',
      });
    }
  }

  // How long a savings goal takes, and how much faster a little more each week would be.
  for (const g of money.goals.slice(0, 2)) {
    const saved = money.accounts.find((a) => a.id === g.accountId)?.amount ?? 0;
    const left = g.target - saved;
    if (left <= 0 || !g.weekly) continue;
    const weeks = Math.ceil(left / g.weekly);
    const faster = Math.ceil(left / (g.weekly * 1.5));
    if (weeks > 8) {
      tips.push({
        id: `pace-${g.id}`,
        icon: g.icon,
        title: `${g.name}: about ${weeks >= 104 ? `${Math.round(weeks / 52)} years` : `${weeks} weeks`} at ${fmt(g.weekly)} a week`,
        text: `Saving ${fmt(Math.round(g.weekly * 0.5))} more a week gets you there ${weeks - faster} weeks sooner. Small extra jobs or skipping one buy a week does it.`,
        tone: 'idea',
      });
    }
  }

  if (!money.income) {
    tips.push({
      id: 'plan',
      icon: '🧮',
      title: 'Make a money plan',
      text: 'Tell the app how much you get each month (Overview → Plan my money). It works out what to save and how much you can spend each day, based on your week.',
      tone: 'idea',
    });
  }

  if (total > 0 && crypto / total > 0.2) {
    tips.push({
      id: 'crypto-risk',
      icon: '₿',
      title: `${Math.round((crypto / total) * 100)}% of your money is in crypto`,
      text: 'Crypto can drop 50% or more in a few months. A common rule: keep it to a small slice (5–10%) of what you have, and only money you could lose without it hurting.',
      tone: 'warn',
    });
  }

  if (investing + crypto === 0 && savings >= Math.max(monthlySpend * 3, 50000)) {
    tips.push({
      id: 'invest',
      icon: '📈',
      title: 'Your savings could be working',
      text: "Once your safety cushion is done, money for 5+ years can go into a low-cost index fund. Time is your biggest advantage when you're young.",
      tone: 'idea',
    });
  }

  return tips;
}

/** Money basics everyone should know. One is featured each day. */
export const MONEY_LESSONS: Array<{ id: string; icon: string; title: string; text: string }> = [
  { id: '503020', icon: '🧮', title: 'The 50/30/20 rule', text: 'Split money that comes in: about 50% for needs, 30% for wants and 20% for saving and investing. If you live with parents, try saving even more while it is easy.' },
  { id: 'first', icon: '🐷', title: 'Pay yourself first', text: 'Move savings out the moment you get paid, not at the end of the month. What is left is what you can spend, so saving happens automatically.' },
  { id: '24h', icon: '⏳', title: 'The 24-hour rule', text: 'Want something that is not a need? Wait a day (a week for big things). Half the time the urge is gone, and the money stays with you.' },
  { id: 'compound', icon: '📈', title: 'Compound interest', text: 'Growth earns growth. 100 a month at 7% a year becomes about 17,000 in 10 years and 52,000 in 20. You only put in 12,000 and 24,000. Starting early matters more than starting big.' },
  { id: 'emergency', icon: '🛟', title: 'Emergency fund first', text: 'Before investing, save 3 months of spending. A broken phone or a lost job then does not turn into debt.' },
  { id: 'needs', icon: '⚖', title: 'Needs vs wants', text: 'Food, transport and rent are needs. A new hoodie, takeaway and skins are wants. Wants are fine, just decide on them on purpose, not by habit.' },
  { id: 'hours', icon: '⌚', title: 'Price in hours', text: 'Divide a price by what you earn per hour. A 60 jacket at 10 an hour costs 6 hours of your life. Is it worth that?' },
  { id: 'cpu', icon: '👟', title: 'Cost per use', text: 'Good shoes for 100 worn 300 times cost 33 cents a wear. Cheap ones for 30 that break after 30 wears cost 1 each. Quality is often cheaper.' },
  { id: 'debt', icon: '💳', title: 'Avoid expensive debt', text: 'Credit cards and "buy now, pay later" can cost 20–30% a year. If you cannot pay cash for a want, you cannot afford it yet.' },
  { id: 'index', icon: '🌍', title: 'Index funds', text: 'An index fund buys a small piece of hundreds of companies at once. Low fees and no guessing which stock wins. Most professionals do not beat them over time.' },
  { id: 'earn', icon: '🚀', title: 'Grow your income', text: 'Saving has a limit, earning does not. Learn a skill people pay for (design, editing, coding, a trade), and do small jobs. Your skills are your best investment.' },
  { id: 'inflation', icon: '🎈', title: 'Inflation', text: 'Prices rise a few percent a year, so cash under the bed slowly loses value. Savings accounts with interest and long-term investing help you keep up.' },
  { id: 'auto', icon: '🔁', title: 'Automate it', text: 'Set an automatic transfer to savings on payday. Good habits are easier when you do not have to remember them.' },
  { id: 'envelope', icon: '✉', title: 'The envelope method', text: 'Give each category a fixed amount for the week (food, fun, transport). When an envelope is empty, that spending stops until next week. The daily limits here work the same way.' },
  { id: 'scams', icon: '🔐', title: 'Spot money scams', text: 'Guaranteed returns, pressure to act now, or someone asking for passwords, codes or a crypto "seed phrase" are always a scam. No real company asks for those.' },
  { id: 'friends', icon: '🤝', title: 'Lending to friends', text: 'Only lend what you would be okay never getting back. It protects both the money and the friendship.' },
];

export const CRYPTO_LESSONS: Array<{ icon: string; title: string; text: string }> = [
  { icon: '🎢', title: 'It moves a lot', text: 'Bitcoin has fallen more than 70% several times and recovered. Only put in money you will not need for years and could lose without it hurting.' },
  { icon: '🥧', title: 'Keep it a small slice', text: 'Many people keep crypto to 5–10% of their money, with the rest in savings and regular investments.' },
  { icon: '🔐', title: 'Your seed phrase is the key', text: 'Whoever has the 12–24 recovery words owns the coins. Never type them into a website or share them. Support staff will never ask for them.' },
  { icon: '📅', title: 'Buy slowly (DCA)', text: 'Putting in the same small amount every week or month means you do not have to guess the right moment.' },
  { icon: '🧾', title: 'Taxes may apply', text: 'In many countries selling crypto for a profit is taxed. Keep a note of what you paid (you can enter it here).' },
  { icon: '🔞', title: 'Age rules', text: 'Most exchanges need you to be 18 or older. Under 18? Learning how it works now is still a great head start.' },
];

/** Same lesson all day, a different one tomorrow. */
export function lessonOfTheDay(today: string = todayKey()) {
  return MONEY_LESSONS[hashString(`lesson:${today}`) % MONEY_LESSONS.length];
}

/** Future value of saving `monthly` cents each month for `years` at `ratePct` a year (monthly compounding). */
export function futureValue(monthly: number, years: number, ratePct: number, start = 0): number {
  const r = ratePct / 100 / 12;
  const n = Math.round(years * 12);
  if (r === 0) return start + monthly * n;
  return start * Math.pow(1 + r, n) + monthly * ((Math.pow(1 + r, n) - 1) / r);
}

/** Next date ("YYYY-MM-DD") a bill paid on day `day` of the month comes out, from today. */
export function nextDue(day: number, today: string = todayKey()): string {
  const d = parseKey(today);
  const clamp = (y: number, m: number) => Math.min(day, new Date(y, m + 1, 0).getDate());
  let y = d.getFullYear();
  let m = d.getMonth();
  if (clamp(y, m) < d.getDate()) {
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(clamp(y, m)).padStart(2, '0')}`;
}

