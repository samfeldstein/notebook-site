# Notebook Site

A read-only website for a notebook of plain Markdown files: notes with links and backlinks, tags, recipes with filters, saved highlights, and word search, in a design based on engineering computation paper.

It was built to read a private notebook on a phone. **The live demo** is built from sample notes that double as the documentation, and it's the best place to read them: https://notebook-site.samfeldstein.workers.dev

## What's interesting about it

- **No framework.** One Node script and a Markdown parser build the whole site in under a second.
- **Private by construction.** Only files Git tracks are published, so ignored folders can't leak, even by accident.
- **Fails closed.** The private version's Cloudflare Worker checks the Access login token itself, so a gap in the setup locks everyone out instead of letting everyone in.
- **One search, two places.** The site's browser search and the notebook's command-line tool share one scoring file, so a query ranks the same way in both.

## Shared, not supported

This is the code behind one person's notebook, published to read. It's MIT licensed, so copy or adapt anything. There's no support, pull requests aren't accepted, and it assumes that notebook's layout (recipes, Readwise, and other highlights).

This repository is a mirror. Work happens in the private notebook, and a GitHub Action copies the site's code and sample notes here on every push.

## Quick start

Needs Node 22 or later.

```sh
cd site
npm install
node build.mjs --public
node --test test.mjs
npx wrangler dev --config wrangler.public.jsonc
```

The last command keeps running to serve the preview; stop it with Ctrl-C.

## What's where

| Path | What it is |
|---|---|
| `site/build.mjs` | The build: Markdown in, static HTML out. |
| `site/demo/` | The sample notes, which are also the docs. Links to the site's own pages (like `/search/`) only work on the demo. |
| `site/static/` | The stylesheet, fonts, and the small scripts for search, filters, and contents. |
| `site/worker.js` | The private version's Cloudflare Worker, which checks the Access login token. |
| `site/test.mjs` | Tests for the build and the Worker. |
| `scripts/lib/` | Code shared with the notebook's command-line tool: front matter, links, and search scoring. |

Comments in the code sometimes mention `scripts.md`, the private notebook's own documentation, which isn't published. The demo notes cover the same ground.
