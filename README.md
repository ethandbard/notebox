# Notebox

A lightweight, self-hosted notes, to-do, and file-drop app — Notion and
Dropbox's basics combined, for personal/small-group use.

**Live**: [notebox.ethandbard.com](https://notebox.ethandbard.com) (sign-in required), listed on [ethandbard.com](https://ethandbard.com).

## Features

- **Tasks** — a checklist with a completed-items history you can reopen.
- **Notes** — sections holding markdown notes, with an edit/preview toggle.
- **Files** — a single shared drop folder: drag-and-drop or click to upload,
  list, download, delete.

## Stack

| Layer | Choice |
|---|---|
| Frontend | Vite + React + TypeScript + Tailwind CSS v4 |
| Backend | Node + Express (ESM, TypeScript via `tsx`) |
| Database | SQLite via `@libsql/client` + Drizzle ORM |
| Uploads | `multer`, stored on disk under `data/uploads` |
| Auth | Cloudflare Access in front of the hostname (email allow-list) — no
  app-level login. The server reads `Cf-Access-Authenticated-User-Email` for
  attribution only. |

Theme tokens (`client/src/index.css`) are lifted from ethandbard.com's
`theme-dark.scss` / `theme-light.scss`: IBM Plex Mono + Newsreader, phosphor
green accent, hairline borders. Each panel renders as a terminal window
(dot bar + path label), with a manual dark/light toggle in the header —
dark is phosphor-on-black, light is a warm paper tone rather than stark
white.

## Local development

```bash
npm install
npm run dev        # API on :4100, web on :5183
```

The client's Vite dev server proxies `/api` to `localhost:4100`. Migrations
run automatically on server start — no separate migrate step.

Other scripts: `npm run build`, `npm run typecheck`, `npm run db:generate`
(new migration from a schema change).

## Deployment

Docker Compose on the Hetzner VPS at `notebox.ethandbard.com`, behind the
shared Cloudflare tunnel — see the `deploy-to-hetzner` skill. The container
joins the `edge` network and publishes no host port; `config.env` (gitignored,
templated by `config.env.example`) holds runtime configuration.
