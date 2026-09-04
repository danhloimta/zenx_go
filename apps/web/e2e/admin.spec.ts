import { expect, test, type APIRequestContext } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { randomInt } from 'node:crypto';

test('admin dashboard manages a user account', async ({ page, request }) => {
  const suffix = `${Date.now()}${randomInt(1000, 9999)}`;
  const adminEmail = `e2e-admin-${suffix}@example.com`;
  const memberEmail = `e2e-member-${suffix}@example.com`;
  const adminUsername = `e2eadmin${suffix.slice(-8)}`;
  const memberUsername = `e2emember${suffix.slice(-8)}`;
  const apiBase = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:4300/api/v1';
  await register(
    request,
    {
      username: adminUsername,
      email: adminEmail,
      phone: `+849${suffix.slice(-8)}`,
      password: 'AdminPassword123!',
    },
    apiBase,
  );
  await register(
    request,
    {
      username: memberUsername,
      email: memberEmail,
      phone: `+849${(Number(suffix.slice(-8)) + 1).toString().slice(-8)}`,
      password: 'MemberPassword123!',
    },
    apiBase,
  );
  const repoRoot = resolve(__dirname, '../..');
  execFileSync('pnpm', ['admin:role', 'grant', `--email=${adminEmail}`], {
    cwd: repoRoot,
    env: process.env,
    stdio: 'pipe',
  });

  await page.goto(`/auth/login?returnTo=${encodeURIComponent('/admin')}`);
  await page.getByLabel('Tên đăng nhập hoặc email').fill(adminEmail);
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill('AdminPassword123!');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Tổng quan vận hành' })).toBeVisible();
  await expect(page.getByText('Tổng người dùng', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Nhật ký hoạt động' })).toHaveCount(0);

  await page.goto('/admin/users');
  await page.getByLabel('Tìm kiếm người dùng').fill(memberEmail);
  await expect(page.locator('p:visible').filter({ hasText: memberEmail }).first()).toBeVisible();
  await page.locator('a[href^="/admin/users/"]:visible').first().click();
  await expect(page).toHaveURL(/\/admin\/users\//);
  await expect(page.getByRole('heading', { name: 'Thông tin tài khoản & Hồ sơ' })).toBeVisible();
  await expect(page.getByText('Nhật ký can thiệp liên quan', { exact: true })).toHaveCount(0);

  await page.getByLabel('Họ và tên').fill('E2E Admin Updated');
  await page.getByRole('button', { name: 'Lưu cập nhật', exact: true }).click();
  await expect(page.getByText('Đã cập nhật hồ sơ người dùng thành công.')).toBeVisible();

  await page.getByRole('button', { name: 'Tạm ngưng', exact: true }).click();
  await expect(page.getByText('Tạm ngưng', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Kích hoạt', exact: true }).click();
  await expect(page.getByText('Đang hoạt động', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Đặt mật khẩu tạm thời', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Mật khẩu tạm mới', exact: true })
    .fill('TemporaryPassword123!');
  await page
    .getByRole('textbox', { name: 'Xác nhận mật khẩu tạm', exact: true })
    .fill('TemporaryPassword123!');
  await page.getByRole('button', { name: 'Đặt mật khẩu', exact: true }).click();
  await expect(page.getByText('Đã đặt mật khẩu tạm và thu hồi các phiên cũ.')).toBeVisible();
});

async function register(
  request: APIRequestContext,
  input: { username: string; email: string; phone: string; password: string },
  apiBase: string,
) {
  const headers = { origin: 'http://lvh.me:3300' };
  const send = await request.post(`${apiBase}/otp/send`, {
    data: { channel: 'SMS', purpose: 'VERIFY_PHONE', destination: input.phone },
    headers,
  });
  expect(send.status()).toBe(201);
  const verify = await request.post(`${apiBase}/otp/verify`, {
    data: { channel: 'SMS', purpose: 'VERIFY_PHONE', destination: input.phone, code: '123456' },
    headers,
  });
  expect(verify.status()).toBe(201);
  const registerResponse = await request.post(`${apiBase}/auth/register`, {
    data: {
      ...input,
      verificationToken: (await verify.json()).data.verificationToken,
      acceptTerms: true,
      acceptPrivacy: true,
    },
    headers,
  });
  expect(registerResponse.status()).toBe(201);
}
