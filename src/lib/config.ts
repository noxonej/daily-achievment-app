/**
 * Where Squzo lives on the web. Change it in ONE place when moving to an own domain (C4):
 * set VITE_SITE_ORIGIN (e.g. https://squzo.app) and VITE_BASE (e.g. /) when building, or edit the
 * defaults below. Invite and challenge links, the Shortcut's Referer header and the share cards
 * all use these.
 */
export const SITE_ORIGIN: string = ((import.meta.env.VITE_SITE_ORIGIN as string | undefined) || 'https://noxonej.github.io').replace(/\/+$/, '');
/** The app's path on that site, always ending in "/" (from vite.config.ts `base`). */
export const APP_BASE: string = import.meta.env.BASE_URL || '/';
/** Full address of the app, e.g. https://noxonej.github.io/daily-achievment-app/ */
export const APP_URL = `${SITE_ORIGIN}${APP_BASE}`;
