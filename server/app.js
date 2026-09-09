import express from 'express';
import { randomBytes } from 'node:crypto';
import { config, normalizeEmail } from './config.js';
import { userStore } from './userStore.js';

const sessionStore = new Map();
const adminLoginAttempts = new Map();

const ADMIN_MAX_ATTEMPTS = 5;
const ADMIN_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_LOCK_MS = 15 * 60 * 1000;

const serializeCookie = (name, value, options = {}) => {
  const cookieParts = [`${name}=${value}`];
  if (options.httpOnly) cookieParts.push('HttpOnly');
  if (options.sameSite) cookieParts.push(`SameSite=${options.sameSite}`);
  if (options.path) cookieParts.push(`Path=${options.path}`);
  if (options.maxAge !== undefined) cookieParts.push(`Max-Age=${options.maxAge}`);
  if (options.secure) cookieParts.push('Secure');
  return cookieParts.join('; ');
};

const parseCookies = (rawCookie = '') => {
  return rawCookie
    .split(';')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce((cookies, segment) => {
      const separator = segment.indexOf('=');
      if (separator === -1) return cookies;
      const key = segment.slice(0, separator);
      const value = segment.slice(separator + 1);
      cookies[key] = decodeURIComponent(value);
      return cookies;
    }, {});
};

const clearSessionCookie = (res) => {
  res.setHeader(
    'Set-Cookie',
    serializeCookie(config.sessionCookieName, '', {
      httpOnly: true,
      sameSite: 'Strict',
      path: '/',
      maxAge: 0,
      secure: process.env.NODE_ENV === 'production'
    })
  );
};

const createSession = (user) => {
  const token = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + config.sessionTtlMs;
  sessionStore.set(token, {
    token,
    userId: user.id,
    email: user.email,
    role: user.role,
    expiresAt
  });
  return { token, expiresAt };
};

const setSessionCookie = (res, token) => {
  res.setHeader(
    'Set-Cookie',
    serializeCookie(config.sessionCookieName, token, {
      httpOnly: true,
      sameSite: 'Strict',
      path: '/',
      maxAge: Math.floor(config.sessionTtlMs / 1000),
      secure: process.env.NODE_ENV === 'production'
    })
  );
};

const getRequestIp = (req) =>
  (req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.socket.remoteAddress || 'unknown').toLowerCase();

const getAdminAttemptKey = (req, email) => `${getRequestIp(req)}:${normalizeEmail(email || 'unknown')}`;

const canAttemptAdminLogin = (req, email) => {
  const key = getAdminAttemptKey(req, email);
  const now = Date.now();
  const record = adminLoginAttempts.get(key);

  if (!record) {
    return { allowed: true, key };
  }

  if (record.lockUntil && record.lockUntil > now) {
    return { allowed: false, key, retryAfterMs: record.lockUntil - now };
  }

  if (record.windowStart + ADMIN_WINDOW_MS < now) {
    adminLoginAttempts.delete(key);
    return { allowed: true, key };
  }

  return { allowed: true, key };
};

const recordAdminLoginFailure = (key) => {
  const now = Date.now();
  const current = adminLoginAttempts.get(key);
  if (!current || current.windowStart + ADMIN_WINDOW_MS < now) {
    adminLoginAttempts.set(key, { count: 1, windowStart: now, lockUntil: null });
    return;
  }

  const nextCount = current.count + 1;
  adminLoginAttempts.set(key, {
    count: nextCount,
    windowStart: current.windowStart,
    lockUntil: nextCount >= ADMIN_MAX_ATTEMPTS ? now + ADMIN_LOCK_MS : null
  });
};

const clearAdminAttemptRecord = (key) => {
  adminLoginAttempts.delete(key);
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createApp = () => {
  const app = express();
  app.use(express.json());

  app.get('/api/config/admin-login-path', (_req, res) => {
    res.json({ adminLoginPath: config.adminLoginPath });
  });

  app.use((req, _res, next) => {
    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies[config.sessionCookieName];

    if (!token) {
      req.authSession = null;
      return next();
    }

    const session = sessionStore.get(token);
    if (!session || session.expiresAt <= Date.now()) {
      sessionStore.delete(token);
      req.authSession = null;
      return next();
    }

    req.authSession = session;
    return next();
  });

  const requireAuth = async (req, res, next) => {
    if (!req.authSession) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const user = await userStore.findUserByEmail(req.authSession.email);
    if (!user) {
      sessionStore.delete(req.authSession.token);
      clearSessionCookie(res);
      return res.status(401).json({ error: 'Authentication required.' });
    }

    req.authUser = user;
    return next();
  };

  const requireAdmin = (req, res, next) => {
    if (!req.authUser || req.authUser.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (!config.isEmailAllowlisted(req.authUser.email)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    return next();
  };

  app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body || {};
    const cleanEmail = normalizeEmail(String(email || ''));
    const cleanName = String(name || '').trim();
    const cleanPassword = String(password || '');

    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
    }

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (cleanPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    try {
      const user = await userStore.createUser({ email: cleanEmail, password: cleanPassword, name: cleanName, role: 'trader' });
      const session = createSession(user);
      setSessionCookie(res, session.token);
      return res.status(201).json({ user });
    } catch {
      return res.status(409).json({ error: 'An account with that email already exists. Please sign in instead.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body || {};
    const cleanEmail = normalizeEmail(String(email || ''));
    const cleanPassword = String(password || '');

    const user = await userStore.verifyCredentials(cleanEmail, cleanPassword);
    if (!user || user.role !== 'trader') {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const session = createSession(user);
    setSessionCookie(res, session.token);
    return res.json({ user: userStore.sanitizeUser(user) });
  });

  app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body || {};
    const cleanEmail = normalizeEmail(String(email || ''));
    const cleanPassword = String(password || '');
    const attempt = canAttemptAdminLogin(req, cleanEmail);

    if (!attempt.allowed) {
      res.setHeader('Retry-After', String(Math.ceil((attempt.retryAfterMs || 0) / 1000)));
      return res.status(429).json({ error: 'Invalid email or password.' });
    }

    const user = await userStore.verifyCredentials(cleanEmail, cleanPassword);
    if (!user || user.role !== 'admin') {
      recordAdminLoginFailure(attempt.key);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!config.isEmailAllowlisted(cleanEmail)) {
      recordAdminLoginFailure(attempt.key);
      return res.status(403).json({ error: 'Access denied.' });
    }

    clearAdminAttemptRecord(attempt.key);
    const session = createSession(user);
    setSessionCookie(res, session.token);
    return res.json({ user: userStore.sanitizeUser(user) });
  });

  app.get('/api/auth/me', requireAuth, async (req, res) => {
    return res.json({ user: userStore.sanitizeUser(req.authUser) });
  });

  app.get('/api/admin/session', requireAuth, requireAdmin, (req, res) => {
    return res.json({ user: userStore.sanitizeUser(req.authUser) });
  });

  app.get('/api/admin/protected', requireAuth, requireAdmin, (_req, res) => {
    return res.json({ status: 'ok' });
  });

  app.post('/api/auth/logout', (req, res) => {
    if (req.authSession?.token) {
      sessionStore.delete(req.authSession.token);
    }
    clearSessionCookie(res);
    return res.status(204).send();
  });

  return app;
};
