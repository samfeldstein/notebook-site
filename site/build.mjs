// Builds the private web version of the notebook: Markdown in, static HTML out (site/dist/).
// Cloudflare runs it on every push to main; see the "Web version" section of scripts.md.
// Only files Git tracks are published, so the Git-ignored inboxes and exports never leave the Mac.
// --public builds the public demo instead, from the sample notes in site/demo/ (which are also the
// docs), with search engines allowed and a footer pointing to the code.
//   node site/build.mjs [--public] [--root=<notebook>] [--out=<dir>]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import markedFootnote from 'marked-footnote';
import { parseNote } from '../scripts/lib/notes.mjs';
import { parseLinks, relativeTarget } from '../scripts/lib/links.mjs';

const SITE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const option = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const PUBLIC = argv.includes('--public');
const REPO = 'https://github.com/samfeldstein/notebook-site';
const SITE_URL = 'https://notebook-site.samfeldstein.workers.dev';
const AUTHOR = 'Sam Feldstein';
const AUTHOR_URL = 'https://samfeldstein.xyz';

// Files in static/ are linked with a hash of their contents (?v=), so browsers can keep them for a
// year and still fetch a changed one. search.js imports score.js, so that import gets the hash too.
// Fonts keep plain names; a changed font gets a new file name instead.
const hash = (data) => createHash('sha256').update(data).digest('hex').slice(0, 10);
const shipped = new Map(
  fs.readdirSync(path.join(SITE, 'static'), { withFileTypes: true })
    .filter((f) => f.isFile())
    .map((f) => [f.name, fs.readFileSync(path.join(SITE, 'static', f.name))]),
);
shipped.set('score.js', fs.readFileSync(path.join(SITE, '../scripts/lib/score.mjs')));
{
  const search = shipped.get('search.js').toString();
  if (!search.includes("from './score.js'")) throw new Error("static/search.js no longer imports './score.js'; update the hashing in build.mjs");
  shipped.set('search.js', Buffer.from(search.replace("from './score.js'", `from './score.js?v=${hash(shipped.get('score.js'))}'`)));
}
const asset = (name) => `/static/${name}?v=${hash(shipped.get(name))}`;
const ROOT = path.resolve(option('root') ?? (PUBLIC ? path.join(SITE, 'demo') : path.join(SITE, '..')));
const OUT = path.resolve(option('out') ?? path.join(SITE, 'dist'));
// Workers serves static files up to 25 MiB. Bigger attachments stay on the Mac.
const MAX_BYTES = Number(option('max-bytes') ?? 25 * 1024 * 1024);

// The two highlight sections: readwise/ (synced from Readwise) and highlights/ (saved by a separate
// reading app from articles, PDFs, and newsletters).
const READWISE = 'Readwise Highlights';
const OTHER = 'Other Highlights';

const COURSES = ['entrees', 'soups', 'sides', 'breads', 'desserts', 'drinks', 'sauces'];
// Top-level paths the site uses for its own pages. A root note with one of these ids would collide.
const RESERVED = ['notes', 'recipes', 'tags', 'search', 'readwise', 'highlights', 'static', '404'];

// --- files -------------------------------------------------------------------

// Tracked files, so a local build matches Cloudflare's, which builds from a clone of the repo.
// Without Git (or outside a repo), every file except dot folders, node_modules, and site/ counts.
function trackedFiles() {
  try {
    return execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\0')
      .filter((f) => f && fs.existsSync(path.join(ROOT, f)));
  } catch {
    const walk = (dir) =>
      fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) => {
        if (e.name.startsWith('.') || e.name === 'node_modules' || (dir === '' && e.name === 'site')) return [];
        const rel = path.posix.join(dir, e.name);
        return e.isDirectory() ? walk(rel) : [rel];
      });
    return walk('');
  }
}

// Which section a Markdown file belongs to, or null if it isn't a page.
function kindOf(file) {
  const parts = file.split('/');
  if (parts.at(-1) === 'CLAUDE.md' || !file.endsWith('.md')) return null;
  if (parts.length === 1 || (parts.length === 2 && parts[0] === 'daily')) return 'note';
  if (parts.length === 3 && parts[0] === 'recipes') return 'recipe';
  if (parts.length === 2 && parts[0] === 'readwise') return 'readwise';
  if (parts.length === 2 && parts[0] === 'highlights') return 'highlight';
  return null;
}

const encodePath = (p) => p.split('/').map(encodeURIComponent).join('/');
const pageUrl = (id) => `/${encodePath(id)}/`;

// --- HTML helpers -------------------------------------------------------------

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const unesc = (s) => s.replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[e]);
// A heading's id, from its rendered HTML: tags dropped and entities decoded first, so "Q &amp; A" gives "q-a".
const slug = (s) => unesc(s.replace(/<[^>]*>/g, '')).toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// The demo's pages get a canonical link; a page without a url (the 404) gets none.
function layout({ title, description, url, section, body, scripts = [] }) {
  const nav = [['notes', 'Notes'], ['recipes', 'Recipes'], ['search', 'Search']]
    .map(([key, label]) => `<a href="/${key}/"${section === key ? ' aria-current="page"' : ''}>${label}</a>`)
    .join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${PUBLIC ? '' : '<meta name="robots" content="noindex, nofollow">\n'}<meta name="theme-color" content="#eef3e6" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#102a4c" media="(prefers-color-scheme: dark)">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${PUBLIC ? `<meta name="author" content="${AUTHOR}">\n<link rel="author" href="${AUTHOR_URL}">\n` : ''}${PUBLIC && url ? `<link rel="canonical" href="${esc(SITE_URL + url)}">\n` : ''}<link rel="preload" href="/static/fonts/ibm-plex-sans-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/static/fonts/ibm-plex-sans-condensed-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${asset('site.css')}">
<link rel="icon" href="${asset('icon.svg')}">
<link rel="apple-touch-icon" href="${asset('apple-touch-icon.png')}">
<meta name="apple-mobile-web-app-title" content="Notebook">
</head>
<body>
<header class="top"><a class="brand" href="/">Notebook</a><nav aria-label="Site">${nav}</nav></header>
<main>
${body}
</main>
${PUBLIC ? `<footer class="site-foot"><p>Made by <a href="${AUTHOR_URL}">${AUTHOR}</a>. A demo built from sample notes, which are also the docs. <a href="${REPO}" rel="noreferrer">Code on GitHub</a>.</p></footer>\n` : ''}${scripts.map((s) => `<script type="module" src="${asset(s)}"></script>`).join('\n')}
</body>
</html>
`;
}

// Tags that differ only in case share one page, since their folders would collide on a Mac's disk.
const tagUrl = (t) => `/tags/${t.toLowerCase().split('/').map(encodeURIComponent).join('/')}/`;
const tagLinks = (tags, href = tagUrl) =>
  tags.length ? `<ul class="tags">${tags.map((t) => `<li><a href="${esc(href(t))}">${esc(t)}</a></li>`).join('')}</ul>` : '';

const duration = (m) => (m < 90 ? `${m} min` : `${Math.floor(m / 60)} hr${m % 60 ? ` ${m % 60} min` : ''}`);
const recipeFacts = (d) =>
  [d.total_minutes && duration(Number(d.total_minutes)), d.servings && `serves ${d.servings}`, d.effort && `${d.effort} effort`].filter(Boolean);

// --- build -------------------------------------------------------------------

const files = trackedFiles();
const tracked = new Set(files);

const pages = new Map(); // file -> page
for (const file of files) {
  const kind = kindOf(file);
  if (!kind) continue;
  const id = file.slice(0, -3);
  const { data, body } = parseNote(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  pages.set(file, { file, id, kind, url: pageUrl(id), data, body, title: data.title || path.posix.basename(id) });
}

const collisions = [...pages.values()].filter((p) => p.kind === 'note' && RESERVED.includes(p.id));
if (collisions.length) {
  console.error(`These notes collide with the site's own pages; rename them: ${collisions.map((p) => p.file).join(', ')}`);
  process.exit(1);
}
// A tag becomes a folder under tags/ (a pattern tag like idea/emergence, a nested one), so a part
// that is only dots, or a backslash, could write outside it.
const badTags = [...pages.values()].filter((p) => p.kind === 'note' && p.data.tags.some((t) => t.includes('\\') || t.split('/').some((part) => /^\.*$/.test(part))));
if (badTags.length) {
  console.error(`These notes have a tag with an empty or dots-only part, or a backslash; fix the tag: ${badTags.map((p) => p.file).join(', ')}`);
  process.exit(1);
}

// Wikilinks name a note or file anywhere in the notebook, by file name.
const byName = new Map();
for (const f of files) {
  const name = path.posix.basename(f).toLowerCase();
  for (const key of new Set([name, name.replace(/\.md$/, '')])) byName.set(key, byName.has(key) ? null : f);
}
function wikiToMarkdown(file, body) {
  const wikis = parseLinks(body).filter((l) => l.kind === 'wiki');
  for (const l of wikis.reverse()) {
    const name = path.posix.basename(l.target).toLowerCase();
    const target = byName.get(name) ?? byName.get(name.replace(/\.md$/, ''));
    const text = (l.text ?? l.target).replace(/[[\]]/g, '');
    const md = target ? `${l.embed ? '!' : ''}[${text}](${relativeTarget(file, target)}${l.anchor})` : text;
    body = body.slice(0, l.index) + md + body.slice(l.index + l.raw.length);
  }
  return body;
}

// Rendering state for the page being rendered. Link targets resolve relative to its file.
let current = null;
const backlinks = new Map(); // file -> Set of files linking to it
const attachments = new Set();
const offline = new Set();

function resolveHref(href) {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href)) return { href };
  // The site's own pages, like /tags/ or /search/?q=word, pass through as they are.
  if (RESERVED.includes(href.match(/^\/([^/?#]+)\//)?.[1])) return { href };
  const hash = href.indexOf('#');
  const anchor = hash === -1 ? '' : href.slice(hash);
  let target = hash === -1 ? href : href.slice(0, hash);
  try {
    target = decodeURI(target);
  } catch {}
  // A leading slash means the notebook's root, not the linking file's folder.
  const p = target.startsWith('/') ? path.posix.normalize(target.slice(1)) : path.posix.normalize(path.posix.join(path.posix.dirname(current.file), target));
  const page = pages.get(p) ?? pages.get(`${p}.md`);
  if (page) {
    if (page.file !== current.file) (backlinks.get(page.file) ?? backlinks.set(page.file, new Set()).get(page.file)).add(current.file);
    return { href: page.url + anchor };
  }
  if (tracked.has(p) && fs.statSync(path.join(ROOT, p)).size <= MAX_BYTES) {
    attachments.add(p);
    return { href: `/${encodePath(p)}${anchor}` };
  }
  // A note not written yet, or a file Git ignores or that is too big to host.
  if (!p.endsWith('.md') && path.posix.extname(p)) offline.add(p);
  return { missing: p.endsWith('.md') || !path.posix.extname(p) ? 'Not written yet' : 'Not published' };
}

const marked = new Marked(markedFootnote(), {
  gfm: true,
  walkTokens(token) {
    if (token.type === 'link' || token.type === 'image') Object.assign(token, resolveHref(token.href));
  },
  renderer: {
    heading({ tokens, depth }) {
      const html = this.parser.parseInline(tokens);
      const base = slug(html) || 'section';
      let id = base;
      for (let n = 2; current.ids.has(id); n++) id = `${base}-${n}`;
      current.ids.add(id);
      if (depth <= 3) current.headings.push({ depth, id, html: html.replace(/<[^>]*>/g, '') });
      return `<h${depth} id="${esc(id)}">${html}</h${depth}>\n`;
    },
    link(token) {
      const text = this.parser.parseInline(token.tokens);
      if (token.missing) return `<span class="missing" title="${token.missing}">${text}</span>`;
      const external = /^(?:https?:)?\/\//i.test(token.href);
      return `<a href="${esc(token.href)}"${token.title ? ` title="${esc(token.title)}"` : ''}${external ? ' rel="noreferrer"' : ''}>${text}</a>`;
    },
    image(token) {
      if (token.missing) return `<span class="missing" title="${token.missing}">${esc(token.text || 'Image')} (${token.missing.toLowerCase()})</span>`;
      if (/\.pdf$/i.test(token.href)) return `<a href="${esc(token.href)}">${esc(token.text || 'PDF')}</a>`;
      return `<img src="${esc(token.href)}" alt="${esc(token.text)}" loading="lazy">`;
    },
    // Tables scroll sideways inside a wrapper, so the table itself keeps its table semantics.
    table(token) {
      return `<div class="table-wrap">${this.constructor.prototype.table.call(this, token)}</div>\n`;
    },
    // Raw HTML in a note is almost always an example that lost its code formatting, so it shows as text.
    html(token) {
      return esc(token.text);
    },
  },
});

function render(page) {
  current = { file: page.file, ids: new Set(), headings: [] };
  // marked puts a space after a task's checkbox; the stylesheet's hanging indent spaces it instead.
  page.html = marked.parse(wikiToMarkdown(page.file, page.body)).replace(/(<input [^>]*type="checkbox">) /g, '$1');
  page.headings = current.headings;
}
for (const page of pages.values()) render(page);

fs.rmSync(OUT, { recursive: true, force: true });
const write = (rel, html) => {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
};
// The demo lists every page in its sitemap; the private version isn't indexed, so it has none.
const sitemap = [];
const writePage = (url, page) => {
  sitemap.push(url);
  write(path.join(decodeURIComponent(url), 'index.html'), layout({ ...page, url }));
};

const all = [...pages.values()];
const byTitle = (a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' });
const notes = all.filter((p) => p.kind === 'note').sort(byTitle);
const recipes = all.filter((p) => p.kind === 'recipe').sort(byTitle);
const readwise = all.filter((p) => p.kind === 'readwise').sort(byTitle);
const highlights = all.filter((p) => p.kind === 'highlight').sort((a, b) => String(b.data.published ?? '').localeCompare(String(a.data.published ?? '')));
const courseOf = (p) => p.id.split('/')[1];
const sectionOf = { note: 'notes', recipe: 'recipes', readwise: 'notes', highlight: 'notes' };

const noteItem = (p) =>
  `<li data-item data-text="${esc([p.title, ...p.data.aliases, ...p.data.tags].join(' ').toLowerCase())}"><a href="${p.url}">${esc(p.title)}</a>${p.data.summary ? `<p>${esc(p.data.summary)}</p>` : ''}</li>`;

// Contents for a note with two or more headings: h1 and h2 at the top level, h3 nested under them.
// Long ones start collapsed, so the note itself stays near the top of the screen.
// Only h2 entries are numbered, since only h2s are numbered in the note (see site.css).
function toc(page) {
  const hs = page.headings;
  if (page.kind !== 'note' || hs.length < 2) return '';
  const link = (h) => `<a href="#${esc(h.id)}">${h.html}</a>`;
  const top = [];
  for (const h of hs) {
    if (h.depth === 3 && top.length) top.at(-1).children.push(h);
    else top.push({ ...h, children: [] });
  }
  const items = top
    .map((h) => `<li${h.depth === 2 ? '' : ' class="unnumbered"'}>${link(h)}${h.children.length ? `<ol>${h.children.map((c) => `<li>${link(c)}</li>`).join('')}</ol>` : ''}</li>`)
    .join('');
  return `<nav class="toc" aria-label="Contents"><details${hs.length > 15 ? '' : ' open'}><summary>Contents</summary><ol>${items}</ol></details></nav>`;
}

function backlinkList(page) {
  const from = [...(backlinks.get(page.file) ?? [])].map((f) => pages.get(f)).sort(byTitle);
  if (!from.length) return '';
  return `<aside class="backlinks"><h2>Backlinks</h2><ul>${from.map((p) => `<li><a href="${p.url}">${esc(p.title)}</a></li>`).join('')}</ul></aside>`;
}

// A page's meta description: its summary, or a line from what it has.
function describe(p) {
  const d = p.data;
  if (d.summary) return d.summary;
  if (p.kind === 'recipe') return [`A ${courseOf(p)} recipe`, ...recipeFacts(d)].join(' · ');
  if (p.kind === 'note') return `A note in the notebook: ${p.title}.`;
  return `Highlights from ${p.title}${d.author ? `, by ${d.author}` : ''}.`;
}

// Note, recipe, Readwise, and highlight pages.
for (const p of all) {
  const d = p.data;
  let head = `<h1>${esc(p.title)}</h1>`;
  if (p.kind === 'note') {
    if (d.summary) head += `<p class="lede">${esc(d.summary)}</p>`;
    head += tagLinks(d.tags);
    if (d.updated || d.created) head += `<p class="meta">${d.updated ? `Updated ${esc(d.updated)}` : `Created ${esc(d.created)}`}</p>`;
  } else if (p.kind === 'recipe') {
    const facts = recipeFacts(d);
    head = `<p class="kicker"><a href="/recipes/#${esc(courseOf(p))}">${esc(courseOf(p))}</a></p>${head}`;
    if (facts.length) head += `<p class="facts">${facts.map(esc).join(' · ')}</p>`;
    head += tagLinks(d.tags.slice(1), (t) => `/recipes/?tag=${encodeURIComponent(t)}`);
  } else {
    const by = [d.author, d.feed, d.category].filter(Boolean).map(esc).join(' · ');
    head = `<p class="kicker"><a href="/${p.kind === 'readwise' ? 'readwise' : 'highlights'}/">${p.kind === 'readwise' ? READWISE : OTHER}</a></p>${head}`;
    if (by) head += `<p class="meta">${by}</p>`;
    if (d.summary) head += `<p class="lede">${esc(d.summary)}</p>`;
    if (d.source_url) head += `<p class="meta"><a href="${esc(d.source_url)}" rel="noreferrer">Original</a></p>`;
  }
  const contents = toc(p);
  const body = `<article class="${p.kind}"><header class="page-head">${head}</header>${contents}<div class="prose">${p.html}</div>${backlinkList(p)}</article>`;
  writePage(p.url, { title: p.title, description: describe(p), section: sectionOf[p.kind], body, scripts: contents ? ['toc.js'] : [] });
}

// Notes, A to Z, with a filter box.
const filterBox = (label) =>
  `<p class="filter"><label>${label} <input type="search" data-filter placeholder="Type to filter" autocomplete="off"></label></p>`;
{
  const letters = Map.groupBy(notes, (p) => (/[a-z]/i.test(p.title[0]) ? p.title[0].toUpperCase() : '#'));
  const letterId = (letter) => (letter === '#' ? 'other' : letter.toLowerCase());
  const body = `<h1>Notes</h1>
<p class="meta">${plural(notes.length, 'note')} · <a href="/tags/">Tags</a> · <a href="/readwise/">${READWISE}</a> · <a href="/highlights/">${OTHER}</a></p>
${filterBox('Filter notes')}
<nav class="az" aria-label="Jump to letter">${[...letters.keys()].map((l) => `<a href="#${letterId(l)}">${esc(l)}</a>`).join('')}</nav>
${[...letters].map(([letter, list]) => `<section data-group><h2 id="${letterId(letter)}">${esc(letter)}</h2><ul class="list">${list.map(noteItem).join('')}</ul></section>`).join('\n')}`;
  writePage('/notes/', { title: 'Notes', description: `All ${plural(notes.length, 'note')}, A to Z.`, section: 'notes', body, scripts: ['filter.js'] });
}

// Tags: an index, and one page per tag. Recipes have their own filters, so tags cover notes only.
{
  // Keyed by lowercase tag. Each page is named with the spelling most notes use.
  const tagged = new Map();
  const spellings = new Map();
  for (const p of notes) {
    for (const t of new Set(p.data.tags.map((t) => t.toLowerCase()))) (tagged.get(t) ?? tagged.set(t, []).get(t)).push(p);
    for (const t of p.data.tags) {
      const counts = spellings.get(t.toLowerCase()) ?? spellings.set(t.toLowerCase(), new Map()).get(t.toLowerCase());
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  const name = (key) => [...spellings.get(key)].sort((a, b) => b[1] - a[1])[0][0];
  const tags = [...tagged.keys()].sort((a, b) => a.localeCompare(b));
  const body = `<h1>Tags</h1>${filterBox('Filter tags')}<ul class="tag-index" data-group>${tags
    .map((t) => `<li data-item data-text="${esc(t)}"><a href="${tagUrl(t)}">${esc(name(t))}</a> <span class="count">${tagged.get(t).length}</span></li>`)
    .join('')}</ul>`;
  writePage('/tags/', { title: 'Tags', description: 'Every tag on the notes, with a count of each.', section: 'notes', body, scripts: ['filter.js'] });
  for (const t of tags) {
    const list = tagged.get(t);
    writePage(tagUrl(t), { title: `Tag: ${name(t)}`, description: `${plural(list.length, 'note')} tagged ${name(t)}.`, section: 'notes', body: `<p class="kicker"><a href="/tags/">Tags</a></p><h1>${esc(name(t))}</h1><p class="meta">${plural(list.length, 'note')}</p><ul class="list">${list.map(noteItem).join('')}</ul>` });
  }
}

// Recipes by course, with filters for tag, time, and effort (static/filter.js).
{
  const courses = [...COURSES, ...new Set(recipes.map(courseOf).filter((c) => !COURSES.includes(c)))];
  const tagCounts = new Map();
  for (const p of recipes) for (const t of p.data.tags.slice(1)) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const tagOptions = [...tagCounts.keys()].sort((a, b) => a.localeCompare(b)).map((t) => `<option value="${esc(t)}">${esc(t)} (${tagCounts.get(t)})</option>`).join('');
  const item = (p) => {
    const facts = recipeFacts(p.data);
    return `<li data-item data-text="${esc([p.title, ...p.data.tags].join(' ').toLowerCase())}" data-tags="${esc(p.data.tags.join(' '))}" data-minutes="${esc(p.data.total_minutes ?? '')}" data-effort="${esc(p.data.effort ?? '')}"><a href="${p.url}">${esc(p.title)}</a>${facts.length ? `<p>${esc(facts.join(' · '))}</p>` : ''}</li>`;
  };
  const sections = courses
    .map((c) => [c, recipes.filter((p) => courseOf(p) === c)])
    .filter(([, list]) => list.length)
    .map(([c, list]) => `<section data-group id="${esc(c)}"><h2>${esc(c[0].toUpperCase() + c.slice(1))}</h2><ul class="list">${list.map(item).join('')}</ul></section>`)
    .join('\n');
  const body = `<h1>Recipes</h1>
<p class="meta">${plural(recipes.length, 'recipe')}</p>
<form class="filters" data-filters>
<label>Name or tag <input type="search" data-filter placeholder="Type to filter" autocomplete="off"></label>
<label>Tag <select name="tag"><option value="">Any</option>${tagOptions}</select></label>
<label>Time <select name="minutes"><option value="">Any</option><option value="30">30 min or less</option><option value="45">45 min or less</option><option value="60">1 hour or less</option><option value="90">90 min or less</option></select></label>
<label>Effort <select name="effort"><option value="">Any</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
</form>
<p class="none" hidden>No recipes match.</p>
${sections}`;
  writePage('/recipes/', { title: 'Recipes', description: `${plural(recipes.length, 'recipe')} by course, filtered by tag, time, and effort.`, section: 'recipes', body, scripts: ['filter.js'] });
}

// Readwise, by category, and highlights, newest first.
{
  const groups = Map.groupBy(readwise, (p) => p.data.category || 'other');
  const order = [...groups.keys()].sort((a, b) => groups.get(b).length - groups.get(a).length);
  const item = (p) => `<li data-item data-text="${esc([p.title, p.data.author].join(' ').toLowerCase())}"><a href="${p.url}">${esc(p.title)}</a>${p.data.author ? `<p>${esc(p.data.author)}</p>` : ''}</li>`;
  const body = `<p class="kicker"><a href="/notes/">Notes</a></p><h1>${READWISE}</h1><p class="meta">${plural(readwise.length, 'source')}</p>${filterBox('Filter')}
${order.map((c) => `<section data-group><h2>${esc(c[0].toUpperCase() + c.slice(1))}</h2><ul class="list">${groups.get(c).map(item).join('')}</ul></section>`).join('\n')}`;
  writePage('/readwise/', { title: READWISE, description: `Highlights from ${plural(readwise.length, 'source')}, synced from Readwise.`, section: 'notes', body, scripts: ['filter.js'] });
  const hbody = `<p class="kicker"><a href="/notes/">Notes</a></p><h1>${OTHER}</h1><p class="meta">${plural(highlights.length, 'source')}, saved from articles, PDFs, and newsletters</p><ul class="list">${highlights
    .map((p) => `<li><a href="${p.url}">${esc(p.title)}</a><p>${esc([p.data.feed, p.data.published].filter(Boolean).join(' · '))}</p></li>`)
    .join('')}</ul>`;
  writePage('/highlights/', { title: OTHER, description: `Highlights from ${plural(highlights.length, 'source')}, saved from articles, PDFs, and newsletters.`, section: 'notes', body: hbody });
}

// Home: search, the two sections, and recently updated notes.
{
  const recent = notes.filter((p) => p.data.updated).sort((a, b) => b.data.updated.localeCompare(a.data.updated) || byTitle(a, b)).slice(0, 12);
  const intro = PUBLIC ? '<p class="lede">A demo notebook whose sample notes are also its docs. Start with <a href="/welcome/">Welcome</a>.</p>\n' : '';
  const body = `<h1 class="visually-hidden">Notebook</h1>${intro}<form class="search-form home" action="/search/"><label class="visually-hidden" for="q">Search</label><input id="q" type="search" name="q" placeholder="Search notes and recipes"><button>Search</button></form>
<nav class="sections" aria-label="Sections"><a href="/notes/"><strong>Notes</strong><span>${plural(notes.length, 'note')}</span></a><a href="/recipes/"><strong>Recipes</strong><span>${plural(recipes.length, 'recipe')}</span></a><a href="/readwise/"><strong>${READWISE}</strong><span>${plural(readwise.length, 'source')}</span></a><a href="/highlights/"><strong>${OTHER}</strong><span>${plural(highlights.length, 'source')}</span></a></nav>
<h2>Recently updated</h2>
<ul class="list">${recent.map(noteItem).join('')}</ul>`;
  writePage('/', { title: 'Notebook', description: PUBLIC ? 'A demo of a read-only website for a notebook of Markdown files.' : 'Notes, recipes, and highlights.', section: '', body });
}

// Search: the page, plus two indexes. Readwise and highlights load only when included.
{
  const entry = (p) => ({
    id: p.id,
    url: p.url,
    kind: p.kind,
    title: p.title,
    aliases: p.data.aliases,
    tags: p.data.tags,
    summary: p.kind === 'recipe' ? recipeFacts(p.data).join(' · ') : p.data.summary ?? '',
    body: p.body,
  });
  write('search-notes.json', JSON.stringify([...notes, ...recipes].map(entry)));
  write('search-readwise.json', JSON.stringify([...readwise, ...highlights].map(entry)));
  const body = `<h1>Search</h1>
<form class="search-form" data-search>
<label class="visually-hidden" for="q">Search</label><input id="q" type="search" name="q" placeholder="Words, or alternatives like stuck|rut" autofocus><button>Search</button>
<fieldset class="kinds"><legend class="visually-hidden">Show</legend>
<label><input type="radio" name="kind" value="" checked> All</label>
<label><input type="radio" name="kind" value="note"> Notes</label>
<label><input type="radio" name="kind" value="recipe"> Recipes</label>
<label><input type="checkbox" name="readwise" value="1"> Include all highlights</label>
</fieldset>
</form>
<p class="meta" data-status></p>
<ol class="list results" data-results></ol>
<noscript><p>Search needs JavaScript.</p></noscript>`;
  writePage('/search/', { title: 'Search', description: 'Search the notes, recipes, and highlights.', section: 'search', body, scripts: ['search.js'] });
}

write('404.html', layout({ title: 'Not found', description: 'No page here.', section: '', body: '<h1>Not found</h1><p>No page here. Try <a href="/search/">search</a>.</p>' }));
if (PUBLIC) {
  const urls = sitemap.map((u) => `<url><loc>${esc(SITE_URL + u)}</loc></url>`).join('\n');
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
}

// Static files, the shared search scoring, and attachments that pages link to.
fs.cpSync(path.join(SITE, 'static'), path.join(OUT, 'static'), { recursive: true });
for (const [name, data] of shipped) fs.writeFileSync(path.join(OUT, 'static', name), data);
// The demo's static files are served straight from the folder, so _headers sets their caching.
// The private version's Worker sets it instead (worker.js).
if (PUBLIC) write('_headers', '/static/*\n  Cache-Control: public, max-age=31536000, immutable\n');
for (const f of attachments) {
  fs.mkdirSync(path.dirname(path.join(OUT, f)), { recursive: true });
  fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
}

console.log(
  `Built ${plural(notes.length, 'note')}, ${plural(recipes.length, 'recipe')}, ${plural(readwise.length, 'Readwise source')}, ${plural(highlights.length, 'highlight')}, and ${plural(attachments.size, 'attachment')} into ${path.relative(process.cwd(), OUT) || '.'}.`,
);
if (offline.size) console.log(`Linked but not published (Git ignores them or they're over ${MAX_BYTES / 1024 / 1024} MiB): ${[...offline].sort().join(', ')}`);
