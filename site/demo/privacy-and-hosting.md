---
title: Privacy and Hosting
summary: "My private version publishes only files Git tracks, sits behind Cloudflare Access, and turns everyone away if Access is ever misconfigured."
tags: [docs, privacy]
created: 2026-10-27
updated: 2026-10-28
---

My real notebook is private, so the site that shows it has three layers of protection. This demo doesn't use any of them, since it's all sample notes.

## Only tracked files are published

The build gets its list of files from Git. Folders Git ignores, like my import inboxes and data exports, can't end up on the site even by accident, and a build on my computer matches the one in the cloud.

## A login in front

My private site runs on Cloudflare Workers behind Cloudflare Access, so I'm the only one who can sign in. How long I stay signed in is a setting in Access.

## Fails closed

Access adds a signed token to every request it lets through. A small Worker checks that token's signature, app, issuer, and expiry before it serves anything. If Access ever got turned off or misconfigured, the Worker would turn everyone away rather than let everyone in. The pages also ask search engines not to index them.

The setup is in [Building and Deploying](building-and-deploying.md).
