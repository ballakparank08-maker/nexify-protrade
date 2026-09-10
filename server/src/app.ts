import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Request, type Response, type NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import type { CookieOptions } from 'express';
import { bootstrapAdminUser, deleteSession, findUserBySessionToken, loginUser, registerUser, type PublicUser } from './auth.js';
import type { AuthConfig } from './config.js';
import type { SqliteDatabase } from './database.js';

interface AuthenticatedRequest extends Request {
  authUser?: PublicUser;
  sessionToken?: string;
}

export interface AppDependencies {
  db: SqliteDatabase;
  config: AuthConfig;
}

const buildCookieOptions = (config: AuthConfig): CookieOptions => ({
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: config.cookieSameSite,
  maxAge: config.sessionTtlHours * 60 * 60 * 1000,
  path: '/',
});

const buildCorsMiddleware = (config: AuthConfig) => cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || config.frontendOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed by CORS'));
  },
});

const requireAuth = (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
  if (!request.authUser) {
    response.status(401).json({ message: 'Authentication required.' });
    return;
  }
  next();
};

const requireRole = (role: PublicUser['role']) => (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
  if (!request.authUser) {
    response.status(401).json({ message: 'Authentication required.' });
    return;
  }

  if (request.authUser.role !== role) {
    response.status(403).json({ message: 'You do not have permission to access this resource.' });
    return;
  }

  next();
};

export const createApp = ({ db, config }: AppDependencies) => {
  const app = express();
  const cookieOptions = buildCookieOptions(config);
  const authAttemptLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many authentication attempts. Please try again later.' },
  });
  const clearCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    path: '/',
  };

  app.use(buildCorsMiddleware(config));
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/auth', (request, response, next) => {
    response.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.use((request: AuthenticatedRequest, response, next) => {
    const sessionToken = request.cookies?.[config.cookieName];
    if (!sessionToken) {
      next();
      return;
    }

    const user = findUserBySessionToken(db, config, sessionToken);
    if (!user) {
      response.clearCookie(config.cookieName, clearCookieOptions);
      next();
      return;
    }

    request.authUser = user;
    request.sessionToken = sessionToken;
    next();
  });

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true });
  });

  app.post('/api/auth/register', authAttemptLimiter, (request, response) => {
    const result = registerUser(db, config, request.body ?? {});
    if ('error' in result) {
      response.status(result.status).json({ message: result.error });
      return;
    }

    response.cookie(config.cookieName, result.data.sessionToken, cookieOptions);
    response.status(result.status).json({ user: result.data.user });
  });

  app.post('/api/auth/login', authAttemptLimiter, (request, response) => {
    const email = typeof request.body?.email === 'string' ? request.body.email : '';
    const password = typeof request.body?.password === 'string' ? request.body.password : '';

    if (!email.trim() || !password) {
      response.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const result = loginUser(db, config, { email, password });
    if ('error' in result) {
      response.status(result.status).json({ message: result.error });
      return;
    }

    response.cookie(config.cookieName, result.data.sessionToken, cookieOptions);
    response.status(result.status).json({ user: result.data.user });
  });

  app.get('/api/auth/me', requireAuth, (request: AuthenticatedRequest, response) => {
    response.json({ user: request.authUser });
  });

  app.post('/api/auth/logout', (request: AuthenticatedRequest, response) => {
    if (request.sessionToken) {
      deleteSession(db, config, request.sessionToken);
    }
    response.clearCookie(config.cookieName, clearCookieOptions);
    response.json({ success: true });
  });

  app.get('/api/auth/admin/verify', requireAuth, requireRole('admin'), (request: AuthenticatedRequest, response) => {
    response.json({ authorized: true, user: request.authUser });
  });

  app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
    response.status(500).json({ message: config.nodeEnv === 'production' ? 'Internal server error.' : error.message });
  });

  if (config.adminBootstrapEmail && config.adminBootstrapName && config.adminBootstrapPassword) {
    bootstrapAdminUser(db, {
      name: config.adminBootstrapName,
      email: config.adminBootstrapEmail,
      password: config.adminBootstrapPassword,
    });
  }

  return app;
};
