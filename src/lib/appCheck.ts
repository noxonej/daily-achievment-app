/**
 * Firebase App Check over REST (no SDK), A2 round 2.
 *
 * App Check proves a request comes from the real Squzo website and not from a bot script. The page
 * asks Google reCAPTCHA Enterprise for a token (invisible, no "I'm not a robot" box), swaps it for a
 * Firebase App Check token, and sends that with every Firestore request in the
 * `X-Firebase-AppCheck` header.
 *
 * It does nothing until both values below are filled in (see SECURITY.md → App Check). While
 * Firebase is in "monitor" mode, requests without a token still work, so turning this on can't
 * lock anybody out. Failures are silent: the request just goes without the header.
 */
const SITE_KEY: string = (import.meta.env.VITE_APPCHECK_SITE_KEY as string | undefined) || '';
/** The web app id from Firebase → Project settings → Your apps (looks like 1:5055…:web:abc123). */
const APP_ID: string = (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined) || '';
const PROJECT_ID: string = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) || 'squzo-861ad';
const API_KEY: string = (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) || 'AIzaSyDUDTAX2zxf_mVHVILcaiBe_nPiR9dLuG8';

export const appCheckConfigured = (): boolean => !!SITE_KEY && /^1:\d+:web:[0-9a-f]+$/.test(APP_ID);

interface Grecaptcha {
  enterprise: { ready: (cb: () => void) => void; execute: (key: string, o: { action: string }) => Promise<string> };
}

let cached: { token: string; expiresAt: number } | null = null;
let pending: Promise<string | null> | null = null;
let scriptPromise: Promise<Grecaptcha | null> | null = null;
let failedUntil = 0;

function loadRecaptcha(): Promise<Grecaptcha | null> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve(null);
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(SITE_KEY)}`;
    s.async = true;
    s.onload = () => {
      const g = (window as unknown as { grecaptcha?: Grecaptcha }).grecaptcha;
      if (!g?.enterprise) return resolve(null);
      g.enterprise.ready(() => resolve(g));
    };
    s.onerror = () => {
      scriptPromise = null;
      resolve(null);
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

async function fetchToken(): Promise<string | null> {
  const g = await loadRecaptcha();
  if (!g) return null;
  const recaptcha = await g.enterprise.execute(SITE_KEY, { action: 'firestore' });
  const url = `https://firebaseappcheck.googleapis.com/v1/projects/${PROJECT_ID}/apps/${APP_ID}:exchangeRecaptchaEnterpriseToken?key=${API_KEY}`;
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ recaptchaEnterpriseToken: recaptcha }) });
  if (!res.ok) return null;
  const j = (await res.json()) as { token?: string; ttl?: string };
  if (typeof j.token !== 'string') return null;
  // ttl looks like "3600s". Refresh 5 minutes early.
  const ttl = Math.max(60, parseFloat(j.ttl ?? '3600') || 3600);
  cached = { token: j.token, expiresAt: Date.now() + (ttl - 300) * 1000 };
  return j.token;
}

/** A fresh App Check token, or null (not configured, offline, blocked…). Never throws. */
export async function appCheckToken(): Promise<string | null> {
  if (!appCheckConfigured()) return null;
  if (cached && cached.expiresAt > Date.now()) return cached.token;
  if (Date.now() < failedUntil) return null;
  pending ??= fetchToken()
    .catch(() => null)
    .then((t) => {
      if (!t) failedUntil = Date.now() + 60_000; // don't retry on every request while it's failing
      return t;
    })
    .finally(() => (pending = null));
  return pending;
}

/** Headers to add to a Firestore request: the App Check token when there is one. */
export async function appCheckHeaders(): Promise<Record<string, string>> {
  const t = await appCheckToken();
  return t ? { 'X-Firebase-AppCheck': t } : {};
}

/** fetch() for Firestore: same as fetch, plus the App Check header. */
export async function fsFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const extra = await appCheckHeaders();
  return fetch(url, { ...init, headers: { ...(init.headers as Record<string, string> | undefined), ...extra } });
}
