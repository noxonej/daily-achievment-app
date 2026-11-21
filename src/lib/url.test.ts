import { describe, expect, it } from 'vitest';
import { safeLink, safePicture } from './url';

describe('safeLink', () => {
  it('adds https:// to bare addresses', () => {
    expect(safeLink('shop.com/shoes')).toBe('https://shop.com/shoes');
    expect(safeLink(' www.zalando.lt ')).toBe('https://www.zalando.lt/');
    expect(safeLink('shop.com:8080/x')).toBe('https://shop.com:8080/x');
  });
  it('keeps http and https', () => {
    expect(safeLink('https://a.com/x?y=1')).toBe('https://a.com/x?y=1');
    expect(safeLink('HTTP://a.com')).toBe('http://a.com/');
  });
  it('refuses other schemes and junk', () => {
    for (const bad of ['javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html,hi', 'file:///etc/passwd', 'vbscript:x', 'mailto:a@b.com', 'hello', '', '   ', 'a b.com', 'https://user:pw@a.com', 42, null, undefined]) {
      expect(safeLink(bad)).toBeUndefined();
    }
  });
});

describe('safePicture', () => {
  it('only allows Google account photos', () => {
    expect(safePicture('https://lh3.googleusercontent.com/a/abc=s96-c')).toBeTruthy();
    expect(safePicture('https://evil.com/track.png')).toBeUndefined();
    expect(safePicture('https://lh3.googleusercontent.com.evil.com/a')).toBeUndefined();
    expect(safePicture('http://lh3.googleusercontent.com/a')).toBeUndefined();
    expect(safePicture(undefined)).toBeUndefined();
  });
});
