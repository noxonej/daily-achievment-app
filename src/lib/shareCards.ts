/**
 * Story-sized share cards (B4, round 2): 1080×1920 PNGs for TikTok / Instagram / Snap stories.
 * Every card carries the app's address and your invite code, so each share can bring a friend.
 *
 * 1. IRL stats radar  2. streak milestone  3. weekly recap (shareCard.ts)  4. challenge finished
 * 5. savings (amount can be hidden)
 */
import { APP_NAME, APP_TAGLINE } from './brand';
import { APP_URL } from './config';
import { friendsSession } from './friends';
import { shareImage } from './shareCard';
import { STAT_IDS, STATS, overallStatLevel, type IrlStats } from './irlStats';
import { isLt, L } from './lang';
import { weekKey } from './date';
import type { AppState, JoinedChallenge } from './types';
import { fullDays } from './social';
import { chartMax, point, share } from '../components/stats/radarGeometry';

export const W = 1080;
export const H = 1920;

const font = (w: number, px: number) => `${w} ${px}px Outfit, "Space Grotesk", system-ui, sans-serif`;

/** Your invite code (friend code) when you're connected, so the link adds you as a friend. */
export function inviteCode(): string | undefined {
  return friendsSession()?.me.code;
}

/** The address printed on cards: short, without https://. */
export function cardLink(code = inviteCode()): string {
  return `${APP_URL}${code ? `?invite=${code}` : ''}`.replace(/^https?:\/\//, '');
}

interface Theme {
  a: string;
  b: string;
}

/** Canvas with the shared look: dark background, two colour glows, brand at the top, link at the bottom. */
async function frame(theme: Theme): Promise<{ c: HTMLCanvasElement; g: CanvasRenderingContext2D }> {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  if (!g) throw new Error('Your browser cannot make images.');
  await document.fonts?.ready.catch(() => undefined);
  g.fillStyle = '#08090d';
  g.fillRect(0, 0, W, H);
  for (const [x, y, r, col] of [
    [W * 0.15, 380, 900, theme.a],
    [W * 0.9, 1500, 900, theme.b],
  ] as const) {
    const glow = g.createRadialGradient(x, y, 20, x, y, r);
    glow.addColorStop(0, `${col}66`);
    glow.addColorStop(1, `${col}00`);
    g.fillStyle = glow;
    g.fillRect(0, 0, W, H);
  }
  // Fine grain lines, like a game HUD.
  g.strokeStyle = 'rgba(255,255,255,0.035)';
  g.lineWidth = 2;
  for (let y = 0; y < H; y += 48) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }
  g.textAlign = 'center';
  g.fillStyle = '#ffffff';
  g.font = font(800, 60);
  g.fillText(APP_NAME, W / 2, 150);
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.font = font(600, 30);
  g.fillText(APP_TAGLINE.toUpperCase(), W / 2, 200);
  return { c, g };
}

function footer(g: CanvasRenderingContext2D) {
  const code = inviteCode();
  g.textAlign = 'center';
  roundRect(g, 120, H - 300, W - 240, 170, 44);
  g.fillStyle = 'rgba(255,255,255,0.08)';
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = font(800, 44);
  g.fillText(code ? `${L('Add me', 'Pridėk mane')}: ${code}` : L('Free on Squzo', 'Nemokama Squzo programėlė'), W / 2, H - 220);
  g.fillStyle = 'rgba(255,255,255,0.65)';
  g.font = font(600, 32);
  g.fillText(cardLink(code), W / 2, H - 165);
}

function toBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not make the image.'))), 'image/png'));
}

export function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/* ---------------------------------------------------------------- 1. stats radar */

export async function drawStatsCard(name: string, s: IrlStats, level: number): Promise<Blob> {
  const { c, g } = await frame({ a: '#a78bfa', b: '#34d399' });
  const lt = isLt();
  const week = Number(weekKey().split('W')[1]);
  g.fillStyle = '#c4b5fd';
  g.font = font(700, 40);
  g.fillText(L(`MY IRL STATS · WEEK ${week}`, `MANO IRL RODIKLIAI · ${week} SAV.`), W / 2, 330);
  g.fillStyle = '#ffffff';
  g.font = font(800, 84);
  g.fillText(`${name || 'Me'} · LV ${level}`, W / 2, 425);

  // The radar, drawn like the in-app chart but bigger.
  const cx = W / 2;
  const cy = 1000;
  const R = 290;
  const max = chartMax(s);
  const toXY = (r: number, i: number) => point(cx, cy, r, i);
  g.lineWidth = 3;
  for (const f of [0.25, 0.5, 0.75, 1]) {
    g.beginPath();
    STAT_IDS.forEach((_, i) => {
      const [x, y] = toXY(R * f, i);
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    });
    g.closePath();
    g.strokeStyle = `rgba(255,255,255,${f === 1 ? 0.25 : 0.1})`;
    g.stroke();
  }
  STAT_IDS.forEach((_, i) => {
    const [x, y] = toXY(R, i);
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(x, y);
    g.strokeStyle = 'rgba(255,255,255,0.1)';
    g.stroke();
  });
  const pts = STAT_IDS.map((id, i) => toXY(R * share(s, id, max), i));
  const grad = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  grad.addColorStop(0, 'rgba(251,113,133,0.65)');
  grad.addColorStop(0.5, 'rgba(167,139,250,0.6)');
  grad.addColorStop(1, 'rgba(52,211,153,0.65)');
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.shadowColor = 'rgba(167,139,250,0.9)';
  g.shadowBlur = 50;
  g.fillStyle = grad;
  g.fill();
  g.shadowBlur = 0;
  g.lineWidth = 7;
  g.lineJoin = 'round';
  g.strokeStyle = '#ffffff';
  g.stroke();
  pts.forEach(([x, y], i) => {
    g.beginPath();
    g.arc(x, y, 16, 0, Math.PI * 2);
    g.fillStyle = STATS[STAT_IDS[i]].color;
    g.fill();
    g.lineWidth = 5;
    g.strokeStyle = '#fff';
    g.stroke();
  });
  STAT_IDS.forEach((id, i) => {
    const [x, y] = toXY(R + 105, i);
    const top = i === 0 ? -40 : 0;
    g.textAlign = 'center';
    g.fillStyle = '#ffffff';
    g.font = font(800, 40);
    g.fillText((lt ? STATS[id].lt : STATS[id].label).toUpperCase(), x, y + top);
    g.fillStyle = s[id].rank.color;
    g.font = font(800, 36);
    g.fillText(`LV ${s[id].level} · ${lt ? s[id].rank.lt : s[id].rank.name}`, x, y + top + 46);
  });

  // Overall badge.
  roundRect(g, W / 2 - 230, 1420, 460, 130, 65);
  g.fillStyle = 'rgba(255,255,255,0.1)';
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = font(800, 66);
  g.textAlign = 'center';
  g.fillText(`${L('OVERALL', 'BENDRAS')} ${overallStatLevel(s)}`, W / 2, 1508);
  footer(g);
  return toBlob(c);
}

/* ---------------------------------------------------------------- 2. streak milestone */

export async function drawStreakCard(days: number): Promise<Blob> {
  const { c, g } = await frame({ a: '#fb923c', b: '#ef4444' });
  g.fillStyle = '#fdba74';
  g.font = font(700, 44);
  g.fillText(L('STREAK MILESTONE', 'UGNELĖS RUOŽAS'), W / 2, 420);
  // A big flame made of layered drops.
  const cx = W / 2;
  const cy = 800;
  for (const [s, col] of [
    [1, '#f97316'],
    [0.72, '#fb923c'],
    [0.45, '#fde68a'],
  ] as const) {
    g.beginPath();
    g.moveTo(cx, cy - 330 * s);
    g.bezierCurveTo(cx + 260 * s, cy - 80 * s, cx + 230 * s, cy + 220 * s, cx, cy + 250 * s);
    g.bezierCurveTo(cx - 230 * s, cy + 220 * s, cx - 260 * s, cy - 80 * s, cx, cy - 330 * s);
    g.shadowColor = '#f97316';
    g.shadowBlur = s === 1 ? 90 : 0;
    g.fillStyle = col;
    g.fill();
  }
  g.shadowBlur = 0;
  g.fillStyle = '#ffffff';
  g.font = font(900, 260);
  g.fillText(String(days), W / 2, 1360);
  g.font = font(800, 72);
  g.fillText(L('DAYS IN A ROW', 'DIENŲ IŠ EILĖS'), W / 2, 1460);
  g.fillStyle = 'rgba(255,255,255,0.65)';
  g.font = font(600, 40);
  g.fillText(days >= 100 ? L('Almost nobody gets here.', 'Beveik niekas čia nepasiekia.') : days >= 30 ? L('A whole month of showing up.', 'Visas mėnuo be pertraukos.') : L('Building the habit, one day at a time.', 'Įprotis auga kasdien.'), W / 2, 1540);
  footer(g);
  return toBlob(c);
}

/* ---------------------------------------------------------------- 4. challenge finished */

export async function drawChallengeCard(ch: JoinedChallenge): Promise<Blob> {
  const { c, g } = await frame({ a: '#facc15', b: '#38bdf8' });
  g.fillStyle = '#fde68a';
  g.font = font(700, 44);
  g.fillText(L('CHALLENGE COMPLETE', 'IŠŠŪKIS ĮVEIKTAS'), W / 2, 420);
  // Medal.
  const cx = W / 2;
  const cy = 800;
  g.fillStyle = '#38bdf8';
  g.beginPath();
  g.moveTo(cx - 150, cy - 330);
  g.lineTo(cx - 40, cy - 330);
  g.lineTo(cx + 40, cy - 120);
  g.lineTo(cx - 70, cy - 120);
  g.closePath();
  g.fill();
  g.fillStyle = '#0ea5e9';
  g.beginPath();
  g.moveTo(cx + 150, cy - 330);
  g.lineTo(cx + 40, cy - 330);
  g.lineTo(cx - 40, cy - 120);
  g.lineTo(cx + 70, cy - 120);
  g.closePath();
  g.fill();
  const medal = g.createRadialGradient(cx - 60, cy - 60, 20, cx, cy, 230);
  medal.addColorStop(0, '#fef9c3');
  medal.addColorStop(0.5, '#facc15');
  medal.addColorStop(1, '#a16207');
  g.shadowColor = '#facc15';
  g.shadowBlur = 80;
  g.beginPath();
  g.arc(cx, cy, 210, 0, Math.PI * 2);
  g.fillStyle = medal;
  g.fill();
  g.shadowBlur = 0;
  g.lineWidth = 14;
  g.strokeStyle = 'rgba(255,255,255,0.5)';
  g.stroke();
  g.fillStyle = '#713f12';
  g.font = font(900, 150);
  g.fillText(String(ch.days), cx, cy + 40);
  g.font = font(800, 44);
  g.fillText(L('DAYS', 'DIENŲ'), cx, cy + 100);
  g.fillStyle = '#ffffff';
  g.font = font(800, 76);
  wrap(g, ch.title, W / 2, 1200, 900, 90);
  g.fillStyle = 'rgba(255,255,255,0.7)';
  g.font = font(600, 44);
  g.fillText(`${L('hosted by', 'veda')} ${ch.hostName} · ${fullDays(ch)}/${ch.days} ${L('perfect days', 'pilnų dienų')}`, W / 2, 1420);
  footer(g);
  return toBlob(c);
}

/* ---------------------------------------------------------------- 5. savings */

export async function drawSavingsCard(opts: { amount: string; goal?: string; pct?: number; hide: boolean }): Promise<Blob> {
  const { c, g } = await frame({ a: '#34d399', b: '#22d3ee' });
  g.fillStyle = '#6ee7b7';
  g.font = font(700, 44);
  g.fillText(L('MONEY GOAL', 'TAUPYMO TIKSLAS'), W / 2, 420);
  g.fillStyle = '#ffffff';
  g.font = font(900, opts.hide ? 200 : 170);
  g.fillText(opts.hide ? `${Math.floor((opts.pct ?? 0) * 100)}%` : opts.amount, W / 2, 800);
  g.font = font(700, 60);
  g.fillText(opts.hide ? L('of my goal saved', 'tikslo sutaupyta') : L('saved', 'sutaupyta'), W / 2, 900);
  if (opts.goal) {
    g.fillStyle = 'rgba(255,255,255,0.75)';
    g.font = font(600, 48);
    g.fillText(`${L('for', 'tikslui')}: ${opts.goal}`, W / 2, 990);
  }
  if (opts.pct !== undefined) {
    roundRect(g, 160, 1110, W - 320, 60, 30);
    g.fillStyle = 'rgba(255,255,255,0.1)';
    g.fill();
    roundRect(g, 160, 1110, Math.max(60, (W - 320) * Math.min(1, opts.pct)), 60, 30);
    const bar = g.createLinearGradient(160, 0, W - 160, 0);
    bar.addColorStop(0, '#34d399');
    bar.addColorStop(1, '#22d3ee');
    g.fillStyle = bar;
    g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,0.6)';
  g.font = font(600, 36);
  g.fillText(L('Squzo tracks money too. General info, not financial advice.', 'Squzo seka ir pinigus. Ne finansinė konsultacija.'), W / 2, 1320);
  footer(g);
  return toBlob(c);
}

function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > max && line) {
      g.fillText(line, x, yy);
      line = w;
      yy += lh;
    } else line = test;
  }
  if (line) g.fillText(line, x, yy);
}

/* ---------------------------------------------------------------- share */

export type ShareResult = 'shared' | 'downloaded' | 'cancelled';

export async function shareStatsCard(state: AppState, s: IrlStats, level: number): Promise<ShareResult> {
  return shareImage(await drawStatsCard(state.profile?.name ?? '', s, level), 'squzo-stats.png', `${L('My IRL stats on Squzo', 'Mano IRL rodikliai Squzo')} ${APP_URL}`);
}
export async function shareStreakCard(days: number): Promise<ShareResult> {
  return shareImage(await drawStreakCard(days), `squzo-streak-${days}.png`, `${days} ${L('day streak on Squzo', 'dienų ruožas Squzo')} 🔥 ${APP_URL}`);
}
export async function shareChallengeCard(ch: JoinedChallenge): Promise<ShareResult> {
  return shareImage(await drawChallengeCard(ch), 'squzo-challenge.png', `${L('I finished', 'Įveikiau')} “${ch.title}” ${APP_URL}`);
}
export async function shareSavingsCard(opts: { amount: string; goal?: string; pct?: number; hide: boolean }): Promise<ShareResult> {
  return shareImage(await drawSavingsCard(opts), 'squzo-savings.png', `${L('Saving with Squzo', 'Taupau su Squzo')} ${APP_URL}`);
}
