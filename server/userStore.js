import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { normalizeEmail } from './config.js';

const scrypt = promisify(scryptCallback);
const dbPath = path.resolve(process.cwd(), 'server/data/users.json');

const ensureDbFile = async () => {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  try {
    await fs.access(dbPath);
  } catch {
    await fs.writeFile(dbPath, JSON.stringify({ users: [] }, null, 2));
  }
};

const readDb = async () => {
  await ensureDbFile();
  const raw = await fs.readFile(dbPath, 'utf-8');
  const parsed = JSON.parse(raw || '{"users":[]}');
  if (!Array.isArray(parsed.users)) {
    return { users: [] };
  }
  return parsed;
};

const writeDb = async (db) => {
  await fs.writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, 'utf-8');
};

const hashPassword = async (password) => {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${Buffer.from(derived).toString('hex')}`;
};

const verifyPasswordHash = async (password, passwordHash) => {
  const [salt, expectedHex] = String(passwordHash || '').split(':');
  if (!salt || !expectedHex) {
    return false;
  }

  const derived = await scrypt(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(derived), expected);
};

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const findUserByEmailInternal = (users, email) => {
  const normalized = normalizeEmail(email);
  return users.find((user) => user.email === normalized) || null;
};

export const userStore = {
  normalizeEmail,
  async listUsers() {
    const db = await readDb();
    return db.users.map(sanitizeUser);
  },
  async findUserByEmail(email) {
    const db = await readDb();
    return findUserByEmailInternal(db.users, email);
  },
  async verifyCredentials(email, password) {
    const user = await this.findUserByEmail(email);
    if (!user) {
      return null;
    }

    const valid = await verifyPasswordHash(password, user.passwordHash);
    if (!valid) {
      return null;
    }

    return user;
  },
  async createUser({ email, name, password, role = 'trader' }) {
    const db = await readDb();
    const normalizedEmail = normalizeEmail(email);
    if (findUserByEmailInternal(db.users, normalizedEmail)) {
      throw new Error('User already exists');
    }

    const now = new Date().toISOString();
    const user = {
      id: `usr-${randomBytes(8).toString('hex')}`,
      email: normalizedEmail,
      name: name.trim(),
      role,
      passwordHash: await hashPassword(password),
      createdAt: now,
      updatedAt: now
    };

    db.users.push(user);
    await writeDb(db);
    return sanitizeUser(user);
  },
  async upsertAdmin({ email, name, password }) {
    const db = await readDb();
    const normalizedEmail = normalizeEmail(email);
    const now = new Date().toISOString();
    const existing = findUserByEmailInternal(db.users, normalizedEmail);

    if (existing) {
      existing.name = name.trim();
      existing.role = 'admin';
      existing.passwordHash = await hashPassword(password);
      existing.updatedAt = now;
      await writeDb(db);
      return sanitizeUser(existing);
    }

    const user = {
      id: `usr-${randomBytes(8).toString('hex')}`,
      email: normalizedEmail,
      name: name.trim(),
      role: 'admin',
      passwordHash: await hashPassword(password),
      createdAt: now,
      updatedAt: now
    };
    db.users.push(user);
    await writeDb(db);
    return sanitizeUser(user);
  },
  sanitizeUser
};
