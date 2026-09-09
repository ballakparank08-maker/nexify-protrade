# Nexify ProTrade

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env file from the example:
   ```bash
   cp .env.example .env.local
   ```
3. Set `ADMIN_ALLOWED_EMAILS` and the admin login paths in `.env.local`.

## Run

- Frontend:
  ```bash
  npm run dev
  ```
- Backend auth server:
  ```bash
  npm run server
  ```

The admin login screen is only rendered when you directly open:

`http://localhost:3000/secure-admin-login` (or your configured `VITE_ADMIN_LOGIN_PATH`).

> The path is only obscurity. Real protection is enforced by backend session + `requireAdmin` + `ADMIN_ALLOWED_EMAILS` checks.

## Create or reset an admin account securely

Run the bootstrap command and enter the password interactively (input is hidden):

```bash
npm run admin:create -- --email admin@example.com
```

- This command writes only a hashed password to `server/data/users.json`.
- It can be rerun to rotate/reset an existing admin password.
- Never commit real administrator credentials to source control.

## Security model implemented

- No admin links are shown in member-facing UI.
- Member login uses `/api/auth/login` and cannot authenticate admin access.
- Admin login uses `/api/admin/login` with brute-force protection and generic failure messages.
- Auth state is server-side via HTTP-only cookie.
- Dashboard access is verified against `/api/admin/session` before rendering.
- Admin APIs return `401` when unauthenticated and `403` when non-admin or non-allowlisted.
- Logout clears the server session (`POST /api/auth/logout`).

## Validation commands

```bash
npm run lint
npm run test:backend
npm run build
```
