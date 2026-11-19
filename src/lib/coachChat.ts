import type { AppState, DerivedStats } from './types';
import { addDaysToKey, daysBetween, todayKey } from './date';
import { levelFromTotalXp } from './xp';
import { formatMoney } from './money';
import { bedtimesFor, fallAsleepMin, sleepNeed } from './sleep';
import { hashString } from './hash';
import { tl } from './i18n';

/**
 * "Ask your coach" (2026-11-15): a built-in coach that answers questions from your own data:
 * streaks, quests, goals, money, sleep, focus, running and mood. It runs on the phone, costs
 * nothing and sends nothing anywhere. It understands topics through keywords (English plus a few
 * Lithuanian words), not free conversation. A real AI model can be plugged in behind `askCoach`
 * later without changing the screen.
 */
export type CoachTopic = 'today' | 'progress' | 'streak' | 'motivation' | 'goals' | 'money' | 'wealth' | 'sleep' | 'focus' | 'fitness' | 'mood' | 'help' | 'care';

export interface CoachReply {
  topic: CoachTopic;
  text: string;
  bullets?: string[];
  /** One button under the answer. */
  open?: { label: string; to: 'today' | 'quests' | 'money' | 'focus' | 'plan' };
  /** Follow-up questions to tap. */
  next?: string[];
  /** A small line under the answer (money answers say they are not financial advice). */
  note?: string;
}

/** Starter questions shown as chips. */
export const STARTERS = ['What should I do today?', 'How am I doing this week?', 'How do I keep my streak?', "I don't feel like doing anything", 'Am I on track with my goals?', 'How can I save more money?', 'How do I build wealth young?', 'How much should I sleep?'];

const TOPICS: Array<[CoachTopic, RegExp]> = [
  // Safety first: anything about hurting yourself gets a caring answer, never a productivity tip.
  ['care', /suicid|kill myself|end my life|self.?harm|hurt myself|want to die|nusižudyt|savižal/i],
  ['wealth', /wealth|rich|invest|business|side hustle|earn|income|make money|passive|turt|uždirb|investuo|verslas/i],
  ['money', /money|save|saving|spend|spent|budget|buy|afford|cash|pinig|taupy|išlaid/i],
  ['sleep', /sleep|tired|bed ?time|wake|nap|insomnia|miego|miegot|pavarg/i],
  ['streak', /streak|chain|days in a row|serij/i],
  ['goals', /goal|target|on track|dream|tiksl|planas/i],
  ['focus', /focus|study|homework|exam|concentrat|distract|phone|procrastinat|mokyt|susikaup/i],
  ['fitness', /run|gym|workout|exercise|steps|sport|fit|km|bėg|sport/i],
  ['mood', /sad|stress|anxious|anxiety|angry|lonely|depress|feel bad|upset|nuotaik|liūd|stres/i],
  ['motivation', /motivat|lazy|don'?t feel|can'?t be bothered|give up|bored|no energy|tingiu|nenoriu|motyvac/i],
  ['progress', /how am i|progress|doing|week|level|xp|stats|rezultat|kaip man sekasi/i],
  ['today', /today|now|next|what should|what to do|šiandien|ką daryti/i],
];

export function topicOf(question: string): CoachTopic {
  for (const [t, re] of TOPICS) if (re.test(question)) return t;
  return 'help';
}

/** Pick one of a few phrasings, stable for the day so answers don't flicker. */
function vary(lines: string[], seed: string): string {
  return lines[hashString(seed + todayKey()) % lines.length];
}

function rateOn(state: AppState, date: string): number | null {
  const log = state.dayLogs[date];
  if (!log || !log.dailyQuestCount) return null;
  return Math.min(1, (log.completedQuestIds.length + (log.skipped?.length ?? 0)) / log.dailyQuestCount);
}

function weekRate(state: AppState, today: string, offset: number): { rate: number; days: number } {
  let sum = 0;
  let days = 0;
  for (let i = offset; i < offset + 7; i++) {
    const r = rateOn(state, addDaysToKey(today, -i));
    if (r === null) continue;
    sum += r;
    days++;
  }
  return { rate: days ? sum / days : 0, days };
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

export function askCoach(question: string, state: AppState, stats: DerivedStats, today: string = todayKey()): CoachReply {
  const topic = topicOf(question);
  const name = state.profile.name?.split(' ')[0] || 'you';
  const active = state.quests.filter((q) => !q.archived && !q.wildcardDate && !q.wildcardWeekKey);
  const daily = active.filter((q) => q.frequency === 'daily');
  const log = state.dayLogs[today];
  const done = new Set(log?.completedQuestIds ?? []);
  const left = daily.filter((q) => !done.has(q.id) && !(log?.skipped ?? []).includes(q.id));
  const order = { easy: 0, medium: 1, hard: 2, epic: 3 } as Record<string, number>;
  const easiest = [...left].sort((a, b) => (order[a.difficulty] ?? 1) - (order[b.difficulty] ?? 1))[0];

  switch (topic) {
    case 'care':
      return {
        topic,
        text: `${name}, I'm really glad you said something. I'm only an app, so please talk to someone who can actually be there for you: a parent, a friend, a teacher or a doctor. If you might hurt yourself, call your local emergency number or a crisis line right now. In Lithuania you can call Jaunimo linija on 8 800 28888 (free, any time). You matter more than any streak.`,
      };

    case 'today': {
      if (!daily.length) return { topic, text: "You don't have any daily quests yet. Add two or three small ones, like drinking water or a 10-minute walk, and you'll have a plan.", open: { label: 'Add quests', to: 'quests' } };
      if (!left.length) return { topic, text: `Everything for today is done. Nice work, ${name}. Use the rest of the day for something you enjoy, or get ahead on a long-term goal.`, next: ['Am I on track with my goals?', 'How do I build wealth young?'] };
      return {
        topic,
        text: `${left.length} of ${daily.length} quests are left today. Start with the easiest one: momentum beats willpower.`,
        bullets: left.slice(0, 4).map((q) => (q.id === easiest?.id ? `${q.title} (start here)` : q.title)),
        open: { label: 'Go to Today', to: 'today' },
        next: ["I don't feel like doing anything", 'How do I keep my streak?'],
      };
    }

    case 'progress': {
      const now = weekRate(state, today, 0);
      const before = weekRate(state, today, 7);
      const lv = levelFromTotalXp(stats.totalXp);
      const trend = before.days === 0 ? '' : now.rate > before.rate + 0.05 ? ` That's up from ${pct(before.rate)} the week before.` : now.rate < before.rate - 0.05 ? ` That's down from ${pct(before.rate)} the week before, so let's turn it around.` : ' About the same as the week before.';
      return {
        topic,
        text: now.days ? `Over the last 7 days you finished ${pct(now.rate)} of your daily quests.${trend}` : 'There is not much history yet. Finish a few quests and I can tell you how your week is going.',
        bullets: [`Streak: ${stats.currentStreak} days (best ${stats.longestStreak})`, `Level ${lv.level}: ${lv.xpForNextLevel - lv.xpIntoLevel} XP to the next level`, `${stats.activeThisWeek} active days this week`, `${stats.totalPerfectDays} perfect days in total`],
        next: ['What should I do today?', 'Am I on track with my goals?'],
      };
    }

    case 'streak': {
      const s = stats.currentStreak;
      const doneToday = (log?.completedQuestIds.length ?? 0) > 0;
      return {
        topic,
        text:
          s === 0
            ? 'Your streak starts the moment you finish one quest today. Pick the smallest one.'
            : doneToday
              ? `Your ${s}-day streak is safe for today. Tomorrow, do one quest before lunch and it stays safe.`
              : `Your ${s}-day streak needs one finished quest today.${easiest ? ` The quickest is "${easiest.title}".` : ''}`,
        bullets: [
          'Make one quest tiny (2 minutes) for busy days. Showing up counts more than doing a lot.',
          'Do it at the same time each day, right after something you already do, like brushing your teeth.',
          state.streakShields > 0 ? `You have ${state.streakShields} streak shield${state.streakShields === 1 ? '' : 's'}: it protects the streak on a day you miss.` : 'Streak shields protect a missed day. You can get them on the You tab.',
        ],
        open: doneToday ? undefined : { label: 'Go to Today', to: 'today' },
      };
    }

    case 'motivation':
      return {
        topic,
        text: vary(
          [
            "Motivation usually comes after you start, not before. Don't try to feel like it. Just do two minutes.",
            "That's normal. Everyone has these days. The goal today isn't a perfect day, it's not a zero day.",
            "It's you vs. you. Yesterday's you set these quests for a reason. Give them two minutes.",
          ],
          'mot',
        ),
        bullets: [easiest ? `Do only "${easiest.title}" for now. Stop after if you want.` : 'Pick one tiny thing and do it now.', 'Put your phone in another room for 15 minutes.', 'Done badly still counts as done.'],
        open: { label: 'Start a 15-min focus', to: 'focus' },
      };

    case 'goals': {
      const open = state.goals.filter((g) => !g.completedAt);
      if (!open.length) return { topic, text: "You don't have a long-term goal right now. Pick one thing you'd be proud of by the end of the year, like reading 12 books or saving for something, and I'll track your pace.", open: { label: 'Add a goal', to: 'quests' } };
      const rows = open.slice(0, 4).map((g) => {
        const share = g.target ? g.progress / g.target : 0;
        const days = Math.max(1, daysBetween(g.createdAt.slice(0, 10), today));
        const perDay = g.progress / days;
        const leftAmt = Math.max(0, g.target - g.progress);
        const eta = perDay > 0 ? Math.ceil(leftAmt / perDay) : null;
        return `${g.title}: ${pct(share)} (${g.progress}/${g.target} ${g.unit})${eta !== null && leftAmt > 0 ? `, about ${eta} days to go at this pace` : leftAmt === 0 ? ', ready to complete' : ', not started yet'}`;
      });
      return { topic, text: 'Here is where your goals stand:', bullets: rows, next: ['How do I keep my streak?', 'What should I do today?'], open: { label: 'Open goals', to: 'quests' } };
    }

    case 'money': {
      const m = state.money;
      const cur = m.currency || 'EUR';
      const spentWeek = m.expenses.filter((e) => e.date > addDaysToKey(today, -7)).reduce((s, e) => s + e.amount, 0);
      const spentBefore = m.expenses.filter((e) => e.date > addDaysToKey(today, -14) && e.date <= addDaysToKey(today, -7)).reduce((s, e) => s + e.amount, 0);
      const byCat = new Map<string, number>();
      for (const e of m.expenses.filter((x) => x.date > addDaysToKey(today, -30))) byCat.set(e.categoryId, (byCat.get(e.categoryId) ?? 0) + e.amount);
      const top = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
      const topName = top ? m.categories.find((c) => c.id === top[0])?.name : null;
      const bullets: string[] = [];
      if (spentWeek || spentBefore) bullets.push(`Spent in the last 7 days: ${formatMoney(spentWeek, cur)}${spentBefore ? ` (week before: ${formatMoney(spentBefore, cur)})` : ''}`);
      if (topName && top) bullets.push(`Most money this month goes to ${topName} (${formatMoney(top[1], cur)}). Cut that by a quarter and you'll feel it in your savings.`);
      for (const g of m.goals.slice(0, 2)) {
        const have = m.accounts.find((a) => a.id === g.accountId)?.amount ?? 0;
        bullets.push(`${g.name}: ${formatMoney(have, cur)} of ${formatMoney(g.target, cur)} (${pct(g.target ? have / g.target : 0)})`);
      }
      bullets.push('Pay yourself first: move money to savings the day you get it, not what is left at the end.');
      bullets.push('Wait 48 hours before buying anything that isn\'t food or a bill. Most wants disappear.');
      return { topic, text: m.setupDone ? 'Here is your money picture:' : "You haven't set up Money yet. It takes a minute and then I can give you real numbers. Meanwhile, the two rules that matter most:", bullets, open: { label: 'Open Money', to: 'money' }, next: ['How do I build wealth young?'], note: tl('money.notAdvice') };
    }

    case 'wealth': {
      // Show compound growth with real numbers: €50 a month from now to 30 years old.
      const monthly = 50;
      const years = 15;
      const r = 0.07 / 12;
      const fv = monthly * ((Math.pow(1 + r, years * 12) - 1) / r);
      const cur = state.money.currency || 'EUR';
      return {
        topic,
        text: `Being young is your biggest advantage, because time does the heavy lifting. If you put away ${formatMoney(monthly * 100, cur, { compact: true })} a month and it grows about 7% a year, after ${years} years you'd have about ${formatMoney(Math.round(fv) * 100, cur, { compact: true })}. You only paid in ${formatMoney(monthly * 12 * years * 100, cur, { compact: true })}.`,
        bullets: [
          'Build one skill people pay for (editing videos, coding, design, selling, a trade). Your income is your biggest money tool.',
          'Save a fixed share of everything you get, even 10%, before you spend anything.',
          'Avoid debt for things that lose value, like phones and clothes.',
          'Start small: sell something, help a neighbour, run a mini service. Doing it once teaches more than reading about it.',
          'Investing is long-term: broad index funds, never money you need soon. Ask a parent or adult you trust before you start.',
        ],
        open: { label: 'Open Money', to: 'money' },
        note: tl('money.notAdvice'),
      };
    }

    case 'sleep': {
      const need = sleepNeed(state.sleep);
      const nights = (state.sleep?.log ?? []).filter((n) => n.date > addDaysToKey(today, -7));
      const avg = nights.length ? nights.reduce((s, n) => s + n.hours, 0) / nights.length : null;
      const best = bedtimesFor(state.profile.wakeTime || '07:00', need, fallAsleepMin(state.sleep)).find((o) => o.best);
      return {
        topic,
        text: `You need about ${need} hours a night.${avg !== null ? ` Over the last ${nights.length} nights you got ${avg.toFixed(1)} on average${avg < need - 0.5 ? ", so you're short. That makes everything else harder." : ', which is good.'}` : ''}${best ? ` To wake at ${state.profile.wakeTime || '07:00'}, be in bed with the lights off by ${best.time}.` : ''}`,
        bullets: ['No screens for 30 minutes before bed. Put the phone on the other side of the room.', 'Same wake-up time every day, also on weekends.', 'Daylight in the morning and no caffeine after 2 pm.'],
      };
    }

    case 'focus': {
      let week = 0;
      for (let i = 0; i < 7; i++) week += state.focusMinutes[addDaysToKey(today, -i)] ?? 0;
      return {
        topic,
        text: `${week ? `You focused for ${week} minutes in the last 7 days. ` : ''}Try one 25-minute block: one task, phone away, then a 5-minute break. Two blocks a day is already a lot.`,
        bullets: ['Write down the one thing the block is for before you start.', 'If a distraction pops up, write it on paper and go back.', 'Hard subject first, while your brain is fresh.'],
        open: { label: 'Start a focus timer', to: 'focus' },
      };
    }

    case 'fitness': {
      const runs = state.runs.filter((x) => x.date > addDaysToKey(today, -7));
      const km = runs.reduce((s, x) => s + x.km, 0);
      return {
        topic,
        text: runs.length ? `You ran ${km.toFixed(1)} km in ${runs.length} run${runs.length === 1 ? '' : 's'} this week. Add about 10% next week, not more, to stay injury-free.` : `You've run ${stats.kmRun.toFixed(0)} km in total. A good start is 20–30 minutes of easy movement 3 times a week: you should still be able to talk while you do it.`,
        bullets: ['Walk after meals: 10 minutes helps energy and focus.', 'Sleep and water matter as much as the workout.', 'Consistency beats intensity: 3 easy sessions beat 1 hard one.'],
      };
    }

    case 'mood': {
      const days = Object.entries(state.moods).filter(([d]) => d > addDaysToKey(today, -7));
      const avg = days.length ? days.reduce((s, [, v]) => s + v, 0) / days.length : null;
      return {
        topic,
        text: `${avg !== null && avg < 2.8 ? 'Your mood has been low this week. ' : ''}That sounds hard, ${name}. Be kind to yourself today: a lighter day still counts.`,
        bullets: ['Talk to someone you trust about it. Saying it out loud really helps.', 'Go outside for 10 minutes, even just a walk around the block.', 'Write down three things that went OK today in your diary.', 'If it keeps feeling heavy, talk to a parent, a school counsellor or a doctor.'],
      };
    }

    default:
      return {
        topic: 'help',
        text: "I'm your built-in coach. I look at your own quests, streak, goals, money, sleep and focus and answer from that. I can't chat about everything, but try one of these:",
        next: STARTERS.slice(0, 6),
      };
  }
}
