---
title: Welcome
summary: "What this site is: a read-only web version of a plain-Markdown notebook, shown here with sample notes that double as its docs."
tags: [docs, start-here]
created: 2026-10-27
updated: 2026-10-28
---

This is the web version of a notebook kept as a folder of plain Markdown files. The real notebook is private and read mostly on a phone. This copy is built from sample notes instead, and those notes are also the documentation, so browsing the site shows how it works.

## What's interesting about it

- **The files are the source of truth.** The site is a read-only view, rebuilt on every push. See [Design Decisions](design-decisions.md).
- **No framework.** One Node script and a Markdown parser build the whole site in under a second. See [Building and Deploying](building-and-deploying.md).
- **Private by construction.** Only files Git tracks are published, and the private version checks its login token itself, so a gap in the setup locks everyone out instead of letting everyone in. See [Privacy and Hosting](privacy-and-hosting.md).
- **One search, two places.** The site and the notebook's command-line tool share one scoring file, so a query ranks the same way in both. See [How Search Works](how-search-works.md).

## The guide

- [Writing a Note](writing-a-note.md): the front matter every note starts with.
- [Links and Backlinks](links-and-backlinks.md): how notes point to each other.
- [Using Tags](using-tags.md): tag pages, and pattern tags for ideas that cross topics.
- [How Search Works](how-search-works.md): how results are ranked.
- [Recipe Format](recipe-format.md): a section with its own format and filters.
- [Readwise and Other Highlights](readwise-and-highlights.md): saved passages from books, articles, PDFs, and newsletters.
- [The Design](the-design.md): Engineering Pad, and everything a note can contain.
- [Privacy and Hosting](privacy-and-hosting.md): how the real one stays private.
- [Building and Deploying](building-and-deploying.md): running it yourself.
- [The Notes CLI](the-notes-cli.md): the command-line tool that works alongside the site.
- [Design Decisions](design-decisions.md): the choices behind the site, and why.

## Shared, not supported

The code is public under the MIT license, free to read, copy, or adapt. It's built for one specific notebook, so there's no support, and pull requests aren't accepted. It expects sections (recipes, Readwise, and other highlights) that other notebooks won't share.
