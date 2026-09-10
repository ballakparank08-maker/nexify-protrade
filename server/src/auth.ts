import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { AuthConfig } from './config.js';
import type { DatabaseUserRow, SqliteDatabase } from './database.js';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: 'trader' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AuthSuccess {
  user: PublicUser;
  sessionToken: string;
}

export interface AdminBootstrapInput {
  name: string;
  email: string;
  password: string;
}

const PASSWORD_MIN_LENGTH = 8;
const BCRYPT_ROUNDS = 12;

const mapPublicUser = (row: Pick<DatabaseUserRow, 'id' | 'name' | 'email' | 'role' | 'created_at' | 'updated_at'>): PublicUser => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const hashSessionToken = (authSecret: string, token: string) => (
  crypto.createHmac('sha256', authSecret).update(token).digest('hex')
);

const createPasswordHash = (password: string) => bcrypt.hashSync(password, BCRYPT_ROUNDS);

const validateName = (name: string) => {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return 'Please enter your full name (at least 2 characters).';
  }
  return null;
};

const validatePassword = (password: string) => {
  if (password.trim().length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
  }
  return null;
};

const validateEmail = (email: string) => {
  const normalized = normalizeEmail(email);
  const atIndex = normalized.indexOf('@');
  const hasSingleAt = atIndex > 0 && atIndex === normalized.lastIndexOf('@');
  const localPart = hasSingleAt ? normalized.slice(0, atIndex) : '';
  const domainPart = hasSingleAt ? normalized.slice(atIndex + 1) : '';
  const isValidDomain =
    domainPart.length >= 3 &&
    domainPart.includes('.') &&
    !domainPart.startsWith('.') &&
    !domainPart.endsWith('.') &&
    !domainPart.includes('..');

  if (!localPart || !isValidDomain || normalized.includes(' ')) {
    return 'Please enter a valid email address.';
  }
  return null;
};

const createSession = (db: SqliteDatabase, config: AuthConfig, userId: string) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.sessionTtlHours * 60 * 60 * 1000).toISOString();
  const sessionToken = crypto.randomBytes(48).toString('base64url');
  const tokenHash = hashSessionToken(config.authSecret, sessionToken);

  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now.toISOString());
  db.prepare(`
    INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(crypto.randomUUID(), userId, tokenHash, expiresAt, now.toISOString(), now.toISOString());

  return sessionToken;
};

export const findUserByEmail = (db: SqliteDatabase, email: string) => {
  const normalizedEmail = normalizeEmail(email);
  return db.prepare<unknown[], DatabaseUserRow>('SELECT * FROM users WHERE email = ?').get(normalizedEmail) || null;
};

export const findUserBySessionToken = (db: SqliteDatabase, config: AuthConfig, sessionToken: string) => {
  const tokenHash = hashSessionToken(config.authSecret, sessionToken);
  const now = new Date().toISOString();
  const row = db.prepare<unknown[], DatabaseUserRow & { expires_at: string }>(`
    SELECT users.*,
           sessions.expires_at AS expires_at
    FROM sessions
    INNER JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(tokenHash, now);

  return row ? mapPublicUser(row) : null;
};

export const deleteSession = (db: SqliteDatabase, config: AuthConfig, sessionToken: string) => {
  const tokenHash = hashSessionToken(config.authSecret, sessionToken);
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
};

export const registerUser = (db: SqliteDatabase, config: AuthConfig, input: { name: string; email: string; password: string }) => {
  const nameError = validateName(input.name);
  if (nameError) {
    return { error: nameError, status: 400 as const };
  }

  const emailError = validateEmail(input.email);
  if (emailError) {
    return { error: emailError, status: 400 as const };
  }

  const passwordError = validatePassword(input.password);
  if (passwordError) {
    return { error: passwordError, status: 400 as const };
  }

  const normalizedEmail = normalizeEmail(input.email);
  if (findUserByEmail(db, normalizedEmail)) {
    return { error: 'An account with that email already exists.', status: 409 as const };
  }

  const now = new Date().toISOString();
  const userId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'trader', ?, ?)
  `).run(userId, input.name.trim(), normalizedEmail, createPasswordHash(input.password), now, now);

  const createdUser = db.prepare<unknown[], DatabaseUserRow>('SELECT * FROM users WHERE id = ?').get(userId);
  if (!createdUser) {
    throw new Error('Failed to create user.');
  }

  return {
    status: 201 as const,
    data: {
      user: mapPublicUser(createdUser),
      sessionToken: createSession(db, config, createdUser.id),
    },
  };
};

export const loginUser = (db: SqliteDatabase, config: AuthConfig, input: { email: string; password: string }) => {
  const normalizedEmail = normalizeEmail(input.email);
  const user = findUserByEmail(db, normalizedEmail);
  const invalidCredentials = { error: 'Invalid email or password.', status: 401 as const };

  if (!user) {
    return invalidCredentials;
  }

  const matches = bcrypt.compareSync(input.password, user.password_hash);
  if (!matches) {
    return invalidCredentials;
  }

  return {
    status: 200 as const,
    data: {
      user: mapPublicUser(user),
      sessionToken: createSession(db, config, user.id),
    },
  };
};

export const bootstrapAdminUser = (db: SqliteDatabase, input: AdminBootstrapInput) => {
  const nameError = validateName(input.name);
  const emailError = validateEmail(input.email);
  const passwordError = validatePassword(input.password);

  if (nameError || emailError || passwordError) {
    throw new Error(nameError || emailError || passwordError || 'Invalid admin bootstrap input.');
  }

  const normalizedEmail = normalizeEmail(input.email);
  const existing = findUserByEmail(db, normalizedEmail);
  if (existing) {
    if (existing.role !== 'admin') {
      throw new Error('The bootstrap email is already assigned to a non-admin account.');
    }
    return { created: false, user: mapPublicUser(existing) };
  }

  const now = new Date().toISOString();
  const userId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'admin', ?, ?)
  `).run(userId, input.name.trim(), normalizedEmail, createPasswordHash(input.password), now, now);

  const createdUser = db.prepare<unknown[], DatabaseUserRow>('SELECT * FROM users WHERE id = ?').get(userId);
  if (!createdUser) {
    throw new Error('Failed to create bootstrap admin account.');
  }

  return { created: true, user: mapPublicUser(createdUser) };
};
