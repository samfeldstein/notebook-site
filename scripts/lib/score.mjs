// Word search scoring. Shared by the notes CLI (find) and the site's search page, which loads
// this file in the browser, so it has no imports.

// Scores each note against the query. Front matter matches outrank body matches, and every
// query word has to appear somewhere in the note.
// A query word can list alternatives with |, like "stuck|block|rut"; any one of them counts,
// and the best-scoring one is used. Every word still has to match somewhere in the note.
export function scoreNote(note, query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean).map((w) => w.split('|').filter(Boolean));
  const phrase = words.length > 1 && words.every((alts) => alts.length === 1) ? words.join(' ') : null;
  const fields = [
    ['title', 100, (note.data.title ?? '').toLowerCase()],
    ['alias', 80, note.data.aliases.join(' | ').toLowerCase()],
    ['tag', 60, note.data.tags.join(' ').toLowerCase()],
    ['summary', 40, (note.data.summary ?? '').toLowerCase()],
    ['id', 30, note.id.replaceAll('-', ' ').toLowerCase()],
  ];
  const body = note.body.toLowerCase();
  let score = 0;
  let bodyHits = 0;
  const why = new Set();
  for (const alts of words) {
    let best = null;
    for (const word of alts) {
      let wordScore = 0;
      const wordWhy = [];
      for (const [name, weight, value] of fields) {
        if (value.includes(word)) {
          wordScore += weight;
          wordWhy.push(name);
        }
      }
      const count = body.split(word).length - 1;
      wordScore += Math.min(count, 10);
      if ((wordWhy.length || count) && (!best || wordScore > best.score)) best = { score: wordScore, why: wordWhy, count, word };
    }
    if (!best) return null;
    score += best.score;
    bodyHits += best.count;
    for (const w of best.why) why.add(w);
    if (alts.length > 1) why.add(`"${best.word}"`);
  }
  if (bodyHits) why.add(`body ×${bodyHits}`);
  if (phrase) {
    for (const [, weight, value] of fields) if (value.includes(phrase)) score += weight;
    if (body.includes(phrase)) score += 20;
  }
  if (phrase !== null || words.length === 1) {
    const whole = words.map((a) => a[0]).join(' ');
    if (words.every((a) => a.length === 1) && (note.data.title ?? '').toLowerCase() === whole) score += 200;
  }
  return { score, why: [...why] };
}
