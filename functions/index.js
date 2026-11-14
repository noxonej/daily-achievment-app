/**
 * Optional: the same push sender as a Firebase scheduled function (needs the Blaze plan).
 * Squzo normally runs it from GitHub Actions instead (free): see SETUP-PUSH.md and scripts/push/run.cjs.
 */
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const webpush = require('web-push');
const { runOnce } = require('./sender');

initializeApp();

exports.sendReminders = onSchedule({ schedule: 'every 15 minutes', timeZone: 'UTC', memory: '256MiB' }, async () => {
  const stats = await runOnce(getFirestore(), webpush);
  console.log('push round', stats);
});
