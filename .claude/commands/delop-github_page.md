---
description: Deploy this project (Vite frontend) to GitHub Pages
---

Deploy the "Interactive Treasure Box Game" to GitHub Pages using the existing GitHub Actions workflow. Follow these steps in order and stop to ask the user if any step fails or requires a decision.

## 1. Pre-flight checks

- Run `git status`. If there are uncommitted changes, ask the user whether to commit them first — GitHub Pages deploys the pushed commit, not the working tree.
- Confirm `.github/workflows/deploy-pages.yml` exists. This repo already ships one that builds with `npm run build` (output `build/`) and publishes it via `actions/upload-pages-artifact` + `actions/deploy-pages`, triggered on push to `main` (and `workflow_dispatch`). Only add/modify a workflow if it's missing or broken — don't recreate it if it already works.
- Confirm the production build works locally before pushing: run `npm run build` and check it completes without errors.
- Note that `vite.config.ts` already sets `base: './'`, which is correct for a GitHub Pages project site (`https://<owner>.github.io/<repo>/`) — do not change it to an absolute base.

## 2. Ensure a GitHub remote exists

- Run `git remote -v`. If no remote is configured, this repo hasn't been pushed to GitHub yet.
- Check whether the `gh` CLI is available (`gh --version`). If it is and the user is authenticated (`gh auth status`), you can create the repo directly: `gh repo create <owner>/<repo> --public --source=. --remote=origin` (ask the user for visibility — public vs private — since Pages requires a public repo unless the account has GitHub Pro/Enterprise for private Pages).
- If `gh` is not available, ask the user for the GitHub repository URL (or ask them to create an empty repo on github.com first), then add it: `git remote add origin <url>`.
- Never create or push to a repo without the user confirming the target owner/name — this is a shared, externally-visible action.

## 3. Push to GitHub

- Push the current branch to `main` on `origin`: `git push -u origin main` (or `HEAD:main` if the local branch isn't named `main`).
- If this is the first push, this alone will kick off the `Deploy to GitHub Pages` workflow via the `push` trigger.

## 4. Enable GitHub Pages (one-time, first deploy only)

- GitHub Pages must have its source set to **GitHub Actions** before the workflow's `actions/deploy-pages` step can publish successfully. If this is the first deploy for this repo, tell the user to check: repo → **Settings → Pages → Build and deployment → Source = GitHub Actions**. If `gh` is available you can check/set this via `gh api repos/<owner>/<repo>/pages` (GET to check, POST to create with `{"build_type":"workflow"}` if it 404s).
- If Pages was never enabled and you can't tell via API, ask the user to enable it once in the Settings UI, then re-run the workflow.

## 5. Watch the deployment

- If `gh` is available: `gh run watch` (or `gh run list --workflow=deploy-pages.yml` then `gh run watch <run-id>`) to follow the build/deploy job to completion.
- Otherwise, ask the user to check the **Actions** tab on GitHub, or poll `gh api repos/<owner>/<repo>/pages/builds/latest` if `gh` becomes available.

## 6. Report the URL

- Once the `deploy` job succeeds, the live URL is `https://<owner>.github.io/<repo>/` (also printed as the `page_url` output of the `deploy-pages` step, and visible under Settings → Pages).
- Give this URL back to the user and note that score-saving (`/api/*`) will **not** work on GitHub Pages — it only serves static files, so the Express/SQLite backend isn't deployed. Guest play works fully; sign-in/score-save requires the API to be hosted elsewhere (see `deployment-Vercel` for one path, or any other Node host for `server/`).
