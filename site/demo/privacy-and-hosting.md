---
title: Privacy and Hosting
summary: "The private version publishes only files Git tracks, sits behind Cloudflare Access, and turns everyone away if Access is ever misconfigured."
tags: [docs, privacy]
created: 2026-10-27
updated: 2026-10-28
---

My real notebook is private, so the site that shows it has three layers of protection. This demo uses none of them, since it's made of sample notes.

## Only tracked files are published

The build reads its file list from Git. Folders that Git ignores, such as import inboxes and data exports, can't reach the site even by accident, and a local build matches the one in the cloud.

## A login in front

The private site runs on Cloudflare Workers behind Cloudflare Access, so only I can sign in. How long a session lasts is set in Access.

## Fails closed

Access adds a signed token to every request it lets through. A small Worker checks that token's signature, app, issuer, and expiry before serving anything. If Access were ever turned off or misconfigured, the Worker would turn everyone away rather than let everyone in. The pages also ask search engines not to index them.

See [Building and Deploying](building-and-deploying.md) for the setup.
