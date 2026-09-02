import { expect, test } from '@playwright/test';

test('landing page exposes the account and wallet entry points', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Đăng nhập', exact: true }).first()).toBeVisible();
  const mobileMenu = page.getByRole('button', { name: 'Toggle menu' });
  if (await mobileMenu.isVisible()) {
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await expect(page.locator('a[href="/auth/register"]').last()).toBeVisible();
  } else {
    await expect(page.locator('a[href="/auth/register"]').first()).toBeVisible();
  }
  await expect(page.getByText('Lục Địa Đam Mê', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('Chiến Tuyến Orion', { exact: false }).first()).toBeVisible();
});

test('game hostnames resolve the shared game shell and routes', async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ 'x-forwarded-host': 'lucdia.lvh.me:3300' });
  await page.goto('http://lvh.me:3300/');
  await expect(page.getByRole('heading', { name: 'Lục Địa Đam Mê', exact: true }).first()).toBeVisible();
  await page.context().setExtraHTTPHeaders({ 'x-forwarded-host': 'hoalong.lvh.me:3300' });
  await page.goto('http://lvh.me:3300/');
  await expect(page.getByRole('heading', { name: 'Vương Triều Hỏa Long', exact: true }).first()).toBeVisible();
  await expect(page.getByText('Đang hoạt động', { exact: true }).first()).toBeVisible();
  await page.context().setExtraHTTPHeaders({ 'x-forwarded-host': 'orion.lvh.me:3300' });
  await page.goto('http://lvh.me:3300/');
  await expect(page.getByRole('heading', { name: 'Chiến Tuyến Orion', exact: true }).first()).toBeVisible();
  await expect(page.getByText('Đang hoạt động', { exact: true }).first()).toBeVisible();
});

test('game cards and article cards link to their public destinations', async ({ page }) => {
  await page.goto('/');
  const gameCard = page.locator('a[href*="lucdia.lvh.me"]').first();
  await expect(gameCard).toHaveAttribute('href', /^http:\/\/lucdia\.lvh\.me:3300\//);
  for (const subdomain of ['lucdia', 'hoalong', 'thitranmay', 'orion']) {
    await expect(page.locator(`a[href*="${subdomain}.lvh.me"]:visible`).first()).toBeVisible();
  }
  for (const [subdomain, title] of [
    ['lucdia', 'LỤC ĐỊA ĐAM MÊ'],
    ['hoalong', 'Vương Triều Hỏa Long'],
    ['thitranmay', 'Thị Trấn Mây'],
    ['orion', 'Chiến Tuyến Orion'],
  ]) {
    const avatar = page.locator(`img[title="${title}"]`).first();
    await expect(avatar.locator('..')).toHaveAttribute('href', new RegExp(`^http://${subdomain}\\.lvh\\.me:3300/`));
  }
  const articleCard = page.getByRole('link', { name: /Đọc bài viết/ }).first();
  await expect(articleCard).toHaveAttribute('href', /^http:\/\/orion\.lvh\.me:3300\/tin-tuc\//);
});

test('game article metadata uses the article canonical URL', async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ 'x-forwarded-host': 'lucdia.lvh.me:3300' });
  await page.goto('http://lvh.me:3300/tin-tuc/world-remake');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'http://lucdia.lvh.me:3300/tin-tuc/world-remake');
});

test('all live game routes resolve and download remains unavailable', async ({ page }) => {
  for (const subdomain of ['lucdia', 'hoalong', 'thitranmay', 'orion']) {
    await page.context().setExtraHTTPHeaders({ 'x-forwarded-host': `${subdomain}.lvh.me:3300` });
    for (const path of ['/gioi-thieu', '/roadmap']) {
      const response = await page.goto(`http://lvh.me:3300${path}`);
      expect(response?.status(), `${subdomain}${path}`).toBe(200);
    }
    const downloadResponse = await page.goto('http://lvh.me:3300/tai-game');
    expect(downloadResponse?.status(), `${subdomain}/tai-game`).toBe(404);
    const newsResponse = await page.goto('http://lvh.me:3300/tin-tuc');
    expect(newsResponse?.status(), `${subdomain}/tin-tuc`).toBe(200);
    await expect(page.getByRole('heading', { name: 'Tin tức mới nhất', exact: true })).toBeVisible();
  }
});

test('unknown game host returns a real 404', async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ 'x-forwarded-host': 'unknown-game.lvh.me:3300' });
  const response = await page.goto('http://lvh.me:3300/');
  expect(response?.status()).toBe(404);
});

test('login route renders its form', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.getByRole('heading', { name: 'Đăng nhập tài khoản', exact: true })).toBeVisible();
  await expect(page.getByLabel('Tên đăng nhập hoặc email')).toBeVisible();
});

test('protected wallet routes redirect an expired session to login', async ({ page }) => {
  await page.goto('/wallet');
  await expect(page).toHaveURL(/\/auth\/login\?returnTo=http%3A%2F%2Flvh\.me%3A3300%2Fwallet/);
});

test('legal footer links resolve to explicit documents', async ({ page }) => {
  await page.goto('/terms');
  await expect(page.getByRole('heading', { name: 'Điều khoản sử dụng' })).toBeVisible();
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Chính sách bảo mật' })).toBeVisible();
});
