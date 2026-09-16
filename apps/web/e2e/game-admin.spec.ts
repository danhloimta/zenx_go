import { expect, test, type APIRequestContext, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { resolve } from 'node:path';

const apiBase = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:4300/api/v1';
const gameSsoMock = 'http://127.0.0.1:4500';
const gameSsoCallback = 'http://game-sso.localhost:4500/callback';
const password = 'GameAdminE2ePassword123!';

test.describe('game administrator and player SSO journey', () => {
  test.skip(({ isMobile }) => isMobile, 'The SSO CTA is intentionally desktop-only.');

  test('SUPER_ADMIN assigns an Orion moderator, scopes access, and can block then unblock a game SSO player', async ({ browser, request }) => {
    test.setTimeout(90_000);
    const suffix = `${Date.now()}${randomInt(1000, 9999)}`;
    const superAdmin = account('game-super', suffix);
    const moderator = account('game-moderator', suffix);
    const player = account('game-player', suffix);
    await Promise.all([register(request, superAdmin), register(request, moderator), register(request, player)]);
    execFileSync('pnpm', ['admin:role', 'grant', `--email=${superAdmin.email}`], {
      cwd: resolve(__dirname, '../..'),
      env: process.env,
      stdio: 'pipe',
    });

    const [orion, hoaLong] = await Promise.all([game(request, 'orion'), game(request, 'hoalong')]);
    const superAdminContext = await signedInContext(browser, superAdmin);
    const superAdminPage = await superAdminContext.newPage();
    await superAdminPage.goto(`http://lvh.me:3300/admin/content/games/${orion.id}/access`);
    await expect(superAdminPage.getByRole('heading', { name: 'Admin & SSO game' })).toBeVisible();

    await superAdminPage.getByRole('button', { name: 'Cấp hoặc thu hồi quyền' }).click();
    const assignment = superAdminPage.getByRole('dialog').first();
    await assignment.getByPlaceholder('Tìm username hoặc email (từ 2 ký tự)').fill(moderator.email);
    await expect(assignment.locator('select')).toContainText(moderator.email);
    await assignment.locator('select').selectOption({ label: `${moderator.username} — ${moderator.email}` });
    await assignment.getByLabel('Điều phối người chơi').check();
    await assignment.getByPlaceholder('Lý do (ít nhất 3 ký tự)').fill('E2E moderator assignment for Orion.');
    await assignment.getByRole('button', { name: 'Lưu quyền' }).click();
    await expect(superAdminPage.getByText(moderator.username, { exact: true })).toBeVisible();

    // The public CTA is enabled only after an active client is configured. The secret is
    // provided to the in-process mock directly and never written to test output.
    await superAdminPage.getByPlaceholder('https://game.example.com/sso/callback').fill(gameSsoCallback);
    const createsClient = await superAdminPage.getByRole('button', { name: 'Tạo SSO client' }).count();
    await superAdminPage.getByRole('button', { name: createsClient ? 'Tạo SSO client' : 'Lưu callback URL' }).click();
    if (!createsClient) await superAdminPage.getByRole('button', { name: 'Rotate secret' }).click();
    const secretDialog = superAdminPage.getByRole('dialog').last();
    await expect(secretDialog.getByRole('heading', { name: 'Client secret mới' })).toBeVisible();
    const clientSecret = (await secretDialog.locator('code').innerText()).trim();
    const clientId = (await superAdminPage.locator('p').filter({ hasText: 'Client ID:' }).locator('code').innerText()).trim();
    await configureGameSsoMock(request, { clientId, clientSecret });
    await secretDialog.getByRole('button', { name: 'Tôi đã lưu secret' }).click();

    const ctaPage = await superAdminContext.newPage();
    await ctaPage.goto('http://orion.lvh.me:3300/');
    await expect(ctaPage.getByRole('button', { name: 'Chơi ngay' })).toBeVisible();
    await superAdminPage.getByRole('button', { name: 'Tắt SSO' }).click();
    await expect(superAdminPage.getByText(/Đang tắt/)).toBeVisible();
    await ctaPage.reload();
    await expect(ctaPage.getByRole('button', { name: 'Chơi ngay' })).toHaveCount(0);
    await superAdminPage.getByRole('button', { name: 'Bật SSO' }).click();
    await expect(superAdminPage.getByText(/Đang bật/)).toBeVisible();
    await ctaPage.reload();
    await expect(ctaPage.getByRole('button', { name: 'Chơi ngay' })).toBeVisible();

    await superAdminPage.goto('http://orion.lvh.me:3300/admin/operations');
    await expect(superAdminPage.getByRole('heading', { name: 'Vận hành' })).toBeVisible();
    await superAdminPage.getByLabel('Bật chế độ bảo trì').check();
    await superAdminPage.locator('#maintenance-message').fill('E2E bảo trì Orion trong thời gian ngắn.');
    await superAdminPage.locator('#maintenance-reason').fill('Kiểm tra chế độ bảo trì qua giao diện.');
    await superAdminPage.getByRole('button', { name: 'Bật bảo trì', exact: true }).click();
    await expect(superAdminPage.getByText('Đang bảo trì', { exact: true })).toBeVisible();
    await ctaPage.reload();
    await expect(ctaPage.getByText('E2E bảo trì Orion trong thời gian ngắn.')).toBeVisible();
    await expect(ctaPage.getByRole('button', { name: 'Chơi ngay' })).toHaveCount(0);
    await superAdminPage.getByLabel('Bật chế độ bảo trì').uncheck();
    await superAdminPage.locator('#maintenance-reason').fill('Kết thúc kiểm tra bảo trì qua giao diện.');
    await superAdminPage.getByRole('button', { name: 'Tắt bảo trì', exact: true }).click();
    await expect(superAdminPage.getByText('Sẵn sàng phục vụ', { exact: true })).toBeVisible();
    await ctaPage.reload();
    await expect(ctaPage.getByRole('button', { name: 'Chơi ngay' })).toBeVisible();
    await ctaPage.close();

    const moderatorContext = await signedInContext(browser, moderator);
    const moderatorPage = await moderatorContext.newPage();
    await moderatorPage.goto('http://orion.lvh.me:3300/admin');
    await expect(moderatorPage.getByRole('heading', { name: /Tổng quan/ })).toBeVisible();
    await expect(moderatorPage.getByRole('link', { name: 'Người chơi' })).toBeVisible();
    await expect(moderatorPage.getByRole('link', { name: 'Bài viết' })).toHaveCount(0);
    await expect(moderatorPage.getByRole('link', { name: 'Sự kiện' })).toHaveCount(0);
    await expect(moderatorPage.getByRole('link', { name: 'Giao diện' })).toHaveCount(0);
    await expect(moderatorPage.getByRole('link', { name: 'Nhật ký hoạt động' })).toHaveCount(0);
    await expect(moderatorPage.getByRole('link', { name: 'Vận hành' })).toHaveCount(0);

    await moderatorPage.goto('http://hoalong.lvh.me:3300/admin');
    await expect(moderatorPage.getByText('Không thể truy cập khu vực quản trị game.')).toBeVisible();

    const playerContext = await signedInContext(browser, player);
    const playerPage = await playerContext.newPage();
    const firstExchange = await launchGameAndReadMockResult(playerPage, request);
    expect(firstExchange.state).toBe(firstExchange.authorizeState);
    expect(firstExchange.status).toBe(201);
    expect(firstExchange.identity?.username).toBe(player.username);

    await moderatorPage.goto('http://orion.lvh.me:3300/admin/players');
    await expect(moderatorPage.getByRole('heading', { name: 'Người chơi' })).toBeVisible();
    await moderatorPage.getByPlaceholder('Tìm username, tên hiển thị hoặc User ID').fill(player.username);
    await expect(moderatorPage.getByText(player.username, { exact: true })).toBeVisible();
    await moderatorPage.locator('a[href^="/admin/players/"]').first().click();
    await expect(moderatorPage.getByRole('heading', { name: player.username, exact: true })).toBeVisible();
    await moderatorPage.getByPlaceholder('Thêm ghi chú hỗ trợ nội bộ…').fill('E2E note for this Orion player.');
    await moderatorPage.getByRole('button', { name: 'Lưu ghi chú', exact: true }).click();
    await expect(moderatorPage.getByText('Đã cập nhật ghi chú nội bộ', { exact: true })).toBeVisible();
    await moderatorPage.reload();
    await expect(moderatorPage.getByPlaceholder('Thêm ghi chú hỗ trợ nội bộ…')).toHaveValue('E2E note for this Orion player.');
    await expect(moderatorPage.getByText('Đã cập nhật ghi chú nội bộ', { exact: true })).toBeVisible();

    await moderatorPage.getByRole('button', { name: 'Khóa player', exact: true }).click();
    await moderatorPage.getByPlaceholder('Nhập lý do (tối thiểu 3 ký tự)').fill('E2E block the Orion player.');
    await moderatorPage.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(moderatorPage.getByText('Đã khóa', { exact: true })).toBeVisible();
    await expect(moderatorPage.getByText('Đã khóa player', { exact: true })).toBeVisible();

    await playerPage.goto('http://orion.lvh.me:3300/');
    await playerPage.getByRole('button', { name: 'Chơi ngay' }).click();
    await expect(playerPage).toHaveURL(/\/api\/v1\/game-sso\/authorize/);
    await expect(playerPage.getByText('GAME_PLAYER_BLOCKED')).toBeVisible();

    await moderatorPage.getByRole('button', { name: 'Mở khóa player', exact: true }).click();
    await moderatorPage.getByPlaceholder('Nhập lý do (tối thiểu 3 ký tự)').fill('E2E unblock the Orion player.');
    await moderatorPage.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(moderatorPage.getByText('Hoạt động', { exact: true })).toBeVisible();
    await expect(moderatorPage.getByText('Đã mở khóa player', { exact: true })).toBeVisible();

    const secondExchange = await launchGameAndReadMockResult(playerPage, request);
    expect(secondExchange.state).toBe(secondExchange.authorizeState);
    expect(secondExchange.status).toBe(201);
    expect(secondExchange.identity?.username).toBe(player.username);

    await Promise.all([superAdminContext.close(), moderatorContext.close(), playerContext.close()]);
    expect(hoaLong.id).not.toBe(orion.id);
  });
});

type Account = { username: string; email: string; phone: string; password: string };
type Game = { id: string; slug: string; subdomain: string };
type MockResult = { state: string; authorizeState: string; status: number; identity?: { username: string } };

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
  const body = await response.json();
  return body.data;
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

async function configureGameSsoMock(request: APIRequestContext, input: { clientId: string; clientSecret: string }) {
  const response = await request.post(`${gameSsoMock}/__test/configure`, { data: { apiBaseUrl: apiBase, redirectUri: gameSsoCallback, ...input } });
  expect(response.status()).toBe(204);
}

async function launchGameAndReadMockResult(page: Page, request: APIRequestContext): Promise<MockResult> {
  await request.delete(`${gameSsoMock}/__test/results`);
  let authorizeState = '';
  page.on('request', (outgoing) => {
    const url = new URL(outgoing.url());
    if (url.pathname.endsWith('/game-sso/authorize')) authorizeState = url.searchParams.get('state') ?? '';
  });
  await page.goto('http://orion.lvh.me:3300/');
  await expect(page.getByRole('button', { name: 'Chơi ngay' })).toBeVisible();
  await page.getByRole('button', { name: 'Chơi ngay' }).click();
  await expect(page).toHaveURL(new RegExp(`^${gameSsoCallback.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  await expect(page.getByRole('heading', { name: 'Mock game SSO callback' })).toBeVisible();
  const response = await request.get(`${gameSsoMock}/__test/results`);
  expect(response.status()).toBe(200);
  const result = (await response.json()).results.at(-1) as Omit<MockResult, 'authorizeState'>;
  return { ...result, authorizeState };
}
