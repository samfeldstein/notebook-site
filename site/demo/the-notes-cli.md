---
title: The Notes CLI
summary: "The command-line tool I use alongside the site, for search by meaning, links, and convention checks. It isn't part of this repository."
tags: [docs, cli]
created: 2026-10-27
updated: 2026-10-28
---

The site is for reading. I write on my computer, mostly through Claude Code, with a command-line tool for the notebook. The tool isn't included here, since it needs a language model of over 100 MB and is shaped around my notebook, but the site shares its code for reading front matter, resolving links, and scoring search.

## What it does

| Command | What it does |
|---|---|
| `find <words or a description>` | Ranked search by words and meaning together, so it finds exact names and vague descriptions alike, in about a third of a second. |
| `similar <note>` | Notes close in meaning to a note, for finding links not yet made. |
| `links <note>` | A note's backlinks and outgoing links. |
| `check` | Convention problems: missing summaries, broken links, misplaced headings, and front matter written the wrong way. |
| `rename <old> <new>` | Renames a note and rewrites every link to it. |

## Search by meaning

The meaning half embeds each note with a small local model and compares it with the query, so it works offline. The word half scores exactly like [the site's search](how-search-works.md).
