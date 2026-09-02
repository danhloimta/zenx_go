import { Controller, Get, Param, Query } from '@nestjs/common';
import { GamesQueryDto } from './game.dto';
import { GameService } from './game.service';

@Controller('games')
export class GameController {
  constructor(private readonly games: GameService) {}

  @Get()
  list(@Query() query: GamesQueryDto) { return this.games.list(query); }

  @Get('by-subdomain/:subdomain')
  bySubdomain(@Param('subdomain') subdomain: string) { return this.games.bySubdomain(subdomain); }

  @Get(':slug/articles/:articleSlug')
  article(@Param('slug') slug: string, @Param('articleSlug') articleSlug: string) { return this.games.article(slug, articleSlug); }

  @Get(':slug/articles')
  articles(@Param('slug') slug: string) { return this.games.articles(slug); }

  @Get(':slug/roadmap')
  roadmap(@Param('slug') slug: string) { return this.games.roadmap(slug); }

  @Get(':slug')
  detail(@Param('slug') slug: string) { return this.games.bySlug(slug); }
}
