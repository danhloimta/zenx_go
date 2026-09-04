import { expect, test, type APIRequestContext } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

test('SUPER_ADMIN manages game, article, event and announcement content', async ({ page, request }) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
  const adminEmail = `e2e-content-${suffix}@example.com`;
  const adminUsername = `e2econtent${suffix.slice(-8)}`;
  const apiBase = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:4300/api/v1';
  await register(request, { username: adminUsername, email: adminEmail, phone: `+849${suffix.slice(-8)}`, password: 'ContentPassword123!' }, apiBase);
  execFileSync('pnpm', ['admin:role', 'grant', `--email=${adminEmail}`], { cwd: resolve(__dirname, '../..'), env: process.env, stdio: 'pipe' });

  await page.goto(`/auth/login?returnTo=${encodeURIComponent('/admin/content')}`);
  await page.getByLabel('Tên đăng nhập hoặc email').fill(adminEmail);
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill('ContentPassword123!');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/content/);
  await expect(page.getByRole('heading', { name: 'Quản lý nội dung' })).toBeVisible();

  await page.goto('/admin/content/games');
  await page.getByLabel('Tìm game').fill('luc-dia-dam-me');
  await expect(page.locator('a[href^="/admin/content/games/"]:visible').first()).toBeVisible();
  await page.locator('a[href^="/admin/content/games/"]:visible').first().click();
  await expect(page.getByRole('heading', { name: 'Lục Địa Đam Mê' })).toBeVisible();
  await page.getByLabel('Tagline').fill(`CMS E2E ${suffix}`);
  await page.getByLabel('Lý do thay đổi').fill('Cập nhật game trong E2E');
  await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await expect(page.getByText('Đã lưu thông tin game.')).toBeVisible();

  await page.goto('/admin/content/articles/new');
  await page.getByLabel('Game').selectOption({ label: 'Lục Địa Đam Mê' });
  await page.getByLabel('Tiêu đề').fill(`Bài viết CMS ${suffix}`);
  await page.getByLabel('Slug').fill(`bai-viet-cms-${suffix}`);
  await page.getByLabel('Excerpt').fill('Excerpt bài viết CMS E2E.');
  await page.getByLabel('Nội dung Markdown').fill('# Bài viết\n\nNội dung **CMS E2E**.');
  await page.getByLabel('Lý do thay đổi').fill('Tạo bài viết nháp E2E');
  await page.getByRole('button', { name: 'Tạo bài viết', exact: true }).click();
  await expect(page.getByText('Đã tạo bài viết.')).toBeVisible();
  await page.getByLabel('Tìm bài viết').fill(`bai-viet-cms-${suffix}`);
  const articleTitle = page.getByText(`Bài viết CMS ${suffix}`, { exact: true });
  await expect(articleTitle).toBeVisible();
  await articleTitle.click();
  await page.getByLabel('Trạng thái').selectOption('PUBLISHED');
  await page.getByLabel('Lý do thay đổi').fill('Publish bài viết CMS E2E');
  await page.getByRole('button', { name: 'Lưu bài viết', exact: true }).click();
  await expect(page.getByText('Đã lưu bài viết.')).toBeVisible();
  await page.getByLabel('Trạng thái').selectOption('DRAFT');
  await page.getByLabel('Lý do thay đổi').fill('Đưa bài viết về nháp E2E');
  await page.getByRole('button', { name: 'Lưu bài viết', exact: true }).click();
  await expect(page.getByText('Đã lưu bài viết.')).toBeVisible();

  await page.goto('/admin/content/events/new');
  await page.getByLabel('Tiêu đề').fill(`Sự kiện CMS ${suffix}`);
  await page.getByLabel('Slug').fill(`su-kien-cms-${suffix}`);
  await page.getByLabel('Excerpt').fill('Sự kiện CMS E2E.');
  await page.getByLabel('Bắt đầu').fill('2026-12-01T10:00');
  await page.getByLabel('Nội dung Markdown').fill('Nội dung sự kiện CMS.');
  await page.getByLabel('Lý do thay đổi').fill('Tạo sự kiện CMS E2E');
  await page.getByRole('button', { name: 'Tạo sự kiện', exact: true }).click();
  await expect(page.getByText('Đã tạo sự kiện.')).toBeVisible();

  await page.goto('/admin/content/announcements');
  await page.getByRole('button', { name: 'Tạo thông báo', exact: true }).click();
  await page.getByLabel('Code').fill(`E2E_${suffix}`);
  await page.getByLabel('Tiêu đề').fill(`Thông báo CMS ${suffix}`);
  await page.getByLabel('Thông điệp').fill('Thông báo được tạo từ CMS E2E.');
  await page.getByLabel('Bắt đầu').fill('2026-09-01T10:00');
  await page.getByLabel('Lý do').fill('Tạo announcement CMS E2E');
  await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await expect(page.getByText('Đã tạo thông báo.')).toBeVisible();
});

async function register(request: APIRequestContext, input: { username: string; email: string; phone: string; password: string }, apiBase: string) {
  const headers = { origin: 'http://lvh.me:3300' };
  const sent = await request.post(`${apiBase}/otp/send`, { data: { channel: 'SMS', purpose: 'VERIFY_PHONE', destination: input.phone }, headers });
  expect(sent.status()).toBe(201);
  const verified = await request.post(`${apiBase}/otp/verify`, { data: { channel: 'SMS', purpose: 'VERIFY_PHONE', destination: input.phone, code: '123456' }, headers });
  expect(verified.status()).toBe(201);
  const response = await request.post(`${apiBase}/auth/register`, { data: { ...input, verificationToken: (await verified.json()).data.verificationToken, acceptTerms: true, acceptPrivacy: true }, headers });
  expect(response.status()).toBe(201);
}
