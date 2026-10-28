---
title: Building and Deploying
summary: "Build with Node in under a second, test with node --test, and deploy to Cloudflare Workers, with or without the login."
tags: [docs, setup]
created: 2026-10-27
updated: 2026-10-28
---

The site is one Node script with two dependencies, `marked` and `marked-footnote`. There's no framework and no bundler. It needs Node 22 or later.

## Build, test, and preview

From the `site/` folder:

```sh
npm install
node build.mjs --public
node --test test.mjs
npx wrangler dev --config wrangler.public.jsonc
```

`--public` builds this demo from `demo/`. Without it, the build reads the notebook one folder up and makes the private version. `--root=<folder>` points it at any notebook, and `--out=<folder>` changes where the pages go (`dist/` by default).

Each test builds a tiny notebook in a temporary folder, so a real notebook is never touched. The Worker's token check is tested with keys made up on the spot. The last command keeps running to serve the preview; stop it with Ctrl-C.

## Deploy

Both versions are Cloudflare Workers, connected to a GitHub repository and deployed on every push by Workers Builds. The private version deploys from the private notebook; this demo deploys from the public repository.

| Setting | Private | Public demo |
|---|---|---|
| Root directory | `site` | `site` |
| Build command | `npm ci && node build.mjs` | `npm ci && node build.mjs --public` |
| Deploy command | `npx wrangler deploy` | `npx wrangler deploy --config wrangler.public.jsonc` |
| Worker code | `worker.js` checks the Access token | None; static files only |
| Login | Cloudflare Access | None |

For the private version, turn on Access for the Worker's address, then fill in your own team domain and the Access app's AUD tag in `vars` in `wrangler.jsonc`. If they're empty or wrong, the Worker turns every request away. See [Privacy and Hosting](privacy-and-hosting.md).
