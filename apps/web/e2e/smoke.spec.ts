import { expect, test } from '@playwright/test';

test('landing page exposes the account and wallet entry points', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /đăng nhập/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /xem ví/i })).toBeVisible();
});

test('login route renders its form', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.getByRole('heading', { name: /chào mừng trở lại/i })).toBeVisible();
  await expect(page.getByLabel(/username/i)).toBeVisible();
});
