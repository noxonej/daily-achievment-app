/**
 * "Continue with Google": signs in with Google Identity Services and keeps a backup of your
 * progress in your own Google Drive, in the hidden app-data folder (only Dayforge can see it,
 * and it doesn't touch your files or your email).
 *
 * Needs an OAuth "Web application" client ID from Google Cloud Console with this site's address
 * as an authorised JavaScript origin. Put it in GOOGLE_CLIENT_ID below (it isn't a secret), or
 * set VITE_GOOGLE_CLIENT_ID when building. Without one, the Google buttons show as "coming soon".
 */
const GOOGLE_CLIENT_ID_DEFAULT = '';

export const GOOGLE_CLIENT_ID: string = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || GOOGLE_CLIENT_ID_DEFAULT;

export const googleConfigured = (): boolean => GOOGLE_CLIENT_ID.length > 0;

const SCOPES = 'openid email profile https://www.googleapis.com/auth/drive.appdata';
const BACKUP_NAME = 'dayforge-backup.json';

export interface GoogleProfile {
  email: string;
  name?: string;
  picture?: string;
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}

interface GisTokenClient {
  requestAccessToken: (overrides?: { prompt?: string; login_hint?: string }) => void;
}

interface Gis {
  accounts: {
    oauth2: {
      initTokenClient: (cfg: {
        client_id: string;
        scope: string;
        callback: (r: TokenResponse) => void;
        error_callback?: (e: { type?: string; message?: string }) => void;
      }) => GisTokenClient;
      revoke: (token: string, done?: () => void) => void;
    };
  };
}

declare global {
  interface Window {
    google?: Gis;
  }
}

let gisPromise: Promise<Gis> | null = null;

function loadGis(): Promise<Gis> {
  if (window.google?.accounts?.oauth2) return Promise.resolve(window.google);
  gisPromise ??= new Promise<Gis>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => (window.google?.accounts?.oauth2 ? resolve(window.google) : reject(new Error('Google sign-in failed to load.')));
    s.onerror = () => {
      gisPromise = null;
      reject(new Error("Couldn't reach Google. Are you online?"));
    };
    document.head.appendChild(s);
  });
  return gisPromise;
}

let token: { value: string; expiresAt: number } | null = null;

export function hasValidToken(): boolean {
  return !!token && token.expiresAt > Date.now() + 60_000;
}

/**
 * Opens Google's sign-in window (must be called from a tap). Returns an access token for the
 * profile and the app's Drive folder. `hint` pre-selects the linked account.
 */
export async function googleSignIn(hint?: string): Promise<string> {
  if (!googleConfigured()) throw new Error("Google sign-in isn't set up yet.");
  if (hasValidToken()) return token!.value;
  const gis = await loadGis();
  return new Promise<string>((resolve, reject) => {
    const client = gis.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: (r) => {
        if (r.error || !r.access_token) return reject(new Error(r.error === 'access_denied' ? 'Google sign-in was cancelled.' : 'Google sign-in failed.'));
        token = { value: r.access_token, expiresAt: Date.now() + (r.expires_in ?? 3600) * 1000 };
        resolve(r.access_token);
      },
      error_callback: (e) => reject(new Error(e?.type === 'popup_closed' ? 'Google sign-in was cancelled.' : 'Google sign-in failed.')),
    });
    client.requestAccessToken(hint ? { login_hint: hint } : {});
  });
}

async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  if (!token) throw new Error('Not signed in to Google.');
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token.value}` } });
  } catch {
    throw new Error("Couldn't reach Google. Are you online?");
  }
  if (res.status === 401) {
    token = null;
    throw new Error('Google sign-in expired. Tap again to reconnect.');
  }
  if (!res.ok) throw new Error(`Google returned an error (${res.status}).`);
  return (await res.json()) as T;
}

export async function googleProfile(): Promise<GoogleProfile> {
  const p = await api<{ email: string; name?: string; given_name?: string; picture?: string }>('https://www.googleapis.com/oauth2/v3/userinfo');
  return { email: p.email, name: p.given_name || p.name, picture: p.picture };
}

interface DriveFile {
  id: string;
  modifiedTime?: string;
}

/** The backup file in the app's Drive folder, if there is one. */
export async function findBackup(): Promise<DriveFile | null> {
  const q = encodeURIComponent(`name='${BACKUP_NAME}'`);
  const r = await api<{ files: DriveFile[] }>(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)&orderBy=modifiedTime desc`);
  return r.files?.[0] ?? null;
}

export async function downloadBackup(fileId: string): Promise<unknown> {
  return api<unknown>(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
}

/** Saves the backup (creating the file the first time). Returns its id and time. */
export async function uploadBackup(data: unknown, existingId?: string): Promise<{ id: string; modifiedTime: string }> {
  const boundary = `dayforge${Math.random().toString(36).slice(2)}`;
  const meta = existingId ? {} : { name: BACKUP_NAME, parents: ['appDataFolder'], mimeType: 'application/json' };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(data)}\r\n--${boundary}--`;
  const url = existingId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart&fields=id,modifiedTime`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime';
  const r = await api<{ id: string; modifiedTime?: string }>(url, {
    method: existingId ? 'PATCH' : 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  return { id: r.id, modifiedTime: r.modifiedTime ?? new Date().toISOString() };
}

export async function googleSignOut() {
  const t = token?.value;
  token = null;
  if (!t) return;
  try {
    (await loadGis()).accounts.oauth2.revoke(t);
  } catch {
    // signed out locally either way
  }
}

/** Looks like a Dayforge backup (same check as importing a file). */
export function isBackup(x: unknown): x is { quests: unknown[]; goals: unknown[]; profile?: { name?: string } } {
  return !!x && typeof x === 'object' && Array.isArray((x as { quests?: unknown }).quests) && Array.isArray((x as { goals?: unknown }).goals);
}
