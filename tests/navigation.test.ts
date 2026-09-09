import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ADMIN_DASHBOARD_PATH,
  DEFAULT_ADMIN_LOGIN_PATH,
  getCanonicalPathForIntent,
  getRouteOverride,
  normalizePath,
  resolveRouteIntent,
} from '../src/utils/navigation.ts';

test('root URL resolves to landing even without session state hints', () => {
  assert.equal(
    resolveRouteIntent({
      pathname: '/',
      search: '?route=%2F',
      hash: '',
    }),
    'landing',
  );
});

test('hidden admin login path resolves to admin-login', () => {
  assert.equal(
    resolveRouteIntent({
      pathname: DEFAULT_ADMIN_LOGIN_PATH,
      hash: '',
    }),
    'admin-login',
  );
});

test('legacy admin hash still resolves to admin-login', () => {
  assert.equal(
    resolveRouteIntent({
      pathname: '/',
      hash: '#admin-login',
    }),
    'admin-login',
  );
});

test('protected admin path resolves to admin-dashboard', () => {
  assert.equal(
    resolveRouteIntent({
      pathname: DEFAULT_ADMIN_DASHBOARD_PATH,
      hash: '',
    }),
    'admin-dashboard',
  );
});

test('unknown redirected paths fall back to landing canonical path', () => {
  assert.equal(getRouteOverride('?route=%2Funknown'), '/unknown');
  assert.equal(
    getCanonicalPathForIntent(
      resolveRouteIntent({
        pathname: '/404.html',
        search: '?route=%2Funknown',
      }),
    ),
    '/',
  );
});

test('normalizes configured route paths consistently', () => {
  assert.equal(normalizePath('secure-admin-login/'), DEFAULT_ADMIN_LOGIN_PATH);
  assert.equal(normalizePath('/secure-admin/'), DEFAULT_ADMIN_DASHBOARD_PATH);
});
