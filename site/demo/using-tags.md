---
title: Using Tags
summary: "Each tag gets a page listing its notes. I use pattern tags, like idea/atomic-parts, for ideas that turn up across unrelated topics."
tags: [docs, tags, idea/atomic-parts]
created: 2026-10-27
updated: 2026-10-28
---

Tags go in the front matter as an inline list: `tags: [docs, tags]`. Every tag gets its own page, and [the tag index](/tags/) lists them all, with a count and a filter box.

## Topic tags and pattern tags

Most of my tags name a topic, like `cooking` or `search`. A few are what I call **pattern tags**, written with a slash: `idea/atomic-parts`. I use them for an idea that keeps turning up in notes about unrelated things, so a pattern tag's page reads like a thread running through the notebook. Here, `idea/atomic-parts` connects this note, about splitting tags into parts, with [Writing a Note](writing-a-note.md), about keeping one idea per note. Follow the tag to see both.

## Rules the build enforces

- Tags that differ only in case, like `Foam` and `foam`, share a page, named with whichever spelling most notes use.
- Each tag becomes a folder on disk, so a tag can't have a backslash, an empty part (`idea//x`), or a part that's only dots (`idea/..`). If one does, the build stops and tells me which note it's in.
- Recipes have their own tags, which drive the filters on [the Recipes page](/recipes/) instead of getting tag pages. See [Recipe Format](recipe-format.md).
