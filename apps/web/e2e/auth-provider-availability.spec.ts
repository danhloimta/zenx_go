import { expect, test, type Page, type Route } from '@playwright/test';

const availabilityUrl = '**/api/v1/auth/provider-availability';
const authPages = [
  {
    path: '/auth/login',
    divider: 'Hoặc đăng nhập với',
    passwordField: 'Mật khẩu',
  },
  {
    path: '/auth/register',
    divider: 'Hoặc đăng ký bằng tài khoản',
    passwordField: 'Mật khẩu',
  },
] as const;

for (const { google, facebook } of [
  { google: true, facebook: true },
  { google: true, facebook: false },
  { google: false, facebook: true },
  { google: false, facebook: false },
]) {
  test.describe(`provider availability: google=${google}, facebook=${facebook}`, () => {
    for (const authPage of authPages) {
      test(`${authPage.path} projects enabled providers`, async ({ page }) => {
        await mockAvailability(page, { google, facebook });
        const availabilityResponse = page.waitForResponse((response) =>
          response.url().includes('/api/v1/auth/provider-availability'),
        );
        await page.goto(authPage.path);
        await availabilityResponse;

        await expectSocialProjection(page, authPage.divider, { google, facebook });
        await expect(page.getByRole('textbox', { name: authPage.passwordField, exact: true })).toBeEnabled();
      });
    }
  });
}

for (const authPage of authPages) {
  test(`${authPage.path} fails closed while provider availability loads`, async ({ page }) => {
    let releaseResponse: (() => void) | undefined;
    const released = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });

    await page.route(availabilityUrl, async (route) => {
      await released;
      await fulfillAvailability(route, { google: true, facebook: true });
    });

    await page.goto(authPage.path);
    await expectSocialProjection(page, authPage.divider, { google: false, facebook: false });
    await expect(page.getByRole('textbox', { name: authPage.passwordField, exact: true })).toBeEnabled();

    releaseResponse?.();
    await expectSocialProjection(page, authPage.divider, { google: true, facebook: true });
  });

  test(`${authPage.path} fails closed when provider availability errors`, async ({ page }) => {
    await page.route(availabilityUrl, (route) => route.fulfill({
      status: 503,
      contentType: 'application/json',
      headers: { 'cache-control': 'no-store' },
      body: JSON.stringify({
        data: null,
        error: { code: 'SETTINGS_UNAVAILABLE', message: 'Unavailable' },
      }),
    }));

    const availabilityResponse = page.waitForResponse((response) =>
      response.url().includes('/api/v1/auth/provider-availability'),
    );
    await page.goto(authPage.path);
    await availabilityResponse;

    await expectSocialProjection(page, authPage.divider, { google: false, facebook: false });
    await expect(page.getByRole('textbox', { name: authPage.passwordField, exact: true })).toBeEnabled();
  });
}

test('cached providers fail closed during a stale query refetch', async ({ page }) => {
  let requestCount = 0;
  let releaseRefetch: (() => void) | undefined;
  const refetchReleased = new Promise<void>((resolve) => {
    releaseRefetch = resolve;
  });

  await page.route(availabilityUrl, async (route) => {
    requestCount += 1;
    if (requestCount > 1) await refetchReleased;
    await fulfillAvailability(route, { google: true, facebook: true });
  });

  await page.goto('/auth/login');
  await expectSocialProjection(page, 'Hoặc đăng nhập với', { google: true, facebook: true });

  await page.getByRole('link', { name: 'Tạo tài khoản', exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/register$/);
  await expect.poll(() => requestCount).toBe(2);
  await expectSocialProjection(page, 'Hoặc đăng ký bằng tài khoản', { google: false, facebook: false });
  await expect(page.getByRole('textbox', { name: 'Mật khẩu', exact: true })).toBeEnabled();

  releaseRefetch?.();
  await expectSocialProjection(page, 'Hoặc đăng ký bằng tài khoản', { google: true, facebook: true });
});

for (const authPage of authPages) {
  test(`${authPage.path} fails closed while cached provider refetch is paused offline`, async ({
    context,
    page,
  }) => {
    await mockAvailability(page, { google: true, facebook: true });
    const availabilityResponse = page.waitForResponse((response) =>
      response.url().includes('/api/v1/auth/provider-availability'),
    );
    await page.goto(authPage.path);
    await availabilityResponse;
    await expectSocialProjection(page, authPage.divider, { google: true, facebook: true });

    const otherPage = authPage.path === '/auth/login'
      ? { path: '/auth/register', link: 'Tạo tài khoản' }
      : { path: '/auth/login', link: 'Đăng nhập ngay' };
    await page.getByRole('link', { name: otherPage.link, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${otherPage.path}$`));
    await expectSocialProjection(page, otherPage.path === '/auth/login' ? 'Hoặc đăng nhập với' : 'Hoặc đăng ký bằng tài khoản', {
      google: true,
      facebook: true,
    });

    await context.setOffline(true);
    const targetLink = authPage.path === '/auth/login' ? 'Đăng nhập ngay' : 'Tạo tài khoản';
    await page.getByRole('link', { name: targetLink, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${authPage.path}$`));

    await expectSocialProjection(page, authPage.divider, { google: false, facebook: false });
    await expect(page.getByRole('textbox', { name: authPage.passwordField, exact: true })).toBeEnabled();
  });
}

for (const { code, message } of [
  { code: 'provider_disabled', message: 'Phương thức đăng nhập này hiện không khả dụng.' },
  { code: 'settings_unavailable', message: 'Phương thức đăng nhập này hiện không khả dụng.' },
]) {
  test(`login shows neutral copy for ${code}`, async ({ page }) => {
    await mockAvailability(page, { google: false, facebook: false });
    await page.goto(`/auth/login?social_error=${code}`);

    await expect(page.getByText(message, { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Mật khẩu', exact: true })).toBeEnabled();
  });
}

async function mockAvailability(
  page: Page,
  availability: { google: boolean; facebook: boolean; otpRequired?: boolean; phoneRegistrationOtpRequired?: boolean },
) {
  await page.route(availabilityUrl, (route) => fulfillAvailability(route, availability));
}

async function fulfillAvailability(
  route: Route,
  availability: { google: boolean; facebook: boolean; otpRequired?: boolean; phoneRegistrationOtpRequired?: boolean },
) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'cache-control': 'no-store' },
    body: JSON.stringify({
      data: {
        ...availability,
        otpRequired: availability.otpRequired ?? availability.phoneRegistrationOtpRequired ?? true,
        phoneRegistrationOtpRequired: availability.phoneRegistrationOtpRequired ?? availability.otpRequired ?? true,
      },
      error: null,
    }),
  });
}

async function expectSocialProjection(
  page: Page,
  divider: string,
  availability: { google: boolean; facebook: boolean },
) {
  await expect(page.getByRole('link', { name: 'Google', exact: true })).toHaveCount(availability.google ? 1 : 0);
  await expect(page.getByRole('link', { name: 'Facebook', exact: true })).toHaveCount(availability.facebook ? 1 : 0);
  await expect(page.getByText(divider, { exact: true })).toHaveCount(availability.google || availability.facebook ? 1 : 0);
}
