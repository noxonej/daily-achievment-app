import { describe, expect, it, vi, beforeEach } from 'vitest';
import { stateWith } from '../test/helpers';

/** In-memory Firestore that enforces the A6 rule: codes/{code} only if profiles/{me}.code == code. */
const store: Record<string, Record<string, unknown>> = {};
const log: string[] = [];
vi.mock('./firebase', () => ({
  friendsConfigured: () => true,
  loadSession: () => ({ uid: 'me' }),
  clearSession: () => undefined,
  friendsSignIn: async () => ({ uid: 'me' }),
  db: () => ({
    uid: () => 'me',
    get: async (p: string) => store[p] ?? null,
    set: async (p: string, v: Record<string, unknown>) => {
      log.push(`set ${p}`);
      store[p] = v;
    },
    create: async (p: string, v: Record<string, unknown>) => {
      const code = p.slice(6);
      if (store[p] || !/^[A-Z]{3,4}-[0-9]{4}$/.test(code) || store['profiles/me']?.code !== code) return false;
      log.push(`create ${p}`);
      store[p] = v;
      return true;
    },
    remove: async (p: string) => {
      log.push(`remove ${p}`);
      delete store[p];
    },
  }),
}));

const { ensureProfile } = await import('./friends');
const ctx = { accountId: 'acc', name: 'Jonas', state: stateWith([]), level: 3, streak: 2 };

describe('friend codes (A6)', () => {
  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];
    log.length = 0;
    localStorage.clear();
  });

  it('writes the profile first, then claims the same code', async () => {
    const p = await ensureProfile(ctx);
    expect(p.code).toMatch(/^JONA-\d{4}$/);
    expect(store[`codes/${p.code}`]).toEqual({ uid: 'me' });
    expect(log[0]).toBe('set profiles/me');
    expect(log[1]).toBe(`create codes/${p.code}`);
  });

  it('removes the old code doc when the code changes', async () => {
    store['profiles/me'] = { name: 'Jonas', code: 'JONA-1111' };
    store['codes/JONA-1111'] = { uid: 'someone-else' };
    localStorage.setItem('dayforge-code-doc-acc', JSON.stringify('JONA-2222'));
    store['codes/JONA-2222'] = { uid: 'me' };
    const p = await ensureProfile(ctx);
    expect(p.code).not.toBe('JONA-1111');
    expect(store['codes/JONA-2222']).toBeUndefined();
    expect(store[`codes/${p.code}`]).toEqual({ uid: 'me' });
  });
});
