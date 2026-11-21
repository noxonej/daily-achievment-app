import { useEffect, useRef, useState } from 'react';
import { Modal } from '../Modal';
import { Icon } from '../Icon';
import { L } from '../../lib/lang';
import { compressPhoto, deleteProof, loadProofs, postProof, PROOF_TTL_DAYS, type Proof } from '../../lib/photoProof';
import { useFriends } from '../../lib/friends';
import { challengeDay } from '../../lib/social';
import { todayKey } from '../../lib/date';
import type { JoinedChallenge } from '../../lib/types';

/** Optional photo proof for a challenge (B8): post today's photo, see the others' from the last 7 days. */
export function ChallengePhotos({ challenge: c, open, onClose }: { challenge: JoinedChallenge; open: boolean; onClose: () => void }) {
  const me = useFriends().me;
  const [proofs, setProofs] = useState<Proof[] | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const day = challengeDay(c, todayKey());
  const live = day >= 1 && day <= c.days;

  useEffect(() => {
    if (!open || !me) return;
    let alive = true;
    loadProofs(c.code).then(
      (p) => alive && setProofs(p),
      () => alive && setProofs([]),
    );
    return () => {
      alive = false;
    };
  }, [open, me, c.code]);

  async function pick(f: File | undefined) {
    if (!f) return;
    setErr(null);
    try {
      setPreview(await compressPhoto(f));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not read that photo.');
    }
  }

  async function post() {
    if (!preview) return;
    setBusy(true);
    setErr(null);
    try {
      await postProof(c, preview);
      setPreview(null);
      setProofs(await loadProofs(c.code).catch(() => []));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not post it.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={L('Photo proof', 'Nuotraukos įrodymas')}>
      <p className="text-xs text-slate-400 leading-relaxed">
        {L(
          `Optional. Only players of “${c.title}” can see it, and it's deleted after ${PROOF_TTL_DAYS} days. Never post faces of people who didn't agree.`,
          `Nebūtina. Mato tik „${c.title}“ dalyviai, o po ${PROOF_TTL_DAYS} d. nuotrauka ištrinama. Nekelk žmonių veidų be jų sutikimo.`,
        )}
      </p>

      {!me ? (
        <p className="mt-4 text-sm text-slate-300">{L('Connect with Google first (You → Friends).', 'Pirmiausia prisijunk su Google (Tu → Draugai).')}</p>
      ) : (
        <>
          {live && (
            <div className="mt-4">
              <input ref={file} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
              {preview ? (
                <div className="space-y-2">
                  <img src={preview} alt="" className="w-full max-h-72 object-contain rounded-2xl bg-black/30" />
                  <div className="flex gap-2">
                    <button onClick={() => setPreview(null)} className="flex-1 rounded-full bg-white/[0.07] py-2.5 text-sm font-semibold text-white">
                      {L('Retake', 'Iš naujo')}
                    </button>
                    <button onClick={() => void post()} disabled={busy} className="flex-1 rounded-full bg-[var(--mood2)] py-2.5 text-sm font-bold text-slate-950 disabled:opacity-60">
                      {busy ? L('Posting…', 'Keliama…') : L(`Post for day ${day}`, `Kelti ${day} dienai`)}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => file.current?.click()} className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-5 text-sm font-semibold text-slate-200">
                  <Icon name="📷" size={18} />
                  {L("Add today's photo", 'Pridėti šiandienos nuotrauką')}
                </button>
              )}
            </div>
          )}
          {err && <p className="mt-2 text-xs text-rose-300">{err}</p>}

          <p className="mt-5 eyebrow">{L('Last 7 days', 'Paskutinės 7 dienos')}</p>
          {proofs === null ? (
            <p className="mt-2 text-xs text-slate-500">{L('Loading…', 'Kraunama…')}</p>
          ) : proofs.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">{L('No photos yet.', 'Nuotraukų dar nėra.')}</p>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {proofs.map((p) => (
                <figure key={`${p.uid}_${p.day}`} className="relative rounded-xl overflow-hidden bg-black/30">
                  <img src={p.img} alt={L(`${p.name}, day ${p.day}`, `${p.name}, ${p.day} diena`)} loading="lazy" className="w-full aspect-square object-cover" />
                  <figcaption className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-1.5 pt-4 text-[11px] font-semibold text-white flex items-center justify-between">
                    <span className="truncate">
                      {p.name} · {L('day', 'd.')} {p.day}
                    </span>
                    {p.uid === me.uid && (
                      <button
                        aria-label={L('Delete my photo', 'Ištrinti mano nuotrauką')}
                        onClick={async () => {
                          await deleteProof(c.code, p.day).catch(() => undefined);
                          setProofs((list) => (list ?? []).filter((x) => x !== p));
                        }}
                        className="text-rose-300"
                      >
                        <Icon name="🗑" size={13} />
                      </button>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
