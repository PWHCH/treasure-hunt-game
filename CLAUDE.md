# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # install dependencies
npm run dev       # runs Vite (web, :3000) and the API server (:3001) concurrently
npm run server    # run only the API server (node server/index.js)
npm run build     # production build to build/
```

There is no test suite, linter, or type-check script configured in this project.

## Architecture

This is a React + TypeScript + Vite "Treasure Hunt" game with a small Express/SQLite backend for optional score persistence. The player clicks one of three chests, one of which contains treasure (+$100) and the other two skeletons (-$50). The game ends after the treasure is found or all three chests are opened. Playing is always available as a guest; signing in additionally saves scores.

### Frontend (`src/`)

- `src/main.tsx` — entry point, mounts `App` into `#root`.
- `src/App.tsx` — game state (`boxes`, `score`, `gameEnded`, `saveStatus`) via plain `useState`; no external state management or routing. Box outcomes are randomized in `initializeGame()`, called on mount and on reset. When a game ends and a user is signed in, the score is POSTed to `/api/scores`.
- `src/hooks/useAuth.ts` — owns auth state (`user`, `token`) for the whole app. Persists the session token in `localStorage` (`authToken`) and validates it against `/api/auth/me` on load. Exposes `signup`/`login`/`logout`, each calling the matching `/api/auth/*` endpoint directly with `fetch`.
- `src/components/AuthControls.tsx` — sign up/log in/log out UI, driven by `useAuth`.
- `src/assets/` — chest and key images used by the game.
- `src/audios/` — sound effects (chest open, chest open with evil laugh) referenced from `App.tsx`.
- `src/components/ui/` — a large shadcn/ui-style component library (Radix UI primitives + Tailwind). Most of these components are unused boilerplate scaffolding from the Figma/shadcn starter template; only `Button` is currently used by the game. Prefer reusing a component from here before adding a new UI dependency.
- `src/components/figma/ImageWithFallback.tsx` — image component that swallows load errors and renders a placeholder SVG instead of a broken image.
- `src/styles/globals.css` / `src/index.css` — Tailwind-based global styles.

### Backend (`server/`)

Plain Node/Express, no build step — run directly with `node`, no TypeScript.

- `server/index.js` — Express app entry point (port 3001). Mounts `/api/auth` and `/api/scores` routers, JSON body parsing, CORS, and a catch-all error handler.
- `server/db.js` — opens `server/data/game.db` via Node's built-in `node:sqlite` (`DatabaseSync`) and creates the `users`, `sessions`, and `scores` tables if they don't exist. `server/data/` is gitignored except for `.gitkeep`.
- `server/auth.js` — password hashing (`scrypt` + per-user salt) and bearer-token session helpers, including the `requireAuth` middleware used by protected routes.
- `server/routes/auth.js` — `POST /signup`, `POST /login`, `POST /logout`, `GET /me`. Sessions are opaque random tokens stored in the `sessions` table (no JWT).
- `server/routes/scores.js` — `POST /` (save a score, requires auth) and `GET /me` (list the signed-in user's recent scores + best).

In dev, Vite proxies `/api/*` to `http://localhost:3001` (see `server.proxy` in `vite.config.ts`), so the frontend always calls relative `/api/...` paths regardless of which port it's served from.

### Vite aliasing quirk

`vite.config.ts` maps versioned import specifiers (e.g. `radix-ui/react-dialog@1.1.6`) to their unversioned package names, matching the convention used by Figma-generated shadcn/ui component code. If new `ui/` components are pulled in from Figma Make with versioned imports, either keep using that import style (it will resolve via the alias) or add a corresponding alias entry — don't assume a bare `npm install <pkg>@<version>` import will resolve without one.

Path alias `@` resolves to `src/`.

## Styling conventions

Tailwind utility classes are used directly in JSX (no CSS modules or styled-components). The game's visual theme uses an amber/treasure color palette (`amber-50` through `amber-900`).
