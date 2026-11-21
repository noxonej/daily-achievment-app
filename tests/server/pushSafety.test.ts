import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { pushHost } from '../../src/lib/push';

const require = createRequire(import.meta.url);
const safety = require('../../functions/pushSafety.js') as {
  isPushHost: (h: string) => boolean;
  endpointHost: (e: unknown) => string | null;
  validSubscription: (s: unknown) => boolean;
  RULES_HOST_PATTERN: string;
};

const keys = { p256dh: 'B'.repeat(87), auth: 'a'.repeat(22) };

describe('push endpoint safety', () => {
  it('accepts the real push services', () => {
    for (const e of [
      'https://fcm.googleapis.com/fcm/send/abc',
      'https://updates.push.services.mozilla.com/wpush/v2/abc',
      'https://web.push.apple.com/QWERTY',
      'https://wns2-db5p.notify.windows.com/w/?token=abc',
      'https://api.push.apple.com/3/device/abc',
    ]) {
      expect(safety.endpointHost(e)).toBeTruthy();
      expect(safety.validSubscription({ endpoint: e, keys })).toBe(true);
    }
  });

  it('refuses anything else', () => {
    for (const e of [
      'http://fcm.googleapis.com/fcm/send/abc', // not https
      'https://evil.example.com/hook',
      'https://fcm.googleapis.com.evil.com/x', // look-alike
      'https://evilpush.services.mozilla.com.attacker.io/',
      'https://user:pw@fcm.googleapis.com/x', // credentials
      'https://fcm.googleapis.com:8443/x', // odd port
      'https://169.254.169.254/latest/meta-data',
      'javascript:alert(1)',
      'not a url',
      42,
      undefined,
    ]) {
      expect(safety.endpointHost(e)).toBeNull();
    }
  });

  it('checks the keys', () => {
    const endpoint = 'https://fcm.googleapis.com/fcm/send/abc';
    expect(safety.validSubscription({ endpoint })).toBe(false);
    expect(safety.validSubscription({ endpoint, keys: { p256dh: 'x', auth: keys.auth } })).toBe(false);
    expect(safety.validSubscription({ endpoint, keys: { p256dh: keys.p256dh, auth: 'a b c'.repeat(6) } })).toBe(false);
    expect(safety.validSubscription({ endpoint, keys: { p256dh: keys.p256dh, auth: 'a'.repeat(500) } })).toBe(false);
    expect(safety.validSubscription(null)).toBe(false);
  });

  it('the app sends the host the rules expect', () => {
    const re = new RegExp(safety.RULES_HOST_PATTERN);
    expect(pushHost('https://fcm.googleapis.com/fcm/send/abc')).toBe('fcm.googleapis.com');
    expect(re.test(pushHost('https://web.push.apple.com/x'))).toBe(true);
    expect(pushHost(undefined)).toBe('none');
    expect(re.test('none')).toBe(true);
    expect(re.test('evil.example.com')).toBe(false);
  });

  it('firestore.rules uses the same host list', () => {
    const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');
    expect(rules).toContain(`d().host.matches('${safety.RULES_HOST_PATTERN}')`);
  });
});
