---
title: Using Tags
summary: "Each tag gets a page listing its notes. Pattern tags, like idea/atomic-parts, mark ideas that turn up across unrelated topics."
tags: [docs, tags, idea/atomic-parts]
created: 2026-10-27
updated: 2026-10-28
---

Tags go in the front matter as an inline list: `tags: [docs, tags]`. Every tag gets its own page, and [the tag index](/tags/) lists them all with a count and a filter box.

## Topic tags and pattern tags

Most tags name a topic, like `cooking` or `search`. A few are **pattern tags**, written with a slash: `idea/atomic-parts`. They mark an idea that turns up in notes on unrelated subjects, so a pattern tag's page reads like a thread through the notebook. Here, `idea/atomic-parts` connects this note, about splitting tags into parts, with [Writing a Note](writing-a-note.md), about keeping one idea per note. Follow the tag to see both.

## Rules the build enforces

- Tags that differ only in case, like `Foam` and `foam`, share one page, named with the spelling most notes use.
- Each tag becomes a folder on disk, so a tag can't contain a backslash, an empty part (`idea//x`), or a part that is only dots (`idea/..`). The build stops and names the note.
- Recipes have their own tags, used by the filters on [the Recipes page](/recipes/) rather than tag pages. See [Recipe Format](recipe-format.md).
