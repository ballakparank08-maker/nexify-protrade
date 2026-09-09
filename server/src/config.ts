import path from 'node:path';

export type CookieSameSite = 'lax' | 'strict' | 'none';

export interface AuthConfig {
  port: number;
  nodeEnv: string;
  databasePath: string;
  authSecret: string;
  cookieName: string;
  cookieSecure: boolean;
  cookieSameSite: CookieSameSite;
  sessionTtlHours: number;
  frontendOrigins: string[];
  adminBootstrapName?: string;
  adminBootstrapEmail?: string;
  adminBootstrapPassword?: string;
}

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  return value === 'true';
};

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeOrigins = (origins: string | undefined, fallback: string) => {
  const raw = origins || fallback;
  return raw
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
};

export const loadConfig = (overrides: Partial<AuthConfig> = {}): AuthConfig => {
  const nodeEnv = overrides.nodeEnv ?? process.env.NODE_ENV ?? 'development';
  const cookieSecure = overrides.cookieSecure ?? parseBoolean(process.env.AUTH_COOKIE_SECURE, nodeEnv === 'production');
  const cookieSameSite = overrides.cookieSameSite ?? ((process.env.AUTH_COOKIE_SAME_SITE as CookieSameSite | undefined) ?? (cookieSecure ? 'none' : 'lax'));
  const authSecret = overrides.authSecret ?? process.env.AUTH_SECRET ?? (nodeEnv === 'production' ? '' : 'local-dev-auth-secret-change-me');

  if (!authSecret) {
    throw new Error('AUTH_SECRET must be configured.');
  }

  return {
    port: overrides.port ?? parseNumber(process.env.PORT, 3001),
    nodeEnv,
    databasePath: overrides.databasePath ?? process.env.DATABASE_PATH ?? path.resolve(process.cwd(), 'server/data/nexify-protrade.sqlite'),
    authSecret,
    cookieName: overrides.cookieName ?? process.env.AUTH_COOKIE_NAME ?? 'nexify_session',
    cookieSecure,
    cookieSameSite,
    sessionTtlHours: overrides.sessionTtlHours ?? parseNumber(process.env.SESSION_TTL_HOURS, 168),
    frontendOrigins: overrides.frontendOrigins ?? normalizeOrigins(process.env.FRONTEND_ORIGIN, 'http://localhost:3000'),
    adminBootstrapName: overrides.adminBootstrapName ?? process.env.ADMIN_BOOTSTRAP_NAME,
    adminBootstrapEmail: overrides.adminBootstrapEmail ?? process.env.ADMIN_BOOTSTRAP_EMAIL,
    adminBootstrapPassword: overrides.adminBootstrapPassword ?? process.env.ADMIN_BOOTSTRAP_PASSWORD,
  };
};
