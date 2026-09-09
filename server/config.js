import dotenv from 'dotenv';

dotenv.config();

const normalizePath = (value, fallback) => {
  const raw = (value || fallback || '').trim();
  const stripped = raw.replace(/^\/+|\/+$/g, '');
  return `/${stripped || fallback.replace(/^\/+|\/+$/g, '')}`;
};

const normalizeEmail = (value) => value.trim().toLowerCase();

const parseAllowlist = (value) => {
  if (!value) return new Set();
  return new Set(
    value
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );
};

export const config = {
  port: Number(process.env.PORT || 4000),
  adminLoginPath: normalizePath(process.env.ADMIN_LOGIN_PATH, '/secure-admin-login'),
  adminAllowedEmails: parseAllowlist(process.env.ADMIN_ALLOWED_EMAILS),
  sessionCookieName: 'nexify_session',
  sessionTtlMs: 1000 * 60 * 60 * 12,
  isEmailAllowlisted(email) {
    return this.adminAllowedEmails.has(normalizeEmail(email));
  }
};

export { normalizeEmail };
