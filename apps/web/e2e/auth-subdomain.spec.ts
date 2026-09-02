import { expect, test, type Page } from '@playwright/test';

test.describe('cross-subdomain authentication', () => {
  test('password login returns from the portal to the requested game path', async ({ page }) => {
    const account = await registerAccount(page, 'password');
    await page.context().clearCookies();

    const returnTo = `http://orion.lvh.me:3300/?from=password&player=${encodeURIComponent(account.username)}`;
    await gotoLogin(page, returnTo);
    await page.getByLabel('Tên đăng nhập hoặc email').fill(account.email);
    await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill(account.password);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();

    await expect(page).toHaveURL(returnTo);
    await expect(page.getByText(account.email, { exact: true })).toBeVisible();
    await expectSharedSessionCookies(page);
  });

  test('the shared cookie authenticates a second game host and refreshes an expired access cookie', async ({ page }) => {
    const account = await registerAccount(page, 'refresh');
    await page.context().clearCookies();
    await loginAtPortal(page, account, 'http://orion.lvh.me:3300/');

    await page.context().clearCookies({ name: 'zenx_access' });
    await page.goto('http://hoalong.lvh.me:3300/');
    await expect(page.getByText(account.email, { exact: true })).toBeVisible();
    await expectSharedSessionCookies(page);
  });

  test('concurrent refreshes from two game hosts converge on the shared session', async ({ page, context }) => {
    const account = await registerAccount(page, 'race');
    await page.context().clearCookies();
    await loginAtPortal(page, account, 'http://orion.lvh.me:3300/');
    await context.clearCookies({ name: 'zenx_access' });

    const secondPage = await context.newPage();
    await Promise.all([
      page.goto('http://orion.lvh.me:3300/'),
      secondPage.goto('http://hoalong.lvh.me:3300/'),
    ]);
    await expect(page.getByText(account.email, { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(secondPage.getByText(account.email, { exact: true })).toBeVisible({ timeout: 15_000 });
    await secondPage.close();
  });

  test('logout at the portal invalidates the shared cookie for game hosts', async ({ page }) => {
    const account = await registerAccount(page, 'logout');
    await page.context().clearCookies();
    await loginAtPortal(page, account, 'http://orion.lvh.me:3300/');

    await page.goto('http://lvh.me:3300/account');
    await page.getByRole('button', { name: 'Menu tài khoản', exact: true }).click();
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).last().click();
    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.context().cookies()).resolves.toEqual([]);

    await page.goto('http://orion.lvh.me:3300/');
    await expect(page.getByText(account.email, { exact: true })).toHaveCount(0);
    await expect(page.getByText('Tài khoản', { exact: true }).first()).toBeVisible();
  });

  for (const provider of ['Google', 'Facebook']) {
    test(`OAuth ${provider} returns to the originating game path`, async ({ page }) => {
      test.setTimeout(45_000);
      const returnTo = `http://orion.lvh.me:3300/?from=${provider.toLowerCase()}`;
      await page.goto(`http://orion.lvh.me:3300/?from=${provider.toLowerCase()}`);
      await page.getByRole('link', { name: 'Tài khoản', exact: true }).click();
      await expect(page).toHaveURL(/\/auth\/login\?returnTo=/);
      await page.getByRole('link', { name: provider, exact: true }).click();

      await expect(page).toHaveURL(returnTo);
      await expect(page.getByRole('link', { name: new RegExp(`^${provider.toLowerCase()}-.*@example\\.com$`) }).first()).toBeVisible();
      await expectSharedSessionCookies(page);
    });
  }
});

type Account = { username: string; email: string; password: string };

async function registerAccount(page: Page, label: string): Promise<Account> {
  const suffix = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const account = {
    username: `cross${suffix.replace(/[^a-z0-9]/gi, '').slice(-20)}`,
    email: `cross-${suffix}@example.com`,
    password: 'Password123!',
  };
  const phone = `+849${String(Math.floor(Math.random() * 100_000_000)).padStart(8, '0')}`;

  await page.goto('/auth/register');
  await page.getByLabel('Tên đăng nhập').fill(account.username);
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Số điện thoại').fill(phone);
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill(account.password);
  await page.getByRole('textbox', { name: 'Xác nhận mật khẩu', exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Gửi OTP' }).click();
  await expect(page.getByText(/Đã gửi OTP/)).toBeVisible({ timeout: 10_000 });
  await page.getByLabel('Nhập số OTP').fill('123456');
  await page.locator('input[type="checkbox"]').nth(0).check();
  await page.getByRole('button', { name: 'Đăng ký tài khoản' }).click();
  await expect(page).toHaveURL(/\/account\/complete-profile/);
  await page.getByLabel('Họ và tên').fill(`Cross ${label}`);
  await page.getByLabel('Ngày sinh').fill('2000-01-01');
  await page.getByLabel('Tỉnh / Thành phố').fill('Ho Chi Minh City');
  await page.getByRole('button', { name: 'Hoàn tất hồ sơ' }).click();
  await expect(page).toHaveURL(/\/account\/profile/);
  return account;
}

async function loginAtPortal(page: Page, account: Account, returnTo: string) {
  await gotoLogin(page, returnTo);
  await page.getByLabel('Tên đăng nhập hoặc email').fill(account.email);
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(returnTo);
  await expect(page.getByText(account.email, { exact: true })).toBeVisible();
}

async function gotoLogin(page: Page, returnTo: string) {
  await page.goto('about:blank');
  await page.goto(`http://lvh.me:3300/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
}

async function expectSharedSessionCookies(page: Page) {
  const cookies = await page.context().cookies();
  const access = cookies.find((cookie) => cookie.name === 'zenx_access');
  const refresh = cookies.find((cookie) => cookie.name === 'zenx_refresh');
  expect(access).toBeTruthy();
  expect(refresh).toBeTruthy();
  expect(access?.domain.replace(/^\./, '')).toBe('lvh.me');
  expect(refresh?.domain.replace(/^\./, '')).toBe('lvh.me');
  expect(access?.path).toBe('/');
  expect(refresh?.path).toBe('/api/v1/auth');
  expect(access?.httpOnly).toBe(true);
  expect(refresh?.httpOnly).toBe(true);
  expect(access?.sameSite).toBe('Lax');
  expect(refresh?.sameSite).toBe('Lax');
}
