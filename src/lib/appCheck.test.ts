import { afterEach, describe, expect, it, vi } from 'vitest';
import { appCheckConfigured, appCheckHeaders, fsFetch } from './appCheck';

describe('App Check', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is off until the site key and app id are set', async () => {
    expect(appCheckConfigured()).toBe(false);
    expect(await appCheckHeaders()).toEqual({});
  });

  it('fsFetch passes the request through unchanged when off', async () => {
    const seen: RequestInit[] = [];
    vi.stubGlobal('fetch', async (_u: string, init: RequestInit) => {
      seen.push(init);
      return new Response('{}');
    });
    await fsFetch('https://firestore.googleapis.com/x', { method: 'PATCH', headers: { 'content-type': 'application/json' } });
    expect(seen[0].method).toBe('PATCH');
    expect(seen[0].headers).toEqual({ 'content-type': 'application/json' });
  });
});
