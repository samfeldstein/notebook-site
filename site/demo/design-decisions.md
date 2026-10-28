---
title: Design Decisions
summary: "The choices behind the site and why: plain Markdown as the source of truth, no framework, static pages, word search only, and failing closed."
tags: [docs, decisions]
created: 2026-10-27
updated: 2026-10-28
---

The notebook has moved through Obsidian, Foam, and a published Astro site. These are the choices that stuck, and why.

## The files are the source of truth

The notebook is a folder of Markdown files in Git. The site is a view of it, rebuilt on every push, and never edited directly. If the site disappeared tomorrow, nothing would be lost.

## No framework

The build is one Node script and a Markdown parser. A framework would bring upgrades, a second set of format rules, and its own ideas about content. The earlier Astro site left a cleanup behind when the notebook moved off it.

## Read here, work elsewhere

The site is read-only and static. Writing and organizing happen on the computer, where [the CLI](the-notes-cli.md) and Claude Code have the whole notebook. That keeps the site simple, free to host, and with nothing to break.

## Word search only

The site's search is word search, scored the same way as the CLI's. Search by meaning needs a language model, which would mean a server, a cost, and something to maintain, so it stays in the CLI on the one computer that has the model. On a phone, words are enough.

## Fail closed

For the private version, a gap in the setup should mean nobody gets in, not that everyone does. See [Privacy and Hosting](privacy-and-hosting.md).

## One design

There used to be two designs with a switch between them. Only [Engineering Pad](the-design.md) was kept; deleting the other cut the stylesheet by about a quarter.
