---
title: Welcome
summary: "What this site is: a read-only web version of my plain-Markdown notebook, shown here with sample notes that double as its docs."
tags: [docs, start-here]
created: 2026-10-27
updated: 2026-10-28
---

I keep my notebook as a folder of plain Markdown files, and this is the website I built so I could read it on my phone. My real notebook is private, so what you're looking at is the same site built from sample notes. Those sample notes are also the documentation, which means that clicking around is the best way to see how it all works.

## What I think is interesting about it

- **The files are the source of truth.** The site is just a read-only view, rebuilt every time I push. More in [Design Decisions](design-decisions.md).
- **No framework.** One Node script and a Markdown parser build the whole thing in under a second. More in [Building and Deploying](building-and-deploying.md).
- **Private by construction.** Only files Git tracks get published, and my private version checks its login token itself, so if I ever mess up the setup, it locks everyone out instead of letting everyone in. More in [Privacy and Hosting](privacy-and-hosting.md).
- **One search, two places.** The site and my notebook's command-line tool share one scoring file, so a search ranks the same way in both. More in [How Search Works](how-search-works.md).

## The guide

- [Writing a Note](writing-a-note.md): the front matter every note starts with.
- [Links and Backlinks](links-and-backlinks.md): how my notes point to each other.
- [Using Tags](using-tags.md): tag pages, and the pattern tags I use for ideas that cross topics.
- [How Search Works](how-search-works.md): how results get ranked.
- [Recipe Format](recipe-format.md): my recipes, which have their own format and filters.
- [Readwise and Other Highlights](readwise-and-highlights.md): passages I've saved from books, articles, PDFs, and newsletters.
- [The Design](the-design.md): Engineering Pad, and everything a note can contain.
- [Privacy and Hosting](privacy-and-hosting.md): how I keep the real one private.
- [Building and Deploying](building-and-deploying.md): how to run it yourself.
- [The Notes CLI](the-notes-cli.md): the command-line tool I use alongside the site.
- [Design Decisions](design-decisions.md): the choices behind the site, and why I made them.

## Shared, not supported

The code is public under the MIT license, so feel free to read it, copy it, or adapt it. Just know that I built it for my own notebook. I don't offer support or take pull requests, and it expects sections (recipes, Readwise, and other highlights) that your notebook probably doesn't have.
