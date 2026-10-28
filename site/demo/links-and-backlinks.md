---
title: Links and Backlinks
summary: "My notes link with standard Markdown links, relative to the file. The site turns them into page addresses and lists backlinks under each note."
tags: [docs, links]
created: 2026-10-27
updated: 2026-10-28
---

I link notes with standard Markdown links, using the note's title as the text and its file as the target: `[Writing a Note](writing-a-note.md)`. Since they're plain relative links between files, they work in any Markdown editor too, not just here.

## What the build does with a link

- **To a note:** it points to that note's page, like this link to [How Search Works](how-search-works.md).
- **To a section:** I add the heading's id, as in [the front matter table](writing-a-note.md#front-matter).
- **From a recipe:** recipes sit two folders down, so a link back to a note starts with `../../`, like the one in [Tomato Soup](recipes/soups/tomato-soup.md).
- **To a note I haven't written yet:** it shows up as plain muted text instead of a link, like [A Note Not Written Yet](not-written-yet.md). Hover over it and it tells you.
- **To an attachment,** like an image or a PDF: the file only gets published if a page links to it and Git tracks it, like the [design sketch](assets/title-block.svg) in [The Design](the-design.md). Anything else shows as muted text marked "Not published," like this [screen recording](assets/walkthrough.mp4), which isn't in the repository.
- **To another site:** a small arrow marks it, like this link to [CommonMark](https://commonmark.org).
- **To the site's own pages:** a link that starts with `/`, like [the tag index](/tags/), passes through untouched.

## Backlinks

At the bottom of every note is a list of the notes that link to it. Scroll to the end of [How Search Works](how-search-works.md) to see a few. Backlinks are what make links worth writing for me: one link shows up on both notes.

## Wikilinks

Readwise exports `[[double bracket]]` links, so the build resolves those by file name anywhere in the notebook. That lets my highlights link into my notes, the way [Walden](readwise/walden.md) does. My own notes stick to standard links.
