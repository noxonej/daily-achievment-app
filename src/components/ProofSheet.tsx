import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Icon } from './Icon';
import type { Quest } from '../lib/types';
import { PROOF_BONUS, countWords, proofFor } from '../lib/proof';
import { questRarity, rarityText } from '../lib/rarity';

/**
 * Proof before (or right after) a quest counts: "What did you read about?". Answering gives a
 * small coin bonus and a "Proven" tick. "Just tick it" still completes it, nobody is forced.
 */
export function ProofSheet({
  quest,
  after = false,
  onConfirm,
  onSkip,
  onClose,
}: {
  quest: Quest | null;
  /** The quest is already done (a number quest that hit its target): this only adds the proof. */
  after?: boolean;
  onConfirm: (text: string) => void;
  onSkip: () => void;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  useEffect(() => setText(''), [quest?.id]);
  const ask = quest ? proofFor(quest) : null;
  const words = countWords(text);
  const ok = !!ask && words >= ask.minWords;
  const pct = quest ? questRarity(quest) : 0;

  return (
    <Modal open={!!quest && !!ask} onClose={onClose} title={after ? 'Nice work! Prove it' : 'Prove it'}>
      {quest && ask && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="shrink-0 w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
              <Icon name={quest.icon} size={22} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate">{quest.title}</p>
              <p className="text-xs text-violet-200">
                <Icon name="👥" size={11} className="icon-inline" />
                {pct < 10 ? `Only about ${rarityText(pct)} of people do this. You're one of them.` : `About ${rarityText(pct)} of people do this.`}
              </p>
            </div>
          </div>
          <label className="block">
            <span className="block font-display text-lg font-semibold text-white">{ask.question}</span>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={ask.placeholder}
              className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400/60"
            />
            <span className="mt-1 flex justify-between text-[11px] text-slate-500">
              <span>Writing it down helps you remember twice as much.</span>
              <span className={ok ? 'text-emerald-300' : ''}>
                {Math.min(words, ask.minWords)}/{ask.minWords} words
              </span>
            </span>
          </label>
          <button
            disabled={!ok}
            onClick={() => onConfirm(text)}
            className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-[#03140c] font-bold py-3 flex items-center justify-center gap-2"
          >
            <Icon name="✓" size={18} />
            {after ? 'Save proof' : 'Confirm'} · +{PROOF_BONUS} coins
          </button>
          <button onClick={onSkip} className="w-full text-center text-sm font-semibold text-slate-400 hover:text-white py-1">
            {after ? 'Skip' : 'Just tick it (no bonus)'}
          </button>
        </div>
      )}
    </Modal>
  );
}
