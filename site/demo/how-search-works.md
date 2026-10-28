---
title: How Search Works
summary: "Word search in the browser, ranked so a match in the title beats a match in the body, with | for alternatives."
tags: [docs, search]
created: 2026-10-27
updated: 2026-10-28
---

[The Search page](/search/) searches every note and recipe right in the browser, with no server involved. Every word you type has to show up somewhere in a note for it to match. Words also match as parts of words, so "link" finds "backlinks" too.

## How results are ranked

Each word earns points for every place it shows up:

| Where the word appears | Points |
|---|---|
| Title | 100 |
| An alias | 80 |
| A tag | 60 |
| The summary | 40 |
| The file name | 30 |
| The body | 1 per time, up to 10 |

A search with several words also gets a bonus when they appear together as a phrase, and an exact title match jumps straight to the top. Try [searching for "link"](/search/?q=link).

## Alternatives

To search for alternatives, I separate them with `|` and no spaces: `stuck|block|rut` matches a note with any of the three and scores it by the best one. It saves me from trying synonyms one at a time.

## Highlights

My Readwise and other highlights only get searched when "Include all highlights" is ticked, since I have far more of them than notes. Their index only downloads then, too. See [Readwise and Other Highlights](readwise-and-highlights.md).

## The same scoring as the command line

The site and [The Notes CLI](the-notes-cli.md) share one scoring file, so the same search ranks the same way in both. Why I left search by meaning out of the site is in [Design Decisions](design-decisions.md).
