/**
 * End-to-end encryption for the automatic cloud backup (Firestore backups/{uid}).
 *
 * The backup is locked on the phone with AES-GCM before it is uploaded. The key is a random secret
 * made on the phone. It is kept in two places only:
 * - on this phone (localStorage), and
 * - in your own Google Drive, in Squzo's hidden app folder (squzo-backup-key.json), so a new phone
 *   can unlock the backup after you continue with Google.
 * Squzo's server (Firebase) never sees the key, so the project owner can't read your backup.
 *
 * A key is only ever made while a Google sign-in is fresh, and it is saved to Drive first, so there
 * is never an encrypted backup that a new phone can't open.
 */
import { findAppFile, downloadBackup as downloadAppFile, hasValidToken, uploadAppFile } from './google';

const KEY_FILE = 'squzo-backup-key.json';
const localKeyName = (accountId: string) => `dayforge-backup-key-${accountId}`;

export const cryptoAvailable = (): boolean => typeof crypto !== 'undefined' && !!crypto.subtle;

export function bytesToB64(bytes: Uint8Array): string {
  let s = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) s += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(s);
}

export function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const raw = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** The backup key saved on this phone (base64 of 32 random bytes), or null. */
export function localBackupKey(accountId: string): string | null {
  try {
    const k = localStorage.getItem(localKeyName(accountId));
    return k && k.length >= 40 ? k : null;
  } catch {
    return null;
  }
}

function saveLocalKey(accountId: string, key: string) {
  try {
    localStorage.setItem(localKeyName(accountId), key);
  } catch {
    // storage full: the key is still in Drive, the next sign-in brings it back
  }
}

export function forgetBackupKey(accountId: string) {
  try {
    localStorage.removeItem(localKeyName(accountId));
  } catch {
    // nothing to do
  }
}

/**
 * Makes sure this phone has the backup key, using a fresh Google sign-in (call right after
 * googleSignIn). Takes the key from Drive when there is one; otherwise makes a new key and saves
 * it to Drive first. Returns the key, or null when it couldn't (offline, Drive refused…).
 */
export async function ensureBackupKey(accountId: string): Promise<string | null> {
  if (!cryptoAvailable() || !hasValidToken()) return localBackupKey(accountId);
  try {
    const file = await findAppFile(KEY_FILE);
    if (file) {
      const doc = (await downloadAppFile(file.id)) as { key?: unknown } | null;
      if (doc && typeof doc.key === 'string' && doc.key.length >= 40) {
        saveLocalKey(accountId, doc.key);
        return doc.key;
      }
    }
    // No key in Drive yet. A key this phone already has (from before) is reused, so older backups stay readable.
    const key = localBackupKey(accountId) ?? bytesToB64(crypto.getRandomValues(new Uint8Array(32)));
    await uploadAppFile(KEY_FILE, { key, made: new Date().toISOString(), note: 'Unlocks your Squzo cloud backup. Keep it.' }, file?.id);
    saveLocalKey(accountId, key);
    return key;
  } catch {
    return localBackupKey(accountId);
  }
}

async function aesKey(key: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', b64ToBytes(key), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

/** Encrypts bytes. Returns base64 ciphertext and IV. */
export async function encryptBytes(key: string, plain: Uint8Array<ArrayBuffer>): Promise<{ data: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const out = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(key), plain);
  return { data: bytesToB64(new Uint8Array(out)), iv: bytesToB64(iv) };
}

export async function decryptBytes(key: string, data: string, iv: string): Promise<Uint8Array<ArrayBuffer>> {
  const out = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(iv) }, await aesKey(key), b64ToBytes(data));
  return new Uint8Array(out);
}
