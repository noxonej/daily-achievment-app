/**
 * Housekeeping that runs with the push sender (B8, round 2): photo proofs in challenges are deleted
 * 7 days after they were posted. Challenges last at most 30 days (plus a start date up to ~6 weeks
 * ahead), so only challenges created in the last 90 days are checked. Uses single-field queries only,
 * so no extra Firestore index is needed.
 */
const DAY = 86400000;
const PROOF_TTL_MS = 7 * DAY;
const CHALLENGE_WINDOW_MS = 90 * DAY;
/** Caps per run, so a flood of docs can't make a run take forever (the next run continues). */
const MAX_CHALLENGES = 500;
const MAX_PROOFS = 400;

async function cleanProofs(db, now = Date.now()) {
  const stats = { challenges: 0, deleted: 0 };
  const recent = await db.collection('challenges').where('createdAt', '>=', new Date(now - CHALLENGE_WINDOW_MS)).limit(MAX_CHALLENGES).get();
  stats.challenges = recent.size;
  for (const ch of recent.docs) {
    if (stats.deleted >= MAX_PROOFS) break;
    const old = await ch.ref.collection('proofs').where('at', '<', new Date(now - PROOF_TTL_MS)).limit(MAX_PROOFS - stats.deleted).get();
    await Promise.all(old.docs.map((d) => d.ref.delete()));
    stats.deleted += old.size;
  }
  return stats;
}

module.exports = { cleanProofs, PROOF_TTL_MS };
