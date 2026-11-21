/**
 * Links that open Squzo with something to join: ?challenge=CODE and ?squad=CODE (B3), read once at
 * start and handed to the Squads screen.
 */
import { cleanCode, JOIN_CODE } from './social';

export interface PendingLink {
  kind: 'challenge' | 'squad';
  code: string;
}

let pending: PendingLink | null = null;

/** Reads the link from the address bar. Returns it when there was one. */
export function readJoinLink(params: URLSearchParams): PendingLink | null {
  for (const kind of ['challenge', 'squad'] as const) {
    const raw = params.get(kind);
    if (raw) {
      const code = cleanCode(raw);
      if (JOIN_CODE.test(code)) return (pending = { kind, code });
    }
  }
  return null;
}

/** The link waiting to be shown (once). */
export function takePendingLink(): PendingLink | null {
  const p = pending;
  pending = null;
  return p;
}
