<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Nexify ProTrade

Nexify ProTrade is a React 19 + Vite + TypeScript trading workstation prototype with a local TypeScript Express authentication backend.

## Architecture

- `src/` — frontend SPA and trading simulation UI
- `server/` — Express auth API with SQLite persistence and HTTP-only cookie sessions
- GitHub Pages can host only the frontend build. The backend must be deployed separately and exposed through `VITE_API_BASE_URL` in production.

## Environment

Copy `.env.example` to `.env` and update the values you need.

Important variables:

- `DATABASE_PATH` — SQLite database file used by the backend
- `AUTH_SECRET` — secret used to sign session token hashes
- `FRONTEND_ORIGIN` — allowed browser origin for backend CORS/cookie requests
- `VITE_API_BASE_URL` — production frontend API base URL (leave unset locally to use the Vite proxy)
- `ADMIN_BOOTSTRAP_*` — one-time admin creation values used by `npm run bootstrap:admin`

## Install

```bash
npm install
```

## Run locally

Frontend only:

```bash
npm run dev
```

Backend only:

```bash
npm run dev:server
```

Frontend + backend together:

```bash
npm run dev:full
```

Local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

## Bootstrap the initial admin

1. Set `ADMIN_BOOTSTRAP_NAME`, `ADMIN_BOOTSTRAP_EMAIL`, and `ADMIN_BOOTSTRAP_PASSWORD` in `.env`.
2. Run:

```bash
npm run bootstrap:admin
```

This creates the first admin account in SQLite if it does not already exist.

## Authentication API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/auth/admin/verify`

Passwords are hashed with bcryptjs. Sessions are stored server-side and restored with an HTTP-only cookie.

## Validation commands

Type check:

```bash
npm run lint
```

Backend auth tests:

```bash
npm test
```

Production builds:

```bash
npm run build
npm run build:server
```

## Deployment notes

- GitHub Pages deploys only the static frontend in `dist/`.
- Deploy `server/` separately to a Node-compatible host.
- In production, set `VITE_API_BASE_URL` to the backend origin, set `FRONTEND_ORIGIN` to the published frontend URL, and use `AUTH_COOKIE_SECURE=true`.
- For cross-site cookies, set `AUTH_COOKIE_SAME_SITE=none` and serve the backend over HTTPS.
