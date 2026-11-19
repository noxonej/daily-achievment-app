/**
 * "Delete my cloud data" (Settings → Account): removes everything Squzo saved about you in Firebase,
 * then the Firebase sign-in itself (EU right to erasure). What's on this phone stays.
 */
import { db, deleteFirebaseUser, loadSession, publicDocUrl } from './firebase';
import { addDaysToKey, parseKey, todayKey, weekKey } from './date';
import { pushToken } from './push';

/** Week keys for the last ~2 years (the leaderboard keeps one folder per week). */
function recentWeeks(n = 110): string[] {
  const out = new Set<string>();
  let d = todayKey();
  for (let i = 0; i < n; i++) {
    out.add(weekKey(parseKey(d)));
    d = addDaysToKey(d, -7);
  }
  return [...out];
}

export async function deleteMyCloudData(accountId: string, opts: { stepsToken?: string } = {}): Promise<void> {
  if (!loadSession(accountId)) throw new Error('Not signed in to Squzo’s cloud on this phone.');
  const api = db(accountId);
  const uid = api.uid();
  const ids = async (parent: string, collection: string) => (await api.query(parent, collection).catch(() => [])).map((d) => d.id);

  const [activity, friends, cheers, requests, profile] = await Promise.all([
    ids(`activity/${uid}`, 'items'),
    ids(`friends/${uid}`, 'list'),
    ids(`cheers/${uid}`, 'items'),
    ids(`requests/${uid}`, 'from'),
    api.get<{ code?: unknown }>(`profiles/${uid}`).catch(() => null),
  ]);
  const code = typeof profile?.code === 'string' ? profile.code : '';
  const own = code ? await api.get<{ uid?: unknown }>(`codes/${code}`).catch(() => null) : null;

  const paths = [
    ...activity.map((id) => `activity/${uid}/items/${id}`),
    ...cheers.map((id) => `cheers/${uid}/items/${id}`),
    ...requests.map((id) => `requests/${uid}/from/${id}`),
    ...friends.map((id) => `friends/${uid}/list/${id}`),
    ...recentWeeks().map((w) => `boards/${w}/players/${uid}`),
    `push/${uid}`,
    `profiles/${uid}`,
    `backups/${uid}`,
  ];
  await api.removeMany(paths);
  // The other side of each friendship, and your friend code (one by one: either may already be gone).
  await Promise.all(friends.map((id) => api.remove(`friends/${id}/list/${uid}`).catch(() => undefined)));
  if (own?.uid === uid) await api.remove(`codes/${code}`).catch(() => undefined);

  // Phone-keyed documents (no sign-in): the notification plan and the Apple Health steps inbox.
  const tokenDocs = [`pushQueue/${pushToken()}`, ...(opts.stepsToken ? [`stepsInbox/${opts.stepsToken}`] : [])];
  await Promise.all(tokenDocs.map((p) => fetch(publicDocUrl(p), { method: 'DELETE' }).catch(() => undefined)));

  await deleteFirebaseUser(accountId);
}
