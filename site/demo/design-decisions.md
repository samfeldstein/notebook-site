---
title: Design Decisions
summary: "The choices behind the site and why I made them: plain Markdown as the source of truth, no framework, static pages, word search only, and failing closed."
tags: [docs, decisions]
created: 2026-10-27
updated: 2026-10-28
---

My notebook has lived in Obsidian, in Foam, and on a published Astro site. These are the choices that stuck, and why.

## The files are the source of truth

My notebook is a folder of Markdown files in Git. The site is a view of it, rebuilt on every push, and I never edit the site directly. If it disappeared tomorrow, I wouldn't lose anything.

## No framework

The build is one Node script and a Markdown parser. A framework would bring upgrades, a second set of format rules, and its own opinions about content. My earlier Astro site left a cleanup behind when I moved the notebook off it, and I didn't want that again.

## Read here, work elsewhere

The site is read-only and static. I write and organize on my computer, where [the CLI](the-notes-cli.md) and Claude Code can see the whole notebook. That keeps the site simple, free to host, and with nothing to break.

## Word search only

The site's search is word search, scored the same way as the CLI's. Search by meaning needs a language model, which would mean a server, a cost, and something to maintain, so I kept it in the CLI on the one computer that has the model. On my phone, words are enough.

## Fail closed

For my private version, a gap in the setup should mean nobody gets in, not that everyone does. See [Privacy and Hosting](privacy-and-hosting.md).

## One design

I used to have two designs with a switch between them. I kept only [Engineering Pad](the-design.md), and deleting the other one cut the stylesheet by about a quarter.
