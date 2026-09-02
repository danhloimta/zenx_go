import { expect, test } from '@playwright/test';
import { createHash, randomInt } from 'node:crypto';

test('registers, tops up through a signed mock callback, and shows wallet history', async ({ page, request }) => {
  const suffix = `${Date.now().toString().slice(-5)}${randomInt(100000, 1_000_000)}`;
  const username = `e2e${suffix.slice(-8)}`;
  const email = `e2e-${suffix}@example.com`;
  const phone = `+849${suffix.slice(-8)}`;

  await page.goto('/auth/register');
  await page.getByLabel('Tên đăng nhập').fill(username);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Số điện thoại').fill(phone);
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill('Password123!');
  await page.getByRole('textbox', { name: 'Xác nhận mật khẩu', exact: true }).fill('Password123!');
  await page.getByRole('button', { name: 'Gửi OTP' }).click();
  await expect(page.getByText(/Đã gửi OTP/)).toBeVisible({ timeout: 10_000 });
  await page.getByLabel('Nhập số OTP').fill('123456');
  await page.locator('input[type="checkbox"]').nth(0).check();
  await page.getByRole('button', { name: 'Đăng ký tài khoản' }).click();
  await expect(page).toHaveURL(/\/account\/complete-profile/);
  await page.getByLabel('Họ và tên').fill('E2E Player');
  await page.getByLabel('Ngày sinh').fill('2000-01-01');
  await page.getByLabel('Tỉnh / Thành phố').fill('Ho Chi Minh City');
  await page.getByRole('button', { name: 'Hoàn tất hồ sơ' }).click();
  await expect(page).toHaveURL(/\/account\/profile/);
  await expect(page.getByRole('textbox', { name: 'Họ và tên' })).toHaveValue('E2E Player');

  await page.goto('/wallet');
  await expect(page.getByText('0', { exact: true })).toBeVisible();

  await page.goto('/payment');
  await expect(page.getByRole('button', { name: /Nhập số lượng/ })).toBeDisabled();
  await page.getByText('MoMo', { exact: true }).click();
  await page.getByRole('button', { name: 'Thanh toán', exact: true }).click();
  await expect(page).toHaveURL(/\/payment\/ZPAY-/);
  await expect(page.getByRole('link', { name: /Mở cổng thanh toán/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Hoàn tất thanh toán mẫu' })).toBeVisible();
  const paymentNo = decodeURIComponent(new URL(page.url()).pathname.split('/').pop() ?? '');
  const callback = { providerTransactionId: `mock-${paymentNo}`, paymentNo, status: 'SUCCESS' };
  const rawBody = JSON.stringify(callback);
  const signature = createHash('sha256').update(rawBody).digest('hex');
  const callbackResponse = await request.post(`${process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:4300/api/v1'}/payments/mock/callback`, {
    data: rawBody,
    headers: { 'content-type': 'application/json', origin: 'http://lvh.me:3300', 'x-payment-signature': signature },
  });
  expect(callbackResponse.status()).toBe(201);

  await page.reload();
  await expect(page.getByText('Nạp Coin thành công')).toBeVisible();
  await page.goto('/wallet');
  await expect(page.getByText('1.000', { exact: true })).toBeVisible();
  await expect(page.getByText(/Top up ZPAY-/)).toBeVisible();

  await page.goto('/wallet/transactions');
  await expect(page.locator('tr[role="button"]').first()).toBeVisible();
  const today = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await page.getByLabel('Từ ngày').fill(today);
  await page.getByLabel('Đến ngày').fill(today);
  await expect(page.getByText(/1 giao dịch/)).toBeVisible();
  await page.locator('tr[role="button"]').first().click();
  await expect(page.getByText('Thông tin thanh toán')).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/wallet/transactions');
  await page.locator('tr[role="button"]').first().click();
  await expect(page).toHaveURL(/\/wallet\/transactions\/ZTX-/);
  await expect(page.getByText('Chi tiết giao dịch')).toBeVisible();
});
