// Links between notes. The notebook uses standard Markdown links, like [How to Learn](how-to-learn.md),
// so any Markdown viewer shows a clickable title. Wikilinks ([[how-to-learn]]) are still read, because
// readwise/ notes and older text may contain them.
import path from 'node:path';

// Code spans and fenced code blocks hold examples, not links, so they are skipped.
function codeRanges(text) {
  const ranges = [];
  const fence = /^(```|~~~)[^\n]*\n[\s\S]*?(?:^\1[^\n]*$|(?![\s\S]))/gm;
  for (const m of text.matchAll(fence)) ranges.push([m.index, m.index + m[0].length]);
  const span = /(`+)(?!`)[\s\S]*?[^`]\1(?!`)/g;
  for (const m of text.matchAll(span)) ranges.push([m.index, m.index + m[0].length]);
  return ranges;
}

const WIKI = /(!?)\[\[([^\]|#\n]+)(#[^\]|\n]*)?(?:\|([^\]\n]*))?\]\]/g;
// [text](target "optional title"), where target may be wrapped in <> when it has spaces.
const MD = /(!?)\[((?:\\.|[^\]\\\n])*)\]\((<[^>\n]*>|[^)\s]+)(?:\s+"[^"\n]*")?\)/g;
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

// Every link to a file in the notebook: { kind, embed, target, anchor, text, index, raw }.
// For Markdown links, target is the path as written (relative to the linking note's folder).
export function parseLinks(text) {
  const code = codeRanges(text);
  const inCode = (i) => code.some(([a, b]) => i >= a && i < b);
  const links = [];
  for (const m of text.matchAll(WIKI)) {
    if (inCode(m.index)) continue;
    links.push({ kind: 'wiki', embed: m[1] === '!', target: m[2].trim(), anchor: m[3] ?? '', text: m[4], index: m.index, raw: m[0] });
  }
  for (const m of text.matchAll(MD)) {
    if (inCode(m.index)) continue;
    let target = m[3].startsWith('<') ? m[3].slice(1, -1) : m[3];
    if (EXTERNAL.test(target)) continue;
    const hash = target.indexOf('#');
    const anchor = hash === -1 ? '' : target.slice(hash);
    target = hash === -1 ? target : target.slice(0, hash);
    try {
      target = decodeURI(target);
    } catch {}
    links.push({ kind: 'md', embed: m[1] === '!', target, anchor, text: m[2].replace(/\\([[\]\\])/g, '$1'), index: m.index, raw: m[0] });
  }
  return links.sort((a, b) => a.index - b.index);
}

// The notebook-relative path a link points at, before checking that the file exists.
// Markdown links are relative to the linking note's folder; wikilinks name a note or file anywhere.
export function linkPath(link, fromFile) {
  if (link.kind === 'wiki') return link.target.replace(/^\.?\//, '');
  return path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), link.target));
}

// A path written the way a Markdown link needs it: relative to the linking note, wrapped in <> if it has spaces.
export function relativeTarget(fromFile, toFile) {
  const rel = path.posix.relative(path.posix.dirname(fromFile), toFile) || path.posix.basename(toFile);
  return /[\s()<>]/.test(rel) ? `<${rel}>` : rel;
}

export const escapeText = (s) => s.replace(/[[\]\\]/g, (c) => `\\${c}`);

const IMAGE = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

// A Markdown link to toFile, written from inside fromFile.
export function markdownLink(fromFile, toFile, text, { embed = false, anchor = '' } = {}) {
  const target = relativeTarget(fromFile, toFile);
  const dest = anchor ? (target.startsWith('<') ? `${target.slice(0, -1)}${anchor}>` : `${target}${anchor}`) : target;
  return `${embed && IMAGE.test(toFile) ? '!' : ''}[${escapeText(text)}](${dest})`;
}
