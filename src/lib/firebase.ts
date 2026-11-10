/**
 * A tiny Firebase client (Auth + Firestore over their REST APIs, no SDK), used for Friends.
 *
 * Setup: in the same Google Cloud project as the Google sign-in, add Firebase, turn on
 * Authentication → Google and Firestore, publish `firestore.rules` from this repo, and put the web
 * app's apiKey and projectId below (they are not secrets; the rules protect the data), or set
 * VITE_FIREBASE_API_KEY / VITE_FIREBASE_PROJECT_ID when building.
 */
import { googleConfigured, googleSignIn } from './google';

const API_KEY_DEFAULT = 'AIzaSyDUDTAX2zxf_mVHVILcaiBe_nPiR9dLuG8';
const PROJECT_ID_DEFAULT = 'squzo-861ad';

const API_KEY: string = (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) || API_KEY_DEFAULT;
const PROJECT_ID: string = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) || PROJECT_ID_DEFAULT;

export const friendsConfigured = (): boolean => googleConfigured() && !!API_KEY && !!PROJECT_ID;

const BASE = () => `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/* ---------------------------------------------------------------- auth */

export interface FbSession {
  uid: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

const sessionKey = (accountId: string) => `dayforge-fb-${accountId}`;

export function loadSession(accountId: string): FbSession | null {
  try {
    const raw = localStorage.getItem(sessionKey(accountId));
    return raw ? (JSON.parse(raw) as FbSession) : null;
  } catch {
    return null;
  }
}

function saveSession(accountId: string, s: FbSession | null) {
  try {
    if (s) localStorage.setItem(sessionKey(accountId), JSON.stringify(s));
    else localStorage.removeItem(sessionKey(accountId));
  } catch {
    // session only lives in memory this time
  }
}

export function clearSession(accountId: string) {
  saveSession(accountId, null);
}

async function post<T>(url: string, body: unknown, form = false): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json' },
      body: form ? (body as string) : JSON.stringify(body),
    });
  } catch {
    throw new Error("Couldn't reach the server. Are you online?");
  }
  if (!res.ok) throw new Error('Sign-in to friends failed. Try again.');
  return (await res.json()) as T;
}

/** Signs in to Firebase with the Google account (opens Google's window; call from a tap). */
export async function friendsSignIn(accountId: string, hint?: string): Promise<FbSession> {
  const access = await googleSignIn(hint);
  const r = await post<{ localId: string; idToken: string; refreshToken: string; expiresIn: string }>(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${API_KEY}`,
    { postBody: `access_token=${access}&providerId=google.com`, requestUri: window.location.origin, returnSecureToken: true },
  );
  const s = { uid: r.localId, idToken: r.idToken, refreshToken: r.refreshToken, expiresAt: Date.now() + Number(r.expiresIn) * 1000 };
  saveSession(accountId, s);
  return s;
}

/** A valid ID token, refreshing it quietly when it's about to expire (no pop-ups). */
async function idToken(accountId: string): Promise<FbSession> {
  const s = loadSession(accountId);
  if (!s) throw new Error('Not signed in to friends.');
  if (s.expiresAt > Date.now() + 60_000) return s;
  const r = await post<{ id_token: string; refresh_token: string; expires_in: string; user_id: string }>(
    `https://securetoken.googleapis.com/v1/token?key=${API_KEY}`,
    `grant_type=refresh_token&refresh_token=${encodeURIComponent(s.refreshToken)}`,
    true,
  );
  const next = { uid: r.user_id || s.uid, idToken: r.id_token, refreshToken: r.refresh_token, expiresAt: Date.now() + Number(r.expires_in) * 1000 };
  saveSession(accountId, next);
  return next;
}

/* ---------------------------------------------------------------- Firestore values */

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
type FsValue = Record<string, unknown>;

function enc(v: Json): FsValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
  return { mapValue: { fields: encFields(v) } };
}

function encFields(o: { [k: string]: Json }): Record<string, FsValue> {
  const out: Record<string, FsValue> = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = enc(v);
  return out;
}

function dec(v: FsValue): Json {
  if ('stringValue' in v) return v.stringValue as string;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return !!v.booleanValue;
  if ('arrayValue' in v) return (((v.arrayValue as { values?: FsValue[] }).values ?? []) as FsValue[]).map(dec);
  if ('mapValue' in v) return decFields(((v.mapValue as { fields?: Record<string, FsValue> }).fields ?? {}) as Record<string, FsValue>);
  return null;
}

function decFields(f: Record<string, FsValue>): { [k: string]: Json } {
  const out: { [k: string]: Json } = {};
  for (const [k, v] of Object.entries(f ?? {})) out[k] = dec(v);
  return out;
}

export interface Doc<T> {
  id: string;
  data: T;
}

/** Firestore over REST for one signed-in account. */
export function db(accountId: string) {
  async function call(path: string, init: RequestInit = {}): Promise<Response> {
    const s = await idToken(accountId);
    let res: Response;
    try {
      res = await fetch(`${BASE()}${path}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.idToken}`, ...(init.headers ?? {}) },
      });
    } catch {
      throw new Error("Couldn't reach the server. Are you online?");
    }
    if (!res.ok && res.status !== 404) throw new Error(res.status === 403 ? 'Not allowed.' : `Server error (${res.status}).`);
    return res;
  }

  return {
    uid: () => loadSession(accountId)?.uid ?? '',

    async get<T>(path: string): Promise<T | null> {
      const res = await call(`/${path}`);
      if (res.status === 404) return null;
      const d = (await res.json()) as { fields?: Record<string, FsValue> };
      return decFields(d.fields ?? {}) as T;
    },

    async set(path: string, data: { [k: string]: Json }) {
      await call(`/${path}`, { method: 'PATCH', body: JSON.stringify({ fields: encFields(data) }) });
    },

    async add(collection: string, data: { [k: string]: Json }) {
      await call(`/${collection}`, { method: 'POST', body: JSON.stringify({ fields: encFields(data) }) });
    },

    async remove(path: string) {
      await call(`/${path}`, { method: 'DELETE' });
    },

    /** Documents in `parent/collection`, optionally filtered by one field and sorted. */
    async query<T>(
      parent: string,
      collection: string,
      opts: { where?: [string, Json]; orderBy?: string; limit?: number } = {},
    ): Promise<Array<Doc<T>>> {
      const structuredQuery: Record<string, unknown> = { from: [{ collectionId: collection }] };
      if (opts.where) structuredQuery.where = { fieldFilter: { field: { fieldPath: opts.where[0] }, op: 'EQUAL', value: enc(opts.where[1]) } };
      if (opts.orderBy) structuredQuery.orderBy = [{ field: { fieldPath: opts.orderBy }, direction: 'DESCENDING' }];
      if (opts.limit) structuredQuery.limit = opts.limit;
      const res = await call(`${parent ? `/${parent}` : ''}:runQuery`, { method: 'POST', body: JSON.stringify({ structuredQuery }) });
      if (res.status === 404) return [];
      const rows = (await res.json()) as Array<{ document?: { name: string; fields?: Record<string, FsValue> } }>;
      return rows
        .filter((r) => r.document)
        .map((r) => ({ id: r.document!.name.split('/').pop()!, data: decFields(r.document!.fields ?? {}) as T }));
    },
  };
}
