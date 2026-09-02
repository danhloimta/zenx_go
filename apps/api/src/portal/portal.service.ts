import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { DomainError, ErrorCode } from '../common/errors';
import { markdownToSafeHtml } from '../game/game.service';
import { PrismaService } from '../database/prisma.service';
import { PortalEventsQueryDto, PortalNewsQueryDto } from './portal.dto';

const PUBLIC_STATUS = 'PUBLISHED';
const GAME_INCLUDE = {
  genres: { include: { genre: true } },
  platforms: true,
};

@Injectable()
export class PortalService {
  private readonly webOrigin: string;

  constructor(private readonly prisma: PrismaService, config: ConfigService) {
    this.webOrigin = config.get<string>('webOrigin') ?? 'http://lvh.me:3000';
  }

  async home() {
    const now = new Date();
    const [announcement, games, articles, activeEvents] = await this.prisma.$transaction([
      this.prisma.portalAnnouncement.findFirst({
        where: {
          status: PUBLIC_STATUS,
          startsAt: { lte: now },
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        },
        orderBy: [{ sortOrder: 'asc' }, { startsAt: 'desc' }],
      }),
      this.prisma.game.findMany({
        where: { isPublic: true },
        include: GAME_INCLUDE,
        orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.gameArticle.findMany({
        where: {
          status: PUBLIC_STATUS,
          publishedAt: { not: null, lte: now },
          game: { isPublic: true },
        },
        include: { game: { select: { name: true, slug: true, subdomain: true } } },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: 3,
      }),
      this.prisma.gameEvent.findMany({
        where: {
          status: PUBLIC_STATUS,
          publishedAt: { not: null, lte: now },
          startsAt: { lte: now },
          AND: [
            { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
            { OR: [{ gameId: null }, { game: { isPublic: true } }] },
          ],
        },
        include: { game: { select: { name: true, slug: true, subdomain: true } } },
        orderBy: [{ startsAt: 'asc' }, { publishedAt: 'desc' }],
        take: 3,
      }),
    ]);

    const publicGames = games.map((game) => this.publicGameSummary(game));
    return {
      announcement: announcement ? this.publicAnnouncement(announcement) : null,
      heroGames: publicGames.filter((game) => game.featured || game.primaryGame).slice(0, 4),
      games: publicGames,
      latestArticles: articles.map((article) => this.publicArticleSummary(article)),
      activeEvents: activeEvents.map((event) => this.publicEventSummary(event, now)),
    };
  }

  async news(query: PortalNewsQueryDto) {
    const now = new Date();
    const where: Prisma.GameArticleWhereInput = {
      status: PUBLIC_STATUS,
      publishedAt: { not: null, lte: now },
      game: {
        isPublic: true,
        ...(query.game ? this.gameFilter(query.game) : {}),
      },
      ...(query.category ? { category: query.category } : {}),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [articles, total] = await this.prisma.$transaction([
      this.prisma.gameArticle.findMany({
        where,
        include: { game: { select: { name: true, slug: true, subdomain: true } } },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: query.pageSize,
      }),
      this.prisma.gameArticle.count({ where }),
    ]);
    return {
      items: articles.map((article) => this.publicArticleSummary(article)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async events(query: PortalEventsQueryDto) {
    const now = new Date();
    const where: Prisma.GameEventWhereInput = {
      status: PUBLIC_STATUS,
      publishedAt: { not: null, lte: now },
      AND: [
        { OR: [{ gameId: null }, { game: { isPublic: true } }] },
        this.eventTimeFilter(query.status, now),
        ...(query.game ? [{ game: { isPublic: true, ...this.gameFilter(query.game) } }] : []),
      ],
    };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.gameEvent.findMany({
        where,
        include: { game: { select: { name: true, slug: true, subdomain: true } } },
        orderBy: [{ startsAt: 'asc' }, { publishedAt: 'desc' }],
        skip,
        take: query.pageSize,
      }),
      this.prisma.gameEvent.count({ where }),
    ]);
    return {
      items: items.map((event) => this.publicEventSummary(event, now)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async event(slug: string) {
    const item = await this.prisma.gameEvent.findFirst({
      where: {
        slug: slug.trim().toLowerCase(),
        status: PUBLIC_STATUS,
        publishedAt: { not: null, lte: new Date() },
        OR: [{ gameId: null }, { game: { isPublic: true } }],
      },
      include: { game: { select: { name: true, slug: true, subdomain: true } } },
    });
    if (!item) throw new DomainError(ErrorCode.PORTAL_EVENT_NOT_FOUND, 'Portal event not found', 404);
    return {
      ...this.publicEventSummary(item, new Date()),
      contentHtml: markdownToSafeHtml(item.content),
      seoTitle: item.seoTitle,
      seoDescription: item.seoDescription,
    };
  }

  private publicAnnouncement(item: any) {
    return {
      code: item.code,
      title: item.title,
      message: item.message,
      ctaLabel: item.ctaLabel,
      ctaPath: item.ctaPath,
      startsAt: item.startsAt,
      endsAt: item.endsAt,
    };
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

  private publicArticleSummary(article: any) {
    const game = article.game ? { name: article.game.name, slug: article.game.slug, subdomain: article.game.subdomain } : undefined;
    return {
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      coverImageUrl: article.coverImageUrl,
      category: article.category,
      publishedAt: article.publishedAt,
      seoTitle: article.seoTitle,
      seoDescription: article.seoDescription,
      readTimeMinutes: this.readTimeMinutes(article.content),
      game,
      href: game ? this.gameUrl(game.subdomain, `/tin-tuc/${article.slug}`) : this.portalUrl(`/news/${article.slug}`),
    };
  }

  private publicEventSummary(event: any, now: Date) {
    const game = event.game ? { name: event.game.name, slug: event.game.slug, subdomain: event.game.subdomain } : undefined;
    return {
      title: event.title,
      slug: event.slug,
      excerpt: event.excerpt,
      coverImageUrl: event.coverImageUrl,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      publishedAt: event.publishedAt,
      status: this.eventStatus(event, now),
      game,
      href: this.portalUrl(`/events/${event.slug}`),
    };
  }

  private eventStatus(event: { startsAt: Date; endsAt: Date | null }, now: Date) {
    if (event.startsAt > now) return 'UPCOMING';
    if (event.endsAt && event.endsAt <= now) return 'ENDED';
    return 'ACTIVE';
  }

  private eventTimeFilter(status: string | undefined, now: Date): Prisma.GameEventWhereInput {
    if (status === 'UPCOMING') return { startsAt: { gt: now } };
    if (status === 'ENDED') return { endsAt: { not: null, lte: now } };
    if (status === 'ACTIVE') return { startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] };
    return {};
  }

  private gameFilter(value: string): Prisma.GameWhereInput {
    const normalized = value.trim().toLowerCase();
    return { OR: [{ slug: normalized }, { subdomain: normalized }] };
  }

  private readTimeMinutes(content: string | undefined) {
    const words = content?.trim().split(/\s+/).filter(Boolean).length ?? 0;
    return Math.max(1, Math.ceil(words / 180));
  }

  private portalUrl(path: string) {
    return this.buildUrl(path);
  }

  private gameUrl(subdomain: string, path: string) {
    return this.buildUrl(path, subdomain);
  }

  private buildUrl(path: string, subdomain?: string) {
    const url = new URL(this.webOrigin);
    if (subdomain) url.hostname = `${subdomain}.${url.hostname}`;
    url.pathname = path.startsWith('/') ? path : `/${path}`;
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, path === '/' ? '/' : '');
  }
}

function platformRank(platform: string) {
  return ({ PC: 1, MOBILE: 2, WEB: 3 } as Record<string, number>)[platform] ?? 99;
}
