import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

const env = await initializeTestEnvironment({ projectId: 'demo-squzo', firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8085 } });
let pass = 0, fail = 0;
async function t(name, fn) { try { await fn(); pass++; console.log('ok  ', name); } catch (e) { fail++; console.log('FAIL', name, e.message.slice(0, 200)); } }
const anon = env.unauthenticatedContext().firestore();
const me = env.authenticatedContext('me').firestore();
const bob = env.authenticatedContext('bob').firestore();
const tok = 'a'.repeat(32);
const now = Date.now();

await t('pushQueue: real host ok', () => assertSucceeds(setDoc(doc(anon, 'pushQueue', tok), { data: '{}', updatedAt: now, host: 'fcm.googleapis.com' })));
await t('pushQueue: none ok', () => assertSucceeds(setDoc(doc(anon, 'pushQueue', tok), { data: '{}', updatedAt: now, host: 'none' })));
await t('pushQueue: evil host refused', () => assertFails(setDoc(doc(anon, 'pushQueue', tok), { data: '{}', updatedAt: now, host: 'evil.com' })));
await t('pushQueue: no host refused', () => assertFails(setDoc(doc(anon, 'pushQueue', tok), { data: '{}', updatedAt: now })));
await t('stepsInbox: shortcut write ok', () => assertSucceeds(setDoc(doc(anon, 'stepsInbox', 'ab12'.repeat(8)), { steps: 1234 })));
await t('stepsInbox: get ok', () => assertSucceeds(getDoc(doc(anon, 'stepsInbox', 'ab12'.repeat(8)))));
await t('stepsInbox: bad token refused', () => assertFails(setDoc(doc(anon, 'stepsInbox', 'X'.repeat(30)), { steps: 1 })));

const prof = { name: 'Jonas', code: 'JONA-1234', updatedAt: now };
await t('profile ok', () => assertSucceeds(setDoc(doc(me, 'profiles', 'me'), prof)));
await t('profile google picture ok', () => assertSucceeds(setDoc(doc(me, 'profiles', 'me'), { ...prof, picture: 'https://lh3.googleusercontent.com/a/x' })));
await t('profile evil picture refused', () => assertFails(setDoc(doc(me, 'profiles', 'me'), { ...prof, picture: 'https://evil.com/x.png' })));
await t('code = own profile code ok', () => assertSucceeds(setDoc(doc(me, 'codes', 'JONA-1234'), { uid: 'me' })));
await t('other code refused', () => assertFails(setDoc(doc(me, 'codes', 'JONA-9999'), { uid: 'me' })));
await t('bad format refused', () => assertFails(setDoc(doc(me, 'codes', 'x'), { uid: 'me' })));
await t('code without profile refused', () => assertFails(setDoc(doc(bob, 'codes', 'BOB-1111'), { uid: 'bob' })));

await env.withSecurityRulesDisabled(async (c) => {
  const db = c.firestore();
  await setDoc(doc(db, 'friends/me/list/bob'), { at: now });
});
await t('cheer ok', () => assertSucceeds(setDoc(doc(bob, 'cheers/me/items/bob_item1'), { fromUid: 'bob', fromName: 'Bob', text: 'hi', at: now })));
await t('cheer again refused (no update)', () => assertFails(setDoc(doc(bob, 'cheers/me/items/bob_item1'), { fromUid: 'bob', fromName: 'Bob', text: 'hi', at: now })));
await t('cheer wrong id refused', () => assertFails(setDoc(doc(bob, 'cheers/me/items/someone_item2'), { fromUid: 'bob', fromName: 'Bob', text: 'hi', at: now })));
await t('cheer old at refused', () => assertFails(setDoc(doc(bob, 'cheers/me/items/bob_item3'), { fromUid: 'bob', fromName: 'Bob', text: 'hi', at: now - 86400000 })));
await t('activity ok', () => assertSucceeds(setDoc(doc(me, 'activity/me/items/a1'), { kind: 'quest', text: 'x', icon: '✅', at: now - 3600000 })));
await t('activity future refused', () => assertFails(setDoc(doc(me, 'activity/me/items/a2'), { kind: 'quest', text: 'x', icon: '✅', at: now + 86400000 })));
await t('block ok', () => assertSucceeds(setDoc(doc(me, 'blocks/me/list/bob'), { at: now })));
await t('blocked cheer refused', () => assertFails(setDoc(doc(bob, 'cheers/me/items/bob_item4'), { fromUid: 'bob', fromName: 'Bob', text: 'hi', at: now })));
await t('blocked request refused', () => assertFails(setDoc(doc(bob, 'requests/me/from/bob'), { name: 'Bob', code: 'BOB-1111', createdAt: serverTimestamp() })));
const carol = env.authenticatedContext('carol').firestore();
await t('normal request ok', () => assertSucceeds(setDoc(doc(carol, 'requests/me/from/carol'), { name: 'Carol', code: 'CARO-1111', createdAt: serverTimestamp() })));
await t('report ok', () => assertSucceeds(setDoc(doc(me, 'reports/bob/from/me'), { week: '2026-W47', weekXp: 50000, level: 2, at: serverTimestamp() })));
await t('report read refused', () => assertFails(getDoc(doc(bob, 'reports/bob/from/me'))));
// ---- squads (B3)
const SQ = 'ABCDEFGH';
const dave = env.authenticatedContext('dave').firestore();
await t('squad create ok', () => assertSucceeds(setDoc(doc(me, 'squads', SQ), { name: 'Gym rats', owner: 'me', members: ['me'], names: { me: 'Jonas' }, createdAt: serverTimestamp() })));
await t('squad create for others refused', () => assertFails(setDoc(doc(bob, 'squads', 'ZZZZZZZZ'), { name: 'x', owner: 'me', members: ['me'], names: { me: 'x' }, createdAt: serverTimestamp() })));
await t('squad bad code refused', () => assertFails(setDoc(doc(me, 'squads', 'abc'), { name: 'x', owner: 'me', members: ['me'], names: { me: 'x' }, createdAt: serverTimestamp() })));
await t('join squad ok', () => assertSucceeds(updateDoc(doc(dave, 'squads', SQ), { members: ['me', 'dave'], names: { me: 'Jonas', dave: 'Dave' } })));
await t('add someone else refused', () => assertFails(updateDoc(doc(dave, 'squads', SQ), { members: ['me', 'dave', 'eve'], names: { me: 'Jonas', dave: 'Dave', eve: 'Eve' } })));
await t('rename squad refused', () => assertFails(updateDoc(doc(dave, 'squads', SQ), { name: 'Mine now' })));
await t('squad feed post ok', () => assertSucceeds(setDoc(doc(dave, `squads/${SQ}/feed/dave_q1`), { uid: 'dave', name: 'Dave', kind: 'quest', text: 'Gym', icon: '💪', at: now })));
await t('squad feed read by member ok', () => assertSucceeds(getDoc(doc(me, `squads/${SQ}/feed/dave_q1`))));
await t('squad feed read by outsider refused', () => assertFails(getDoc(doc(bob, `squads/${SQ}/feed/dave_q1`))));
await t('squad cheer (not friends) ok', () => assertSucceeds(setDoc(doc(dave, 'cheers/me/items/dave_x1'), { fromUid: 'dave', fromName: 'Dave', text: 'go', at: now, squad: SQ })));
await t('cheer with fake squad refused', () => assertFails(setDoc(doc(carol, 'cheers/me/items/carol_x1'), { fromUid: 'carol', fromName: 'C', text: 'go', at: now, squad: SQ })));
await t('leave squad ok', () => assertSucceeds(updateDoc(doc(dave, 'squads', SQ), { members: ['me'] })));
// ---- challenges (B3)
const CH = 'CHAPTER2';
const chDoc = { title: '7 days', host: 'me', hostName: 'Jonas', days: 7, start: '2026-11-21', quests: [{ title: 'Run', icon: '🏃' }], badge: '🏅', createdAt: serverTimestamp() };
await t('challenge create ok', () => assertSucceeds(setDoc(doc(me, 'challenges', CH), chDoc)));
await t('challenge 9 days refused', () => assertFails(setDoc(doc(me, 'challenges', 'CHAPTER3'), { ...chDoc, days: 9 })));
await t('challenge huge quest refused', () => assertFails(setDoc(doc(me, 'challenges', 'CHAPTER4'), { ...chDoc, quests: [{ title: 'x'.repeat(500), icon: 'a' }] })));
await t('challenge public read ok', () => assertSucceeds(getDoc(doc(anon, 'challenges', CH))));
await t('challenge score ok', () => assertSucceeds(setDoc(doc(bob, `challenges/${CH}/players/bob`), { name: 'Bob', score: 3, fullDays: 1, finished: false, at: serverTimestamp() })));
await t('challenge score spam refused', () => assertFails(setDoc(doc(bob, `challenges/${CH}/players/bob`), { name: 'Bob', score: 4, fullDays: 1, finished: false, at: serverTimestamp() })));
await t('challenge fake score refused', () => assertFails(setDoc(doc(carol, `challenges/${CH}/players/carol`), { name: 'C', score: 9999, fullDays: 1, finished: false, at: serverTimestamp() })));
await t('challenge board public ok', () => assertSucceeds(getDoc(doc(anon, `challenges/${CH}/players/bob`))));

// ---- analytics (C1)
const ev = { id: 'abcdefghij0123456789', ev: ['open', 'quest_done'], v: 1 };
await t('stats write anon ok', () => assertSucceeds(setDoc(doc(anon, 'stats/2026-11-21/events/x1'), ev)));
await t('stats read refused', () => assertFails(getDoc(doc(me, 'stats/2026-11-21/events/x1'))));
await t('stats update refused', () => assertFails(setDoc(doc(anon, 'stats/2026-11-21/events/x1'), ev)));
await t('stats extra field refused', () => assertFails(setDoc(doc(anon, 'stats/2026-11-21/events/x2'), { ...ev, email: 'a@b.c' })));
await t('stats bad id refused', () => assertFails(setDoc(doc(anon, 'stats/2026-11-21/events/x3'), { ...ev, id: 'Jonas' })));
await t('stats bad day refused', () => assertFails(setDoc(doc(anon, 'stats/nope/events/x4'), ev)));

// ---- photo proof (B8). bob is on the CH board (above), carol isn't.
const img = 'data:image/jpeg;base64,' + 'A'.repeat(1000);
const proof = (uid, day, extra = {}) => ({ uid, name: 'X', day, img, at: serverTimestamp(), ...extra });
await t('proof by player ok', () => assertSucceeds(setDoc(doc(bob, `challenges/${CH}/proofs/bob_1`), proof('bob', 1))));
await t('proof by non-player refused', () => assertFails(setDoc(doc(carol, `challenges/${CH}/proofs/carol_1`), proof('carol', 1))));
await t('proof for someone else refused', () => assertFails(setDoc(doc(bob, `challenges/${CH}/proofs/me_1`), proof('me', 1))));
await t('proof wrong id refused', () => assertFails(setDoc(doc(bob, `challenges/${CH}/proofs/bob_2`), proof('bob', 1))));
await t('proof too big refused', () => assertFails(setDoc(doc(bob, `challenges/${CH}/proofs/bob_3`), proof('bob', 3, { img: 'data:image/jpeg;base64,' + 'A'.repeat(280000) }))));
await t('proof not jpeg refused', () => assertFails(setDoc(doc(bob, `challenges/${CH}/proofs/bob_4`), proof('bob', 4, { img: 'data:text/html;base64,AAAA' }))));
await t('proof read by player ok', () => assertSucceeds(getDoc(doc(bob, `challenges/${CH}/proofs/bob_1`))));
await t('proof read by outsider refused', () => assertFails(getDoc(doc(carol, `challenges/${CH}/proofs/bob_1`))));
await t('proof read anon refused', () => assertFails(getDoc(doc(anon, `challenges/${CH}/proofs/bob_1`))));
await t('proof delete by owner ok', () => assertSucceeds(deleteDoc(doc(bob, `challenges/${CH}/proofs/bob_1`))));

// ---- invites (B6). 'me' has a profile (above). Frank was invited by me.
const frank = env.authenticatedContext('frank').firestore();
const day = Math.floor(Date.now() / 86400000);
await t('invitedBy self refused', () => assertFails(setDoc(doc(frank, 'invitedBy', 'frank'), { by: 'frank' })));
await t('invitedBy unknown user refused', () => assertFails(setDoc(doc(frank, 'invitedBy', 'frank'), { by: 'nobody' })));
await t('invitedBy ok', () => assertSucceeds(setDoc(doc(frank, 'invitedBy', 'frank'), { by: 'me' })));
await t('invitedBy change refused', () => assertFails(setDoc(doc(frank, 'invitedBy', 'frank'), { by: 'bob' })));
await t('invite doc for someone else refused', () => assertFails(setDoc(doc(frank, 'invites/bob/from/frank'), { name: 'Frank', days: [], claimed: false })));
await t('invite doc with days refused', () => assertFails(setDoc(doc(frank, 'invites/me/from/frank'), { name: 'Frank', days: [1, 2, 3], claimed: false })));
await t('invite doc ok', () => assertSucceeds(setDoc(doc(frank, 'invites/me/from/frank'), { name: 'Frank', days: [], claimed: false })));
await t('invite add today ok', () => assertSucceeds(updateDoc(doc(frank, 'invites/me/from/frank'), { days: [day] })));
await t('invite add today twice refused', () => assertFails(updateDoc(doc(frank, 'invites/me/from/frank'), { days: [day, day] })));
await t('invite fake future day refused', () => assertFails(updateDoc(doc(frank, 'invites/me/from/frank'), { days: [day, day + 1] })));
await t('invite claim before 3 days refused', () => assertFails(updateDoc(doc(me, 'invites/me/from/frank'), { claimed: true })));
await t("invite friend can't claim", () => assertFails(updateDoc(doc(frank, 'invites/me/from/frank'), { claimed: true })));
await env.withSecurityRulesDisabled((c) => updateDoc(doc(c.firestore(), 'invites/me/from/frank'), { days: [day - 2, day - 1, day] }));
await t('invite claim after 3 days ok', () => assertSucceeds(updateDoc(doc(me, 'invites/me/from/frank'), { claimed: true })));
await t('invite unclaim refused', () => assertFails(updateDoc(doc(me, 'invites/me/from/frank'), { claimed: false })));
await t('invite delete refused', () => assertFails(deleteDoc(doc(frank, 'invites/me/from/frank'))));
await t('invite name blank ok', () => assertSucceeds(updateDoc(doc(frank, 'invites/me/from/frank'), { name: '' })));
await t('invite read by stranger refused', () => assertFails(getDoc(doc(bob, 'invites/me/from/frank'))));

console.log(`\n${pass} passed, ${fail} failed`);
await env.cleanup();
process.exit(fail ? 1 : 0);
