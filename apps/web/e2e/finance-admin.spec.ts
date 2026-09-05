import { expect, test, type APIRequestContext } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { randomInt } from 'node:crypto';

test('SUPER_ADMIN manages coin packages, payments and wallet adjustments', async ({ page, request }) => {
  const suffix = `${Date.now()}${randomInt(1000, 9999)}`;
  const adminEmail = `e2e-finance-admin-${suffix}@example.com`;
  const memberEmail = `e2e-finance-member-${suffix}@example.com`;
  const adminUsername = `e2efinadmin${suffix.slice(-8)}`;
  const memberUsername = `e2efinmember${suffix.slice(-8)}`;
  const adminPassword = 'FinanceAdmin123!';
  const memberPassword = 'FinanceMember123!';
  const adminPhone = `+849${suffix.slice(-8)}`;
  const memberPhone = `+849${(Number(suffix.slice(-8)) + 1).toString().slice(-8)}`;
  const apiBase = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:4300/api/v1';
  const headers = { origin: 'http://lvh.me:3300' };

  await register(request, { username: adminUsername, email: adminEmail, phone: adminPhone, password: adminPassword }, apiBase);
  await register(request, { username: memberUsername, email: memberEmail, phone: memberPhone, password: memberPassword }, apiBase);
  execFileSync('pnpm', ['admin:role', 'grant', `--email=${adminEmail}`], {
    cwd: resolve(__dirname, '../..'),
    env: process.env,
    stdio: 'pipe',
  });

  const memberLogin = await request.post(`${apiBase}/auth/login`, {
    data: { username: memberEmail, password: memberPassword },
    headers,
  });
  expect(memberLogin.status()).toBe(201);
  const memberCookies = cookieHeader(memberLogin);
  const packages = await request.get(`${apiBase}/coin-packages`, { headers });
  expect(packages.status()).toBe(200);
  const selectedPackage = (await packages.json()).data[0] as { id: string };
  const createdPayment = await request.post(`${apiBase}/payments`, {
    data: { coinPackageId: selectedPackage.id, paymentMethod: 'MOMO' },
    headers: { ...headers, cookie: memberCookies },
  });
  expect(createdPayment.status()).toBe(201);
  const paymentNo = (await createdPayment.json()).data.paymentNo as string;

  await page.goto(`/auth/login?returnTo=${encodeURIComponent('/admin/finance')}`);
  await page.getByLabel('Tên đăng nhập hoặc email').fill(adminEmail);
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill(adminPassword);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/finance$/);
  await expect(page.getByRole('heading', { name: 'Tổng quan tài chính' })).toBeVisible();

  await page.goto('/admin/finance/packages');
  await page.getByRole('button', { name: 'Gói mới', exact: true }).click();
  const packageName = `Gói E2E ${suffix}`;
  await page.getByLabel('Mã gói').fill(`E2E_${suffix}`.slice(0, 32));
  await page.getByLabel('Tên gói').fill(packageName);
  await page.getByLabel('Giá VND').fill('30000');
  await page.getByLabel('Số Coin').fill('1500');
  await page.getByRole('button', { name: 'Lưu gói nạp', exact: true }).click();
  await expect(page.getByText(packageName, { exact: true })).toBeVisible();

  await page.goto('/admin/finance/payments');
  await page.getByPlaceholder('Payment no, username, email…').fill(paymentNo);
  await page.locator(`a[href="/admin/finance/payments/${encodeURIComponent(paymentNo)}"]`).click();
  await expect(page.getByRole('heading', { name: paymentNo })).toBeVisible();
  page.on('dialog', (dialog) => dialog.accept());
  await page.getByLabel(/Provider transaction ID/).fill(`e2e-provider-${suffix}`);
  await page.getByRole('button', { name: 'Xác nhận thành công', exact: true }).click();
  await expect(page.getByText('Thành công', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Hoàn và thu hồi Coin', exact: true }).click();
  await expect(page.getByText('Đã hoàn', { exact: true })).toBeVisible();

  await page.goto('/admin/users');
  await page.getByLabel('Tìm kiếm người dùng').fill(memberEmail);
  await page.locator('a[href^="/admin/users/"]:visible').first().click();
  await expect(page.getByRole('heading', { name: 'Thông tin tài khoản & Hồ sơ' })).toBeVisible();
  await page.getByRole('button', { name: 'Cộng Coin', exact: true }).click();
  await page.getByLabel('Số Coin').fill('100');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByText('Đã cộng Coin vào ví.')).toBeVisible();
  await page.getByRole('button', { name: 'Trừ Coin', exact: true }).click();
  await page.getByLabel('Số Coin').fill('25');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByText('Đã trừ Coin khỏi ví.')).toBeVisible();

  await page.goto('/admin/finance/transactions');
  await expect(page.getByRole('main').getByRole('heading', { name: 'Sổ cái Coin' })).toBeVisible();
  await expect(page.getByText('ADMIN_ADJUSTMENT', { exact: true }).first()).toBeVisible();
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
    data: {
      ...input,
      verificationToken: (await verified.json()).data.verificationToken,
      acceptTerms: true,
      acceptPrivacy: true,
    },
    headers,
  });
  expect(response.status()).toBe(201);
}

function cookieHeader(response: { headers(): Record<string, string | string[]> }) {
  const value = response.headers()['set-cookie'];
  const cookies = Array.isArray(value) ? value : [value];
  return cookies.filter(Boolean).map((cookie) => cookie.split(';')[0]).join('; ');
}
