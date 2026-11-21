/**
 * Admin only: prints installs, event counts and D1/D7/D30 retention from stats/{day}/events.
 *
 *   FIREBASE_SERVICE_ACCOUNT="$(cat key.json)" node scripts/analytics/retention.cjs [days=60]
 *
 * Needs the same service account as the push sender (read access to Firestore). Run it on your own
 * computer; never commit the key. It only reads.
 */
const path = require('path');
const fnDir = path.join(__dirname, '..', '..', 'functions');
const req = (m) => require(require.resolve(m, { paths: [fnDir] }));
const { retention } = require(path.join(fnDir, 'retention.js'));

async function main() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw || !raw.trim().startsWith('{')) throw new Error('Set FIREBASE_SERVICE_ACCOUNT to the service account JSON.');
  const days = Math.max(2, Math.min(120, Number(process.argv[2]) || 60));
  const { initializeApp, cert } = req('firebase-admin/app');
  const { getFirestore } = req('firebase-admin/firestore');
  const account = JSON.parse(raw);
  initializeApp({ credential: cert(account), projectId: account.project_id });
  const db = getFirestore();
  const today = new Date().toISOString().slice(0, 10);
  const rows = [];
  for (let i = 0; i < days; i++) {
    const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const snap = await db.collection(`stats/${day}/events`).select('id', 'ev').get();
    snap.forEach((d) => rows.push({ day, id: d.get('id'), ev: d.get('ev') }));
  }
  const r = retention(rows, today);
  console.log(`Last ${days} days: ${r.installs} installs, ${rows.length} batches`);
  console.log('Events:', r.events);
  for (const n of [1, 7, 30]) {
    const x = r[`d${n}`];
    console.log(`D${n}: ${x ? `${x.pct}% (${x.back} of ${x.eligible})` : 'not enough data yet'}`);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
