---
title: Writing a Note
summary: "A note is one Markdown file with a short front matter block: title, summary, tags, and dates. The file name is its id."
tags: [docs, notes, idea/atomic-parts]
aliases:
  - Front Matter
created: 2026-10-27
updated: 2026-10-28
---

Every note is one Markdown file at the top of the notebook. Its file name, without `.md`, is its id and its address: `writing-a-note.md` is served at `/writing-a-note/`.

## Front matter

A note opens with a block of YAML between two `---` lines:

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
| `title` | The page heading, and the name in every list. Without one, the file name is used. |
| `summary` | The Description in the title block, and the line under the title in lists. |
| `tags` | An inline list. Each tag links to a page of every note with it. See [Using Tags](using-tags.md). |
| `aliases` | Other names for the note, as a block list. Search matches them. |
| `created`, `updated` | Dates as YYYY-MM-DD. The title block shows `updated`, or `created` if there's no `updated`. The home page lists the most recently updated notes. |

The site reads only these keys. Anything else in the front matter is ignored.

## File names the site keeps for itself

A note can't be named `notes`, `recipes`, `tags`, `search`, `readwise`, `highlights`, `static`, or `404`, since the site uses those addresses for its own pages. The build stops and names the note.

## The body

The rest is ordinary Markdown, with GitHub's extras: tables, task lists, and footnotes. [The Design](the-design.md) shows each one. The title is the page's only top-level heading, so sections start at `##`. A note with two or more section headings gets a numbered contents box, and on a wide screen it moves to a column beside the text. Recipes and highlights don't get one.

## One idea per note

I keep notes small, one idea each, and link them to each other rather than letting them grow into long documents. That's what makes [Links and Backlinks](links-and-backlinks.md) useful.
