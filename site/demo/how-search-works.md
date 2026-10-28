---
title: How Search Works
summary: "Word search in the browser, ranked so a match in the title beats a match in the body, with | for alternatives."
tags: [docs, search]
created: 2026-10-27
updated: 2026-10-28
---

[The Search page](/search/) searches every note and recipe in the browser, with no server. Every word typed has to appear somewhere in a note for it to match. Words match as parts of words too, so "link" also finds "backlinks."

## How results are ranked

Each word scores points for each place it appears:

| Where the word appears | Points |
|---|---|
| Title | 100 |
| An alias | 80 |
| A tag | 60 |
| The summary | 40 |
| The file name | 30 |
| The body | 1 per time, up to 10 |

A query of several words also earns a bonus when they appear together as a phrase, and an exact title match jumps to the top. Try [searching for "link"](/search/?q=link).

## Alternatives

Separate alternatives with `|`, with no spaces: `stuck|block|rut` matches a note with any of the three, and scores it by the best one. It saves trying synonyms one at a time.

## Highlights

Readwise and other highlights are searched only when "Include all highlights" is ticked, since there are far more of them than notes. Their index downloads only then. See [Readwise and Other Highlights](readwise-and-highlights.md).

## The same scoring as the command line

The site and [The Notes CLI](the-notes-cli.md) share one scoring file, so the same query ranks the same way in both. Why the site has no search by meaning is in [Design Decisions](design-decisions.md).
