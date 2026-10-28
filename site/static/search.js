// Word search, in the browser. Uses the same scoring as `notes.mjs find --words` (score.js is a copy
// of scripts/lib/score.mjs made by the build). Readwise and highlights load only when included.
import { scoreNote } from './score.js';

const form = document.querySelector('[data-search]');
const status = document.querySelector('[data-status]');
const results = document.querySelector('[data-results]');
const LIMIT = 50;
const LABELS = { note: 'note', recipe: 'recipe', readwise: 'Readwise', highlight: 'highlight' };

const cache = {};
const load = (name) =>
  (cache[name] ??= fetch(`/search-${name}.json`)
    .then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then((list) => list.map((e) => ({ ...e, data: { title: e.title, aliases: e.aliases, tags: e.tags, summary: e.summary } }))));

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Each search gets a number; one that finishes after a newer one started shows nothing, so a slow
// index load can't overwrite newer results.
let latest = 0;

async function search() {
  const run = ++latest;
  const f = form.elements;
  const query = f.q.value.trim();
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (f.kind.value) params.set('kind', f.kind.value);
  if (f.readwise.checked) params.set('readwise', '1');
  history.replaceState(null, '', params.size ? `?${params}` : location.pathname);
  if (!query) {
    status.textContent = '';
    results.innerHTML = '';
    return;
  }
  status.textContent = 'Searching…';
  let entries;
  try {
    entries = (await Promise.all([load('notes'), ...(f.readwise.checked ? [load('readwise')] : [])])).flat();
  } catch {
    if (run === latest) status.textContent = 'Couldn’t load the search index. Reload the page and try again.';
    return;
  }
  if (run !== latest) return;
  const kind = f.kind.value;
  const matches = [];
  for (const e of entries) {
    if (kind && e.kind !== kind) continue;
    const m = scoreNote(e, query);
    if (m) matches.push({ e, score: m.score });
  }
  matches.sort((a, b) => b.score - a.score || a.e.title.localeCompare(b.e.title));
  status.textContent = matches.length
    ? `${matches.length} match${matches.length === 1 ? '' : 'es'}${matches.length > LIMIT ? `, showing the first ${LIMIT}` : ''}`
    : 'No matches.';
  results.innerHTML = matches
    .slice(0, LIMIT)
    .map(({ e }) => `<li><a href="${esc(e.url)}">${esc(e.title)}</a><span class="kind">${LABELS[e.kind]}</span>${e.summary ? `<p>${esc(e.summary)}</p>` : ''}</li>`)
    .join('');
}

const params = new URLSearchParams(location.search);
form.elements.q.value = params.get('q') ?? '';
if (params.get('kind')) form.elements.kind.value = params.get('kind');
form.elements.readwise.checked = params.get('readwise') === '1';

form.addEventListener('submit', (e) => {
  e.preventDefault();
  search();
});
form.addEventListener('change', search);
search();
// Start downloading the notes index while the query is typed, so the first search doesn't wait for it.
// A failure here is reported by the search that needs it.
load('notes').catch(() => delete cache.notes);
