import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';

process.env.ADMIN_ALLOWED_EMAILS = 'admin.allowed@example.com';
process.env.ADMIN_LOGIN_PATH = '/secure-admin-login';

const { createApp } = await import('../server/app.js');
const { userStore } = await import('../server/userStore.js');

const dbPath = path.resolve(process.cwd(), 'server/data/users.json');

const resetDb = async () => {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  await fs.writeFile(dbPath, JSON.stringify({ users: [] }, null, 2));
};

const startServer = async () => {
  const app = createApp();
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const stop = async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  };

  return { baseUrl, stop };
};

beforeEach(async () => {
  await resetDb();
});

const parseCookie = (response) => {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) return '';
  return setCookie.split(';')[0];
};

test('admin login succeeds with valid allowlisted credentials', async () => {
  const { baseUrl, stop } = await startServer();
  try {
    await userStore.upsertAdmin({
      email: 'admin.allowed@example.com',
      name: 'Admin Allowed',
      password: 'StrongAdminPass123!'
    });

    const response = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin.allowed@example.com', password: 'StrongAdminPass123!' })
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.user.role, 'admin');
  } finally {
    await stop();
  }
});

test('admin login fails with wrong password', async () => {
  const { baseUrl, stop } = await startServer();
  try {
    await userStore.upsertAdmin({
      email: 'admin.allowed@example.com',
      name: 'Admin Allowed',
      password: 'StrongAdminPass123!'
    });

    const response = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin.allowed@example.com', password: 'wrong-pass' })
    });

    assert.equal(response.status, 401);
  } finally {
    await stop();
  }
});

test('ordinary member credentials are denied on admin login endpoint', async () => {
  const { baseUrl, stop } = await startServer();
  try {
    await userStore.createUser({
      email: 'member@example.com',
      name: 'Member User',
      password: 'MemberPass123!'
    });

    const response = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'member@example.com', password: 'MemberPass123!' })
    });

    assert.equal(response.status, 401);
  } finally {
    await stop();
  }
});

test('non-allowlisted admin is denied', async () => {
  const { baseUrl, stop } = await startServer();
  try {
    await userStore.upsertAdmin({
      email: 'admin.blocked@example.com',
      name: 'Blocked Admin',
      password: 'StrongAdminPass123!'
    });

    const response = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin.blocked@example.com', password: 'StrongAdminPass123!' })
    });

    assert.equal(response.status, 403);
  } finally {
    await stop();
  }
});

test('unauthenticated request to admin API gets 401', async () => {
  const { baseUrl, stop } = await startServer();
  try {
    const response = await fetch(`${baseUrl}/api/admin/protected`);
    assert.equal(response.status, 401);
  } finally {
    await stop();
  }
});

test('authorized admin can access protected admin API', async () => {
  const { baseUrl, stop } = await startServer();
  try {
    await userStore.upsertAdmin({
      email: 'admin.allowed@example.com',
      name: 'Admin Allowed',
      password: 'StrongAdminPass123!'
    });

    const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin.allowed@example.com', password: 'StrongAdminPass123!' })
    });

    const cookie = parseCookie(loginResponse);
    const response = await fetch(`${baseUrl}/api/admin/protected`, {
      headers: { cookie }
    });

    assert.equal(response.status, 200);
  } finally {
    await stop();
  }
});

test('logout clears the session', async () => {
  const { baseUrl, stop } = await startServer();
  try {
    await userStore.upsertAdmin({
      email: 'admin.allowed@example.com',
      name: 'Admin Allowed',
      password: 'StrongAdminPass123!'
    });

    const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin.allowed@example.com', password: 'StrongAdminPass123!' })
    });

    const cookie = parseCookie(loginResponse);

    const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { cookie }
    });

    assert.equal(logoutResponse.status, 204);

    const afterLogout = await fetch(`${baseUrl}/api/admin/protected`, {
      headers: { cookie }
    });

    assert.equal(afterLogout.status, 401);
  } finally {
    await stop();
  }
});

test('member-facing UI source has no visible admin links', async () => {
  const [headerSource, landingSource, appSource] = await Promise.all([
    fs.readFile(path.resolve(process.cwd(), 'src/components/common/Header.tsx'), 'utf-8'),
    fs.readFile(path.resolve(process.cwd(), 'src/components/landing/LandingPage.tsx'), 'utf-8'),
    fs.readFile(path.resolve(process.cwd(), 'src/App.tsx'), 'utf-8')
  ]);

  const combined = `${headerSource}\n${landingSource}\n${appSource}`;

  assert.equal(combined.includes('Admin Console & KYC'), false);
  assert.equal(combined.includes('Admin Gateway'), false);
  assert.equal(combined.includes('#admin-login'), false);
});
