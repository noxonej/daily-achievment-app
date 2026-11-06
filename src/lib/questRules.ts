import type { Quest } from './types';

/**
 * What a written quest needs before it counts as done, so typing "." can't complete it.
 * - list: N separate entries (e.g. Gratitude x3), each with real words, no duplicates
 * - words: a minimum number of real words (e.g. a journal entry)
 */
export type NoteRule = { kind: 'list'; count: number; minLetters: number } | { kind: 'words'; count: number };

const LETTER = /\p{L}/gu;

function letters(s: string): number {
  return (s.match(LETTER) ?? []).length;
}

/** Words that contain at least two letters (so "a . , ok" doesn't pad the count). */
export function realWords(s: string): number {
  return s.split(/\s+/).filter((w) => letters(w) >= 2).length;
}

export function noteRule(quest: Quest): NoteRule {
  if (quest.noteList) return { kind: 'list', count: quest.noteList, minLetters: 3 };
  if (quest.noteMinWords) return { kind: 'words', count: quest.noteMinWords };
  const listMatch = quest.title.match(/\bx\s?(\d)\b|\btop\s?(\d)\b|\b(\d)\s+things\b/i);
  if (listMatch) {
    const n = Number(listMatch[1] ?? listMatch[2] ?? listMatch[3]);
    if (n >= 2 && n <= 10) return { kind: 'list', count: n, minLetters: 3 };
  }
  if (/journal|retrospective|note|reflect|letter/i.test(quest.title)) return { kind: 'words', count: 10 };
  return { kind: 'words', count: 3 };
}

export function splitEntries(note: string): string[] {
  return note.split('\n');
}

export interface NoteCheck {
  done: boolean;
  /** How many of the required entries/words are there so far. */
  have: number;
  need: number;
  /** Per-entry validity, for list rules. */
  entryOk?: boolean[];
  hint?: string;
}

export function checkNote(quest: Quest, note: string): NoteCheck {
  const rule = noteRule(quest);
  if (rule.kind === 'words') {
    const have = realWords(note);
    return { done: have >= rule.count, have: Math.min(have, rule.count), need: rule.count, hint: have < rule.count ? `${rule.count - have} more words to go` : undefined };
  }
  const entries = splitEntries(note).map((e) => e.trim());
  const seen = new Set<string>();
  const entryOk = Array.from({ length: rule.count }, (_, i) => {
    const e = entries[i] ?? '';
    const key = e.toLowerCase().replace(/\s+/g, ' ');
    const ok = letters(e) >= rule.minLetters && !seen.has(key);
    if (ok) seen.add(key);
    return ok;
  });
  const have = entryOk.filter(Boolean).length;
  const dup = entries.slice(0, rule.count).some((e, i) => e && letters(e) >= rule.minLetters && !entryOk[i]);
  return {
    done: have >= rule.count,
    have,
    need: rule.count,
    entryOk,
    hint: dup ? 'Each one needs to be different' : have < rule.count ? `${rule.count - have} more to go` : undefined,
  };
}
