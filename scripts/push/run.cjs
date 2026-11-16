/**
 * Runs from GitHub Actions every 15 minutes (.github/workflows/push.yml):
 * 1. publishes firestore.rules to Firebase when they changed (so nobody has to paste them by hand),
 * 2. sends the motivational notifications that are due (functions/sender.js).
 *
 * Needs one repository secret: FIREBASE_SERVICE_ACCOUNT (the JSON key from Firebase console →
 * Project settings → Service accounts → Generate new private key). See SETUP-PUSH.md.
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const fnDir = path.join(__dirname, '..', '..', 'functions');
const req = (m) => require(require.resolve(m, { paths: [fnDir] }));

async function main() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw || !raw.trim().startsWith('{')) {
    console.log('FIREBASE_SERVICE_ACCOUNT secret is not set yet: nothing to do. See SETUP-PUSH.md.');
    return;
  }
  const { initializeApp, cert } = req('firebase-admin/app');
  const { getFirestore } = req('firebase-admin/firestore');
  const { getSecurityRules } = req('firebase-admin/security-rules');
  const webpush = req('web-push');
  const { runOnce } = require(path.join(fnDir, 'sender.js'));

  const account = JSON.parse(raw);
  initializeApp({ credential: cert(account), projectId: account.project_id });
  const db = getFirestore();

  // 1. Rules: publish only when the file changed since the last publish.
  try {
    const source = fs.readFileSync(path.join(__dirname, '..', '..', 'firestore.rules'), 'utf8');
    const hash = crypto.createHash('sha256').update(source).digest('hex');
    const meta = db.doc('private/meta');
    const snap = await meta.get();
    if (!snap.exists || snap.data().rulesHash !== hash) {
      await getSecurityRules().releaseFirestoreRulesetFromSource(source);
      await meta.set({ rulesHash: hash, rulesAt: new Date().toISOString() }, { merge: true });
      console.log('Published firestore.rules', hash.slice(0, 8));
    }
  } catch (e) {
    console.error('Could not publish firestore.rules:', e.message);
  }

  // 2. Notifications.
  const stats = await runOnce(db, webpush);
  console.log('Push round:', JSON.stringify(stats));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
