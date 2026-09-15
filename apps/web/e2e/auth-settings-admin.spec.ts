import { expect, test, type APIRequestContext, type APIResponse, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { randomInt, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

const apiBase = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:4300/api/v1';
const origin = 'http://lvh.me:3300';

let adminCookie = '';

test.afterEach(async ({ request }) => {
  if (!adminCookie) return;
  const current = await readSettings(request, adminCookie);
  const restored = await request.patch(`${apiBase}/admin/settings/auth-providers`, {
    headers: authenticatedHeaders(adminCookie),
    data: {
      expectedUpdatedAt: current.updatedAt,
      googleLoginRegistrationEnabled: true,
      facebookLoginRegistrationEnabled: true,
    },
  });
  expect(restored.status()).toBe(200);
  adminCookie = '';
});

test('SUPER_ADMIN manages auth settings and SUPPORT cannot reach them', async ({ page, request }) => {
  const suffix = `${Date.now()}${randomInt(1000, 9999)}`;
  const admin = await createRoleAccount(request, `settings-admin-${suffix}`, 'SUPER_ADMIN');
  const support = await createRoleAccount(request, `settings-support-${suffix}`, 'SUPPORT');
  adminCookie = await login(request, admin.email, admin.password);

  await loginInBrowser(page, admin.email, admin.password, '/admin/settings');
  await expect(page).toHaveURL(/\/admin\/settings$/);
  await expect(page.getByRole('link', { name: 'Cài đặt' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Đăng nhập & đăng ký mạng xã hội' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Google' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Facebook' })).toBeChecked();
  await expect(page.getByText(/liên kết và hủy liên kết/i)).toBeVisible();

  await page.route('**/api/v1/admin/settings/auth-providers', async (route) => {
    if (route.request().method() !== 'PATCH') return route.continue();
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
    await route.continue();
  });
  await page.getByRole('checkbox', { name: 'Google' }).uncheck();
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByRole('button', { name: 'Đang lưu…' })).toBeDisabled();
  await expect(page.getByText('Đã lưu cài đặt đăng nhập mạng xã hội.')).toBeVisible();
  await page.unroute('**/api/v1/admin/settings/auth-providers');

  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Google' })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Facebook' })).toBeChecked();

  const loaded = await readSettings(request, adminCookie);
  const external = await request.patch(`${apiBase}/admin/settings/auth-providers`, {
    headers: authenticatedHeaders(adminCookie),
    data: {
      expectedUpdatedAt: loaded.updatedAt,
      facebookLoginRegistrationEnabled: false,
    },
  });
  expect(external.status()).toBe(200);

  await page.getByRole('checkbox', { name: 'Google' }).check();
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByText(/đã được quản trị viên khác thay đổi/i)).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Google' })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Facebook' })).not.toBeChecked();

  await page.route('**/api/v1/admin/settings/auth-providers', async (route) => {
    if (route.request().method() !== 'PATCH') return route.continue();
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ data: null, error: { code: 'SETTINGS_UNAVAILABLE', message: 'Unavailable' } }),
    });
  });
  await page.getByRole('checkbox', { name: 'Google' }).check();
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByText(/không thể lưu/i)).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Google' })).toBeChecked();
  await page.unroute('**/api/v1/admin/settings/auth-providers');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByText('Đã lưu cài đặt đăng nhập mạng xã hội.')).toBeVisible();

  await page.context().clearCookies();
  await loginInBrowser(page, support.email, support.password, '/admin/support');
  await expect(page.getByRole('link', { name: 'Cài đặt' })).toHaveCount(0);
  await page.goto('/admin/settings');
  await expect(page).not.toHaveURL(/\/admin\/settings$/);
});

test('settings load failure can be retried', async ({ page, request }) => {
  const suffix = `${Date.now()}${randomInt(1000, 9999)}`;
  const admin = await createRoleAccount(request, `settings-retry-${suffix}`, 'SUPER_ADMIN');
  adminCookie = await login(request, admin.email, admin.password);
  let failed = false;
  await page.route('**/api/v1/admin/settings/auth-providers', async (route) => {
    if (failed || route.request().method() !== 'GET') return route.continue();
    failed = true;
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ data: null, error: { code: 'SETTINGS_UNAVAILABLE', message: 'Unavailable' } }),
    });
  });

  await loginInBrowser(page, admin.email, admin.password, '/admin/settings');
  await expect(page.getByText('Không thể tải cài đặt đăng nhập mạng xã hội.')).toBeVisible();
  await page.getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.getByRole('checkbox', { name: 'Google' })).toBeVisible();
});

test('background revalidation does not overwrite dirty settings edits', async ({
  context,
  page,
  request,
}) => {
  const suffix = `${Date.now()}${randomInt(1000, 9999)}`;
  const admin = await createRoleAccount(request, `settings-dirty-${suffix}`, 'SUPER_ADMIN');
  adminCookie = await login(request, admin.email, admin.password);
  await loginInBrowser(page, admin.email, admin.password, '/admin/settings');
  await expect(page.getByRole('checkbox', { name: 'Google' })).toBeChecked();

  const baseline = await readSettings(request, adminCookie);
  const external = await request.patch(`${apiBase}/admin/settings/auth-providers`, {
    headers: authenticatedHeaders(adminCookie),
    data: {
      expectedUpdatedAt: baseline.updatedAt,
      facebookLoginRegistrationEnabled: false,
    },
  });
  expect(external.status()).toBe(200);
  await page.getByRole('checkbox', { name: 'Google' }).uncheck();

  let releaseRevalidation!: () => void;
  const revalidationReleased = new Promise<void>((resolveRelease) => {
    releaseRevalidation = resolveRelease;
  });
  let revalidationStarted = false;
  await page.route('**/api/v1/admin/settings/auth-providers', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    revalidationStarted = true;
    await revalidationReleased;
    await route.continue();
  });

  await context.setOffline(true);
  await context.setOffline(false);
  await expect.poll(() => revalidationStarted).toBe(true);
  await expect(page.getByRole('checkbox', { name: 'Google' })).not.toBeChecked();
  const response = page.waitForResponse(
    (candidate) =>
      candidate.request().method() === 'GET' &&
      candidate.url().endsWith('/api/v1/admin/settings/auth-providers'),
  );
  releaseRevalidation();
  await response;

  await expect(page.getByRole('checkbox', { name: 'Google' })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Facebook' })).toBeChecked();
});

test('failed stale conflict reload stays truthful and can retry server state', async ({
  page,
  request,
}) => {
  const suffix = `${Date.now()}${randomInt(1000, 9999)}`;
  const admin = await createRoleAccount(request, `settings-conflict-${suffix}`, 'SUPER_ADMIN');
  adminCookie = await login(request, admin.email, admin.password);
  await loginInBrowser(page, admin.email, admin.password, '/admin/settings');
  await expect(page.getByRole('checkbox', { name: 'Google' })).toBeChecked();

  const baseline = await readSettings(request, adminCookie);
  const external = await request.patch(`${apiBase}/admin/settings/auth-providers`, {
    headers: authenticatedHeaders(adminCookie),
    data: {
      expectedUpdatedAt: baseline.updatedAt,
      facebookLoginRegistrationEnabled: false,
    },
  });
  expect(external.status()).toBe(200);

  let failNextGet = true;
  await page.route('**/api/v1/admin/settings/auth-providers', async (route) => {
    if (route.request().method() !== 'GET' || !failNextGet) return route.continue();
    failNextGet = false;
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        data: null,
        error: { code: 'SETTINGS_UNAVAILABLE', message: 'Unavailable' },
      }),
    });
  });

  await page.getByRole('checkbox', { name: 'Google' }).uncheck();
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByText(/không thể tải dữ liệu mới nhất/i)).toBeVisible();
  await expect(page.getByText('Dữ liệu mới nhất đã được tải lại.')).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: 'Google' })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Facebook' })).toBeChecked();

  await page.getByRole('button', { name: 'Tải lại dữ liệu' }).click();
  await expect(page.getByRole('checkbox', { name: 'Google' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Facebook' })).not.toBeChecked();
  await expect(page.getByText('Dữ liệu mới nhất đã được tải lại.')).toBeVisible();
});

test('automatic stale conflict reload locks controls and replaces the form baseline', async ({
  page,
  request,
}) => {
  const suffix = `${Date.now()}${randomInt(1000, 9999)}`;
  const admin = await createRoleAccount(request, `settings-lock-${suffix}`, 'SUPER_ADMIN');
  adminCookie = await login(request, admin.email, admin.password);
  await loginInBrowser(page, admin.email, admin.password, '/admin/settings');
  await expect(page.getByRole('checkbox', { name: 'Google' })).toBeChecked();

  const baseline = await readSettings(request, adminCookie);
  const external = await request.patch(`${apiBase}/admin/settings/auth-providers`, {
    headers: authenticatedHeaders(adminCookie),
    data: {
      expectedUpdatedAt: baseline.updatedAt,
      facebookLoginRegistrationEnabled: false,
    },
  });
  expect(external.status()).toBe(200);

  let releaseReload!: () => void;
  const reloadReleased = new Promise<void>((resolveRelease) => {
    releaseReload = resolveRelease;
  });
  let reloadStarted = false;
  await page.route('**/api/v1/admin/settings/auth-providers', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    reloadStarted = true;
    await reloadReleased;
    await route.continue();
  });

  await page.getByRole('checkbox', { name: 'Google' }).uncheck();
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect.poll(() => reloadStarted).toBe(true);
  await expect(page.getByRole('checkbox', { name: 'Google' })).toBeDisabled();
  await expect(page.getByRole('checkbox', { name: 'Facebook' })).toBeDisabled();
  await expect(page.getByRole('button', { name: /Lưu thay đổi|Đang lưu…/ })).toBeDisabled();

  const response = page.waitForResponse(
    (candidate) =>
      candidate.request().method() === 'GET' &&
      candidate.url().endsWith('/api/v1/admin/settings/auth-providers'),
  );
  releaseReload();
  await response;
  await expect(page.getByText(/đã được quản trị viên khác thay đổi/i)).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Google' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Facebook' })).not.toBeChecked();

  await page.getByRole('checkbox', { name: 'Facebook' }).check();
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByText('Đã lưu cài đặt đăng nhập mạng xã hội.')).toBeVisible();
});

async function createRoleAccount(
  request: APIRequestContext,
  username: string,
  role: 'SUPER_ADMIN' | 'SUPPORT',
) {
  const email = `${username}@example.com`;
  const password = `E2E-${randomUUID()}aA1!`;
  const phone = `+849${randomInt(10_000_000, 99_999_999)}`;
  await register(request, { username, email, phone, password });
  const args = ['admin:role', 'grant', `--email=${email}`];
  if (role === 'SUPPORT') args.push('--role=SUPPORT');
  execFileSync('pnpm', args, {
    cwd: resolve(__dirname, '../..'),
    env: process.env,
    stdio: 'pipe',
  });
  return { email, password };
}

async function register(
  request: APIRequestContext,
  input: { username: string; email: string; phone: string; password: string },
) {
  const sent = await request.post(`${apiBase}/otp/send`, {
    headers: { origin },
    data: { channel: 'SMS', purpose: 'VERIFY_PHONE', destination: input.phone },
  });
  expect(sent.status()).toBe(201);
  const verified = await request.post(`${apiBase}/otp/verify`, {
    headers: { origin },
    data: { channel: 'SMS', purpose: 'VERIFY_PHONE', destination: input.phone, code: '123456' },
  });
  expect(verified.status()).toBe(201);
  const verificationToken = (await verified.json()).data.verificationToken as string;
  const response = await request.post(`${apiBase}/auth/register`, {
    headers: { origin },
    data: { ...input, verificationToken, acceptTerms: true, acceptPrivacy: true },
  });
  expect(response.status()).toBe(201);
}

async function login(request: APIRequestContext, username: string, password: string) {
  const response = await request.post(`${apiBase}/auth/login`, {
    headers: { origin },
    data: { username, password },
  });
  expect(response.status()).toBe(201);
  return cookieHeader(response);
}

async function loginInBrowser(
  page: Page,
  username: string,
  password: string,
  returnTo: string,
) {
  await page.goto(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  await page.getByLabel('Tên đăng nhập hoặc email').fill(username);
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
}

async function readSettings(request: APIRequestContext, cookie: string) {
  const response = await request.get(`${apiBase}/admin/settings/auth-providers`, {
    headers: authenticatedHeaders(cookie),
  });
  expect(response.status()).toBe(200);
  return (await response.json()).data as {
    googleLoginRegistrationEnabled: boolean;
    facebookLoginRegistrationEnabled: boolean;
    updatedAt: string;
  };
}

function authenticatedHeaders(cookie: string) {
  return { origin, cookie };
}

function cookieHeader(response: APIResponse) {
  const value = response.headers()['set-cookie'];
  return value
    .split(/,\s*(?=[a-z_]+=)/iu)
    .map((cookie) => cookie.split(';')[0])
    .join('; ');
}
