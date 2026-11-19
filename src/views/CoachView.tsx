import './coach.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../store/AppContext';
import { CoachCard } from '../components/today/CoachCard';
import { Icon } from '../components/Icon';
import { InfoTip } from '../components/Guide';
import type { ViewId } from '../components/NavTabs';
import { askCoach, STARTERS, type CoachReply } from '../lib/coachChat';
import { addDaysToKey, todayKey } from '../lib/date';
import { focusTimer } from '../lib/focusTimer';
import { premiumLocked } from '../lib/premium';

type Msg = { id: number; from: 'me' | 'coach'; text: string; reply?: CoachReply };

const STORE = 'dayforge-coach-chat';

function loadChat(): Msg[] {
  try {
    const raw = sessionStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as Msg[]).slice(-30) : [];
  } catch {
    return [];
  }
}

/**
 * Coach tab (2026-11-15, from tester feedback): how you're doing at a glance, the coach's tips,
 * and "Ask your coach", which answers from your own data (src/lib/coachChat.ts).
 * Planned to become premium-only later: see src/lib/premium.ts.
 */
export function CoachView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { state, stats } = useApp();
  const [chat, setChat] = useState<Msg[]>(loadChat);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const locked = premiumLocked('coach-chat');
  const name = state.profile.name?.split(' ')[0];

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify(chat.slice(-30)));
    } catch {
      /* private mode: the chat just isn't kept */
    }
  }, [chat]);
  useEffect(() => {
    if (chat.length) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chat.length, typing]);

  const week = useMemo(() => {
    const today = todayKey();
    let sum = 0;
    let days = 0;
    for (let i = 0; i < 7; i++) {
      const log = state.dayLogs[addDaysToKey(today, -i)];
      if (!log?.dailyQuestCount) continue;
      sum += Math.min(1, (log.completedQuestIds.length + (log.skipped?.length ?? 0)) / log.dailyQuestCount);
      days++;
    }
    return days ? Math.round((sum / days) * 100) : null;
  }, [state.dayLogs]);

  function ask(q: string) {
    const text = q.trim();
    if (!text || typing) return;
    const id = Date.now();
    setChat((c) => [...c, { id, from: 'me', text }]);
    setDraft('');
    setTyping(true);
    // A short pause so the answer feels considered, not instant.
    setTimeout(() => {
      const reply = askCoach(text, state, stats);
      setChat((c) => [...c, { id: id + 1, from: 'coach', text: reply.text, reply }]);
      setTyping(false);
    }, 550);
  }

  function go(to: NonNullable<CoachReply['open']>['to']) {
    if (to === 'focus') focusTimer.open();
    else onNavigate(to);
  }

  const last = [...chat].reverse().find((m) => m.from === 'coach');
  const chips = last?.reply?.next?.length ? last.reply.next : STARTERS;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 stagger">
      <div>
        <p className="eyebrow">Your personal coach</p>
        <h1 className="font-display text-[30px] leading-tight font-medium tracking-tight text-white mt-1 flex items-center gap-1">
          Coach
          <InfoTip title="How your coach works" text="Your coach reads your own quests, streak, goals, money, sleep and focus, and answers from that. It runs on your phone, so nothing you ask is sent anywhere." />
        </h1>
      </div>

      {/* at a glance */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { v: `${stats.currentStreak}`, l: 'day streak' },
          { v: week === null ? '–' : `${week}%`, l: 'done this week' },
          { v: `${stats.level}`, l: 'level' },
        ].map((t) => (
          <div key={t.l} className="rounded-[20px] bg-white/[0.04] px-3 py-3 text-center">
            <p className="font-display text-[24px] leading-none text-white tabular-nums">{t.v}</p>
            <p className="mt-1.5 text-[11px] font-semibold text-slate-400">{t.l}</p>
          </div>
        ))}
      </div>

      <CoachCard onNavigate={onNavigate} max={2} />

      {/* ask */}
      <div className="rounded-[26px] bg-white/[0.035] p-4">
        <p className="eyebrow">Ask your coach</p>
        {locked ? (
          <div className="mt-3 text-center py-6">
            <Icon name="🔒" size={22} className="mx-auto text-slate-300" />
            <p className="mt-2 font-semibold text-white">Part of Squzo Premium</p>
            <p className="text-[13px] text-slate-400">Your tips above stay free.</p>
          </div>
        ) : (
          <>
            <div className="mt-3 space-y-2.5" aria-live="polite">
              {!chat.length && (
                <Bubble from="coach">
                  {`Hey${name ? ` ${name}` : ''}! Ask me about your day, streak, goals, money, sleep or focus. I answer from your own data.`}
                </Bubble>
              )}
              {chat.map((m) => (
                <Bubble key={m.id} from={m.from}>
                  {m.text}
                  {m.reply?.bullets && (
                    <ul className="mt-2 space-y-1.5">
                      {m.reply.bullets.map((b) => (
                        <li key={b} className="flex gap-2">
                          <span className="mt-[7px] w-1.5 h-1.5 shrink-0 rounded-full bg-[var(--mood)]" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {m.reply?.open && (
                    <button onClick={() => go(m.reply!.open!.to)} className="mt-3 pill-light px-3.5 py-1.5 text-xs">
                      {m.reply.open.label}
                    </button>
                  )}
                </Bubble>
              ))}
              {typing && (
                <Bubble from="coach">
                  <span className="coach-dots" aria-label="Coach is typing">
                    <i />
                    <i />
                    <i />
                  </span>
                </Bubble>
              )}
              <div ref={endRef} />
            </div>

            <div className="mt-3 -mx-4 px-4 flex gap-1.5 overflow-x-auto no-scrollbar">
              {chips.map((q) => (
                <button key={q} onClick={() => ask(q)} className="shrink-0 rounded-full bg-white/[0.06] hover:bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-slate-200">
                  {q}
                </button>
              ))}
            </div>

            <form
              className="mt-3 flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                ask(draft);
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask anything about your progress…"
                maxLength={200}
                className="flex-1 min-w-0 rounded-full bg-white/[0.06] px-4 py-2.5 text-[14px] text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-[var(--mood)]"
                aria-label="Ask your coach"
              />
              <button type="submit" disabled={!draft.trim() || typing} className="shrink-0 w-10 h-10 rounded-full pill-light flex items-center justify-center disabled:opacity-40" aria-label="Send">
                <Icon name="📨" size={16} />
              </button>
            </form>
            {chat.length > 0 && (
              <button onClick={() => setChat([])} className="mt-2 text-[12px] font-semibold text-slate-500 hover:text-slate-300">
                Clear chat
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Bubble({ from, children }: { from: 'me' | 'coach'; children: React.ReactNode }) {
  return (
    <div className={`flex ${from === 'me' ? 'justify-end' : 'justify-start'} coach-in`}>
      <div className={`max-w-[88%] rounded-[20px] px-3.5 py-2.5 text-[14px] leading-snug ${from === 'me' ? 'coach-me rounded-br-md' : 'bg-white/[0.06] text-slate-100 rounded-bl-md'}`}>{children}</div>
    </div>
  );
}
