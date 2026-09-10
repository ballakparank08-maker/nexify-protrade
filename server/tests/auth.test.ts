import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import request from 'supertest';
import { bootstrapAdminUser } from '../src/auth.js';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { openDatabase } from '../src/database.js';

const createTestContext = () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexify-auth-'));
  const databasePath = path.join(tempDir, 'auth.sqlite');
  const config = loadConfig({
    nodeEnv: 'test',
    authSecret: 'test-auth-secret',
    databasePath,
    frontendOrigins: ['http://localhost:3000'],
    cookieSecure: false,
    cookieSameSite: 'lax',
    sessionTtlHours: 24,
    cookieName: 'nexify_session',
  });
  const db = openDatabase(databasePath);
  const app = createApp({ db, config });

  return {
    app,
    db,
    cleanup() {
      db.close();
      fs.rmSync(tempDir, { recursive: true, force: true });
    },
  };
};

test('register creates a hashed-password user and active session', async () => {
  const context = createTestContext();
  try {
    const agent = request.agent(context.app);
    const registerResponse = await agent
      .post('/api/auth/register')
      .send({ name: 'Alice Trader', email: 'Alice@example.com', password: 'Password123!' });

    assert.equal(registerResponse.status, 201);
    assert.equal(registerResponse.body.user.email, 'alice@example.com');
    assert.equal(registerResponse.body.user.role, 'trader');

    const row = context.db.prepare('SELECT email, password_hash FROM users WHERE email = ?').get('alice@example.com') as { email: string; password_hash: string };
    assert.equal(row.email, 'alice@example.com');
    assert.notEqual(row.password_hash, 'Password123!');
    assert.match(row.password_hash, /^\$2[aby]\$/);

    const meResponse = await agent.get('/api/auth/me');
    assert.equal(meResponse.status, 200);
    assert.equal(meResponse.body.user.email, 'alice@example.com');
  } finally {
    context.cleanup();
  }
});

test('duplicate registration is rejected', async () => {
  const context = createTestContext();
  try {
    const agent = request.agent(context.app);
    await agent
      .post('/api/auth/register')
      .send({ name: 'Alice Trader', email: 'alice@example.com', password: 'Password123!' })
      .expect(201);

    const duplicateResponse = await request(context.app)
      .post('/api/auth/register')
      .send({ name: 'Alice Trader', email: 'ALICE@example.com', password: 'Password123!' });

    assert.equal(duplicateResponse.status, 409);
    assert.match(duplicateResponse.body.message, /already exists/i);
  } finally {
    context.cleanup();
  }
});

test('login succeeds with valid credentials and fails generically with invalid credentials', async () => {
  const context = createTestContext();
  try {
    await request(context.app)
      .post('/api/auth/register')
      .send({ name: 'Bob Trader', email: 'bob@example.com', password: 'Password123!' })
      .expect(201);

    const successAgent = request.agent(context.app);
    const loginResponse = await successAgent
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'Password123!' });

    assert.equal(loginResponse.status, 200);
    assert.equal(loginResponse.body.user.email, 'bob@example.com');

    const failureResponse = await request(context.app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'wrong-password' });

    assert.equal(failureResponse.status, 401);
    assert.equal(failureResponse.body.message, 'Invalid email or password.');
  } finally {
    context.cleanup();
  }
});

test('logout clears the server-side session and blocks future protected requests', async () => {
  const context = createTestContext();
  try {
    const agent = request.agent(context.app);
    await agent
      .post('/api/auth/register')
      .send({ name: 'Carol Trader', email: 'carol@example.com', password: 'Password123!' })
      .expect(201);

    await agent.get('/api/auth/me').expect(200);
    await agent.post('/api/auth/logout').expect(200);
    await agent.get('/api/auth/me').expect(401);
  } finally {
    context.cleanup();
  }
});

test('admin verification is enforced by backend role checks', async () => {
  const context = createTestContext();
  try {
    bootstrapAdminUser(context.db, {
      name: 'Root Admin',
      email: 'admin@nexifyprotrade.test',
      password: 'Password123!',
    });

    const traderAgent = request.agent(context.app);
    await traderAgent
      .post('/api/auth/register')
      .send({ name: 'Dana Trader', email: 'dana@example.com', password: 'Password123!' })
      .expect(201);
    await traderAgent.get('/api/auth/admin/verify').expect(403);

    const adminAgent = request.agent(context.app);
    await adminAgent
      .post('/api/auth/login')
      .send({ email: 'admin@nexifyprotrade.test', password: 'Password123!' })
      .expect(200);

    const verifyResponse = await adminAgent.get('/api/auth/admin/verify');
    assert.equal(verifyResponse.status, 200);
    assert.equal(verifyResponse.body.authorized, true);
    assert.equal(verifyResponse.body.user.role, 'admin');
  } finally {
    context.cleanup();
  }
});
