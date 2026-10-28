---
title: Writing a Note
summary: "Each of my notes is one Markdown file with a short front matter block: title, summary, tags, and dates. The file name is its id."
tags: [docs, notes, idea/atomic-parts]
aliases:
  - Front Matter
created: 2026-10-27
updated: 2026-10-28
---

Each note is one Markdown file at the top of my notebook. Its file name, minus the `.md`, is both its id and its address, so `writing-a-note.md` ends up at `/writing-a-note/`.

## Front matter

Every note opens with a block of YAML between two `---` lines:

```yaml
---
title: Writing a Note
summary: "One line saying what the note is about."
tags: [docs, notes]
aliases:
  - Front Matter
created: 2026-10-27
updated: 2026-10-28
---
```

| Key | What it does on the site |
|---|---|
| `title` | The page heading, and the name in every list. If I leave it out, the site uses the file name. |
| `summary` | The Description in the title block, and the line under the title in lists. |
| `tags` | An inline list. Each tag links to a page of every note that has it. See [Using Tags](using-tags.md). |
| `aliases` | Other names for the note, as a block list. Search matches them. |
| `created`, `updated` | Dates as YYYY-MM-DD. The title block shows `updated`, or `created` if there's no `updated`. The home page lists whatever I updated most recently. |

The site only reads these keys and ignores anything else in the front matter.

## File names the site keeps for itself

I can't name a note `notes`, `recipes`, `tags`, `search`, `readwise`, `highlights`, `static`, or `404`, because the site uses those addresses for its own pages. If I try, the build stops and tells me which note it was.

## The body

Everything after the front matter is ordinary Markdown, plus GitHub's extras: tables, task lists, and footnotes. [The Design](the-design.md) shows each of them. The title is the page's only top-level heading, so sections start at `##`. Once a note has two or more section headings, it gets a numbered contents box, which moves into a column beside the text on a wide screen. Recipes and highlights don't get one.

## One idea per note

I try to keep each note small, about one idea, and link it to others instead of letting it grow into a long document. That's what makes [Links and Backlinks](links-and-backlinks.md) worth having.
