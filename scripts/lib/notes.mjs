// Reading a note's front matter. Shared by the notes CLI and the site build (site/build.mjs).
// No Node imports, so it runs anywhere.

// Strips YAML quotes. Double-quoted values can escape \" and \\, the way quoteYaml() writes them.
const unquote = (v) => {
  const t = v.trim();
  if (t.length < 2 || t[0] !== t.at(-1) || !`"'`.includes(t[0])) return t;
  const inner = t.slice(1, -1);
  return t[0] === '"' ? inner.replace(/\\(["\\])/g, '$1') : inner;
};

// Reads the front matter keys the notebook uses. Values are strings, except tags and aliases, which are lists.
// Tags are an inline list (`tags: [a, b]`); aliases are a block list (`aliases:` then `  - Name` lines).
export function parseNote(text) {
  // Windows line endings (a file pasted in from elsewhere) would otherwise hide the front matter.
  text = text.replaceAll('\r\n', '\n');
  const data = { tags: [], aliases: [] };
  if (!text.startsWith('---\n')) return { data, body: text };
  const end = text.indexOf('\n---', 4);
  if (end === -1) return { data, body: text };
  const lines = text.slice(4, end).split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, value] = m;
    if (value.startsWith('[')) {
      data[key] = value.slice(1, value.lastIndexOf(']')).split(',').map(unquote).filter(Boolean);
    } else if (value === '') {
      const items = [];
      while (lines[i + 1]?.match(/^\s+-\s/)) items.push(unquote(lines[++i].replace(/^\s+-\s+/, '')));
      data[key] = items;
    } else {
      data[key] = unquote(value);
    }
  }
  const bodyStart = text.indexOf('\n', end + 1);
  return { data, body: bodyStart === -1 ? '' : text.slice(bodyStart + 1) };
}
