import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GameArticleStatus } from '../common/domain';
import { DomainError, ErrorCode } from '../common/errors';
import { PrismaService } from '../database/prisma.service';
import { GamesQueryDto } from './game.dto';
import { parseGamePageConfig } from '../admin/content/game-templates';
import { Marked } from 'marked';

const GAME_INCLUDE = {
  genres: { include: { genre: true } },
  platforms: true,
};

function gameDetailInclude(now: Date) {
  return {
    ...GAME_INCLUDE,
    articles: {
      where: {
        status: GameArticleStatus.PUBLISHED,
        publishedAt: { not: null, lte: now },
        deletedAt: null,
      },
      orderBy: [
        { publishedAt: 'desc' as Prisma.SortOrder },
        { createdAt: 'desc' as Prisma.SortOrder },
      ],
    },
    milestones: {
      orderBy: [{ sortOrder: 'asc' as Prisma.SortOrder }, { title: 'asc' as Prisma.SortOrder }],
    },
  };
}

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: GamesQueryDto) {
    const where: Prisma.GameWhereInput = {
      isPublic: true,
      ...(query.status ? { lifecycleStatus: query.status } : {}),
      ...(query.genre ? { genres: { some: { genre: { code: query.genre.trim().toUpperCase() } } } } : {}),
      ...(query.platform ? { platforms: { some: { platform: query.platform.trim().toUpperCase() } } } : {}),
    };
    const games = await this.prisma.game.findMany({ where, include: GAME_INCLUDE, orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }] });
    return { items: games.map((game) => this.publicGameSummary(game)) };
  }

  async bySlug(slug: string) {
    const game = await this.prisma.game.findFirst({
      where: { slug: slug.trim().toLowerCase(), isPublic: true },
      include: gameDetailInclude(new Date()),
    });
    if (!game) throw new DomainError(ErrorCode.GAME_NOT_FOUND, 'Game not found', 404);
    return this.publicGameDetail(game);
  }

  async bySubdomain(subdomain: string) {
    const game = await this.prisma.game.findFirst({
      where: { subdomain: subdomain.trim().toLowerCase(), isPublic: true },
      include: gameDetailInclude(new Date()),
    });
    if (!game) throw new DomainError(ErrorCode.GAME_NOT_FOUND, 'Game not found', 404);
    return this.publicGameDetail(game);
  }

  async articles(slug: string) {
    const game = await this.prisma.game.findFirst({ where: { slug: slug.trim().toLowerCase(), isPublic: true }, select: { id: true } });
    if (!game) throw new DomainError(ErrorCode.GAME_NOT_FOUND, 'Game not found', 404);
    const articles = await this.prisma.gameArticle.findMany({
      where: {
        gameId: game.id,
        status: GameArticleStatus.PUBLISHED,
        publishedAt: { not: null, lte: new Date() },
        deletedAt: null,
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    });
    return { items: articles.map((article) => this.publicArticleSummary(article)) };
  }

  async article(slug: string, articleSlug: string) {
    const article = await this.prisma.gameArticle.findFirst({
      where: {
        game: { slug: slug.trim().toLowerCase(), isPublic: true },
        slug: articleSlug.trim().toLowerCase(),
        status: GameArticleStatus.PUBLISHED,
        publishedAt: { not: null, lte: new Date() },
        deletedAt: null,
      },
    });
    if (!article) throw new DomainError(ErrorCode.GAME_ARTICLE_NOT_FOUND, 'Game article not found', 404);
    const related = await this.prisma.gameArticle.findMany({
      where: {
        gameId: article.gameId,
        id: { not: article.id },
        status: GameArticleStatus.PUBLISHED,
        publishedAt: { not: null },
        deletedAt: null,
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 3,
    });
    return { ...this.publicArticleDetail(article), related: related.map((item) => this.publicArticleSummary(item)) };
  }

  async roadmap(slug: string) {
    const game = await this.prisma.game.findFirst({ where: { slug: slug.trim().toLowerCase(), isPublic: true }, select: { id: true } });
    if (!game) throw new DomainError(ErrorCode.GAME_NOT_FOUND, 'Game not found', 404);
    const milestones = await this.prisma.gameMilestone.findMany({ where: { gameId: game.id }, orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }] });
    return { items: milestones.map((milestone) => this.publicMilestone(milestone)) };
  }

  private publicGameSummary(game: any) {
    return {
      code: game.code,
      name: game.name,
      slug: game.slug,
      subdomain: game.subdomain,
      recordType: game.recordType,
      tagline: game.tagline,
      shortDescription: game.shortDescription,
      lifecycleStatus: game.lifecycleStatus,
      operationalStatus: game.operationalStatus,
      releaseYear: game.releaseYear,
      themePreset: game.themePreset,
      logoUrl: game.logoUrl,
      iconUrl: game.iconUrl,
      coverUrl: game.coverUrl,
      heroDesktopUrl: game.heroDesktopUrl,
      heroMobileUrl: game.heroMobileUrl,
      primaryCtaLabel: game.primaryCtaLabel,
      primaryCtaPath: game.primaryCtaPath,
      secondaryCtaLabel: game.secondaryCtaLabel,
      secondaryCtaPath: game.secondaryCtaPath,
      featured: game.featured,
      primaryGame: game.primaryGame,
      sortOrder: game.sortOrder,
      genres: game.genres
        .slice()
        .sort((left: any, right: any) => left.genre.sortOrder - right.genre.sortOrder)
        .map((entry: any) => ({ code: entry.genre.code, name: entry.genre.name, slug: entry.genre.slug })),
      platforms: game.platforms
        .map((entry: any) => entry.platform)
        .sort((left: string, right: string) => platformRank(left) - platformRank(right)),
    };
  }

  private publicGameDetail(game: any) {
    return {
      ...this.publicGameSummary(game),
      longDescription: game.longDescription,
      theme: parseThemeConfig(game.themeConfig),
      featureConfig: parseFeatureConfig(game.featureConfig),
      pageConfig: parseGamePageConfig(game.pageConfig, game.themePreset),
      articles: game.articles.map((article: any) => this.publicArticleSummary(article)),
      milestones: game.milestones.map((milestone: any) => this.publicMilestone(milestone)),
    };
  }

  private publicArticleSummary(article: any) {
    return {
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      coverImageUrl: article.coverImageUrl,
      category: article.category,
      publishedAt: article.publishedAt,
      seoTitle: article.seoTitle,
      seoDescription: article.seoDescription,
    };
  }

  private publicArticleDetail(article: any) {
    return { ...this.publicArticleSummary(article), contentHtml: markdownToSafeHtml(article.content) };
  }

  private publicMilestone(milestone: any) {
    const checklist = parseJsonArray(milestone.checklistConfig, 'checklistConfig');
    return { title: milestone.title, description: milestone.description, displayPeriod: milestone.displayPeriod, status: milestone.status, checklist, sortOrder: milestone.sortOrder };
  }
}

function platformRank(platform: string) {
  return ({ PC: 1, MOBILE: 2, WEB: 3 } as Record<string, number>)[platform] ?? 99;
}

function parseJsonObject(value: string, field: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not object');
    return parsed as Record<string, unknown>;
  } catch {
    throw new DomainError(ErrorCode.GAME_CONFIG_INVALID, `Invalid ${field}`, 500);
  }
}

function parseThemeConfig(value: string): Record<string, unknown> {
  const parsed = parseJsonObject(value, 'themeConfig');
  const optionalKeys = ['secondary', 'heading', 'body', 'radius', 'motion'];
  if (typeof parsed.primary !== 'string' || typeof parsed.surface !== 'string' || typeof parsed.text !== 'string' || optionalKeys.some((key) => parsed[key] !== undefined && typeof parsed[key] !== 'string')) {
    throw new DomainError(ErrorCode.GAME_CONFIG_INVALID, 'Invalid themeConfig', 500);
  }
  return parsed;
}

function parseFeatureConfig(value: string): Record<string, unknown> & { sections: string[] } {
  const parsed = parseJsonObject(value, 'featureConfig');
  const routeKeys = ['ABOUT', 'NEWS', 'ROADMAP', 'DOWNLOAD'];
  if (!Array.isArray(parsed.sections) || parsed.sections.some((section) => typeof section !== 'string') || (parsed.routes !== undefined && (!Array.isArray(parsed.routes) || parsed.routes.some((route) => typeof route !== 'string' || !routeKeys.includes(route)))) || (parsed.downloads !== undefined && parsed.downloads !== 'COMING_SOON' && typeof parsed.downloads !== 'boolean')) {
    throw new DomainError(ErrorCode.GAME_CONFIG_INVALID, 'Invalid featureConfig', 500);
  }
  return parsed as Record<string, unknown> & { sections: string[] };
}

function parseJsonArray(value: string, field: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string')) throw new Error('not string array');
    return parsed;
  } catch {
    throw new DomainError(ErrorCode.GAME_CONFIG_INVALID, `Invalid ${field}`, 500);
  }
}

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

const markdownParser = new Marked({
  gfm: true,
  breaks: true,
});

markdownParser.use({
  renderer: {
    html({ text }) {
      return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },
    link({ href, title, text }) {
      const cleanHref = href && (/^https?:\/\//i.test(href) || href.startsWith('/')) ? href : '#';
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${cleanHref}"${titleAttr} rel="noopener noreferrer" target="_blank">${text}</a>`;
    },
    image({ href, title, text }) {
      const cleanHref = href && (/^https?:\/\//i.test(href) || href.startsWith('/')) ? href : '';
      if (!cleanHref) return '';
      const titleAttr = title ? ` title="${title}"` : '';
      const altAttr = text ? ` alt="${text}"` : '';
      return `<img src="${cleanHref}"${altAttr}${titleAttr} loading="lazy" />`;
    },
  },
});

export function markdownToSafeHtml(markdown: string): string {
  if (!markdown || typeof markdown !== 'string' || !markdown.trim()) return '';
  try {
    return (markdownParser.parse(markdown.trim()) as string).trim();
  } catch {
    return escapeHtml(markdown.trim());
  }
}

