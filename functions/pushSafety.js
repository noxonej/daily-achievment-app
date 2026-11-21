/**
 * Safety checks for pushQueue/{token} docs (A1, round 2).
 *
 * pushQueue can be written without sign-in, so a stranger could put any web address in it and make
 * our sender POST to that address every 15 minutes. These checks make sure we only ever talk to the
 * real push services of browsers and phones.
 */

/** Hosts of the real push services (Chrome/Android, Firefox, Safari/iPhone, Edge/Windows). */
const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/,
  /^android\.googleapis\.com$/,
  /^(?:[a-z0-9-]+\.)*push\.services\.mozilla\.com$/,
  /^web\.push\.apple\.com$/,
  /^(?:[a-z0-9-]+\.)*push\.apple\.com$/,
  /^(?:[a-z0-9-]+\.)*notify\.windows\.com$/,
];

/** The same list as one pattern, for firestore.rules (keep the two in sync). */
const RULES_HOST_PATTERN =
  '^(fcm[.]googleapis[.]com|android[.]googleapis[.]com|([a-z0-9-]+[.])*push[.]services[.]mozilla[.]com|web[.]push[.]apple[.]com|([a-z0-9-]+[.])*push[.]apple[.]com|([a-z0-9-]+[.])*notify[.]windows[.]com|none)$';

const B64URL = /^[A-Za-z0-9_-]+={0,2}$/;

/** True when `host` is one of the real push services. */
function isPushHost(host) {
  return typeof host === 'string' && host.length <= 253 && PUSH_HOSTS.some((re) => re.test(host));
}

/** The endpoint's host when it is a safe https push address, otherwise null. */
function endpointHost(endpoint) {
  if (typeof endpoint !== 'string' || endpoint.length > 1000) return null;
  let u;
  try {
    u = new URL(endpoint);
  } catch {
    return null;
  }
  // No passwords in the address, no odd ports: a real push address never has them.
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) return null;
  const host = u.hostname.toLowerCase();
  return isPushHost(host) ? host : null;
}

/** A push subscription we're willing to send to: https endpoint on a known host + sane keys. */
function validSubscription(sub) {
  if (!sub || typeof sub !== 'object') return false;
  if (!endpointHost(sub.endpoint)) return false;
  const k = sub.keys;
  if (!k || typeof k !== 'object') return false;
  // p256dh is a 65-byte public key (87 chars), auth is 16 bytes (22 chars), both base64url.
  const ok = (v, min, max) => typeof v === 'string' && v.length >= min && v.length <= max && B64URL.test(v);
  return ok(k.p256dh, 80, 100) && ok(k.auth, 16, 32);
}

module.exports = { isPushHost, endpointHost, validSubscription, RULES_HOST_PATTERN, PUSH_HOSTS };
