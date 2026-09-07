import { expect, test, type APIRequestContext } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { randomInt } from 'node:crypto';

test('SUPER_ADMIN manages genres and keeps inactive genres on existing games', async ({ page, request }) => {
  const suffix = `${Date.now()}${randomInt(1000, 9999)}`;
  const email = `e2e-genre-${suffix}@example.com`;
  const username = `e2egenre${suffix.slice(-8)}`;
  const password = 'GenrePassword123!';
  const phone = `+849${suffix.slice(-8)}`;
  const apiBase = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:4300/api/v1';
  const headers = { origin: 'http://lvh.me:3300' };

  await register(request, { username, email, phone, password }, apiBase);
  execFileSync('pnpm', ['admin:role', 'grant', `--email=${email}`], {
    cwd: resolve(__dirname, '../..'),
    env: process.env,
    stdio: 'pipe',
  });
  const login = await request.post(`${apiBase}/auth/login`, { data: { username: email, password }, headers });
  expect(login.status()).toBe(201);
  const cookie = cookieHeader(login);
  const authHeaders = { ...headers, cookie };
  const gamesResponse = await request.get(`${apiBase}/admin/content/games`, { headers: authHeaders });
  expect(gamesResponse.status()).toBe(200);
  const game = (await gamesResponse.json()).data.items[0] as { id: string };
  const detailResponse = await request.get(`${apiBase}/admin/content/games/${game.id}`, { headers: authHeaders });
  expect(detailResponse.status()).toBe(200);
  const original = (await detailResponse.json()).data as { genres: Array<{ code: string }>; platforms: string[]; updatedAt: string };

  await page.goto(`/auth/login?returnTo=${encodeURIComponent('/admin/content/genres')}`);
  await page.getByLabel('Tên đăng nhập hoặc email').fill(email);
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/content\/genres$/);

  const code = `E2EGENRE${suffix}`.slice(0, 32).toUpperCase();
  const name = `Genre E2E ${suffix}`;
  const slug = `genre-e2e-${suffix}`.slice(0, 80);
  await page.getByRole('button', { name: 'Thể loại mới', exact: true }).click();
  await page.getByLabel('Mã thể loại').fill(code);
  await page.getByLabel('Tên thể loại').fill(name);
  await page.getByLabel('Slug').fill(slug);
  await page.getByRole('button', { name: 'Lưu thể loại', exact: true }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  const genresResponse = await request.get(`${apiBase}/admin/content/genres`, { headers: authHeaders });
  const created = (await genresResponse.json()).data.find((item: { code: string }) => item.code === code) as { id: string; updatedAt: string };
  expect(created).toBeTruthy();
  const attached = await request.patch(`${apiBase}/admin/content/games/${game.id}`, {
    headers: authHeaders,
    data: { expectedUpdatedAt: original.updatedAt, genreCodes: [...original.genres.map((genre) => genre.code), code], platforms: original.platforms },
  });
  expect(attached.status()).toBe(200);

  await page.reload();
  await page.getByRole('button', { name: `Sửa ${name}`, exact: true }).click();
  await page.getByRole('checkbox', { name: 'Đang hoạt động và cho phép gắn mới vào game' }).uncheck();
  await page.getByRole('button', { name: 'Lưu thể loại', exact: true }).click();
  await expect(page.getByRole('table').getByText('Ngừng dùng', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: `Xóa ${name}`, exact: true })).toBeDisabled();

  await page.goto(`/admin/content/games/${game.id}`);
  await expect(page.getByText('(Ngừng dùng)', { exact: true }).first()).toBeVisible();
  await page.goto('/admin/content/games/new');
  await expect(page.getByText('MMORPG', { exact: true })).toBeVisible();

  const latestResponse = await request.get(`${apiBase}/admin/content/games/${game.id}`, { headers: authHeaders });
  const latest = (await latestResponse.json()).data as { updatedAt: string };
  const removed = await request.patch(`${apiBase}/admin/content/games/${game.id}`, {
    headers: authHeaders,
    data: { expectedUpdatedAt: latest.updatedAt, genreCodes: original.genres.map((genre) => genre.code), platforms: original.platforms },
  });
  expect(removed.status()).toBe(200);

  await page.goto('/admin/content/genres');
  await expect(page.getByRole('button', { name: `Xóa ${name}`, exact: true })).toBeEnabled();
  page.on('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: `Xóa ${name}`, exact: true }).click();
  await expect(page.getByText(name, { exact: true })).toHaveCount(0);
});

async function register(
  request: APIRequestContext,
  input: { username: string; email: string; phone: string; password: string },
  apiBase: string,
) {
  const headers = { origin: 'http://lvh.me:3300' };
  const sent = await request.post(`${apiBase}/otp/send`, {
    data: { channel: 'SMS', purpose: 'VERIFY_PHONE', destination: input.phone },
    headers,
  });
  expect(sent.status()).toBe(201);
  const verified = await request.post(`${apiBase}/otp/verify`, {
    data: { channel: 'SMS', purpose: 'VERIFY_PHONE', destination: input.phone, code: '123456' },
    headers,
  });
  expect(verified.status()).toBe(201);
  const response = await request.post(`${apiBase}/auth/register`, {
    data: { ...input, verificationToken: (await verified.json()).data.verificationToken, acceptTerms: true, acceptPrivacy: true },
    headers,
  });
  expect(response.status()).toBe(201);
}

function cookieHeader(response: { headers(): Record<string, string | string[]> }) {
  const value = response.headers()['set-cookie'];
  const cookies = Array.isArray(value) ? value : [value];
  return cookies.filter(Boolean).map((cookie) => cookie.split(';')[0]).join('; ');
}
