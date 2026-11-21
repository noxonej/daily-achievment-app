import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { runOnce, STALE_MS } = require('../../functions/sender.js') as {
  runOnce: (db: unknown, webpush: unknown, now: number, opts?: { test?: boolean }) => Promise<Record<string, number | boolean>>;
  STALE_MS: number;
};

/** A tiny in-memory stand-in for Firestore, just enough for runOnce. */
function fakeDb(queue: Record<string, Record<string, unknown>>) {
  const docs: Record<string, Record<string, unknown>> = { 'private/vapid': { publicKey: 'pk', privateKey: 'sk' }, 'config/push': { publicKey: 'pk' } };
  for (const [id, v] of Object.entries(queue)) docs[`pushQueue/${id}`] = v;
  const ref = (path: string) => ({
    get: async () => ({ exists: path in docs, data: () => docs[path] }),
    set: async (v: Record<string, unknown>) => void (docs[path] = v),
    delete: async () => void delete docs[path],
  });
  return {
    docs,
    doc: ref,
    collection: () => ({
      orderBy: () => ({
        limit: () => ({
          get: async () => {
            const list = Object.keys(docs).filter((k) => k.startsWith('pushQueue/')).map((k) => ({ id: k.slice(10), data: () => docs[k], ref: ref(k) }));
            return { size: list.length, docs: list };
          },
        }),
      }),
    }),
  };
}

const keys = { p256dh: 'B'.repeat(87), auth: 'a'.repeat(22) };
const now = Date.UTC(2026, 10, 21, 12);

describe('push sender', () => {
  it('sends only to real push services and deletes bad or stale docs', async () => {
    const plan = (tag: string) => [{ tag, at: now - 60000, date: '2026-11-21', title: 'Hi', body: 'Go' }];
    const db = fakeDb({
      good: { updatedAt: now, host: 'fcm.googleapis.com', data: JSON.stringify({ on: true, sub: { endpoint: 'https://fcm.googleapis.com/x', keys }, plan: plan('a') }) },
      evil: { updatedAt: now, host: 'fcm.googleapis.com', data: JSON.stringify({ on: true, sub: { endpoint: 'https://evil.example.com/x', keys }, plan: plan('b') }) },
      liar: { updatedAt: now, host: 'web.push.apple.com', data: JSON.stringify({ on: true, sub: { endpoint: 'https://fcm.googleapis.com/x', keys }, plan: plan('c') }) },
      old: { updatedAt: now - STALE_MS - 1, data: JSON.stringify({ on: true, sub: { endpoint: 'https://fcm.googleapis.com/x', keys }, plan: plan('d') }) },
      junk: { updatedAt: now, data: '{not json' },
    });
    const calls: string[] = [];
    const webpush = { setVapidDetails: () => undefined, sendNotification: async (s: { endpoint: string }) => void calls.push(s.endpoint) };
    const stats = await runOnce(db, webpush, now);
    expect(calls).toEqual(['https://fcm.googleapis.com/x']);
    expect(stats).toMatchObject({ sent: 1, skipped: 3, stale: 1 });
    expect(Object.keys(db.docs).filter((k) => k.startsWith('pushQueue/'))).toEqual(['pushQueue/good']);
  });

  it('removes the doc when the push service says the address is gone', async () => {
    const db = fakeDb({ gone: { updatedAt: now, data: JSON.stringify({ on: true, sub: { endpoint: 'https://fcm.googleapis.com/x', keys }, plan: [{ tag: 't', at: now - 1000, date: '2026-11-21', title: 'a', body: 'b' }] }) } });
    const webpush = { setVapidDetails: () => undefined, sendNotification: async () => Promise.reject(Object.assign(new Error('gone'), { statusCode: 410 })) };
    const stats = await runOnce(db, webpush, now);
    expect(stats.gone).toBe(1);
    expect('pushQueue/gone' in db.docs).toBe(false);
  });
});
