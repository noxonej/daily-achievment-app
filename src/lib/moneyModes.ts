/**
 * Money modes: what you want your money to focus on right now. Each one sets how much of your
 * money to save first and what to pay attention to. All advice here is mainstream personal-finance
 * practice (no tricks, no products), and nothing here is financial advice for your situation.
 */
export type MoneyMode = 'balanced' | 'saver' | 'goal' | 'safety' | 'debt' | 'grow' | 'enjoy';

export interface ModeInfo {
  id: MoneyMode;
  label: string;
  icon: string;
  tagline: string;
  /** Share to save first, for pocket money and for a salary. */
  rate: { allowance: number; salary: number };
  focus: string[];
}

export const MONEY_MODES: ModeInfo[] = [
  {
    id: 'balanced',
    label: 'Balanced',
    icon: '⚖',
    tagline: 'The 50/30/20 rule: a bit of everything.',
    rate: { allowance: 0.3, salary: 0.2 },
    focus: ['About half on needs, 30% on wants, 20% saved (30% with pocket money).', 'Save first, the day money comes in.', 'Check your budget once a week.'],
  },
  {
    id: 'saver',
    label: 'Save hard',
    icon: '🐷',
    tagline: 'Build your savings fast.',
    rate: { allowance: 0.5, salary: 0.3 },
    focus: ['Pay for needs, cut most wants for a while.', 'Try no-spend days and the 30-day rule before buying.', 'Cancel subscriptions you rarely use.'],
  },
  {
    id: 'goal',
    label: 'Big goal',
    icon: '🎯',
    tagline: 'Saving for one thing: a phone, a trip, a car.',
    rate: { allowance: 0.4, salary: 0.25 },
    focus: ['Make it a savings goal so you see the finish line.', 'Put the goal money in a separate account.', 'Every "no" to a small want is a step closer.'],
  },
  {
    id: 'safety',
    label: 'Safety net',
    icon: '🛟',
    tagline: 'Money for when something goes wrong.',
    rate: { allowance: 0.3, salary: 0.2 },
    focus: ['Start small: a first buffer, then 3–6 months of costs (if you pay your own bills).', 'Keep it in an easy-to-reach savings account, not invested.', 'Only use it for real emergencies, then refill it.'],
  },
  {
    id: 'debt',
    label: 'Pay off debt',
    icon: '⛓',
    tagline: 'Get rid of what you owe first.',
    rate: { allowance: 0.1, salary: 0.1 },
    focus: ['Pay at least the minimum on everything, every month.', 'Put all extra money on one debt: highest interest first (saves most) or smallest first (quick wins).', 'Keep a small buffer so a surprise bill doesn’t mean new debt.'],
  },
  {
    id: 'grow',
    label: 'Grow it',
    icon: '📈',
    tagline: 'Long-term investing, once you have a safety net.',
    rate: { allowance: 0.3, salary: 0.25 },
    focus: ['Only invest money you won’t need for 5+ years.', 'Spread it out (a low-cost index fund holds hundreds of companies) and keep fees low.', 'Prices go up and down. Keep adding regularly and don’t panic-sell. Under 18? It has to be through a parent’s account.'],
  },
  {
    id: 'enjoy',
    label: 'Enjoy now',
    icon: '🎉',
    tagline: 'Live a little, still save a little.',
    rate: { allowance: 0.1, salary: 0.1 },
    focus: ['Still save 10% first, automatically.', 'Spend on things you really enjoy, cut what you don’t care about.', 'Plan fun money in your budget so it doesn’t surprise you.'],
  },
];

export function modeInfo(mode: MoneyMode | undefined): ModeInfo {
  return MONEY_MODES.find((m) => m.id === (mode ?? 'balanced')) ?? MONEY_MODES[0];
}

export type MethodAction = 'plan' | 'budget' | 'subs' | 'wishlist' | 'goal-emergency' | 'goal-52';

/** Well-known, widely recommended ways to save. */
export const SAVING_METHODS: Array<{ id: string; icon: string; title: string; text: string; action?: MethodAction; actionLabel?: string }> = [
  { id: 'first', icon: '🥇', title: 'Pay yourself first', text: 'The day money comes in, move your savings part to savings before you spend anything. What’s left is your spending money. You never “forget” to save.', action: 'plan', actionLabel: 'Open my money plan' },
  { id: '503020', icon: '⚖', title: 'The 50/30/20 rule', text: 'Roughly 50% on needs (rent, food, transport), 30% on wants, 20% on savings or paying off debt. A simple starting point you can adjust.' },
  { id: 'emergency', icon: '🛟', title: 'Emergency fund', text: 'Money set aside only for surprises: a broken phone, a repair, a lost job. Adults usually aim for 3–6 months of essential costs. Start with any small amount.', action: 'goal-emergency', actionLabel: 'Start an emergency fund' },
  { id: 'auto', icon: '🔁', title: 'Automate it', text: 'Set up an automatic transfer to savings on payday (most banks call it a standing order). Saving happens without willpower.' },
  { id: 'account', icon: '🏦', title: 'A separate savings account', text: 'Keep savings away from your spending card so you don’t spend them by accident. Look for no fees and a good interest rate. Bank deposits are protected by law up to a limit (for example €100,000 per bank in the EU, $250,000 in the US).' },
  { id: 'wait', icon: '⏳', title: 'The 30-day rule', text: 'Want something that isn’t planned? Put it on your wishlist and wait (24 hours for small things, 30 days for big ones). Often you won’t want it anymore.', action: 'wishlist', actionLabel: 'Open my wishlist' },
  { id: 'envelopes', icon: '✉', title: 'Envelope budgeting', text: 'Give every coin a job: split your money into envelopes (food, fun, transport). When an envelope is empty, you stop or move money from another one.', action: 'budget', actionLabel: 'Open my budget' },
  { id: 'subs', icon: '🔄', title: 'Check your subscriptions', text: 'Small monthly payments add up to a lot in a year. Cancel the ones you rarely use. You can always sign up again.', action: 'subs', actionLabel: 'Check my subscriptions' },
  { id: '52', icon: '🗓', title: 'The 52-week challenge', text: 'Save 1 in week 1, 2 in week 2… up to 52 in week 52. That’s 1,378 in a year, in small steps that feel easy at the start.', action: 'goal-52', actionLabel: 'Start the challenge' },
  { id: 'nospend', icon: '🚫', title: 'No-spend days', text: 'Pick days (or a whole week) with no spending on wants at all. It breaks the habit of buying things just because you’re bored.' },
  { id: 'change', icon: '🪙', title: 'Round-ups and spare change', text: 'Put coins in a jar, or use your bank’s round-up feature that saves the change from every card payment.' },
  { id: 'sell', icon: '🏷', title: 'Sell what you don’t use', text: 'Clothes, games, gadgets: sell them and put the money straight into savings.' },
  { id: 'compound', icon: '📈', title: 'Start early, let it grow', text: 'Money that earns interest or investment returns grows on top of its own growth (compound interest). The earlier you start, the less you need to put in. See the calculator in Tips.' },
];

/** Warning signs of a scam. If you see one, stop and ask someone you trust. */
export const SCAM_FLAGS: string[] = [
  'Guaranteed high returns, or “you can’t lose”.',
  'Pressure to act fast: “only today”, “last spots”.',
  'Anyone asking for your passwords, bank codes, or to pay with gift cards or crypto.',
  'Jobs where you receive money and send it on (that’s “money muling”, a crime).',
  'Influencers selling courses, signals or “secret” trading strategies.',
];
