import { expect, test } from '@playwright/test';
import { randomInt } from 'node:crypto';

test('uses runtime SePay capabilities, renders VietQR, and reacts to webhook status', async ({ page, request }) => {
  const apiBase = process.env.E2E_API_BASE_URL ?? 'http://localhost:4300/api/v1';
  const suffix = `${Date.now().toString().slice(-5)}${randomInt(100000, 1_000_000)}`;
  const phone = `+849${suffix.slice(-8)}`;
  const headers = { 'content-type': 'application/json', origin: 'http://localhost:3300' };
  await request.post(`${apiBase}/otp/send`, { headers, data: { channel: 'SMS', purpose: 'VERIFY_PHONE', destination: phone } });
  const verified = await request.post(`${apiBase}/otp/verify`, { headers, data: { channel: 'SMS', purpose: 'VERIFY_PHONE', destination: phone, code: '123456' } });
  const verificationToken = (await verified.json()).data.verificationToken;
  const registered = await request.post(`${apiBase}/auth/register`, {
    headers,
    data: {
      username: `sepayui${suffix.slice(-7)}`,
      email: `sepay-ui-${suffix}@example.com`,
      phone,
      password: 'Password123!',
      verificationToken,
      acceptTerms: true,
      acceptPrivacy: true,
    },
  });
  const accessCookie = /(?:^|,\s*)zenx_access=([^;]+)/.exec(registered.headers()['set-cookie'] ?? '');
  expect(accessCookie?.[1]).toBeTruthy();
  const completed = await request.post(`${apiBase}/account/complete-profile`, {
    headers: { ...headers, cookie: `zenx_access=${accessCookie![1]}` },
    data: { fullName: 'SePay UI Player', dateOfBirth: '2000-01-01', gender: 'UNSPECIFIED', city: 'Ho Chi Minh City' },
  });
  expect(completed.status()).toBe(201);
  await page.context().addCookies([{ name: 'zenx_access', value: accessCookie![1], url: 'http://localhost:3300' }]);

  const paymentNo = 'ZENXABCDEF123456';
  let status = 'PENDING';
  const payment = () => ({
    paymentNo,
    provider: 'sepay',
    status,
    amountVnd: '20000',
    coinAmount: '1000',
    paymentMethod: 'VIETQR',
    qrImageUrl: `https://vietqr.app/img?acc=0123456789&bank=Vietcombank&amount=20000&des=${paymentNo}`,
    bankTransfer: { bankAccount: '0123456789', bankCode: 'Vietcombank', accountHolder: 'ZENX GO' },
    createdAt: '2026-08-26T05:00:00.000Z',
    paidAt: status === 'SUCCESS' ? '2026-08-26T05:01:00.000Z' : null,
    expiredAt: '2026-08-26T05:30:00.000Z',
  });
  await page.route(`${apiBase}/payment-config`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { provider: 'sepay', methods: ['VIETQR'], isDemo: false, allowMockCompletion: false }, error: null }) }));
  await page.route(`${apiBase}/payments`, async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ data: payment(), error: null }) });
  });
  await page.route(`${apiBase}/payments/${paymentNo}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: payment(), error: null }) }));

  await page.goto('/payment');
  await expect(page.getByText('MoMo', { exact: true })).toHaveCount(0);
  await expect(page.getByText('QR Code (VietQR)', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Thanh toán', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/payment/${paymentNo}$`));
  await expect(page.getByRole('img', { name: 'Mã QR thanh toán VietQR' })).toBeVisible();
  await expect(page.getByText('0123456789', { exact: true })).toBeVisible();
  await expect(page.getByText(paymentNo, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hoàn tất thanh toán mẫu' })).toHaveCount(0);

  status = 'SUCCESS';
  await expect(page.getByText('Nạp Coin thành công')).toBeVisible({ timeout: 8_000 });
});
