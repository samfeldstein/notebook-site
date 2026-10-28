---
title: Building and Deploying
summary: "Build with Node in under a second, test with node --test, and deploy to Cloudflare Workers, with or without the login."
tags: [docs, setup]
created: 2026-10-27
updated: 2026-10-28
---

The whole site is one Node script with two dependencies, `marked` and `marked-footnote`. I didn't use a framework or a bundler. You'll need Node 22 or later.

## Build, test, and preview

From the `site/` folder:

```sh
npm install
node build.mjs --public
node --test test.mjs
npx wrangler dev --config wrangler.public.jsonc
```

`--public` builds this demo from `demo/`. Without it, the build reads my notebook one folder up and makes the private version. `--root=<folder>` points it at any notebook, and `--out=<folder>` changes where the pages go (`dist/` by default).

Each test builds a tiny notebook in a temporary folder, so a real notebook never gets touched. The Worker's token check is tested with keys made up on the spot. The last command keeps running to serve the preview; stop it with Ctrl-C.

## Deploy

Both versions are Cloudflare Workers, connected to a GitHub repository and deployed by Workers Builds on every push. My private version deploys from my private notebook, and this demo deploys from the public repository.

| Setting | Private | Public demo |
|---|---|---|
| Root directory | `site` | `site` |
| Build command | `npm ci && node build.mjs` | `npm ci && node build.mjs --public` |
| Deploy command | `npx wrangler deploy` | `npx wrangler deploy --config wrangler.public.jsonc` |
| Worker code | `worker.js` checks the Access token | None; static files only |
| Login | Cloudflare Access | None |

If you want the private version, turn on Access for the Worker's address, then put your own team domain and the Access app's AUD tag in `vars` in `wrangler.jsonc`. If they're empty or wrong, the Worker turns every request away. See [Privacy and Hosting](privacy-and-hosting.md).
