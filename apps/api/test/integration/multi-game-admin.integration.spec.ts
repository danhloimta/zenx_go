import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import request = require('supertest');
import * as argon2 from 'argon2';
import { createHash } from 'node:crypto';
import { AppModule } from '../../src/app.module';
import { ApiErrorFilter } from '../../src/common/error.filter';
import { ResponseInterceptor } from '../../src/common/response.interceptor';
import { PrismaService } from '../../src/database/prisma.service';

jest.setTimeout(60_000);

describe('Multi-game administration and player SSO (SQL Server)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let orionId = '';
  let hoaLongId = '';
  let orionSubdomain = '';
  let hoaLongSubdomain = '';
  let orionCallback = '';
  let hoaLongCallback = '';
  let gameAdminId = '';
  let contentManagerId = '';
  let contentOnlyId = '';
  let moderatorId = '';
  let playerId = '';
  let superAdminCookies = '';
  let gameAdminCookies = '';
  let contentManagerCookies = '';
  let contentOnlyCookies = '';
  let moderatorCookies = '';
  let playerCookies = '';
  let contentRoleId = '';
  let moderatorRoleId = '';
  let gameAdminRoleId = '';
  let articleId = '';
  let eventId = '';
  let clientId = '';
  let clientSecret = '';
  let hoaLongClientId = '';
  const suffix = `${Date.now()}${Math.floor(Math.random() * 100_000)}`;
  const password = 'MultiGamePassword123!';
  const fixtureUsers: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ rawBody: true });
    const config = app.get(ConfigService);
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');
    app.enableCors({ origin: config.getOrThrow<string>('webOrigin'), credentials: true });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: true }));
    app.useGlobalFilters(new ApiErrorFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
    prisma = app.get(PrismaService);

    const [template, gameAdmin, contentManager, playerModerator] = await Promise.all([
      prisma.game.findUniqueOrThrow({ where: { subdomain: 'orion' } }),
      prisma.role.findUniqueOrThrow({ where: { code: 'GAME_ADMIN' } }),
      prisma.role.findUniqueOrThrow({ where: { code: 'GAME_CONTENT_MANAGER' } }),
      prisma.role.findUniqueOrThrow({ where: { code: 'GAME_PLAYER_MODERATOR' } }),
    ]);
    const fixtureSuffix = suffix.slice(-12);
    orionSubdomain = `suite-orion-${fixtureSuffix}`;
    hoaLongSubdomain = `suite-hoalong-${fixtureSuffix}`;
    const [orion, hoaLong] = await Promise.all([
      createGameFixture(template, { code: `TSOR${fixtureSuffix}`, name: `Suite Orion ${fixtureSuffix}`, slug: `suite-orion-${fixtureSuffix}`, subdomain: orionSubdomain }),
      createGameFixture(template, { code: `TSHL${fixtureSuffix}`, name: `Suite Hoa Long ${fixtureSuffix}`, slug: `suite-hoalong-${fixtureSuffix}`, subdomain: hoaLongSubdomain }),
    ]);
    orionId = orion.id;
    hoaLongId = hoaLong.id;
    orionCallback = `http://${orionSubdomain}.lvh.me/callback`;
    hoaLongCallback = `http://${hoaLongSubdomain}.lvh.me/callback`;
    gameAdminRoleId = gameAdmin.id;
    contentRoleId = contentManager.id;
    moderatorRoleId = playerModerator.id;

    const superAdmin = await createUser('multisuper', true);
    const gameAdminUser = await createUser('multigameadmin');
    const contentManagerUser = await createUser('multicontent');
    const contentOnlyUser = await createUser('multicontentonly');
    const moderator = await createUser('multimoderator');
    const player = await createUser('multiplayer');
    contentManagerId = contentManagerUser.id;
    contentOnlyId = contentOnlyUser.id;
    moderatorId = moderator.id;
    playerId = player.id;
    superAdminCookies = await login(superAdmin.email);
    gameAdminCookies = await login(gameAdminUser.email);
    contentManagerCookies = await login(contentManagerUser.email);
    contentOnlyCookies = await login(contentOnlyUser.email);
    moderatorCookies = await login(moderator.email);
    playerCookies = await login(player.email);
  });

  afterAll(async () => {
    if (articleId) await prisma.gameArticle.deleteMany({ where: { id: articleId } });
    if (eventId) await prisma.gameEvent.deleteMany({ where: { id: eventId } });
    if (fixtureUsers.length) await (prisma.gameSsoAuthorizationCode as any).deleteMany({ where: { userId: { in: fixtureUsers } } });
    if (clientId || hoaLongClientId) await (prisma.gameSsoClient as any).deleteMany({ where: { clientId: { in: [clientId, hoaLongClientId].filter(Boolean) } } });
    if (fixtureUsers.length) {
      await (prisma.gamePlayer as any).deleteMany({ where: { userId: { in: fixtureUsers } } });
      await (prisma.gameRoleAssignment as any).deleteMany({ where: { userId: { in: fixtureUsers } } });
      await prisma.authorizationAuditLog.deleteMany({ where: { actorUserId: { in: fixtureUsers } } });
      await prisma.refreshSession.deleteMany({ where: { userId: { in: fixtureUsers } } });
      await prisma.wallet.deleteMany({ where: { userId: { in: fixtureUsers } } });
      await prisma.userProfile.deleteMany({ where: { userId: { in: fixtureUsers } } });
      await prisma.user.deleteMany({ where: { id: { in: fixtureUsers } } });
    }
    await prisma.game.deleteMany({ where: { id: { in: [orionId, hoaLongId].filter(Boolean) } } });
    await app.close();
  });

  it('keeps platform roles and game assignments isolated, while merging roles only within one game', async () => {
    const deniedAdmin = await http().get('/admin/dashboard').set('Cookie', contentManagerCookies);
    expect(deniedAdmin.status).toBe(403);
    expect(deniedAdmin.body.error.code).toBe('ADMIN_ACCESS_REQUIRED');

    const deniedAssignment = await http()
      .put(`/admin/games/${orionId}/admins/${moderatorId}`)
      .set('Cookie', contentManagerCookies)
      .send({ roleIds: [moderatorRoleId], reason: 'Attempt without platform admin rights.' });
    expect(deniedAssignment.status).toBe(403);

    const deniedSso = await http()
      .patch(`/admin/games/${orionId}/sso-client`)
      .set('Cookie', contentManagerCookies)
      .send({ redirectUri: orionCallback, isActive: true });
    expect(deniedSso.status).toBe(403);

    const assignedContent = await replaceRoles(orionId, contentManagerId, [contentRoleId]);
    expect(assignedContent.roles.map((role: { id: string }) => role.id)).toEqual([contentRoleId]);
    const merged = await replaceRoles(orionId, contentManagerId, [contentRoleId, moderatorRoleId]);
    expect(merged.roles.map((role: { id: string }) => role.id).sort()).toEqual([contentRoleId, moderatorRoleId].sort());

    const orionContext = await http().get(`/game-admin/context/by-subdomain/${orionSubdomain}`).set('Cookie', contentManagerCookies);
    expect(orionContext.status).toBe(200);
    expect(orionContext.body.data.roles.map((role: { code: string }) => role.code).sort()).toEqual(['GAME_CONTENT_MANAGER', 'GAME_PLAYER_MODERATOR']);
    const hoaContext = await http().get(`/game-admin/context/by-subdomain/${hoaLongSubdomain}`).set('Cookie', contentManagerCookies);
    expect(hoaContext.status).toBe(403);
    expect(hoaContext.body.error.code).toBe('GAME_ACCESS_REQUIRED');

    const stillDeniedPlatformAdmin = await http().get('/admin/dashboard').set('Cookie', contentManagerCookies);
    expect(stillDeniedPlatformAdmin.status).toBe(403);
    expect(stillDeniedPlatformAdmin.body.error.code).toBe('ADMIN_ACCESS_REQUIRED');

    const superAdminAssignment = await replaceRoles(orionId, moderatorId, [moderatorRoleId]);
    expect(superAdminAssignment.roles).toHaveLength(1);
    const gameAdminAssignment = await replaceRoles(orionId, gameAdminId, [gameAdminRoleId]);
    expect(gameAdminAssignment.roles.map((role: { id: string }) => role.id)).toEqual([gameAdminRoleId]);
    const contentOnlyAssignment = await replaceRoles(orionId, contentOnlyId, [contentRoleId]);
    expect(contentOnlyAssignment.roles.map((role: { id: string }) => role.id)).toEqual([contentRoleId]);

  });

  it('scopes CMS mutations to Orion, publishes content, and prevents moderator access', async () => {
    const article = await http()
      .post(`/game-admin/games/${orionId}/articles`)
      .set('Cookie', contentManagerCookies)
      .send({
        gameId: hoaLongId,
        title: 'Orion isolation article',
        slug: `orion-isolation-${suffix}`,
        excerpt: 'A scoped article used to prove game isolation.',
        content: '# Orion\n\nContent belongs to Orion.',
        category: 'DEVELOPMENT_UPDATE',
        status: 'DRAFT',
      });
    expect(article.status).toBe(201);
    articleId = article.body.data.id;
    expect(article.body.data.gameId).toBe(orionId);

    const published = await http()
      .patch(`/game-admin/games/${orionId}/articles/${articleId}`)
      .set('Cookie', contentManagerCookies)
      .send({ expectedUpdatedAt: article.body.data.updatedAt, status: 'PUBLISHED' });
    expect(published.status).toBe(200);
    expect(published.body.data.status).toBe('PUBLISHED');

    const deleted = await http().delete(`/game-admin/games/${orionId}/articles/${articleId}`).set('Cookie', contentManagerCookies);
    expect(deleted.status).toBe(200);
    const restored = await http().post(`/game-admin/games/${orionId}/articles/${articleId}/restore`).set('Cookie', contentManagerCookies);
    expect(restored.status).toBe(201);

    const event = await http()
      .post(`/game-admin/games/${orionId}/events`)
      .set('Cookie', contentManagerCookies)
      .send({
        gameId: hoaLongId,
        title: 'Orion isolation event',
        slug: `orion-event-${suffix}`,
        excerpt: 'A scoped event used to prove game isolation.',
        content: 'Orion event body.',
        startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        status: 'DRAFT',
      });
    expect(event.status).toBe(201);
    eventId = event.body.data.id;
    expect(event.body.data.gameId).toBe(orionId);
    const changedEvent = await http()
      .patch(`/game-admin/games/${orionId}/events/${eventId}`)
      .set('Cookie', contentManagerCookies)
      .send({ expectedUpdatedAt: event.body.data.updatedAt, gameId: hoaLongId, title: 'Updated Orion isolation event', status: 'PUBLISHED' });
    expect(changedEvent.status).toBe(200);
    expect(changedEvent.body.data.gameId).toBe(orionId);

    const crossGameArticle = await http().get(`/game-admin/games/${hoaLongId}/articles/${articleId}`).set('Cookie', superAdminCookies);
    expect(crossGameArticle.status).toBe(404);
    expect(crossGameArticle.body.error.code).toBe('GAME_ARTICLE_NOT_FOUND');
    const crossGameArticlePatch = await http()
      .patch(`/game-admin/games/${hoaLongId}/articles/${articleId}`)
      .set('Cookie', superAdminCookies)
      .send({ expectedUpdatedAt: published.body.data.updatedAt, title: 'Cross-game overwrite attempt' });
    expect(crossGameArticlePatch.status).toBe(404);
    const crossGameArticleDelete = await http().delete(`/game-admin/games/${hoaLongId}/articles/${articleId}`).set('Cookie', superAdminCookies);
    expect(crossGameArticleDelete.status).toBe(404);
    const preservedArticle = await http().get(`/game-admin/games/${orionId}/articles/${articleId}`).set('Cookie', contentManagerCookies);
    expect(preservedArticle.body.data.title).toBe('Orion isolation article');
    const crossGameEvent = await http().get(`/game-admin/games/${hoaLongId}/events/${eventId}`).set('Cookie', superAdminCookies);
    expect(crossGameEvent.status).toBe(404);
    const crossGameEventPatch = await http()
      .patch(`/game-admin/games/${hoaLongId}/events/${eventId}`)
      .set('Cookie', superAdminCookies)
      .send({ expectedUpdatedAt: changedEvent.body.data.updatedAt, title: 'Cross-game event overwrite attempt' });
    expect(crossGameEventPatch.status).toBe(404);
    const preservedEvent = await http().get(`/game-admin/games/${orionId}/events/${eventId}`).set('Cookie', contentManagerCookies);
    expect(preservedEvent.body.data.title).toBe('Updated Orion isolation event');

    const beforeHoa = await http().get(`/game-admin/games/${hoaLongId}/presentation`).set('Cookie', superAdminCookies);
    const presentation = await http().get(`/game-admin/games/${orionId}/presentation`).set('Cookie', contentManagerCookies);
    const editedPresentation = await http()
      .patch(`/game-admin/games/${orionId}/presentation`)
      .set('Cookie', contentManagerCookies)
      .send({
        expectedUpdatedAt: presentation.body.data.updatedAt,
        themeConfig: JSON.parse(presentation.body.data.themeConfig),
        featureConfig: JSON.parse(presentation.body.data.featureConfig),
        pageConfig: JSON.parse(presentation.body.data.pageConfig),
      });
    expect(editedPresentation.status).toBe(200);
    const afterHoa = await http().get(`/game-admin/games/${hoaLongId}/presentation`).set('Cookie', superAdminCookies);
    expect(afterHoa.body.data.updatedAt).toBe(beforeHoa.body.data.updatedAt);

    const moderatorCms = await http().get(`/game-admin/games/${orionId}/articles`).set('Cookie', moderatorCookies);
    expect(moderatorCms.status).toBe(403);
    expect(moderatorCms.body.error.code).toBe('GAME_PERMISSION_REQUIRED');
    const moderatorPresentation = await http().get(`/game-admin/games/${orionId}/presentation`).set('Cookie', moderatorCookies);
    expect(moderatorPresentation.status).toBe(403);
    const moderatorEvent = await http()
      .post(`/game-admin/games/${orionId}/events`)
      .set('Cookie', moderatorCookies)
      .send({ title: 'Blocked event', slug: `blocked-event-${suffix}`, excerpt: 'A moderator cannot create events.', content: 'Blocked event content.', startsAt: new Date().toISOString() });
    expect(moderatorEvent.status).toBe(403);
    const moderatorArticleMutation = await http()
      .patch(`/game-admin/games/${orionId}/articles/${articleId}`)
      .set('Cookie', moderatorCookies)
      .send({ expectedUpdatedAt: preservedArticle.body.data.updatedAt, title: 'Blocked article mutation' });
    expect(moderatorArticleMutation.status).toBe(403);
  });

  it('lists and moderates only game players, records audit entries, and never exposes account secrets', async () => {
    const created = await createActiveClient();
    clientId = created.clientId;
    clientSecret = created.clientSecret;
    expect(await (prisma.gamePlayer as any).count({ where: { userId: playerId, gameId: orionId } })).toBe(0);
    const code = await authorize(playerCookies, clientId, orionCallback, 'first-state');
    expect(await (prisma.gamePlayer as any).count({ where: { userId: playerId, gameId: orionId } })).toBe(0);
    const failedExchange = await exchangeCode(clientId, 'wrong-secret-before-provisioning', code, orionCallback);
    expect(failedExchange.status).toBe(400);
    expect(await (prisma.gamePlayer as any).count({ where: { userId: playerId, gameId: orionId } })).toBe(0);
    const exchange = await exchangeCode(clientId, clientSecret, code, orionCallback);
    expect(exchange.status).toBe(201);

    const players = await http().get(`/game-admin/games/${orionId}/players`).query({ search: `multiplayer${suffix.slice(-8)}`, page: 1, pageSize: 20 }).set('Cookie', moderatorCookies);
    expect(players.status).toBe(200);
    expect(players.body.data.items).toHaveLength(1);
    expect(players.body.data).toMatchObject({ page: 1, pageSize: 20, total: 1 });
    expect(JSON.stringify(players.body.data.items[0])).not.toMatch(/email|phone|wallet|password/i);
    const player = players.body.data.items[0];

    const playerDetail = await http().get(`/game-admin/games/${orionId}/players/${playerId}`).set('Cookie', moderatorCookies);
    expect(playerDetail.status).toBe(200);
    expect(JSON.stringify(playerDetail.body.data)).not.toMatch(/email|phone|wallet|password/i);

    const supportNote = await http()
      .patch(`/game-admin/games/${orionId}/players/${playerId}/support-note`)
      .set('Cookie', moderatorCookies)
      .send({ note: '  Integration support note.  ', expectedUpdatedAt: player.updatedAt });
    expect(supportNote.status).toBe(200);
    expect(supportNote.body.data.supportNote).toBe('Integration support note.');

    const contentDashboard = await http().get(`/game-admin/games/${orionId}/dashboard`).set('Cookie', contentOnlyCookies);
    expect(contentDashboard.status).toBe(200);
    expect(JSON.stringify(contentDashboard.body.data.recentPlayers)).not.toMatch(/supportNote|blockReason/i);

    const staleNote = await http()
      .patch(`/game-admin/games/${orionId}/players/${playerId}/support-note`)
      .set('Cookie', moderatorCookies)
      .send({ note: 'This stale note must not overwrite the current one.', expectedUpdatedAt: player.updatedAt });
    expect(staleNote.status).toBe(409);
    expect(staleNote.body.error.code).toBe('STALE_GAME_PLAYER_UPDATE');

    const playerActivity = await http().get(`/game-admin/games/${orionId}/players/${playerId}/activity`).query({ page: 1, pageSize: 20 }).set('Cookie', moderatorCookies);
    expect(playerActivity.status).toBe(200);
    expect(playerActivity.body.data.items.some((item: { action: string; targetId: string }) => item.action === 'GAME_PLAYER_SUPPORT_NOTE_UPDATED' && item.targetId === player.id)).toBe(true);
    const crossGamePlayer = await http().get(`/game-admin/games/${hoaLongId}/players/${playerId}`).set('Cookie', superAdminCookies);
    expect(crossGamePlayer.status).toBe(404);
    const crossGameActivity = await http().get(`/game-admin/games/${hoaLongId}/players/${playerId}/activity`).set('Cookie', superAdminCookies);
    expect(crossGameActivity.status).toBe(404);
    const deniedSupportNote = await http()
      .patch(`/game-admin/games/${orionId}/players/${playerId}/support-note`)
      .set('Cookie', contentOnlyCookies)
      .send({ note: 'Content managers cannot write player notes.', expectedUpdatedAt: supportNote.body.data.updatedAt });
    expect(deniedSupportNote.status).toBe(403);

    const stale = await http()
      .patch(`/game-admin/games/${orionId}/players/${playerId}/status`)
      .set('Cookie', moderatorCookies)
      .send({ status: 'BLOCKED', expectedUpdatedAt: '2000-01-01T00:00:00.000Z', reason: 'Stale moderation request.' });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('STALE_GAME_PLAYER_UPDATE');
    const blankReason = await http()
      .patch(`/game-admin/games/${orionId}/players/${playerId}/status`)
      .set('Cookie', moderatorCookies)
      .send({ status: 'BLOCKED', expectedUpdatedAt: supportNote.body.data.updatedAt, reason: '   ' });
    expect(blankReason.status).toBe(400);

    const blocked = await http()
      .patch(`/game-admin/games/${orionId}/players/${playerId}/status`)
      .set('Cookie', moderatorCookies)
      .send({ status: 'BLOCKED', expectedUpdatedAt: supportNote.body.data.updatedAt, reason: 'Integration block verification.' });
    expect(blocked.status).toBe(200);
    expect(blocked.body.data.status).toBe('BLOCKED');
    const blockedFilter = await http().get(`/game-admin/games/${orionId}/players`).query({ status: 'BLOCKED', page: 1, pageSize: 20 }).set('Cookie', moderatorCookies);
    expect(blockedFilter.body.data.items.map((item: { userId: string }) => item.userId)).toContain(playerId);

    const deniedAudit = await http().get(`/game-admin/games/${orionId}/audit`).set('Cookie', moderatorCookies);
    expect(deniedAudit.status).toBe(403);
    const contentAudit = await http().get(`/game-admin/games/${orionId}/audit`).set('Cookie', contentManagerCookies);
    expect(contentAudit.status).toBe(403);
    const gameAdminAudit = await http().get(`/game-admin/games/${orionId}/audit`).set('Cookie', gameAdminCookies);
    expect(gameAdminAudit.status).toBe(200);
    const orionAudit = await http().get(`/game-admin/games/${orionId}/audit`).query({ action: 'GAME_PLAYER_BLOCKED', page: 1, pageSize: 20 }).set('Cookie', superAdminCookies);
    expect(orionAudit.status).toBe(200);
    expect(orionAudit.body.data.items.some((item: { targetId: string; reason: string }) => item.targetId === blocked.body.data.id && item.reason === 'Integration block verification.')).toBe(true);
    const hoaAudit = await http().get(`/game-admin/games/${hoaLongId}/audit`).query({ action: 'GAME_PLAYER_BLOCKED', page: 1, pageSize: 20 }).set('Cookie', superAdminCookies);
    expect(hoaAudit.body.data.items.some((item: { targetId: string }) => item.targetId === blocked.body.data.id)).toBe(false);

    const unblocked = await http()
      .patch(`/game-admin/games/${orionId}/players/${playerId}/status`)
      .set('Cookie', moderatorCookies)
      .send({ status: 'ACTIVE', expectedUpdatedAt: blocked.body.data.updatedAt, reason: 'Integration unblock verification.' });
    expect(unblocked.status).toBe(200);
    expect(unblocked.body.data.status).toBe('ACTIVE');
  });

  it('rejects invalid SSO authorization requests before login redirects and preserves callback state', async () => {
    const invalid = await http().get('/game-sso/authorize').query({ client_id: clientId, redirect_uri: 'https://evil.example/callback', state: 'unsafe' }).redirects(0);
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('GAME_SSO_CLIENT_INVALID');

    const unauthenticated = await http().get('/game-sso/authorize').query({ client_id: clientId, redirect_uri: orionCallback, state: 'return-state' }).redirects(0);
    expect(unauthenticated.status).toBe(302);
    expect(unauthenticated.headers.location).toContain('/auth/login');
    const loginRedirect = new URL(unauthenticated.headers.location);
    const returnTo = new URL(loginRedirect.searchParams.get('returnTo')!);
    expect(returnTo.pathname).toBe('/api/v1/game-sso/authorize');
    expect(returnTo.searchParams.get('client_id')).toBe(clientId);
    expect(returnTo.searchParams.get('redirect_uri')).toBe(orionCallback);
    expect(returnTo.searchParams.get('state')).toBe('return-state');

    const response = await http().get('/game-sso/authorize').query({ client_id: clientId, redirect_uri: orionCallback, state: 'round-trip-state' }).set('Cookie', playerCookies).redirects(0);
    expect(response.status).toBe(302);
    const callback = new URL(response.headers.location);
    expect(callback.origin + callback.pathname).toBe(orionCallback);
    expect(callback.searchParams.get('state')).toBe('round-trip-state');
    expect(callback.searchParams.get('code')).toBeTruthy();
  });

  it('enforces SSO code binding, TTL, single use, rotation, active client status, and block status', async () => {
    const callback = orionCallback;
    const firstCode = await authorize(playerCookies, clientId, callback, 'exchange-once');
    const wrongSecret = await exchangeCode(clientId, 'wrong-secret', firstCode, callback);
    expect(wrongSecret.status).toBe(400);
    expect(wrongSecret.body.error.code).toBe('GAME_SSO_CODE_INVALID');
    const wrongCallback = await exchangeCode(clientId, clientSecret, firstCode, 'http://orion.lvh.me/other');
    expect(wrongCallback.status).toBe(400);
    expect(wrongCallback.body.error.code).toBe('GAME_SSO_CODE_INVALID');
    const hoaLongClient = await http()
      .patch(`/admin/games/${hoaLongId}/sso-client`)
      .set('Cookie', superAdminCookies)
      .send({ redirectUri: hoaLongCallback, isActive: true });
    expect(hoaLongClient.status).toBe(200);
    hoaLongClientId = hoaLongClient.body.data.clientId;
    const wrongClient = await exchangeCode(hoaLongClient.body.data.clientId, hoaLongClient.body.data.clientSecret, firstCode, callback);
    expect(wrongClient.status).toBe(400);
    expect(wrongClient.body.error.code).toBe('GAME_SSO_CODE_INVALID');
    const consumed = await exchangeCode(clientId, clientSecret, firstCode, callback);
    expect(consumed.status).toBe(201);
    const replay = await exchangeCode(clientId, clientSecret, firstCode, callback);
    expect(replay.status).toBe(400);
    expect(replay.body.error.code).toBe('GAME_SSO_CODE_INVALID');

    const expiringCode = await authorize(playerCookies, clientId, callback, 'expired');
    const expiringStored = await (prisma.gameSsoAuthorizationCode as any).findUniqueOrThrow({ where: { codeHash: sha256(expiringCode) } });
    const ttlMs = expiringStored.expiresAt.getTime() - expiringStored.createdAt.getTime();
    expect(ttlMs).toBeGreaterThanOrEqual(59_000);
    expect(ttlMs).toBeLessThanOrEqual(61_000);
    await (prisma.gameSsoAuthorizationCode as any).update({ where: { codeHash: sha256(expiringCode) }, data: { expiresAt: new Date(Date.now() - 1_000) } });
    const expired = await exchangeCode(clientId, clientSecret, expiringCode, callback);
    expect(expired.status).toBe(400);

    const rotated = await http().post(`/admin/games/${orionId}/sso-client/rotate-secret`).set('Cookie', superAdminCookies).send();
    expect(rotated.status).toBe(201);
    expect(rotated.body.data.clientSecret).toBeTruthy();
    const beforeRotationCode = await authorize(playerCookies, clientId, callback, 'old-secret');
    const oldSecret = await exchangeCode(clientId, clientSecret, beforeRotationCode, callback);
    expect(oldSecret.status).toBe(400);
    clientSecret = rotated.body.data.clientSecret;

    const disabled = await http().patch(`/admin/games/${orionId}/sso-client`).set('Cookie', superAdminCookies).send({ redirectUri: callback, isActive: false });
    expect(disabled.status).toBe(200);
    const inactive = await exchangeCode(clientId, clientSecret, beforeRotationCode, callback);
    expect(inactive.status).toBe(400);
    expect(inactive.body.error.code).toBe('GAME_SSO_CODE_INVALID');
    const reactivated = await http().patch(`/admin/games/${orionId}/sso-client`).set('Cookie', superAdminCookies).send({ redirectUri: callback, isActive: true });
    expect(reactivated.status).toBe(200);

    const current = await (prisma.gamePlayer as any).findUniqueOrThrow({ where: { userId_gameId: { userId: playerId, gameId: orionId } } });
    const block = await http().patch(`/game-admin/games/${orionId}/players/${playerId}/status`).set('Cookie', moderatorCookies).send({ status: 'BLOCKED', expectedUpdatedAt: current.updatedAt.toISOString(), reason: 'Block SSO login.' });
    expect(block.status).toBe(200);
    const blockedAuthorize = await http().get('/game-sso/authorize').query({ client_id: clientId, redirect_uri: callback, state: 'blocked' }).set('Cookie', playerCookies).redirects(0);
    expect(blockedAuthorize.status).toBe(403);
    expect(blockedAuthorize.body.error.code).toBe('GAME_PLAYER_BLOCKED');
    const unblock = await http().patch(`/game-admin/games/${orionId}/players/${playerId}/status`).set('Cookie', moderatorCookies).send({ status: 'ACTIVE', expectedUpdatedAt: block.body.data.updatedAt, reason: 'Allow SSO login.' });
    expect(unblock.status).toBe(200);
    const allowedCode = await authorize(playerCookies, clientId, callback, 'allowed-again');
    expect((await exchangeCode(clientId, clientSecret, allowedCode, callback)).status).toBe(201);
  });

  it('lets only Game Admin manage maintenance and blocks new or pending SSO while it is enabled', async () => {
    const deniedOperations = await http().get(`/game-admin/games/${orionId}/operations`).set('Cookie', contentOnlyCookies);
    expect(deniedOperations.status).toBe(403);
    const deniedMaintenance = await http()
      .patch(`/game-admin/games/${orionId}/operations/maintenance`)
      .set('Cookie', moderatorCookies)
      .send({ enabled: true, message: 'Unauthorized maintenance attempt.', expectedEndsAt: null, expectedUpdatedAt: new Date().toISOString(), reason: 'This role lacks the operations permission.' });
    expect(deniedMaintenance.status).toBe(403);

    const operations = await http().get(`/game-admin/games/${orionId}/operations`).set('Cookie', gameAdminCookies);
    expect(operations.status).toBe(200);
    expect(operations.body.data.operationalStatus).toBe('AVAILABLE');
    const staleMaintenance = await http()
      .patch(`/game-admin/games/${orionId}/operations/maintenance`)
      .set('Cookie', gameAdminCookies)
      .send({ enabled: true, message: 'Stale maintenance attempt.', expectedEndsAt: null, expectedUpdatedAt: '2000-01-01T00:00:00.000Z', reason: 'This update must be rejected as stale.' });
    expect(staleMaintenance.status).toBe(409);
    expect(staleMaintenance.body.error.code).toBe('STALE_GAME_OPERATION_UPDATE');

    const codeBeforeMaintenance = await authorize(playerCookies, clientId, orionCallback, 'maintenance-pending-code');
    const beforeLogins = await (prisma.gamePlayer as any).findUniqueOrThrow({ where: { userId_gameId: { userId: playerId, gameId: orionId } } });
    const enabled = await http()
      .patch(`/game-admin/games/${orionId}/operations/maintenance`)
      .set('Cookie', gameAdminCookies)
      .send({ enabled: true, message: 'Integration maintenance notice.', expectedEndsAt: new Date(Date.now() + 3_600_000).toISOString(), expectedUpdatedAt: operations.body.data.updatedAt, reason: 'Verify public and SSO maintenance safeguards.' });
    expect(enabled.status).toBe(200);
    expect(enabled.body.data).toMatchObject({ operationalStatus: 'MAINTENANCE', maintenanceMessage: 'Integration maintenance notice.' });

    const publicGame = await http().get(`/games/by-subdomain/${orionSubdomain}`);
    expect(publicGame.status).toBe(200);
    expect(publicGame.body.data).toMatchObject({ sso: null, maintenance: { message: 'Integration maintenance notice.' } });
    const blockedAuthorize = await http().get('/game-sso/authorize').query({ client_id: clientId, redirect_uri: orionCallback, state: 'maintenance-blocked' }).set('Cookie', playerCookies).redirects(0);
    expect(blockedAuthorize.status).toBe(503);
    expect(blockedAuthorize.body.error.code).toBe('GAME_SSO_UNAVAILABLE');
    const blockedExchange = await exchangeCode(clientId, clientSecret, codeBeforeMaintenance, orionCallback);
    expect(blockedExchange.status).toBe(503);
    expect(blockedExchange.body.error.code).toBe('GAME_SSO_UNAVAILABLE');
    const duringLogins = await (prisma.gamePlayer as any).findUniqueOrThrow({ where: { userId_gameId: { userId: playerId, gameId: orionId } } });
    expect(duringLogins.loginCount).toBe(beforeLogins.loginCount);

    const disabled = await http()
      .patch(`/game-admin/games/${orionId}/operations/maintenance`)
      .set('Cookie', gameAdminCookies)
      .send({ enabled: false, message: null, expectedEndsAt: null, expectedUpdatedAt: enabled.body.data.updatedAt, reason: 'Maintenance verification completed.' });
    expect(disabled.status).toBe(200);
    expect(disabled.body.data).toMatchObject({ operationalStatus: 'AVAILABLE', maintenanceMessage: null, maintenanceEndsAt: null });
    const recoveredCode = await authorize(playerCookies, clientId, orionCallback, 'maintenance-recovered');
    expect((await exchangeCode(clientId, clientSecret, recoveredCode, orionCallback)).status).toBe(201);
  });

  it('records scoped role, SSO, CMS, and player audit entries without credential material', async () => {
    const audit = await http().get(`/game-admin/games/${orionId}/audit`).query({ page: 1, pageSize: 50 }).set('Cookie', gameAdminCookies);
    expect(audit.status).toBe(200);
    expect(audit.body.data).toMatchObject({ page: 1, pageSize: 50 });
    const relevant = audit.body.data.items.filter((entry: { action: string }) => [
      'GAME_ADMIN_ROLES_REPLACED',
      'GAME_SSO_CLIENT_CREATED',
      'GAME_SSO_SECRET_ROTATED',
      'GAME_ARTICLE_CREATED',
      'GAME_PLAYER_BLOCKED',
      'GAME_PLAYER_SUPPORT_NOTE_UPDATED',
      'GAME_MAINTENANCE_ENABLED',
      'GAME_MAINTENANCE_DISABLED',
    ].includes(entry.action));
    expect(relevant.map((entry: { action: string }) => entry.action)).toEqual(expect.arrayContaining([
      'GAME_ADMIN_ROLES_REPLACED',
      'GAME_SSO_CLIENT_CREATED',
      'GAME_SSO_SECRET_ROTATED',
      'GAME_ARTICLE_CREATED',
      'GAME_PLAYER_BLOCKED',
      'GAME_PLAYER_SUPPORT_NOTE_UPDATED',
      'GAME_MAINTENANCE_ENABLED',
      'GAME_MAINTENANCE_DISABLED',
    ]));
    for (const entry of relevant) {
      expect(entry.actor).toBeTruthy();
      expect(entry.targetId).toBeTruthy();
      const payload = JSON.stringify({ beforeData: entry.beforeData, afterData: entry.afterData });
      expect(payload).not.toMatch(/clientSecret|clientSecretHash|authorization|codeHash/i);
    }
  });

  it('atomically consumes a concurrent code exactly once without double-counting game logins', async () => {
    const callback = orionCallback;
    await (prisma.gamePlayer as any).deleteMany({ where: { userId: playerId, gameId: orionId } });
    const before = await (prisma.gamePlayer as any).count({ where: { userId: playerId, gameId: orionId } });
    expect(before).toBe(0);
    const code = await authorize(playerCookies, clientId, callback, 'concurrent');
    const [left, right] = await Promise.all([
      exchangeCode(clientId, clientSecret, code, callback),
      exchangeCode(clientId, clientSecret, code, callback),
    ]);
    const responses = [left, right];
    expect(responses.filter((response) => response.status === 201)).toHaveLength(1);
    expect(responses.filter((response) => response.status === 400 && response.body.error.code === 'GAME_SSO_CODE_INVALID')).toHaveLength(1);
    const players = await (prisma.gamePlayer as any).findMany({ where: { userId: playerId, gameId: orionId } });
    expect(players).toHaveLength(1);
    expect(players[0].loginCount).toBe(1);
  });

  async function createGameFixture(template: any, identity: { code: string; name: string; slug: string; subdomain: string }) {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...data } = template;
    return prisma.game.create({ data: { ...data, ...identity, isPublic: true, sortOrder: 9_000 } });
  }

  async function createUser(prefix: string, superAdmin = false) {
    const username = `${prefix}${suffix.slice(-8)}`;
    const email = `${username}@example.com`;
    const user = await prisma.user.create({
      data: {
        username,
        usernameNormalized: username.toLowerCase(),
        email,
        emailNormalized: email,
        passwordHash: await argon2.hash(password),
        status: 'ACTIVE',
        phone: null,
        phoneNormalized: null,
        profile: { create: { fullName: username, gender: 'UNSPECIFIED', termsVersion: 'test-2026-01', privacyVersion: 'test-2026-01', acceptedAt: new Date() } },
        wallet: { create: { currency: 'ZENX', balance: 0n } },
      },
    });
    fixtureUsers.push(user.id);
    if (superAdmin) {
      const role = await prisma.role.findUniqueOrThrow({ where: { code: 'SUPER_ADMIN' } });
      await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    }
    return user;
  }

  async function replaceRoles(gameId: string, userId: string, roleIds: string[]) {
    const response = await http().put(`/admin/games/${gameId}/admins/${userId}`).set('Cookie', superAdminCookies).send({ roleIds, reason: 'Configure fixture game responsibilities.' });
    expect(response.status).toBe(200);
    return response.body.data;
  }

  async function createActiveClient() {
    const response = await http().patch(`/admin/games/${orionId}/sso-client`).set('Cookie', superAdminCookies).send({ redirectUri: orionCallback, isActive: true });
    expect(response.status).toBe(200);
    return response.body.data as { clientId: string; clientSecret: string };
  }

  async function authorize(cookies: string, ssoClientId: string, redirectUri: string, state: string) {
    const response = await http().get('/game-sso/authorize').query({ client_id: ssoClientId, redirect_uri: redirectUri, state }).set('Cookie', cookies).redirects(0);
    expect(response.status).toBe(302);
    const code = new URL(response.headers.location).searchParams.get('code');
    expect(code).toBeTruthy();
    return code as string;
  }

  function exchangeCode(ssoClientId: string, secret: string, code: string, redirectUri: string) {
    return http().post('/game-sso/exchange').set('Authorization', `Basic ${Buffer.from(`${ssoClientId}:${secret}`).toString('base64')}`).send({ code, redirect_uri: redirectUri });
  }

  async function login(username: string) {
    const response = await http().post('/auth/login').send({ username, password });
    expect(response.status).toBe(201);
    return cookieHeader(response);
  }

  function http() {
    return {
      get: (path: string) => request(app.getHttpServer()).get(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
      post: (path: string) => request(app.getHttpServer()).post(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
      patch: (path: string) => request(app.getHttpServer()).patch(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
      put: (path: string) => request(app.getHttpServer()).put(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
      delete: (path: string) => request(app.getHttpServer()).delete(`/api/v1${path}`).set('Origin', 'http://localhost:3000'),
    };
  }

  function cookieHeader(response: { headers: Record<string, string | string[]> }) {
    const setCookie = response.headers['set-cookie'];
    return (Array.isArray(setCookie) ? setCookie : [setCookie]).map((cookie) => cookie.split(';')[0]).join('; ');
  }

  function sha256(value: string) {
    // This is deliberately independent from the service helper: the persisted column is the SHA-256 code identifier.
    return createHash('sha256').update(value).digest('hex');
  }
});
    gameAdminId = gameAdminUser.id;
