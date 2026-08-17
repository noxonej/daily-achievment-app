export interface SyncConfig {
  token: string;
  owner: string;
  repo: string;
  path: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}

const SYNC_STORAGE_KEY = 'daily-quest-app-sync-config-v1';

export function loadSyncConfig(): SyncConfig | null {
  try {
    const raw = localStorage.getItem(SYNC_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.token !== 'string' || !parsed.token) return null;
    return parsed as SyncConfig;
  } catch {
    return null;
  }
}

export function saveSyncConfig(cfg: SyncConfig) {
  localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(cfg));
}

export function clearSyncConfig() {
  localStorage.removeItem(SYNC_STORAGE_KEY);
}

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToUtf8(b64: string): string {
  const binary = atob(b64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function contentsUrl(cfg: Pick<SyncConfig, 'owner' | 'repo' | 'path'>): string {
  const cleanPath = cfg.path.replace(/^\/+/, '');
  return `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${cleanPath
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
}

function ghHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export type SyncOutcome = { ok: true; message: string } | { ok: false; message: string };

export async function pushStateToGithub(cfg: SyncConfig, data: unknown): Promise<SyncOutcome> {
  const url = contentsUrl(cfg);
  let sha: string | undefined;
  try {
    const getRes = await fetch(url, { headers: ghHeaders(cfg.token) });
    if (getRes.ok) {
      const json = await getRes.json();
      sha = json.sha;
    } else if (getRes.status !== 404) {
      return { ok: false, message: describeError(getRes.status) };
    }

    const putRes = await fetch(url, {
      method: 'PUT',
      headers: { ...ghHeaders(cfg.token), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Sync progress — ${new Date().toISOString()}`,
        content: utf8ToBase64(JSON.stringify(data, null, 2)),
        sha,
      }),
    });
    if (!putRes.ok) return { ok: false, message: describeError(putRes.status) };
    return { ok: true, message: 'Synced to GitHub' };
  } catch {
    return { ok: false, message: 'Network error reaching GitHub.' };
  }
}

export async function pullStateFromGithub(cfg: SyncConfig): Promise<
  { ok: true; data: unknown } | { ok: false; message: string }
> {
  const url = contentsUrl(cfg);
  try {
    const res = await fetch(url, { headers: ghHeaders(cfg.token) });
    if (res.status === 404) return { ok: false, message: 'No backup found on GitHub yet — sync first.' };
    if (!res.ok) return { ok: false, message: describeError(res.status) };
    const json = await res.json();
    const decoded = base64ToUtf8(json.content as string);
    try {
      return { ok: true, data: JSON.parse(decoded) };
    } catch {
      return { ok: false, message: 'The file on GitHub was not valid JSON.' };
    }
  } catch {
    return { ok: false, message: 'Network error reaching GitHub.' };
  }
}

function describeError(status: number): string {
  if (status === 401) return 'GitHub rejected the token. Check that it is valid and not expired.';
  if (status === 403) return "Token doesn't have permission for this repo (needs Contents: Read and write).";
  if (status === 404) return 'Repo not found — check the owner and repo name.';
  return `GitHub returned an error (${status}).`;
}
