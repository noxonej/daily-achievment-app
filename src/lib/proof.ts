import type { Quest } from './types';

/**
 * A quick "proof" for quests where it makes sense: after reading, say what it was about; after a
 * workout, what you trained. It's honour-based (nobody checks), but writing it down makes you
 * remember more and keeps you honest. Answering gives a small coin bonus.
 */
export interface ProofAsk {
  question: string;
  placeholder: string;
  /** Real words needed before Confirm unlocks. */
  minWords: number;
}

const ASKS: Array<{ re: RegExp; ask: ProofAsk }> = [
  { re: /read|pages|book|article/, ask: { question: 'What did you read about?', placeholder: 'In one or two sentences: what happened, or what was the main idea?', minWords: 6 } },
  { re: /language|words/, ask: { question: 'Write 3 words you learned', placeholder: 'word = meaning, word = meaning…', minWords: 3 } },
  { re: /study|course|lesson|learn|skill|code|coding|documentary|podcast|video that teaches/, ask: { question: 'Teach it back: what did you learn?', placeholder: 'Explain it like to a friend in one or two sentences.', minWords: 6 } },
  { re: /push-?ups?|pull-?ups?|squats?|sit-?ups?|plank|work ?out|gym|train|exercise|yoga|mobility|stretch|sport/, ask: { question: 'What did you train?', placeholder: 'e.g. 5 sets of 10 push-ups, then 3 min plank. Felt strong.', minWords: 4 } },
  { re: /\brun\b|\bkm\b|jog|walk|hike|cycle/, ask: { question: 'How did it go?', placeholder: 'Where did you go, and how did it feel?', minWords: 4 } },
  { re: /meditat|silence|breath/, ask: { question: 'How did you feel before and after?', placeholder: 'e.g. Stressed before, calmer after. Mind wandered a lot.', minWords: 4 } },
  { re: /deep work|focus|single-task|side project|project|build|ship|draw|design|instrument|practi[cs]e/, ask: { question: 'What did you get done?', placeholder: 'One line on what you made or finished.', minWords: 4 } },
  { re: /sale|sell|offer|pitch|business|earn|content|post one|network|problem people/, ask: { question: 'What did you do, and what happened?', placeholder: 'Who did you talk to or what did you post? Any reply?', minWords: 5 } },
  { re: /tidy|clean|laundry|desk|errand|avoiding|putting off/, ask: { question: 'What did you sort out?', placeholder: 'e.g. Cleared my desk and threw out old papers.', minWords: 3 } },
  { re: /message|call|friend|family|compliment|thank|kind|stranger|someone new|conversation|speak up|scar/, ask: { question: 'Who was it, and how did it go?', placeholder: 'A first name or a few words is enough.', minWords: 3 } },
  { re: /cook|meal|healthy|protein|vegetable/, ask: { question: 'What did you eat or make?', placeholder: 'e.g. Chicken, rice and broccoli.', minWords: 3 } },
];

/** The proof question for a quest, or null if it doesn't need one (written quests already are proof). */
export function proofFor(q: Pick<Quest, 'title' | 'description' | 'promptForNote' | 'noteList'>): ProofAsk | null {
  if (q.promptForNote || q.noteList) return null;
  const text = `${q.title} ${q.description ?? ''}`.toLowerCase();
  return ASKS.find((a) => a.re.test(text))?.ask ?? null;
}

export function countWords(s: string): number {
  return s.trim().split(/\s+/).filter((w) => /[\p{L}\p{N}]{2,}/u.test(w)).length;
}

/** Coins for answering a proof question. */
export const PROOF_BONUS = 5;
