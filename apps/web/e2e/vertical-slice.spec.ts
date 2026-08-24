import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';

test('registers, tops up through a signed mock callback, and shows wallet history', async ({ page, request }) => {
  const suffix = Date.now().toString();
  const username = `e2e${suffix.slice(-8)}`;
  const email = `e2e-${suffix}@example.com`;
  const phone = `+849${suffix.slice(-8)}`;

  await page.goto('/auth/register');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Họ và tên').fill('E2E Player');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Số điện thoại').fill(phone);
  await page.getByLabel('Mật khẩu').fill('Password123!');
  await page.getByLabel('Ngày sinh').fill('2000-01-01');
  await page.getByLabel('Tỉnh/Thành phố').fill('Ho Chi Minh City');
  await page.getByRole('button', { name: 'Gửi OTP' }).click();
  await expect(page.getByText(/Đã gửi OTP/)).toBeVisible({ timeout: 10_000 });
  await page.getByLabel('Mã OTP').fill('123456');
  await page.locator('input[type="checkbox"]').nth(0).check();
  await page.locator('input[type="checkbox"]').nth(1).check();
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText(/Xin chào, E2E Player/)).toBeVisible();

  await page.goto('/wallet');
  await expect(page.getByText('0', { exact: true })).toBeVisible();

  await page.goto('/payment');
  await page.locator('input[type="radio"]').first().check({ force: true });
  await page.getByRole('button', { name: /Tiếp tục thanh toán/ }).click();
  await expect(page).toHaveURL(/\/payment\/ZPAY-/);
  const paymentNo = decodeURIComponent(new URL(page.url()).pathname.split('/').pop() ?? '');
  const callback = { providerTransactionId: `mock-${paymentNo}`, paymentNo, status: 'SUCCESS', signature: 'ignored' };
  const rawBody = JSON.stringify(callback);
  const signature = createHash('sha256').update(rawBody).digest('hex');
  const callbackResponse = await request.post('http://localhost:4100/api/v1/payments/mock/callback', {
    data: rawBody,
    headers: { 'content-type': 'application/json', origin: 'http://localhost:3000', 'x-payment-signature': signature },
  });
  expect(callbackResponse.status()).toBe(201);

  await page.reload();
  await expect(page.getByText('Nạp Coin thành công')).toBeVisible();
  await page.goto('/wallet');
  await expect(page.getByText('200', { exact: true })).toBeVisible();
  await expect(page.getByText(/Top up ZPAY-/)).toBeVisible();
});
