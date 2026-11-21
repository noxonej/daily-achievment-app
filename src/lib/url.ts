/**
 * Web addresses typed by the user or read from a backup file / another user (A4 + A5, round 2).
 */

/**
 * A link that is safe to put in <a href>: only http(s). "shop.com/shoes" becomes
 * "https://shop.com/shoes" (without the scheme the browser would open it as a page inside Squzo).
 * javascript:, data:, file: and everything else give undefined.
 */
export function safeLink(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const t = raw.trim();
  if (!t || t.length > 2000 || /\s/.test(t)) return undefined;
  // Has a scheme ("xyz:")? Then it must be http(s). Otherwise treat it as a bare web address.
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(t) && !/^[^:/]+:\d+(\/|$)/.test(t) ? t : `https://${t.replace(/^\/+/, '')}`;
  let u: URL;
  try {
    u = new URL(withScheme);
  } catch {
    return undefined;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return undefined;
  // A real web address has a dot in its name ("shop.com"), or is localhost.
  if (!u.hostname.includes('.') && u.hostname !== 'localhost') return undefined;
  if (u.username || u.password) return undefined;
  return u.href;
}

/** Google account photos only (lh3.googleusercontent.com/…), so a friend can't make your phone load their server. */
export const GOOGLE_PHOTO = /^https:\/\/lh[0-9]\.googleusercontent\.com\//;

export function safePicture(raw: unknown): string | undefined {
  return typeof raw === 'string' && raw.length <= 500 && GOOGLE_PHOTO.test(raw) ? raw : undefined;
}
