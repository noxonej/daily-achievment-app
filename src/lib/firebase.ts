/**
 * A tiny Firebase client (Auth + Firestore over their REST APIs, no SDK), used for Friends.
 *
 * Setup: in the same Google Cloud project as the Google sign-in, add Firebase, turn on
 * Authentication → Google and Firestore, publish `firestore.rules` from this repo, and put the web
 * app's apiKey and projectId below (they are not secrets; the rules protect the data), or set
 * VITE_FIREBASE_API_KEY / VITE_FIREBASE_PROJECT_ID when building.
 */
import { googleConfigured, googleSignIn } from './google';
import { appCheckHeaders, fsFetch } from './appCheck';
import { b64ToBytes, bytesToB64, cryptoAvailable, decryptBytes, encryptBytes, localBackupKey } from './backupCrypto';

const API_KEY_DEFAULT = 'AIzaSyDUDTAX2zxf_mVHVILcaiBe_nPiR9dLuG8';
const PROJECT_ID_DEFAULT = 'squzo-861ad';

const API_KEY: string = (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) || API_KEY_DEFAULT;
const PROJECT_ID: string = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) || PROJECT_ID_DEFAULT;

export const friendsConfigured = (): boolean => googleConfigured() && !!API_KEY && !!PROJECT_ID;

const BASE = () => `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/** Public address of one Firestore document, usable without signing in (the rules decide what's allowed). */
export const publicDocUrl = (path: string) => `${BASE()}/${path}?key=${API_KEY}`;

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

/** Deletes the signed-in Firebase user itself (name, email and photo kept by Firebase sign-in). */
export async function deleteFirebaseUser(accountId: string) {
  const s = await idToken(accountId);
  await post(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${API_KEY}`, { idToken: s.idToken });
  clearSession(accountId);
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
      const check = await appCheckHeaders();
      res = await fetch(`${BASE()}${path}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.idToken}`, ...check, ...(init.headers ?? {}) },
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

    /**
     * Creates a document only if it doesn't exist yet. Returns false when it already exists (or the
     * rules refuse it), so callers can try another id.
     */
    async create(path: string, data: { [k: string]: Json }): Promise<boolean> {
      try {
        const res = await call(`/${path}?currentDocument.exists=false`, { method: 'PATCH', body: JSON.stringify({ fields: encFields(data) }) });
        return res.ok;
      } catch {
        return false;
      }
    },

    /** Changes only these fields of an existing document (the others stay as they are). */
    async patch(path: string, data: { [k: string]: Json }) {
      const mask = Object.keys(data).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
      await call(`/${path}?${mask}&currentDocument.exists=true`, { method: 'PATCH', body: JSON.stringify({ fields: encFields(data) }) });
    },

    async add(collection: string, data: { [k: string]: Json }) {
      await call(`/${collection}`, { method: 'POST', body: JSON.stringify({ fields: encFields(data) }) });
    },

    async remove(path: string) {
      await call(`/${path}`, { method: 'DELETE' });
    },

    /** Like set, but also stamps `field` with the server's own clock (the rules can check it). */
    async setStamped(path: string, data: { [k: string]: Json }, field: string, opts: { create?: boolean } = {}) {
      const name = `projects/${PROJECT_ID}/databases/(default)/documents/${path}`;
      const writes = [
        {
          update: { name, fields: encFields(data) },
          updateTransforms: [{ fieldPath: field, setToServerValue: 'REQUEST_TIME' }],
          ...(opts.create ? { currentDocument: { exists: false } } : {}),
        },
      ];
      await call(':commit', { method: 'POST', body: JSON.stringify({ writes }) });
    },

    /** Deletes many documents in batches (each batch is all-or-nothing). */
    async removeMany(paths: string[]) {
      const root = `projects/${PROJECT_ID}/databases/(default)/documents`;
      for (let i = 0; i < paths.length; i += 400) {
        const writes = paths.slice(i, i + 400).map((p) => ({ delete: `${root}/${p}` }));
        await call(':commit', { method: 'POST', body: JSON.stringify({ writes }) });
      }
    },

    /** How many documents in `parent/collection` match a number filter (e.g. level >= 10). */
    async count(parent: string, collection: string, where?: [string, 'GREATER_THAN' | 'GREATER_THAN_OR_EQUAL', number]): Promise<number> {
      const structuredQuery: Record<string, unknown> = { from: [{ collectionId: collection }] };
      if (where) structuredQuery.where = { fieldFilter: { field: { fieldPath: where[0] }, op: where[1], value: enc(where[2]) } };
      const res = await call(`${parent ? `/${parent}` : ''}:runAggregationQuery`, {
        method: 'POST',
        body: JSON.stringify({ structuredAggregationQuery: { structuredQuery, aggregations: [{ alias: 'n', count: {} }] } }),
      });
      if (res.status === 404) return 0;
      const rows = (await res.json()) as Array<{ result?: { aggregateFields?: { n?: FsValue } } }>;
      const n = rows[0]?.result?.aggregateFields?.n;
      return n ? Number(dec(n)) : 0;
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

/* ---------------------------------------------------------------- public reads (no sign-in) */

/** Reads one document without signing in (only works where the rules allow it). null when missing. */
export async function publicGet<T>(path: string): Promise<T | null> {
  const res = await fsFetch(publicDocUrl(path), { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(res.status === 403 ? 'Not allowed.' : `Server error (${res.status}).`);
  const d = (await res.json()) as { fields?: Record<string, FsValue> };
  return decFields(d.fields ?? {}) as T;
}

/** The top `limit` documents of a collection by a number field, without signing in. */
export async function publicTop<T>(parent: string, collection: string, orderBy: string, limit: number): Promise<Array<Doc<T>>> {
  const structuredQuery = { from: [{ collectionId: collection }], orderBy: [{ field: { fieldPath: orderBy }, direction: 'DESCENDING' }], limit };
  const res = await fsFetch(`${BASE()}/${parent}:runQuery?key=${API_KEY}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ structuredQuery }) });
  if (!res.ok) return [];
  const rows = (await res.json()) as Array<{ document?: { name: string; fields?: Record<string, FsValue> } }>;
  return rows.filter((r) => r.document).map((r) => ({ id: r.document!.name.split('/').pop()!, data: decFields(r.document!.fields ?? {}) as T }));
}

/* ---------------------------------------------------------------- automatic cloud backup */

/** Firestore keeps one document per account; stay safely under its 1 MB limit. */
const MAX_BACKUP = 900_000;

/**
 * Removes the private writing (diary pages, quest notes, proof answers and free notes). Used for the
 * cloud backup only while it can't be encrypted yet: that text then stays on the phone and in your
 * Google Drive backup, never in Squzo's database in readable form.
 */
export function stripPrivateText<T>(state: T): T {
  if (!state || typeof state !== 'object') return state;
  const s = state as Record<string, unknown>;
  const clean = (logs: unknown, keys: string[]) =>
    logs && typeof logs === 'object'
      ? Object.fromEntries(
          Object.entries(logs as Record<string, Record<string, unknown>>).map(([k, l]) => {
            if (!l || typeof l !== 'object') return [k, l];
            const copy = { ...l };
            for (const key of keys) delete copy[key];
            return [k, copy];
          }),
        )
      : logs;
  return { ...s, notes: [], dayLogs: clean(s.dayLogs, ['notes', 'freeNote', 'proofs']), weekLogs: clean(s.weekLogs, ['notes']) } as T;
}

/** Puts the private writing from `full` (e.g. a Google Drive backup) back into a backup that left it out. */
export function mergePrivateText<T>(lite: T, full: unknown): T {
  if (!lite || typeof lite !== 'object' || !full || typeof full !== 'object') return lite;
  const l = lite as Record<string, unknown>;
  const f = full as Record<string, unknown>;
  const pick = (logsL: unknown, logsF: unknown, keys: string[]) => {
    if (!logsL || typeof logsL !== 'object' || !logsF || typeof logsF !== 'object') return logsL;
    const out: Record<string, unknown> = { ...(logsL as Record<string, unknown>) };
    for (const [k, fl] of Object.entries(logsF as Record<string, Record<string, unknown>>)) {
      if (!fl || typeof fl !== 'object') continue;
      const extra = Object.fromEntries(keys.filter((key) => fl[key] !== undefined).map((key) => [key, fl[key]]));
      out[k] = out[k] && typeof out[k] === 'object' ? { ...(out[k] as object), ...extra } : out[k];
    }
    return out;
  };
  return {
    ...l,
    notes: Array.isArray(f.notes) ? f.notes : l.notes,
    dayLogs: pick(l.dayLogs, f.dayLogs, ['notes', 'freeNote', 'proofs']),
    weekLogs: pick(l.weekLogs, f.weekLogs, ['notes']),
  } as T;
}

/** gzip when the browser can (all current ones can); otherwise the bytes as they are. */
async function gzip(bytes: Uint8Array<ArrayBuffer>): Promise<{ bytes: Uint8Array<ArrayBuffer>; z: boolean }> {
  try {
    if (typeof CompressionStream === 'undefined') return { bytes, z: false };
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
    return { bytes: new Uint8Array(await new Response(stream).arrayBuffer()), z: true };
  } catch {
    return { bytes, z: false };
  }
}

async function gunzip(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  if (typeof DecompressionStream === 'undefined') throw new Error('This browser can’t unpack the backup.');
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/* What went wrong with the last cloud backup (shown in Settings → Data), cleared when one works. */
const problemKey = (accountId: string) => `dayforge-backup-problem-${accountId}`;
export function backupProblem(accountId: string): { reason: 'too-big'; at: string; kb: number } | null {
  try {
    const v = JSON.parse(localStorage.getItem(problemKey(accountId)) ?? 'null');
    return v && v.reason === 'too-big' ? v : null;
  } catch {
    return null;
  }
}
function setProblem(accountId: string, kb: number | null) {
  try {
    if (kb === null) localStorage.removeItem(problemKey(accountId));
    else localStorage.setItem(problemKey(accountId), JSON.stringify({ reason: 'too-big', at: new Date().toISOString(), kb }));
  } catch {
    // storage full
  }
}

export type BackupResult = { ok: true; savedAt: string; encrypted: boolean } | { ok: false; reason: 'no-session' | 'too-big' | 'error' };

/**
 * Saves the app state to `backups/{uid}`. Works for as long as the person stays signed in
 * (Firebase refreshes its own token), so it needs no pop-up and no "Back up" button.
 *
 * v2 (normal): the whole state, encrypted on the phone (see backupCrypto.ts).
 * v1 + lite: only while this phone has no backup key yet; the diary and notes are left out.
 */
export async function cloudBackup(accountId: string, state: unknown): Promise<BackupResult> {
  if (!friendsConfigured() || !loadSession(accountId)) return { ok: false, reason: 'no-session' };
  const api = db(accountId);
  const savedAt = new Date().toISOString();
  const key = localBackupKey(accountId);
  const encrypted = !!key && cryptoAvailable();
  const plain = new TextEncoder().encode(JSON.stringify(encrypted ? state : stripPrivateText(state)));
  // Packed (gzip) first: a save of a few MB usually shrinks to a tenth.
  const packed = await gzip(plain);
  let doc: { [k: string]: Json };
  if (encrypted) {
    const { data, iv } = await encryptBytes(key!, packed.bytes);
    doc = { data, iv, savedAt, v: 2, ...(packed.z ? { z: 'gzip' } : {}) };
  } else {
    doc = packed.z
      ? { data: bytesToB64(packed.bytes), savedAt, v: 1, lite: true, z: 'gzip' }
      : { data: new TextDecoder().decode(plain), savedAt, v: 1, lite: true };
  }
  const size = (doc.data as string).length;
  if (size > MAX_BACKUP) {
    setProblem(accountId, Math.round(size / 1024));
    return { ok: false, reason: 'too-big' };
  }
  await api.set(`backups/${api.uid()}`, doc);
  setProblem(accountId, null);
  return { ok: true, savedAt, encrypted };
}

/**
 * Reads `backups/{uid}`: old plain backups (v1), lite ones (v1 without diary) and encrypted ones (v2).
 * An encrypted backup needs the key on this phone (call ensureBackupKey after a Google sign-in first);
 * without it this returns null.
 */
export async function cloudRestore(accountId: string): Promise<{ data: unknown; savedAt: string; lite: boolean } | null> {
  if (!friendsConfigured() || !loadSession(accountId)) return null;
  const api = db(accountId);
  const doc = await api.get<Record<string, unknown>>(`backups/${api.uid()}`);
  if (!doc || typeof doc.data !== 'string') return null;
  const savedAt = typeof doc.savedAt === 'string' ? doc.savedAt : '';
  try {
    const zipped = doc.z === 'gzip';
    if (doc.v === 2) {
      const key = localBackupKey(accountId);
      if (!key || !cryptoAvailable() || typeof doc.iv !== 'string') return null;
      const opened = await decryptBytes(key, doc.data, doc.iv);
      const plain = zipped ? await gunzip(opened) : opened;
      return { data: JSON.parse(new TextDecoder().decode(plain)), savedAt, lite: false };
    }
    const text = zipped ? new TextDecoder().decode(await gunzip(b64ToBytes(doc.data))) : doc.data;
    return { data: JSON.parse(text), savedAt, lite: doc.lite === true };
  } catch {
    return null;
  }
}
