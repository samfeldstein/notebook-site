// Tests for the site build and the Worker's Access check. Run with: node --test site/test.mjs
// Each build test makes a small notebook in a temp folder, stages it with Git, and builds it
// with --root and --out, so the real notebook is never touched.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import worker, { validAccessToken } from './worker.js';

const BUILD = path.join(path.dirname(fileURLToPath(import.meta.url)), 'build.mjs');

const note = (title, { tags = ['test'], body = '' } = {}) =>
  `---\ntitle: ${title}\nsummary: About ${title}.\ntags: [${tags.join(', ')}]\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n\n${body}\n`;
const recipe = (title, course, tags = []) =>
  `---\ntitle: ${title}\ncreated: 2026-01-01\ntags: [${[course, ...tags].join(', ')}]\ntotal_minutes: 30\nservings: 4\neffort: low\n---\n\n## Instructions\n\n1. Cook **1 cup rice**.[^1]\n\n[^1]: Any rice.\n`;

// Builds a site from { tracked: {path: text}, untracked: {path: text} } and returns helpers.
function site({ tracked = {}, untracked = {} }, ...flags) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-test-'));
  const out = path.join(root, '.out');
  const put = (files) => {
    for (const [file, text] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      fs.writeFileSync(path.join(root, file), text);
    }
  };
  put(tracked);
  execFileSync('git', ['init', '-q'], { cwd: root });
  if (Object.keys(tracked).length) execFileSync('git', ['add', ...Object.keys(tracked)], { cwd: root });
  put(untracked);
  let output;
  let code = 0;
  try {
    output = execFileSync('node', [BUILD, `--root=${root}`, `--out=${out}`, ...flags], { encoding: 'utf8', stdio: 'pipe' });
  } catch (err) {
    output = `${err.stdout}${err.stderr}`;
    code = err.status;
  }
  const page = (url) => fs.readFileSync(path.join(out, url, 'index.html'), 'utf8');
  const has = (rel) => fs.existsSync(path.join(out, rel));
  return { output, code, page, has, out, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

test('notes and recipes get separate sections', () => {
  const s = site({
    tracked: {
      'how-to-learn.md': note('How to Learn'),
      'recipes/soups/zuppa.md': recipe('Zuppa Toscana', 'soups', ['sausage']),
      'recipes/CLAUDE.md': '# Recipes\n',
      'CLAUDE.md': '# Notebook\n',
    },
  });
  assert.equal(s.code, 0, s.output);
  const notes = s.page('notes');
  assert.match(notes, /How to Learn/);
  assert.doesNotMatch(notes, /Zuppa/);
  const recipes = s.page('recipes');
  assert.match(recipes, /Zuppa Toscana/);
  assert.match(recipes, /data-minutes="30"/);
  assert.match(recipes, /<option value="sausage">/);
  assert.doesNotMatch(recipes, /How to Learn/);
  const zuppa = s.page('recipes/soups/zuppa');
  assert.match(zuppa, /30 min/);
  assert.match(zuppa, /footnote/i, 'footnotes render');
  assert.ok(!s.has('CLAUDE/index.html') && !s.has('recipes/CLAUDE/index.html'), 'CLAUDE.md files are not pages');
  s.cleanup();
});

test('links are rewritten to site addresses, with backlinks', () => {
  const s = site({
    tracked: {
      'a.md': note('A', { body: 'See [B](b.md#part), [Soup](recipes/soups/zuppa.md), [Later](later.md), and [Web](https://example.com).' }),
      'b.md': note('B', { body: '## Part\n\nText.' }),
      'recipes/soups/zuppa.md': recipe('Zuppa', 'soups').replace('## Instructions', 'From [A](../../a.md).\n\n## Instructions'),
    },
  });
  assert.equal(s.code, 0, s.output);
  const a = s.page('a');
  assert.match(a, /href="\/b\/#part"/);
  assert.match(a, /href="\/recipes\/soups\/zuppa\/"/);
  assert.match(a, /<span class="missing" title="Not written yet">Later<\/span>/);
  assert.match(a, /href="https:\/\/example.com" rel="noreferrer"/);
  assert.match(s.page('b'), /<h2 id="part">/);
  assert.match(s.page('b'), /Backlinks<\/h2>[\s\S]*href="\/a\/"/);
  assert.match(s.page('recipes/soups/zuppa'), /href="\/a\/"/);
  s.cleanup();
});

test('notes with two or more headings get contents, with h3 nested under h2', () => {
  const s = site({
    tracked: {
      'long.md': note('Long', { body: '## Admin\n\n### Domain\n\nText.\n\n## Pages\n\nText.' }),
      'short.md': note('Short', { body: '## Only\n\nText.' }),
      'mixed.md': note('Mixed', { body: '## First\n\nText.\n\n# Part\n\n## Second\n\nText.' }),
      'recipes/soups/zuppa.md': recipe('Zuppa', 'soups').replace('## Instructions', '## Ingredients\n\n## Instructions'),
    },
  });
  assert.equal(s.code, 0, s.output);
  assert.match(s.page('long'), /<nav class="toc"[^>]*><details open><summary>Contents<\/summary><ol><li><a href="#admin">Admin<\/a><ol><li><a href="#domain">Domain<\/a><\/li><\/ol><\/li><li><a href="#pages">Pages<\/a><\/li><\/ol>/);
  assert.match(s.page('long'), /src="\/static\/toc.js"/);
  assert.match(s.page('mixed'), /<ol><li><a href="#first">First<\/a><\/li><li class="unnumbered"><a href="#part">Part<\/a><\/li><li><a href="#second">Second<\/a><\/li><\/ol>/, 'only h2 entries are numbered, like the note');
  assert.doesNotMatch(s.page('short'), /class="toc"|toc.js/);
  assert.doesNotMatch(s.page('recipes/soups/zuppa'), /class="toc"/, 'recipes get none');
  s.cleanup();
});

test('design markup: A to Z row, table wrapper, recipe facts line, theme color', () => {
  const s = site({
    tracked: {
      'apple.md': note('Apple', { body: '| a | b |\n|---|---|\n| 1 | 2 |' }),
      'zebra.md': note('Zebra'),
      '2-numbers.md': note('2 Numbers'),
      'recipes/soups/zuppa.md': recipe('Zuppa', 'soups'),
    },
  });
  assert.equal(s.code, 0, s.output);
  const notes = s.page('notes');
  const az = notes.match(/<nav class="az"[^>]*>(.*?)<\/nav>/)[1];
  const targets = [...az.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(targets, ['other', 'a', 'z']);
  for (const id of targets) assert.match(notes, new RegExp(`<section data-group><h2 id="${id}">`));
  assert.doesNotMatch(notes, /class="az"[^>]*data-group/);
  assert.match(s.page('apple'), /<div class="table-wrap"><table>/);
  assert.match(s.page('recipes/soups/zuppa'), /<p class="facts">30 min · serves 4 · low effort<\/p>/);
  assert.equal(s.page('apple').match(/<meta name="theme-color"[^>]*media=/g).length, 2);
  // One design: a single stylesheet, and no switch.
  const page = s.page('apple');
  assert.equal(page.match(/rel="stylesheet"/g).length, 1);
  assert.doesNotMatch(page, /pad\.css|design\.js|data-design-switch/);
  s.cleanup();
});

test('only tracked files are published, and big attachments stay on the Mac', () => {
  const s = site(
    {
      tracked: {
        'a.md': note('A', { body: '![](<assets/a photo.png>) [Big](assets/big.pdf) [Video](assets/clip.mp4)' }),
        'assets/a photo.png': 'png',
        'assets/big.pdf': 'x'.repeat(2000),
        'assets/unlinked.png': 'png',
      },
      untracked: {
        'voice-memos/memo.md': note('Memo'),
        'apple-notes/thing.md': note('Thing'),
        'secret.md': note('Secret'),
        'assets/clip.mp4': 'video',
      },
    },
    '--max-bytes=1000',
  );
  assert.equal(s.code, 0, s.output);
  assert.ok(s.has('assets/a photo.png'));
  assert.match(s.page('a'), /src="\/assets\/a%20photo.png"/);
  assert.ok(!s.has('assets/big.pdf'), 'over the size limit');
  assert.ok(!s.has('assets/clip.mp4'), 'not tracked');
  assert.ok(!s.has('assets/unlinked.png'), 'only linked attachments are copied');
  assert.match(s.page('a'), /title="Not published">Big</);
  for (const p of ['voice-memos/memo', 'apple-notes/thing', 'secret']) assert.ok(!s.has(`${p}/index.html`), p);
  const index = fs.readFileSync(path.join(s.out, 'search-notes.json'), 'utf8');
  assert.doesNotMatch(index, /Secret|Memo/);
  s.cleanup();
});

test('Readwise wikilinks resolve, raw HTML shows as text, and search indexes split', () => {
  const s = site({
    tracked: {
      'a.md': note('A', { body: 'Use <details> here.' }),
      'readwise/book.md': '---\ntitle: "A Book"\nauthor: "Someone"\ncategory: books\n---\n\n> Quote. [[a|Note A]]\n',
    },
  });
  assert.equal(s.code, 0, s.output);
  assert.match(s.page('readwise/book'), /href="\/a\/">Note A</);
  assert.match(s.page('a'), /&lt;details&gt;/);
  assert.match(s.page('readwise'), /Books/);
  const notes = JSON.parse(fs.readFileSync(path.join(s.out, 'search-notes.json'), 'utf8'));
  const rw = JSON.parse(fs.readFileSync(path.join(s.out, 'search-readwise.json'), 'utf8'));
  assert.deepEqual(notes.map((e) => e.id), ['a']);
  assert.deepEqual(rw.map((e) => e.id), ['readwise/book']);
  assert.ok(s.has('static/score.js'));
  s.cleanup();
});

test('a note that collides with a site page fails the build', () => {
  const s = site({ tracked: { 'recipes.md': note('Recipes') } });
  assert.equal(s.code, 1);
  assert.match(s.output, /recipes\.md/);
  s.cleanup();
});

// --- the Worker's Access check ---------------------------------------------

const TEAM = 'sam.cloudflareaccess.com';
const AUD = 'aud-tag';
const b64url = (data) => Buffer.from(data).toString('base64url');

async function keyPair(kid) {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  );
  return { kid, privateKey: pair.privateKey, jwk: { ...(await crypto.subtle.exportKey('jwk', pair.publicKey)), kid } };
}

async function sign({ kid, privateKey }, claims) {
  const head = b64url(JSON.stringify({ alg: 'RS256', kid }));
  const body = b64url(JSON.stringify(claims));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(`${head}.${body}`));
  return `${head}.${body}.${b64url(new Uint8Array(sig))}`;
}

test('the Worker only serves requests with a valid Access token', async () => {
  const good = await keyPair('k1');
  const other = await keyPair('k2');
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.equal(String(url), `https://${TEAM}/cdn-cgi/access/certs`);
    return new Response(JSON.stringify({ keys: [good.jwk] }));
  };
  try {
    const env = { TEAM_DOMAIN: TEAM, POLICY_AUD: AUD, ASSETS: { fetch: async () => new Response('page', { headers: { 'Content-Type': 'text/html' } }) } };
    const now = Math.floor(Date.now() / 1000);
    const claims = { aud: [AUD], iss: `https://${TEAM}`, exp: now + 3600, iat: now };
    const ask = (headers, e = env) => worker.fetch(new Request('https://notes.example.workers.dev/', { headers }), e);

    const ok = await ask({ 'Cf-Access-Jwt-Assertion': await sign(good, claims) });
    assert.equal(ok.status, 200);
    assert.equal(await ok.text(), 'page');
    assert.equal(ok.headers.get('X-Robots-Tag'), 'noindex, nofollow');
    assert.equal((await ask({ Cookie: `x=1; CF_Authorization=${await sign(good, claims)}` })).status, 200, 'cookie works too');

    assert.equal((await ask({})).status, 403, 'no token');
    assert.equal((await ask({ 'Cf-Access-Jwt-Assertion': 'junk' })).status, 403, 'garbage');
    assert.equal((await ask({ 'Cf-Access-Jwt-Assertion': await sign(other, claims) })).status, 403, 'unknown key');
    assert.equal((await ask({ 'Cf-Access-Jwt-Assertion': await sign({ ...other, kid: 'k1' }, claims) })).status, 403, 'bad signature');
    assert.equal((await ask({ 'Cf-Access-Jwt-Assertion': await sign(good, { ...claims, aud: ['other-app'] }) })).status, 403, 'wrong app');
    assert.equal((await ask({ 'Cf-Access-Jwt-Assertion': await sign(good, { ...claims, iss: 'https://evil.example' }) })).status, 403, 'wrong issuer');
    assert.equal((await ask({ 'Cf-Access-Jwt-Assertion': await sign(good, { ...claims, exp: now - 10 }) })).status, 403, 'expired');
    const unset = { ...env, TEAM_DOMAIN: '', POLICY_AUD: '' };
    assert.equal((await ask({ 'Cf-Access-Jwt-Assertion': await sign(good, claims) }, unset)).status, 403, 'not configured');
    assert.equal(await validAccessToken(undefined, env), false);
    assert.equal((await ask({ 'Cf-Access-Jwt-Assertion': '', Cookie: `CF_Authorization=${await sign(good, claims)}` })).status, 200, 'an empty header falls back to the cookie');
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('unknown keys refetch the certs at most once a minute', async () => {
  const team = 'refetch.cloudflareaccess.com';
  const good = await keyPair('k1');
  const stranger = await keyPair('k9');
  const realFetch = globalThis.fetch;
  let fetches = 0;
  globalThis.fetch = async () => {
    fetches++;
    return new Response(JSON.stringify({ keys: [good.jwk] }));
  };
  try {
    const env = { TEAM_DOMAIN: team, POLICY_AUD: AUD };
    const now = Math.floor(Date.now() / 1000);
    const token = await sign(stranger, { aud: [AUD], iss: `https://${team}`, exp: now + 3600 });
    assert.equal(await validAccessToken(token, env, now), false);
    assert.equal(fetches, 2, 'the first load, then one refetch');
    assert.equal(await validAccessToken(token, env, now + 10), false);
    assert.equal(fetches, 2, 'no refetch within the minute');
    assert.equal(await validAccessToken(token, env, now + 61), false);
    assert.equal(fetches, 3, 'a refetch after it');
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('heading ids, tag pages, root links, and Windows line endings', () => {
  const s = site({
    tracked: {
      'a.md': note('A', { tags: ['Foam', 'x'], body: '## Q & A\n\n## Sam\'s list\n\n## !!!\n\n## ???\n\n[Pic](/assets/p.png)' }),
      'b.md': note('B', { tags: ['foam'] }).replaceAll('\n', '\r\n'),
      'c.md': note('C', { tags: ['Foam'] }),
      'assets/p.png': 'png',
    },
  });
  assert.equal(s.code, 0, s.output);
  const a = s.page('a');
  for (const id of ['q-a', 'sams-list', 'section', 'section-2']) assert.match(a, new RegExp(`id="${id}"`));
  assert.match(a, /href="\/assets\/p.png"/, 'a leading slash means the notebook root');
  assert.match(a, /href="\/tags\/foam\/">Foam</);
  assert.match(s.page('b'), /<h1>B<\/h1>/, 'front matter read despite CRLF');
  const foam = s.page('tags/foam');
  assert.match(foam, /<h1>Foam<\/h1>/, 'named with the commonest spelling');
  assert.match(foam, /3 notes/);
  assert.equal(s.has('tags/Foam/index.html') && fs.readdirSync(path.join(s.out, 'tags')).includes('Foam'), false);
  s.cleanup();
});

test('a tag that could write outside tags/ fails the build', () => {
  const s = site({ tracked: { 'a.md': note('A', { tags: ['idea/../..'] }) } });
  assert.equal(s.code, 1);
  assert.match(s.output, /a\.md/);
  s.cleanup();
  const ok = site({ tracked: { 'a.md': note('A', { tags: ['idea/emergence'] }) } });
  assert.equal(ok.code, 0, ok.output);
  assert.ok(ok.has('tags/idea/emergence/index.html'), 'pattern tags still work');
  assert.match(ok.page('a'), /href="\/tags\/idea\/emergence\/"/, 'links keep the slash, not %2F');
  ok.cleanup();
});

test('--public builds the demo: indexable, with a footer linking the code', () => {
  const s = site({ tracked: { 'welcome.md': note('Welcome') } }, '--public');
  assert.equal(s.code, 0, s.output);
  const home = fs.readFileSync(path.join(s.out, 'index.html'), 'utf8');
  assert.doesNotMatch(home, /name="robots"/);
  assert.match(home, /href="\/welcome\/">Welcome/);
  assert.match(s.page('welcome'), /class="site-foot".*github\.com/);
  assert.match(home, /<h1 class="visually-hidden">Notebook<\/h1>/, 'the home page has its one h1');
  assert.match(s.page('welcome'), /<meta name="description" content="[^"]+">/);
  assert.match(s.page('welcome'), /<link rel="canonical" href="https:\/\/[^"]+\/welcome\/">/);
  assert.match(fs.readFileSync(path.join(s.out, 'sitemap.xml'), 'utf8'), /<loc>https:\/\/[^<]+\/welcome\/<\/loc>/);
  const priv = site({ tracked: { 'welcome.md': note('Welcome') } });
  assert.match(priv.page('welcome'), /name="robots" content="noindex/);
  assert.doesNotMatch(priv.page('welcome'), /site-foot|rel="canonical"/);
  assert.equal(fs.existsSync(path.join(priv.out, 'sitemap.xml')), false, 'the private version has no sitemap');
  s.cleanup();
  priv.cleanup();
});
