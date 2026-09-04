import { expect, test, type APIRequestContext } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

test('SUPPORT agent works the queue and replies without exposing internal notes', async ({
  page,
  request,
}) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
  const supportEmail = `e2e-support-${suffix}@example.com`;
  const memberEmail = `e2e-support-member-${suffix}@example.com`;
  const apiBase = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:4300/api/v1';
  await register(
    request,
    {
      username: `e2esupport${suffix.slice(-8)}`,
      email: supportEmail,
      phone: `+849${suffix.slice(-8)}`,
      password: 'SupportPassword123!',
    },
    apiBase,
  );
  await register(
    request,
    {
      username: `e2esupportmember${suffix.slice(-7)}`,
      email: memberEmail,
      phone: `+849${(Number(suffix.slice(-8)) + 1).toString().slice(-8)}`,
      password: 'MemberPassword123!',
    },
    apiBase,
  );
  const ticketNo = await registerTicket(request, memberEmail, apiBase);
  const repoRoot = resolve(__dirname, '../..');
  execFileSync('pnpm', ['admin:role', 'grant', `--email=${supportEmail}`, '--role=SUPPORT'], {
    cwd: repoRoot,
    env: process.env,
    stdio: 'pipe',
  });

  await page.goto(`/auth/login?returnTo=${encodeURIComponent('/admin')}`);
  await page.getByLabel('Tên đăng nhập hoặc email').fill(supportEmail);
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill('SupportPassword123!');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/support/);
  await expect(page.getByRole('heading', { name: 'Trung tâm hỗ trợ' })).toBeVisible();

  await page.goto('/admin/support/tickets');
  await page.getByLabel('Tìm ticket').fill(ticketNo);
  await expect(page.getByText(ticketNo, { exact: true }).first()).toBeVisible();
  await page.locator('a[href^="/admin/support/tickets/"]:visible').first().click();
  await expect(page).toHaveURL(/\/admin\/support\/tickets\//);
  await page.getByRole('button', { name: 'Nhận ticket', exact: true }).click();
  await expect(page.getByText('Đã nhận ticket.')).toBeVisible();

  await page
    .getByPlaceholder('Viết phản hồi cho user…')
    .fill('Support đã tiếp nhận yêu cầu của bạn.');
  await page.getByRole('button', { name: 'Gửi phản hồi', exact: true }).click();
  await expect(page.getByText('Đã gửi phản hồi cho user.')).toBeVisible();

  const memberMessages = await request.get(
    `${apiBase}/support/tickets/${encodeURIComponent(ticketNo)}/messages`,
    {
      headers: {
        origin: 'http://lvh.me:3300',
        cookie: await login(request, memberEmail, 'MemberPassword123!', apiBase),
      },
    },
  );
  expect(
    (await memberMessages.json()).data.items.some((item: { body: string }) =>
      item.body.includes('đã tiếp nhận'),
    ),
  ).toBe(true);

  await page.getByRole('combobox').first().selectOption('INTERNAL');
  await page.getByPlaceholder('Ghi chú nội bộ cho team…').fill('Ghi chú nội bộ của team support.');
  await page.getByRole('button', { name: 'Thêm internal note', exact: true }).click();
  await expect(page.getByText('Đã thêm internal note.')).toBeVisible();
  const publicAfterNote = await request.get(
    `${apiBase}/support/tickets/${encodeURIComponent(ticketNo)}/messages`,
    {
      headers: {
        origin: 'http://lvh.me:3300',
        cookie: await login(request, memberEmail, 'MemberPassword123!', apiBase),
      },
    },
  );
  expect(
    (await publicAfterNote.json()).data.items.some((item: { body: string }) =>
      item.body.includes('Ghi chú nội bộ'),
    ),
  ).toBe(false);

  await page.goto('/admin/support/faqs');
  await expect(page.getByRole('heading', { name: 'Quản lý FAQ' })).toBeVisible();
  await page.getByRole('button', { name: 'FAQ mới', exact: true }).click();
  await expect(page.getByText('Lý do', { exact: true })).toHaveCount(0);
  await page.getByLabel('Câu hỏi').fill(`FAQ E2E ${Date.now()}`);
  await page.getByLabel('Nội dung Markdown').fill('Nội dung **FAQ** kiểm thử.');
  await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await expect(page.getByText('Đã tạo FAQ.')).toBeVisible();
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
  const response = await request.post(`${apiBase}/auth/register`, {
    data: {
      ...input,
      verificationToken: (await verify.json()).data.verificationToken,
      acceptTerms: true,
      acceptPrivacy: true,
    },
    headers,
  });
  expect(response.status()).toBe(201);
  return { cookies: cookieHeader(response) };
}

async function login(
  request: APIRequestContext,
  username: string,
  password: string,
  apiBase: string,
) {
  const response = await request.post(`${apiBase}/auth/login`, {
    data: { username, password },
    headers: { origin: 'http://lvh.me:3300' },
  });
  expect(response.status()).toBe(201);
  return cookieHeader(response);
}

async function registerTicket(request: APIRequestContext, memberEmail: string, apiBase: string) {
  const member = await login(request, memberEmail, 'MemberPassword123!', apiBase);
  const faqs = await request.get(`${apiBase}/support/faqs`, {
    headers: { origin: 'http://lvh.me:3300' },
  });
  const categoryId = (await faqs.json()).data.categories[0].id;
  const ticket = await request.post(`${apiBase}/support/tickets`, {
    headers: { origin: 'http://lvh.me:3300', cookie: member },
    data: {
      categoryId,
      subject: `E2E Support queue ${Date.now()}`,
      description: 'Nội dung ticket E2E cho support operations.',
    },
  });
  expect(ticket.status()).toBe(201);
  return (await ticket.json()).data.ticketNo as string;
}

function cookieHeader(response: { headers(): Record<string, string> }) {
  const setCookie = response.headers()['set-cookie'] ?? '';
  return setCookie
    .split(/,\s*(?=[a-z_]+=)/iu)
    .map((cookie) => cookie.split(';')[0])
    .join('; ');
}
