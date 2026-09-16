import { expect, test, type APIRequestContext, type Browser, type BrowserContext } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { resolve } from 'node:path';

const apiBase = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:4300/api/v1';
const password = 'GameContentE2ePassword123!';

test.describe('scoped game content workspace', () => {
  test.skip(({ isMobile }) => isMobile, 'The CMS workspace is covered at its desktop layout.');

  test('a Content Manager publishes, edits, deletes/restores Orion content without gaining Hoa Long access', async ({ browser, request }) => {
    test.setTimeout(90_000);
    const suffix = `${Date.now()}${randomInt(1000, 9999)}`;
    const superAdmin = account('content-super', suffix);
    const contentManager = account('content-manager', suffix);
    await Promise.all([register(request, superAdmin), register(request, contentManager)]);
    execFileSync('pnpm', ['admin:role', 'grant', `--email=${superAdmin.email}`], { cwd: resolve(__dirname, '../..'), env: process.env, stdio: 'pipe' });

    const [orion, hoaLong] = await Promise.all([game(request, 'orion'), game(request, 'hoalong')]);
    const superAdminContext = await signedInContext(browser, superAdmin);
    const superAdminPage = await superAdminContext.newPage();
    await superAdminPage.goto(`http://lvh.me:3300/admin/content/games/${orion.id}/access`);
    await expect(superAdminPage.getByRole('heading', { name: 'Admin & SSO game' })).toBeVisible();
    await superAdminPage.getByRole('button', { name: 'Cấp hoặc thu hồi quyền' }).click();
    const assignment = superAdminPage.getByRole('dialog').first();
    await assignment.getByPlaceholder('Tìm username hoặc email (từ 2 ký tự)').fill(contentManager.email);
    await expect(assignment.locator('select')).toContainText(contentManager.email);
    await assignment.locator('select').selectOption({ label: `${contentManager.username} — ${contentManager.email}` });
    await assignment.getByLabel('Quản lý nội dung game').check();
    await assignment.getByPlaceholder('Lý do (ít nhất 3 ký tự)').fill('E2E content manager assignment for Orion.');
    await assignment.getByRole('button', { name: 'Lưu quyền' }).click();
    await expect(superAdminPage.getByText(contentManager.username, { exact: true })).toBeVisible();

    const contentContext = await signedInContext(browser, contentManager);
    const contentPage = await contentContext.newPage();
    const articleTitle = `Orion CMS article ${suffix}`;
    const articleSlug = `orion-cms-${suffix}`;
    await contentPage.goto('http://orion.lvh.me:3300/admin/articles/new');
    await expect(contentPage.getByText('Game hiện tại', { exact: true })).toBeVisible();
    await contentPage.locator('#article-title').fill(articleTitle);
    await contentPage.locator('#article-slug').fill(articleSlug);
    await contentPage.locator('#article-excerpt').fill('An Orion article created by the scoped E2E workspace.');
    await contentPage.getByLabel('Nội dung Markdown').fill(`# ${articleTitle}\n\nPublished exclusively for Orion.`);
    await contentPage.getByRole('button', { name: 'Tạo & Xuất bản' }).click();
    await expect(contentPage).toHaveURL(/\/admin\/articles$/);
    const articleLink = contentPage.getByRole('link', { name: articleTitle });
    await expect(articleLink).toBeVisible();
    const articleHref = await articleLink.getAttribute('href');
    expect(articleHref).toMatch(/^\/admin\/articles\//);
    const articleId = articleHref!.split('/').at(-1)!;

    await articleLink.click();
    await expect(contentPage.getByText('Bản nháp', { exact: true })).toBeVisible();
    await contentPage.getByRole('button', { name: 'Xuất bản', exact: true }).click();
    await contentPage.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await expect(contentPage.getByText('Đã lưu bài viết thành công.')).toBeVisible();
    await contentPage.locator('#article-excerpt').fill('The edited Orion-only excerpt is public after publication.');
    await contentPage.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await expect(contentPage.getByText('Đã lưu bài viết thành công.')).toBeVisible();

    await contentPage.goto(`http://orion.lvh.me:3300/tin-tuc/${articleSlug}`);
    await expect(contentPage.getByRole('heading', { name: articleTitle })).toBeVisible();
    await expect(contentPage.getByText('Published exclusively for Orion.')).toBeVisible();

    await contentPage.goto(`http://orion.lvh.me:3300/admin/articles/${articleId}`);
    await contentPage.getByRole('button', { name: 'Xóa bài' }).click();
    await contentPage.getByRole('button', { name: 'Xóa vào thùng rác' }).click();
    await expect(contentPage).toHaveURL(/\/admin\/articles$/);
    await contentPage.getByRole('button', { name: 'Thùng rác' }).click();
    await expect(contentPage.getByText(articleTitle, { exact: true })).toBeVisible();
    await contentPage.getByRole('button', { name: 'Khôi phục', exact: true }).click();
    await contentPage.getByRole('button', { name: 'Tất cả', exact: true }).click();
    await expect(contentPage.getByText(articleTitle, { exact: true })).toBeVisible();

    const eventTitle = `Orion CMS event ${suffix}`;
    const eventSlug = `orion-event-${suffix}`;
    await contentPage.goto('http://orion.lvh.me:3300/admin/events/new');
    await contentPage.locator('#event-title').fill(eventTitle);
    await contentPage.locator('#event-slug').fill(eventSlug);
    await contentPage.locator('#event-excerpt').fill('A scoped event for Orion players.');
    await contentPage.getByLabel('Nội dung Markdown').fill(`## ${eventTitle}\n\nOrion event details.`);
    await contentPage.getByRole('button', { name: 'Tạo sự kiện ngay', exact: true }).click();
    await expect(contentPage).toHaveURL(/\/admin\/events$/);
    const eventLink = contentPage.getByRole('link', { name: eventTitle });
    await expect(eventLink).toBeVisible();
    await eventLink.click();
    await contentPage.getByRole('button', { name: 'Xuất bản', exact: true }).click();
    await contentPage.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await expect(contentPage.getByText('Đã lưu sự kiện thành công.')).toBeVisible();

    const beforeHoaLong = await publicGame(request, 'hoalong');
    const beforeOrion = await publicGame(request, 'orion');
    await contentPage.goto('http://orion.lvh.me:3300/admin/presentation');
    await expect(contentPage.getByRole('heading', { name: 'Giao diện game' })).toBeVisible();
    const primary = contentPage.locator('#section-theme input[type="text"]').first();
    await primary.fill('#123456');
    await contentPage.getByRole('button', { name: 'Lưu giao diện', exact: true }).click();
    await expect.poll(async () => (await publicGame(request, 'orion')).theme.primary).toBe('#123456');
    const afterHoaLong = await publicGame(request, 'hoalong');
    expect(afterHoaLong.theme.primary).toBe(beforeHoaLong.theme.primary);

    // Restore the seeded Orion presentation so this browser test remains isolated
    // from suites that rely on the standard public theme.
    await primary.fill(beforeOrion.theme.primary);
    await contentPage.getByRole('button', { name: 'Lưu giao diện', exact: true }).click();
    await expect.poll(async () => (await publicGame(request, 'orion')).theme.primary).toBe(beforeOrion.theme.primary);

    const crossRead = await contentContext.request.get(`${apiBase}/game-admin/games/${hoaLong.id}/articles/${articleId}`);
    expect(crossRead.status()).toBe(403);
    const crossMutation = await contentContext.request.patch(`${apiBase}/game-admin/games/${hoaLong.id}/articles/${articleId}`, { data: { expectedUpdatedAt: new Date().toISOString(), title: 'Cross-game overwrite' } });
    expect(crossMutation.status()).toBe(403);
    await contentPage.goto(`http://hoalong.lvh.me:3300/admin/articles/${articleId}`);
    await expect(contentPage).toHaveURL(/http:\/\/lvh\.me:3300\/auth\/login/);

    await Promise.all([superAdminContext.close(), contentContext.close()]);
  });
});

type Account = { username: string; email: string; phone: string; password: string };
type Game = { id: string; subdomain: string };
type PublicGame = { theme: { primary: string } };

function account(prefix: string, suffix: string): Account {
  const compact = `${prefix}${suffix}`.replace(/[^a-z0-9]/gi, '').slice(-20).toLowerCase();
  return { username: compact, email: `${prefix}-${suffix}@example.com`, phone: `+849${String(randomInt(10_000_000, 99_999_999))}`, password };
}

async function register(request: APIRequestContext, input: Account) {
  const headers = { origin: 'http://lvh.me:3300' };
  const sent = await request.post(`${apiBase}/otp/send`, { data: { channel: 'SMS', purpose: 'VERIFY_PHONE', destination: input.phone }, headers });
  expect(sent.status()).toBe(201);
  const verified = await request.post(`${apiBase}/otp/verify`, { data: { channel: 'SMS', purpose: 'VERIFY_PHONE', destination: input.phone, code: '123456' }, headers });
  expect(verified.status()).toBe(201);
  const response = await request.post(`${apiBase}/auth/register`, { data: { ...input, verificationToken: (await verified.json()).data.verificationToken, acceptTerms: true, acceptPrivacy: true }, headers });
  expect(response.status()).toBe(201);
}

async function game(request: APIRequestContext, subdomain: string): Promise<Game> {
  const response = await request.get(`${apiBase}/games/admin-by-subdomain/${subdomain}`);
  expect(response.status()).toBe(200);
  return (await response.json()).data;
}

async function publicGame(request: APIRequestContext, subdomain: string): Promise<PublicGame> {
  const response = await request.get(`${apiBase}/games/by-subdomain/${subdomain}`);
  expect(response.status()).toBe(200);
  return (await response.json()).data;
}

async function signedInContext(browser: Browser, input: Account): Promise<BrowserContext> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://lvh.me:3300/auth/login');
  await page.getByLabel('Tên đăng nhập hoặc email').fill(input.email);
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill(input.password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/\/account/);
  await page.close();
  return context;
}
