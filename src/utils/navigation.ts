export const DEFAULT_ADMIN_LOGIN_PATH = '/secure-admin-login';
export const DEFAULT_ADMIN_DASHBOARD_PATH = '/secure-admin';
export const LEGACY_ADMIN_LOGIN_HASH = 'admin-login';

export type RouteIntent = 'landing' | 'admin-login' | 'admin-dashboard';

export const normalizePath = (path: string | null | undefined): string => {
  const trimmed = (path || '').trim();
  if (!trimmed || trimmed === '/') {
    return '/';
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const normalized = withLeadingSlash.replace(/\/+$/, '');

  return normalized || '/';
};

export const getRouteOverride = (search: string): string | null => {
  const route = new URLSearchParams(search).get('route');
  return route ? normalizePath(route) : null;
};

export const resolveRouteIntent = ({
  pathname,
  hash,
  search,
  adminLoginPath = DEFAULT_ADMIN_LOGIN_PATH,
  adminDashboardPath = DEFAULT_ADMIN_DASHBOARD_PATH,
}: {
  pathname: string;
  hash?: string;
  search?: string;
  adminLoginPath?: string;
  adminDashboardPath?: string;
}): RouteIntent => {
  const requestedPath = getRouteOverride(search || '') || normalizePath(pathname);
  const normalizedAdminLoginPath = normalizePath(adminLoginPath);
  const normalizedAdminDashboardPath = normalizePath(adminDashboardPath);
  const normalizedHash = hash?.replace(/^#/, '').trim().toLowerCase();

  if (requestedPath === normalizedAdminLoginPath || normalizedHash === LEGACY_ADMIN_LOGIN_HASH) {
    return 'admin-login';
  }

  if (requestedPath === normalizedAdminDashboardPath) {
    return 'admin-dashboard';
  }

  return 'landing';
};

export const getCanonicalPathForIntent = (
  intent: RouteIntent,
  adminLoginPath = DEFAULT_ADMIN_LOGIN_PATH,
  adminDashboardPath = DEFAULT_ADMIN_DASHBOARD_PATH,
): string => {
  if (intent === 'admin-login') {
    return normalizePath(adminLoginPath);
  }

  if (intent === 'admin-dashboard') {
    return normalizePath(adminDashboardPath);
  }

  return '/';
};
