import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { ContentPublishStatus, GameArticleStatus } from '../../common/domain';
import { DomainError, ErrorCode } from '../../common/errors';
import { PrismaService } from '../../database/prisma.service';
import { RESERVED_SUBDOMAINS } from '../../common/web-domain';
import {
  AdminContentAnnouncementCreateDto,
  AdminContentAnnouncementUpdateDto,
  AdminContentAnnouncementsQueryDto,
  AdminContentArticleCreateDto,
  AdminContentArticleUpdateDto,
  AdminContentArticlesQueryDto,
  AdminContentEventCreateDto,
  AdminContentEventUpdateDto,
  AdminContentEventsQueryDto,
  AdminContentGameCreateDto,
  AdminContentGamePresentationUpdateDto,
  AdminContentGameUpdateDto,
  AdminContentGamesQueryDto,
} from './content.dto';
import { assertAssetUrl, assertContentMarkdown, assertCtaPath, normalizeSlug } from './content-markdown';
import { checkGameReadiness, createPageConfig, getGameTemplate, listGameTemplates, parseGamePageConfig, validateGameFeatureConfig, validateGamePageConfig, validateGameThemeConfig } from './game-templates';

const ASSET_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

const ASSET_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export type AssetUpload = { buffer: Buffer; mimetype: string; size?: number };

const GAME_PLATFORM_OPTIONS = [
  { code: 'PC', label: 'PC' },
  { code: 'MOBILE', label: 'Mobile' },
  { code: 'WEB', label: 'Web' },
] as const;
const GAME_PLATFORMS = GAME_PLATFORM_OPTIONS.map(({ code }) => code);

const GAME_SELECT = {
  id: true,
  code: true,
  name: true,
  slug: true,
  subdomain: true,
  recordType: true,
  tagline: true,
  shortDescription: true,
  longDescription: true,
  lifecycleStatus: true,
  operationalStatus: true,
  releaseYear: true,
  themePreset: true,
  templateVersion: true,
  themeConfig: true,
  featureConfig: true,
  pageConfig: true,
  logoUrl: true,
  iconUrl: true,
  coverUrl: true,
  heroDesktopUrl: true,
  heroMobileUrl: true,
  primaryCtaLabel: true,
  primaryCtaPath: true,
  secondaryCtaLabel: true,
  secondaryCtaPath: true,
  featured: true,
  primaryGame: true,
  isPublic: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  genres: { select: { genre: { select: { code: true, name: true, slug: true } } } },
  platforms: { select: { platform: true } },
} as const;

const GAME_SUMMARY_SELECT = {
  id: true,
  code: true,
  name: true,
  slug: true,
} as const;

const ARTICLE_LIST_SELECT = {
  id: true,
  gameId: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImageUrl: true,
  category: true,
  status: true,
  publishedAt: true,
  seoTitle: true,
  seoDescription: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  game: { select: GAME_SUMMARY_SELECT },
} as const;

const ARTICLE_SELECT = { ...ARTICLE_LIST_SELECT, content: true } as const;

const EVENT_LIST_SELECT = {
  id: true,
  gameId: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImageUrl: true,
  status: true,
  startsAt: true,
  endsAt: true,
  publishedAt: true,
  seoTitle: true,
  seoDescription: true,
  createdAt: true,
  updatedAt: true,
  game: { select: GAME_SUMMARY_SELECT },
} as const;

const EVENT_SELECT = { ...EVENT_LIST_SELECT, content: true } as const;

const ANNOUNCEMENT_SELECT = {
  id: true,
  code: true,
  title: true,
  message: true,
  ctaLabel: true,
  ctaPath: true,
  status: true,
  startsAt: true,
  endsAt: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class ContentAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async dashboard() {
    const now = new Date();
    const publishedEventWhere: Prisma.GameEventWhereInput = {
      status: ContentPublishStatus.PUBLISHED,
      publishedAt: { not: null, lte: now },
    };
    const [
      gamesTotal,
      gamesPublic,
      articleDraft,
      articlePublished,
      eventActive,
      eventUpcoming,
      announcementDraft,
      announcementPublished,
    ] = await Promise.all([
        this.prisma.game.count(),
        this.prisma.game.count({ where: { isPublic: true } }),
        this.prisma.gameArticle.count({ where: { status: GameArticleStatus.DRAFT, deletedAt: null } }),
        this.prisma.gameArticle.count({ where: { status: GameArticleStatus.PUBLISHED, deletedAt: null } }),
        this.prisma.gameEvent.count({
          where: {
            ...publishedEventWhere,
            startsAt: { lte: now },
            OR: [{ endsAt: null }, { endsAt: { gt: now } }],
          },
        }),
        this.prisma.gameEvent.count({
          where: { ...publishedEventWhere, startsAt: { gt: now } },
        }),
        this.prisma.portalAnnouncement.count({ where: { status: ContentPublishStatus.DRAFT } }),
        this.prisma.portalAnnouncement.count({ where: { status: ContentPublishStatus.PUBLISHED } }),
      ]);
    return {
      games: { total: gamesTotal, public: gamesPublic, private: gamesTotal - gamesPublic },
      articles: { draft: articleDraft, published: articlePublished },
      events: { active: eventActive, upcoming: eventUpcoming },
      announcements: { draft: announcementDraft, published: announcementPublished },
    };
  }

  async listGames(query: AdminContentGamesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();
    const where: Prisma.GameWhereInput = {
      ...(query.lifecycleStatus ? { lifecycleStatus: query.lifecycleStatus } : {}),
      ...(query.operationalStatus ? { operationalStatus: query.operationalStatus } : {}),
      ...(query.isPublic !== undefined ? { isPublic: query.isPublic } : {}),
      ...(search
        ? {
            OR: [
              { code: { contains: search } },
              { name: { contains: search } },
              { slug: { contains: search } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.game.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: GAME_SELECT,
      }),
      this.prisma.game.count({ where }),
    ]);
    return { items: items.map((item) => this.publicGame(item)), page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async getGame(gameId: string) {
    const game = await this.prisma.game.findUnique({ where: { id: gameId }, select: GAME_SELECT });
    if (!game) throw this.notFound('Game not found');
    return this.publicGame(game);
  }

  listGameTemplates() {
    return listGameTemplates();
  }

  async gameOptions() {
    const genres = await this.prisma.genre.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { code: 'asc' }],
      select: { code: true, name: true, slug: true },
    });
    return { genres, platforms: GAME_PLATFORM_OPTIONS };
  }

  async createGame(dto: AdminContentGameCreateDto) {
    const template = getGameTemplate(dto.themePreset);
    const code = dto.code.trim().toUpperCase();
    const slug = normalizeGameSlug(dto.slug);
    const subdomain = normalizeGameSubdomain(dto.subdomain);
    assertGameSubdomain(subdomain);
    const genreCodes = normalizeGameCodes(dto.genreCodes);
    const platforms = normalizeGamePlatforms(dto.platforms);
    const genreIds = await this.resolveGenreIds(genreCodes);
    const pageConfig = createPageConfig(template.id, dto.name, dto.tagline ?? '', dto.shortDescription ?? '');
    pageConfig.hero.imageUrl = dto.heroDesktopUrl ?? null;
    pageConfig.hero.mobileImageUrl = dto.heroMobileUrl ?? dto.heroDesktopUrl ?? null;
    pageConfig.intro.imageUrl = dto.coverUrl ?? null;
    const assetFields = ['logoUrl', 'iconUrl', 'coverUrl', 'heroDesktopUrl', 'heroMobileUrl'] as const;
    for (const field of assetFields) assertAssetUrl(dto[field]);
    assertCtaPath(dto.primaryCtaPath);
    assertCtaPath(dto.secondaryCtaPath);

    try {
      const game = await this.prisma.game.create({
        data: {
          code,
          slug,
          subdomain,
          name: dto.name,
          tagline: dto.tagline ?? '',
          shortDescription: dto.shortDescription ?? '',
          longDescription: dto.longDescription,
          lifecycleStatus: dto.lifecycleStatus ?? 'CONCEPT',
          operationalStatus: dto.operationalStatus ?? 'UNAVAILABLE',
          releaseYear: dto.releaseYear,
          recordType: 'REAL',
          themePreset: template.id,
          templateVersion: 1,
          themeConfig: JSON.stringify(template.theme),
          featureConfig: JSON.stringify(template.featureConfig),
          pageConfig: JSON.stringify(pageConfig),
          logoUrl: dto.logoUrl,
          iconUrl: dto.iconUrl,
          coverUrl: dto.coverUrl,
          heroDesktopUrl: dto.heroDesktopUrl,
          heroMobileUrl: dto.heroMobileUrl,
          primaryCtaLabel: dto.primaryCtaLabel,
          primaryCtaPath: dto.primaryCtaPath,
          secondaryCtaLabel: dto.secondaryCtaLabel,
          secondaryCtaPath: dto.secondaryCtaPath,
          featured: dto.featured ?? false,
          isPublic: false,
          sortOrder: dto.sortOrder ?? 0,
          genres: { create: genreIds.map((genreId) => ({ genreId })) },
          platforms: { create: platforms.map((platform) => ({ platform })) },
        },
        select: { id: true },
      });
      return this.getGame(game.id);
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
  }

  async updateGame(gameId: string, dto: AdminContentGameUpdateDto) {
    const current = await this.prisma.game.findUnique({ where: { id: gameId }, select: GAME_SELECT });
    if (!current) throw this.notFound('Game not found');
    this.assertExpected(current.updatedAt, dto.expectedUpdatedAt);

    const code = dto.code === undefined ? undefined : dto.code.trim().toUpperCase();
    const slug = dto.slug === undefined ? undefined : normalizeGameSlug(dto.slug);
    const subdomain = dto.subdomain === undefined ? undefined : normalizeGameSubdomain(dto.subdomain);
    if (subdomain !== undefined) assertGameSubdomain(subdomain);
    const genreCodes = dto.genreCodes === undefined ? undefined : normalizeGameCodes(dto.genreCodes);
    const platforms = dto.platforms === undefined ? undefined : normalizeGamePlatforms(dto.platforms);
    const effectiveGenreCodes = genreCodes ?? current.genres.map(({ genre }) => genre.code);
    const effectivePlatforms = platforms ?? current.platforms.map(({ platform }) => platform);
    if (effectiveGenreCodes.length === 0) throw this.invalidState('At least one genre is required');
    if (effectivePlatforms.length === 0) throw this.invalidState('At least one platform is required');
    const genreIds = genreCodes === undefined ? undefined : await this.resolveGenreIds(genreCodes);
    const assetFields = ['logoUrl', 'iconUrl', 'coverUrl', 'heroDesktopUrl', 'heroMobileUrl'] as const;
    for (const field of assetFields) assertAssetUrl(dto[field]);
    assertCtaPath(dto.primaryCtaPath);
    assertCtaPath(dto.secondaryCtaPath);

    const fields = [
      'code',
      'slug',
      'subdomain',
      'name',
      'tagline',
      'shortDescription',
      'longDescription',
      'lifecycleStatus',
      'operationalStatus',
      'releaseYear',
      'logoUrl',
      'iconUrl',
      'coverUrl',
      'heroDesktopUrl',
      'heroMobileUrl',
      'primaryCtaLabel',
      'primaryCtaPath',
      'secondaryCtaLabel',
      'secondaryCtaPath',
      'featured',
      'primaryGame',
      'sortOrder',
      'genreCodes',
      'platforms',
    ].filter(
      (field) => dto[field as keyof AdminContentGameUpdateDto] !== undefined,
    );
    if (!fields.length)
      throw new DomainError(ErrorCode.ADMIN_NO_CHANGES, 'No content changes were provided', 400);
    const data: Prisma.GameUpdateManyMutationInput = {
      ...(code !== undefined ? { code } : {}),
      ...(slug !== undefined ? { slug } : {}),
      ...(subdomain !== undefined ? { subdomain } : {}),
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.tagline !== undefined ? { tagline: dto.tagline } : {}),
      ...(dto.shortDescription !== undefined ? { shortDescription: dto.shortDescription } : {}),
      ...(dto.longDescription !== undefined ? { longDescription: dto.longDescription } : {}),
      ...(dto.lifecycleStatus !== undefined ? { lifecycleStatus: dto.lifecycleStatus } : {}),
      ...(dto.operationalStatus !== undefined ? { operationalStatus: dto.operationalStatus } : {}),
      ...(dto.releaseYear !== undefined ? { releaseYear: dto.releaseYear } : {}),
      ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
      ...(dto.iconUrl !== undefined ? { iconUrl: dto.iconUrl } : {}),
      ...(dto.coverUrl !== undefined ? { coverUrl: dto.coverUrl } : {}),
      ...(dto.heroDesktopUrl !== undefined ? { heroDesktopUrl: dto.heroDesktopUrl } : {}),
      ...(dto.heroMobileUrl !== undefined ? { heroMobileUrl: dto.heroMobileUrl } : {}),
      ...(dto.primaryCtaLabel !== undefined ? { primaryCtaLabel: dto.primaryCtaLabel } : {}),
      ...(dto.primaryCtaPath !== undefined ? { primaryCtaPath: dto.primaryCtaPath } : {}),
      ...(dto.secondaryCtaLabel !== undefined ? { secondaryCtaLabel: dto.secondaryCtaLabel } : {}),
      ...(dto.secondaryCtaPath !== undefined ? { secondaryCtaPath: dto.secondaryCtaPath } : {}),
      ...(dto.featured !== undefined ? { featured: dto.featured } : {}),
      ...(dto.primaryGame !== undefined ? { primaryGame: dto.primaryGame } : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      updatedAt: new Date(),
    };
    try {
      await this.prisma.$transaction(async (tx) => {
        const updated = await tx.game.updateMany({
          where: { id: gameId, updatedAt: current.updatedAt },
          data,
        });
        if (updated.count !== 1) throw this.stale('The game was changed by another operator');
        if (genreIds !== undefined) {
          await tx.gameGenre.deleteMany({ where: { gameId } });
          await tx.gameGenre.createMany({
            data: genreIds.map((genreId) => ({ gameId, genreId })),
          });
        }
        if (platforms !== undefined) {
          await tx.gamePlatform.deleteMany({ where: { gameId } });
          await tx.gamePlatform.createMany({
            data: platforms.map((platform) => ({ gameId, platform })),
          });
        }
      });
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
    return this.getGame(gameId);
  }

  async updateGamePresentation(gameId: string, dto: AdminContentGamePresentationUpdateDto) {
    const current = await this.prisma.game.findUnique({ where: { id: gameId }, select: { id: true, themePreset: true, updatedAt: true } });
    if (!current) throw this.notFound('Game not found');
    this.assertExpected(current.updatedAt, dto.expectedUpdatedAt);
    const themeConfig = validateGameThemeConfig(dto.themeConfig);
    const featureConfig = validateGameFeatureConfig(dto.featureConfig);
    const pageConfig = validateGamePageConfig(dto.pageConfig, current.themePreset);
    try {
      const updated = await this.prisma.game.updateMany({
        where: { id: gameId, updatedAt: current.updatedAt },
        data: { themeConfig: JSON.stringify(themeConfig), featureConfig: JSON.stringify(featureConfig), pageConfig: JSON.stringify(pageConfig), updatedAt: new Date() },
      });
      if (updated.count !== 1) throw this.stale('The game was changed by another operator');
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
    return this.getGame(gameId);
  }

  async gameReadiness(gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      select: {
        ...GAME_SELECT,
        articles: { where: { deletedAt: null }, select: { status: true } },
        milestones: { select: { id: true } },
      },
    });
    if (!game) throw this.notFound('Game not found');
    return checkGameReadiness(game);
  }

  async publishGame(gameId: string) {
    const readiness = await this.gameReadiness(gameId);
    if (!readiness.ready) throw new DomainError(ErrorCode.CONTENT_INVALID_STATE, 'Game is not ready to publish', 400);
    const current = await this.prisma.game.findUnique({ where: { id: gameId }, select: { updatedAt: true } });
    if (!current) throw this.notFound('Game not found');
    try {
      const updated = await this.prisma.game.updateMany({ where: { id: gameId, updatedAt: current.updatedAt }, data: { isPublic: true, updatedAt: new Date() } });
      if (updated.count !== 1) throw this.stale('The game was changed by another operator');
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
    return this.getGame(gameId);
  }

  async unpublishGame(gameId: string) {
    const current = await this.prisma.game.findUnique({ where: { id: gameId }, select: { updatedAt: true } });
    if (!current) throw this.notFound('Game not found');
    const updated = await this.prisma.game.updateMany({ where: { id: gameId, updatedAt: current.updatedAt }, data: { isPublic: false, updatedAt: new Date() } });
    if (updated.count !== 1) throw this.stale('The game was changed by another operator');
    return this.getGame(gameId);
  }

  async previewGame(gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      select: {
        ...GAME_SELECT,
        articles: { where: { status: GameArticleStatus.PUBLISHED, publishedAt: { not: null, lte: new Date() }, deletedAt: null }, orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }] },
        milestones: { orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }] },
      },
    });
    if (!game) throw this.notFound('Game not found');
    const parsedTheme = validateGameThemeConfig(JSON.parse(game.themeConfig));
    const parsedFeatureConfig = validateGameFeatureConfig(JSON.parse(game.featureConfig));
    const pageConfig = parseGamePageConfig(game.pageConfig, game.themePreset);
    return {
      ...this.publicGame(game),
      theme: parsedTheme,
      featureConfig: parsedFeatureConfig,
      pageConfig,
      articles: game.articles.map((article) => ({ title: article.title, slug: article.slug, excerpt: article.excerpt, coverImageUrl: article.coverImageUrl, category: article.category, publishedAt: article.publishedAt, seoTitle: article.seoTitle, seoDescription: article.seoDescription })),
      milestones: game.milestones.map((milestone) => ({ title: milestone.title, description: milestone.description, displayPeriod: milestone.displayPeriod, status: milestone.status, checklist: parseChecklist(milestone.checklistConfig), sortOrder: milestone.sortOrder })),
    };
  }

  async listArticles(query: AdminContentArticlesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();
    const where: Prisma.GameArticleWhereInput = {
      ...(query.deletedOnly ? { deletedAt: { not: null } } : { deletedAt: null }),
      ...(query.gameId ? { gameId: query.gameId } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? { OR: [{ title: { contains: search } }, { slug: { contains: search } }, { excerpt: { contains: search } }] }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.gameArticle.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: ARTICLE_LIST_SELECT,
      }),
      this.prisma.gameArticle.count({ where }),
    ]);
    return { items: items.map((item) => this.publicArticle(item)), page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async getArticle(articleId: string) {
    const article = await this.prisma.gameArticle.findUnique({ where: { id: articleId }, select: ARTICLE_SELECT });
    if (!article) throw this.notFound('Article not found');
    return this.publicArticle(article);
  }

  async createArticle(dto: AdminContentArticleCreateDto) {
    const game = await this.prisma.game.findUnique({ where: { id: dto.gameId }, select: { id: true } });
    if (!game) throw this.notFound('Game not found');
    const slug = normalizeSlug(dto.slug);
    assertContentMarkdown(dto.content);
    if (!dto.content.trim()) throw this.invalidState('Content must not be empty');
    assertAssetUrl(dto.coverImageUrl);
    const status = dto.status ?? ContentPublishStatus.DRAFT;
    const publishedAt = status === ContentPublishStatus.PUBLISHED ? new Date() : null;
    try {
      const article = await this.prisma.gameArticle.create({
        data: {
          gameId: dto.gameId,
          title: dto.title,
          slug,
          excerpt: dto.excerpt,
          content: dto.content,
          coverImageUrl: dto.coverImageUrl,
          category: dto.category,
          status,
          publishedAt,
          seoTitle: dto.seoTitle,
          seoDescription: dto.seoDescription,
        },
        select: { id: true },
      });
      return this.getArticle(article.id);
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
  }

  async updateArticle(articleId: string, dto: AdminContentArticleUpdateDto) {
    const current = await this.prisma.gameArticle.findUnique({ where: { id: articleId }, select: ARTICLE_SELECT });
    if (!current) throw this.notFound('Article not found');
    this.assertExpected(current.updatedAt, dto.expectedUpdatedAt);
    if (dto.content !== undefined) {
      assertContentMarkdown(dto.content);
      if (!dto.content.trim()) throw this.invalidState('Content must not be empty');
    }
    assertAssetUrl(dto.coverImageUrl);
    const nextStatus = dto.status ?? current.status;
    if (![ContentPublishStatus.DRAFT, ContentPublishStatus.PUBLISHED].includes(nextStatus as ContentPublishStatus))
      throw this.invalidState('Article status is invalid');
    const fields = ['title', 'excerpt', 'content', 'coverImageUrl', 'category', 'seoTitle', 'seoDescription', 'status'].filter(
      (field) => dto[field as keyof AdminContentArticleUpdateDto] !== undefined,
    );
    if (!fields.length) throw new DomainError(ErrorCode.ADMIN_NO_CHANGES, 'No content changes were provided', 400);
    const publishedAt =
      nextStatus === ContentPublishStatus.DRAFT
        ? null
        : current.status === ContentPublishStatus.DRAFT
          ? new Date()
          : current.publishedAt ?? new Date();
    const data: Prisma.GameArticleUpdateManyMutationInput = {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.excerpt !== undefined ? { excerpt: dto.excerpt } : {}),
      ...(dto.content !== undefined ? { content: dto.content } : {}),
      ...(dto.coverImageUrl !== undefined ? { coverImageUrl: dto.coverImageUrl } : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.seoTitle !== undefined ? { seoTitle: dto.seoTitle } : {}),
      ...(dto.seoDescription !== undefined ? { seoDescription: dto.seoDescription } : {}),
      ...(dto.status !== undefined ? { status: nextStatus, publishedAt } : {}),
      updatedAt: new Date(),
    };
    // A published record can be edited without changing its original publish time.
    if (dto.status === undefined && current.status === ContentPublishStatus.PUBLISHED)
      data.publishedAt = current.publishedAt ?? publishedAt;
    try {
      const updated = await this.prisma.gameArticle.updateMany({
        where: { id: articleId, updatedAt: current.updatedAt },
        data,
      });
      if (updated.count !== 1) throw this.stale('The article was changed by another operator');
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
    return this.getArticle(articleId);
  }

  async deleteArticle(articleId: string) {
    const current = await this.prisma.gameArticle.findUnique({
      where: { id: articleId },
      select: { id: true, title: true, deletedAt: true },
    });
    if (!current) throw this.notFound('Article not found');
    if (current.deletedAt) throw this.invalidState('Article has already been deleted');

    await this.prisma.gameArticle.update({
      where: { id: articleId },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return { success: true, id: articleId };
  }

  async restoreArticle(articleId: string) {
    const current = await this.prisma.gameArticle.findUnique({
      where: { id: articleId },
      select: { id: true, title: true, deletedAt: true },
    });
    if (!current) throw this.notFound('Article not found');
    if (!current.deletedAt) throw this.invalidState('Article is not in trash');

    await this.prisma.gameArticle.update({
      where: { id: articleId },
      data: {
        deletedAt: null,
        updatedAt: new Date(),
      },
    });
    return this.getArticle(articleId);
  }

  async listEvents(query: AdminContentEventsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();
    const where: Prisma.GameEventWhereInput = {
      ...(query.gameId ? { gameId: query.gameId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(search ? { OR: [{ title: { contains: search } }, { slug: { contains: search } }, { excerpt: { contains: search } }] } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.gameEvent.findMany({ where, orderBy: [{ startsAt: 'desc' }, { updatedAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize, select: EVENT_LIST_SELECT }),
      this.prisma.gameEvent.count({ where }),
    ]);
    return { items: items.map((item) => this.publicEvent(item)), page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async getEvent(eventId: string) {
    const event = await this.prisma.gameEvent.findUnique({ where: { id: eventId }, select: EVENT_SELECT });
    if (!event) throw this.notFound('Event not found');
    return this.publicEvent(event);
  }

  async createEvent(dto: AdminContentEventCreateDto) {
    await this.assertGame(dto.gameId);
    const startsAt = this.date(dto.startsAt);
    const endsAt = dto.endsAt === undefined || dto.endsAt === null ? null : this.date(dto.endsAt);
    this.assertDateRange(startsAt, endsAt);
    const slug = normalizeSlug(dto.slug);
    assertContentMarkdown(dto.content);
    if (!dto.content.trim()) throw this.invalidState('Content must not be empty');
    assertAssetUrl(dto.coverImageUrl);
    const status = dto.status ?? ContentPublishStatus.DRAFT;
    const publishedAt = status === ContentPublishStatus.PUBLISHED ? new Date() : null;
    try {
      const event = await this.prisma.gameEvent.create({
        data: {
          gameId: dto.gameId,
          title: dto.title,
          slug,
          excerpt: dto.excerpt,
          content: dto.content,
          coverImageUrl: dto.coverImageUrl,
          status,
          startsAt,
          endsAt,
          publishedAt,
          seoTitle: dto.seoTitle,
          seoDescription: dto.seoDescription,
        },
        select: { id: true },
      });
      return this.getEvent(event.id);
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
  }

  async updateEvent(eventId: string, dto: AdminContentEventUpdateDto) {
    const current = await this.prisma.gameEvent.findUnique({ where: { id: eventId }, select: EVENT_SELECT });
    if (!current) throw this.notFound('Event not found');
    this.assertExpected(current.updatedAt, dto.expectedUpdatedAt);
    if (dto.gameId !== undefined) await this.assertGame(dto.gameId);
    if (dto.content !== undefined) {
      assertContentMarkdown(dto.content);
      if (!dto.content.trim()) throw this.invalidState('Content must not be empty');
    }
    assertAssetUrl(dto.coverImageUrl);
    const startsAt = dto.startsAt === undefined ? current.startsAt : this.date(dto.startsAt);
    const endsAt = dto.endsAt === undefined ? current.endsAt : dto.endsAt === null ? null : this.date(dto.endsAt);
    this.assertDateRange(startsAt, endsAt);
    const nextStatus = dto.status ?? current.status;
    if (![ContentPublishStatus.DRAFT, ContentPublishStatus.PUBLISHED].includes(nextStatus as ContentPublishStatus))
      throw this.invalidState('Event status is invalid');
    const fields = ['gameId', 'title', 'excerpt', 'content', 'coverImageUrl', 'startsAt', 'endsAt', 'seoTitle', 'seoDescription', 'status'].filter(
      (field) => dto[field as keyof AdminContentEventUpdateDto] !== undefined,
    );
    if (!fields.length) throw new DomainError(ErrorCode.ADMIN_NO_CHANGES, 'No content changes were provided', 400);
    const publishedAt =
      nextStatus === ContentPublishStatus.DRAFT
        ? null
        : current.status === ContentPublishStatus.DRAFT
          ? new Date()
          : current.publishedAt ?? new Date();
    const data: Prisma.GameEventUpdateManyMutationInput = {
      ...(dto.gameId !== undefined ? { gameId: dto.gameId } : {}),
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.excerpt !== undefined ? { excerpt: dto.excerpt } : {}),
      ...(dto.content !== undefined ? { content: dto.content } : {}),
      ...(dto.coverImageUrl !== undefined ? { coverImageUrl: dto.coverImageUrl } : {}),
      ...(dto.startsAt !== undefined ? { startsAt } : {}),
      ...(dto.endsAt !== undefined ? { endsAt } : {}),
      ...(dto.seoTitle !== undefined ? { seoTitle: dto.seoTitle } : {}),
      ...(dto.seoDescription !== undefined ? { seoDescription: dto.seoDescription } : {}),
      ...(dto.status !== undefined ? { status: nextStatus, publishedAt } : {}),
      updatedAt: new Date(),
    };
    if (dto.status === undefined && current.status === ContentPublishStatus.PUBLISHED)
      data.publishedAt = current.publishedAt ?? publishedAt;
    try {
      const updated = await this.prisma.gameEvent.updateMany({
        where: { id: eventId, updatedAt: current.updatedAt },
        data,
      });
      if (updated.count !== 1) throw this.stale('The event was changed by another operator');
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
    return this.getEvent(eventId);
  }

  async listAnnouncements(query: AdminContentAnnouncementsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();
    const where: Prisma.PortalAnnouncementWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(search ? { OR: [{ code: { contains: search } }, { title: { contains: search } }, { message: { contains: search } }] } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.portalAnnouncement.findMany({ where, orderBy: [{ startsAt: 'desc' }, { sortOrder: 'asc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize, select: ANNOUNCEMENT_SELECT }),
      this.prisma.portalAnnouncement.count({ where }),
    ]);
    return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async createAnnouncement(dto: AdminContentAnnouncementCreateDto) {
    const startsAt = this.date(dto.startsAt);
    const endsAt = dto.endsAt === undefined || dto.endsAt === null ? null : this.date(dto.endsAt);
    this.assertDateRange(startsAt, endsAt);
    assertCtaPath(dto.ctaPath);
    const status = dto.status ?? ContentPublishStatus.DRAFT;
    try {
      const announcement = await this.prisma.portalAnnouncement.create({
        data: {
          code: dto.code,
          title: dto.title,
          message: dto.message,
          ctaLabel: dto.ctaLabel,
          ctaPath: dto.ctaPath,
          status,
          startsAt,
          endsAt,
          sortOrder: dto.sortOrder,
        },
        select: { id: true },
      });
      return this.getAnnouncement(announcement.id);
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
  }

  async updateAnnouncement(announcementId: string, dto: AdminContentAnnouncementUpdateDto) {
    const current = await this.prisma.portalAnnouncement.findUnique({ where: { id: announcementId }, select: ANNOUNCEMENT_SELECT });
    if (!current) throw this.notFound('Announcement not found');
    this.assertExpected(current.updatedAt, dto.expectedUpdatedAt);
    const startsAt = dto.startsAt === undefined ? current.startsAt : this.date(dto.startsAt);
    const endsAt = dto.endsAt === undefined ? current.endsAt : dto.endsAt === null ? null : this.date(dto.endsAt);
    this.assertDateRange(startsAt, endsAt);
    assertCtaPath(dto.ctaPath);
    const nextStatus = dto.status ?? current.status;
    if (![ContentPublishStatus.DRAFT, ContentPublishStatus.PUBLISHED].includes(nextStatus as ContentPublishStatus))
      throw this.invalidState('Announcement status is invalid');
    const fields = ['title', 'message', 'ctaLabel', 'ctaPath', 'status', 'startsAt', 'endsAt', 'sortOrder'].filter(
      (field) => dto[field as keyof AdminContentAnnouncementUpdateDto] !== undefined,
    );
    if (!fields.length) throw new DomainError(ErrorCode.ADMIN_NO_CHANGES, 'No content changes were provided', 400);
    const data: Prisma.PortalAnnouncementUpdateManyMutationInput = {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.message !== undefined ? { message: dto.message } : {}),
      ...(dto.ctaLabel !== undefined ? { ctaLabel: dto.ctaLabel } : {}),
      ...(dto.ctaPath !== undefined ? { ctaPath: dto.ctaPath } : {}),
      ...(dto.status !== undefined ? { status: nextStatus } : {}),
      ...(dto.startsAt !== undefined ? { startsAt } : {}),
      ...(dto.endsAt !== undefined ? { endsAt } : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      updatedAt: new Date(),
    };
    try {
      const updated = await this.prisma.portalAnnouncement.updateMany({
        where: { id: announcementId, updatedAt: current.updatedAt },
        data,
      });
      if (updated.count !== 1) throw this.stale('The announcement was changed by another operator');
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
    return this.getAnnouncement(announcementId);
  }

  private async getAnnouncement(announcementId: string) {
    const announcement = await this.prisma.portalAnnouncement.findUnique({ where: { id: announcementId }, select: ANNOUNCEMENT_SELECT });
    if (!announcement) throw this.notFound('Announcement not found');
    return announcement;
  }

  private async assertGame(gameId: string | null | undefined) {
    if (gameId === null || gameId === undefined) return;
    const game = await this.prisma.game.findUnique({ where: { id: gameId }, select: { id: true } });
    if (!game) throw this.notFound('Game not found');
  }

  private publicGame<T extends { genres: { genre: { code: string; name: string; slug: string } }[]; platforms: { platform: string }[] }>(game: T) {
    return {
      ...game,
      genres: game.genres.map(({ genre }) => genre),
      platforms: game.platforms
        .map(({ platform }) => platform)
        .sort((left, right) => GAME_PLATFORMS.indexOf(left as (typeof GAME_PLATFORMS)[number]) - GAME_PLATFORMS.indexOf(right as (typeof GAME_PLATFORMS)[number])),
    };
  }

  private publicArticle<T extends { game: { id: string; code: string; name: string; slug: string } | null }>(article: T) {
    return {
      ...article,
      game: article.game,
    };
  }

  private publicEvent<T extends { game: { id: string; code: string; name: string; slug: string } | null }>(event: T) {
    return {
      ...event,
      game: event.game,
    };
  }

  private date(value: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw this.invalidState('Content date is invalid');
    return parsed;
  }

  private assertDateRange(startsAt: Date, endsAt: Date | null) {
    if (endsAt && endsAt.getTime() <= startsAt.getTime()) throw this.invalidState('End date must be after start date');
  }

  private assertExpected(current: Date, expected: string) {
    const parsed = new Date(expected);
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() !== current.getTime()) throw this.stale('The content was changed by another operator');
  }

  private rethrowUnique(error: unknown): void {
    if ((error as { code?: string }).code === 'P2002')
      throw new DomainError(ErrorCode.CONTENT_SLUG_EXISTS, 'Content slug or code already exists', 409);
  }

  async uploadAsset(file?: AssetUpload) {
    if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
      throw new DomainError(ErrorCode.INVALID_MEDIA, 'File is required', 400);
    }
    if (file.buffer.length > ASSET_MAX_BYTES) {
      throw new DomainError(ErrorCode.INVALID_MEDIA, 'File must be 10 MB or smaller', 400);
    }
    const extension = ASSET_EXTENSIONS[file.mimetype];
    if (!extension || !this.hasImageSignature(file.buffer, file.mimetype)) {
      throw new DomainError(
        ErrorCode.INVALID_MEDIA,
        'File must be a valid JPEG, PNG, WebP, GIF, or SVG image',
        400,
      );
    }

    const uploadRoot = resolve(this.config.get<string>('uploadDir') ?? 'uploads');
    const contentDir = join(uploadRoot, 'content');
    const filename = `${randomUUID()}${extension}`;
    const targetPath = join(contentDir, filename);
    const url = `/uploads/content/${filename}`;
    try {
      await mkdir(contentDir, { recursive: true });
      await writeFile(targetPath, file.buffer, { flag: 'wx' });
    } catch {
      throw new DomainError(ErrorCode.INVALID_MEDIA, 'Asset could not be stored', 500);
    }
    return { url };
  }

  private hasImageSignature(buffer: Buffer, mimetype: string) {
    if (mimetype === 'image/jpeg') {
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    if (mimetype === 'image/png') {
      return buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    }
    if (mimetype === 'image/webp') {
      return (
        buffer.length >= 12 &&
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP'
      );
    }
    if (mimetype === 'image/gif') {
      return (
        buffer.length >= 6 &&
        (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a')
      );
    }
    if (mimetype === 'image/svg+xml') {
      const text = buffer.toString('utf8', 0, Math.min(buffer.length, 1000)).trim();
      return text.includes('<svg') || text.includes('<?xml');
    }
    return false;
  }

  private notFound(message: string) {
    return new DomainError(ErrorCode.CONTENT_NOT_FOUND, message, 404);
  }

  private invalidState(message: string) {
    return new DomainError(ErrorCode.CONTENT_INVALID_STATE, message, 400);
  }

  private async resolveGenreIds(codes: string[]) {
    const genres = await this.prisma.genre.findMany({
      where: { code: { in: codes } },
      select: { code: true, id: true },
    });
    const idsByCode = new Map(genres.map((genre) => [genre.code, genre.id]));
    const missing = codes.filter((code) => !idsByCode.has(code));
    if (missing.length) throw this.invalidState(`Unknown genre: ${missing.join(', ')}`);
    return codes.map((code) => idsByCode.get(code)!);
  }

  private stale(message: string) {
    return new DomainError(ErrorCode.STALE_ADMIN_UPDATE, message, 409);
  }
}

function normalizeGameSlug(value: string) {
  const slug = normalizeSlug(value);
  if (slug.length > 160) throw new DomainError(ErrorCode.CONTENT_INVALID_STATE, 'Game slug is invalid', 400);
  return slug;
}

function normalizeGameSubdomain(value: string) {
  return value.trim().toLowerCase();
}

function normalizeGameCodes(values: string[]) {
  const normalized = values.map((value) => value.trim().toUpperCase());
  if (new Set(normalized).size !== normalized.length) {
    throw new DomainError(ErrorCode.CONTENT_INVALID_STATE, 'Game genres must be unique', 400);
  }
  return normalized;
}

function normalizeGamePlatforms(values: Array<'PC' | 'MOBILE' | 'WEB'>) {
  const normalized = values.map((value) => value.trim().toUpperCase());
  if (new Set(normalized).size !== normalized.length) {
    throw new DomainError(ErrorCode.CONTENT_INVALID_STATE, 'Game platforms must be unique', 400);
  }
  if (normalized.some((value) => !GAME_PLATFORMS.includes(value as (typeof GAME_PLATFORMS)[number]))) {
    throw new DomainError(ErrorCode.CONTENT_INVALID_STATE, 'Game platform is invalid', 400);
  }
  return normalized as Array<'PC' | 'MOBILE' | 'WEB'>;
}

function parseChecklist(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string') ? parsed : [];
  } catch {
    return [];
  }
}

function assertGameSubdomain(value: string) {
  if (RESERVED_SUBDOMAINS.has(value) || !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(value)) {
    throw new DomainError(ErrorCode.CONTENT_INVALID_STATE, 'Game subdomain is invalid or reserved', 400);
  }
}
