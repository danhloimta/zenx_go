import { expect, test } from '@playwright/test';

test('homepage links resolve to the live portal content surfaces', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('a[href="/events/season-6-luc-dia-dam-me"]').first()).toHaveAttribute('href', '/events/season-6-luc-dia-dam-me');
  await expect(page.getByRole('link', { name: 'Xem tất cả bài viết', exact: true })).toHaveAttribute('href', '/news');
  await expect(page.getByRole('link', { name: 'Sự kiện nổi bật Quà tặng mỗi ngày', exact: true })).toHaveAttribute('href', '/events');
  await expect(page.getByRole('link', { name: 'VIP & Ưu đãi Đặc quyền hấp dẫn', exact: true })).toHaveAttribute('href', '/rewards');
  await expect(page.getByRole('link', { name: 'Tham gia cộng đồng', exact: true }).last()).toHaveAttribute('href', '/community');
});

test('portal news and events use database content and canonical destinations', async ({ page }) => {
  const newsResponse = await page.goto('/news?game=luc-dia-dam-me');
  expect(newsResponse?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Tin mới từ các thế giới' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Không gian gameplay là ưu tiên/ }).first()).toHaveAttribute('href', /^http:\/\/lucdia\.lvh\.me:3300\/tin-tuc\//);

  const eventResponse = await page.goto('/events');
  expect(eventResponse?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Sự kiện nổi bật' })).toBeVisible();
  await page.getByRole('link', { name: /Season 6 Lục Địa Đam Mê/ }).first().click();
  await expect(page).toHaveURL(/\/events\/season-6-luc-dia-dam-me$/);
  await expect(page.getByRole('heading', { name: 'Season 6 Lục Địa Đam Mê' }).first()).toBeVisible();
  await expect(page.locator('article .prose')).toContainText('Season 6 đã mở cửa');
});

test('community and rewards surfaces render without placeholder external destinations', async ({ page }) => {
  const communityResponse = await page.goto('/community');
  expect(communityResponse?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Cùng trải nghiệm những thế giới đáng nhớ' })).toBeVisible();
  const externalLinks = page.locator('a[target="_blank"]');
  for (const link of await externalLinks.all()) {
    await expect(link).not.toHaveAttribute('href', /^(https:\/\/discord\.com|https:\/\/facebook\.com|https:\/\/youtube\.com|https:\/\/tiktok\.com)$/);
  }

  const rewardsResponse = await page.goto('/rewards');
  expect(rewardsResponse?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Đặc quyền thành viên & Ưu đãi', exact: true })).toBeVisible();
});

test('the live game subdomain exposes every enabled content page', async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ 'x-forwarded-host': 'lucdia.lvh.me:3300' });
  for (const [path, heading] of [
    ['/gioi-thieu', 'Lục Địa Đam Mê'],
    ['/tin-tuc', 'Tin tức mới nhất'],
    ['/roadmap', 'Lộ trình vận hành'],
  ] as const) {
    const response = await page.goto(`http://lvh.me:3300${path}`);
    expect(response?.status(), path).toBe(200);
    await expect(page.getByRole('heading', { name: heading, exact: true }).first()).toBeVisible();
  }
});
