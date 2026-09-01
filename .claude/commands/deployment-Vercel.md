---
description: Deploy this project (Vite frontend + Express/SQLite API) to Vercel
---

Deploy the "Interactive Treasure Box Game" to Vercel. Follow these steps in order and stop to ask the user if any step fails or requires a decision.

## 1. Pre-flight checks

- Run `git status`. If there are uncommitted changes, ask the user whether to commit them first — Vercel deployments from a Git integration deploy the pushed commit, not the working tree.
- Confirm the Vercel CLI is available: run `vercel --version`. If it's not installed, run `npm install -g vercel` (ask before installing globally) or use `npx vercel` for all subsequent commands instead.
- Confirm the production build works locally before deploying: run `npm run build` and check it completes without errors (output goes to `build/`).

## 2. Decide the deployment shape

This repo is a static Vite frontend plus a separate stateful Express/SQLite API (`server/index.js`, `server/data/game.db`). Vercel is built for static sites and stateless serverless functions — a long-running Express process with a SQLite file on local disk does **not** persist reliably across deployments/invocations there. Before deploying, check with the user which of these they want, since it changes the config:

- **Frontend-only on Vercel** (recommended, least work): deploy `build/` as a static site. Score-saving (`/api/*`) will not work unless the API is reachable elsewhere — either point the frontend at an externally-hosted API URL, or accept that guest play works but sign-in/score-save doesn't.
- **Full-stack on Vercel**: convert `server/routes/*` into Vercel serverless functions under `api/`, and replace the local SQLite file with a hosted DB Vercel functions can reach from a stateless environment (e.g. Vercel Postgres, Turso/libSQL, or another managed SQLite-over-HTTP service). This is a real migration, not just a config change — do not attempt it silently; propose a plan and get sign-off first.
- **Split deployment**: frontend on Vercel, API deployed separately (Railway, Render, Fly.io, a VM) where a persistent SQLite file is fine. Point `vercel.json` rewrites or the frontend's fetch base URL at that API's public URL.

Default to the frontend-only option unless the user says otherwise, since it requires no backend rework.

## 3. Configure Vercel for a Vite static build

If not already present, create a `vercel.json` in the project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "vite"
}
```

Adjust `outputDirectory` if the user's `vite.config.ts` `build.outDir` differs from `build/`.

If the user picked the **split deployment** option, also add rewrites so `/api/*` proxies to the externally hosted API, e.g.:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://<external-api-host>/api/:path*" }
  ]
}
```

Ask the user for `<external-api-host>` rather than guessing it.

## 4. Deploy

- First deploy as a preview to sanity-check: `vercel` (interactive) or `vercel --yes` if the user wants no prompts. This links the project to Vercel on first run (creates `.vercel/` locally — do not commit it; ensure it's gitignored).
- Once the preview looks correct, ship to production: `vercel --prod`.
- Report back the deployment URL(s) Vercel prints.

## 5. Post-deploy verification

- Open the deployed URL and confirm the game loads and a guest can play a full round (click a chest, see win/lose, reset).
- If auth/score-saving is expected to work in this deployment shape, sign up/log in and confirm a score persists — call out clearly if this is expected to fail per the shape chosen in step 2.

## Notes

- Never run `vercel --prod` without the user's go-ahead if this is the first production deploy for this project — confirm before making it live.
- Do not commit secrets: any DB connection string, auth secret, etc. needed for a full-stack or split deployment should be set via `vercel env add`, not hardcoded into `vercel.json` or source.
