// Runs before every request (assets.run_worker_first). Cloudflare Access sits in front of the site and
// adds a signed token to each request it lets through. This checks that token too, so a gap in the
// Access setup means nobody gets in, not that everyone does. TEAM_DOMAIN and POLICY_AUD are in
// wrangler.jsonc; they identify the Access app and aren't secret.

const keyCache = new Map(); // team domain -> Promise of { kid: CryptoKey }
const lastRefetch = new Map(); // team domain -> time of the last refetch for an unknown key, in seconds
// Unknown keys refetch at most this often, so made-up tokens can't force a fetch on every request.
const REFETCH_SECONDS = 60;

async function accessKeys(team) {
  if (!keyCache.has(team)) {
    const promise = fetch(`https://${team}/cdn-cgi/access/certs`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`certs ${r.status}`))))
      .then(async ({ keys }) => {
        const out = {};
        for (const jwk of keys) {
          out[jwk.kid] = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
        }
        return out;
      });
    keyCache.set(team, promise);
    promise.catch(() => keyCache.delete(team));
  }
  return keyCache.get(team);
}

const fromBase64Url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const decodePart = (s) => JSON.parse(new TextDecoder().decode(fromBase64Url(s)));

// True if the token is a current Access token for this app, signed by the team's keys.
export async function validAccessToken(token, { TEAM_DOMAIN, POLICY_AUD }, now = Date.now() / 1000) {
  if (!token || !TEAM_DOMAIN || !POLICY_AUD) return false;
  try {
    const [h, p, s] = token.split('.');
    const header = decodePart(h);
    const payload = decodePart(p);
    if (header.alg !== 'RS256') return false;
    let keys = await accessKeys(TEAM_DOMAIN);
    if (!keys[header.kid] && now - (lastRefetch.get(TEAM_DOMAIN) ?? 0) >= REFETCH_SECONDS) {
      // Access rotates its keys; refetch once before giving up.
      lastRefetch.set(TEAM_DOMAIN, now);
      keyCache.delete(TEAM_DOMAIN);
      keys = await accessKeys(TEAM_DOMAIN);
    }
    const key = keys[header.kid];
    if (!key) return false;
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, fromBase64Url(s), new TextEncoder().encode(`${h}.${p}`));
    const aud = [payload.aud].flat();
    return ok && aud.includes(POLICY_AUD) && payload.iss === `https://${TEAM_DOMAIN}` && payload.exp > now && (payload.nbf ?? 0) <= now + 60;
  } catch {
    return false;
  }
}

const cookie = (request, name) =>
  request.headers
    .get('Cookie')
    ?.split(';')
    .map((c) => c.trim().split('='))
    .find(([k]) => k === name)?.[1];

export default {
  async fetch(request, env) {
    // || rather than ??, so an empty header still falls back to the cookie.
    const token = request.headers.get('Cf-Access-Jwt-Assertion') || cookie(request, 'CF_Authorization');
    if (!(await validAccessToken(token, env))) {
      return new Response('Forbidden', { status: 403, headers: { 'Content-Type': 'text/plain', 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' } });
    }
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    headers.set('Cache-Control', 'private, no-cache');
    headers.set('Referrer-Policy', 'no-referrer');
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
