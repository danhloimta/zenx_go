import { expect, test } from '@playwright/test';

test('landing page exposes the account and wallet entry points', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Đăng nhập', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tạo tài khoản', exact: true }).first()).toBeVisible();
});

test('login route renders its form', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.getByRole('heading', { name: 'Đăng nhập tài khoản', exact: true })).toBeVisible();
  await expect(page.getByLabel('Tên đăng nhập hoặc email')).toBeVisible();
});

test('protected wallet routes redirect an expired session to login', async ({ page }) => {
  await page.goto('/wallet');
  await expect(page).toHaveURL(/\/auth\/login\?next=%2Fwallet/);
});

test('legal footer links resolve to explicit demo documents', async ({ page }) => {
  await page.goto('/terms');
  await expect(page.getByRole('heading', { name: 'Điều khoản sử dụng' })).toBeVisible();
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Chính sách bảo mật' })).toBeVisible();
});
