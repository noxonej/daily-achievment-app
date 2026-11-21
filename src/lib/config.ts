/**
 * Where Squzo lives on the web, worked out from ONE value: src/site.ts (or VITE_APP_URL at build
 * time). Invite and challenge links, the Shortcut's Referer header and the share cards use these.
 * See DOMAIN.md for moving to an own domain.
 */
import { DEFAULT_APP_URL } from '../site';

/** Full address of the app, always ending in "/", e.g. https://noxonej.github.io/daily-achievment-app/ */
export const APP_URL: string = normalizeAppUrl((import.meta.env.VITE_APP_URL as string | undefined) || DEFAULT_APP_URL);
/** Just the origin, e.g. https://noxonej.github.io */
export const SITE_ORIGIN: string = new URL(APP_URL).origin;
/** The app's path on that site, e.g. /daily-achievment-app/ */
export const APP_BASE: string = new URL(APP_URL).pathname;

export function normalizeAppUrl(raw: string): string {
  const u = new URL(raw.trim());
  if (u.protocol !== 'https:' && u.hostname !== 'localhost') throw new Error('The app URL must use https.');
  return `${u.origin}${u.pathname.replace(/\/*$/, '/')}`;
}
