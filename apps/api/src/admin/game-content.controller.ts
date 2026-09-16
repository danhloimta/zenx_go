import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { GameAccessGuard, GameAdminRequest } from './game-access.guard';
import { GamePermissionGuard } from './game-permission.guard';
import { RequirePermission } from './permission.decorator';
import { GameContentService } from './game-content.service';
import { AdminContentArticleCreateDto, AdminContentArticleUpdateDto, AdminContentArticlesQueryDto, AdminContentEventCreateDto, AdminContentEventUpdateDto, AdminContentEventsQueryDto, AdminContentGamePresentationUpdateDto } from './content/content.dto';

@Controller('game-admin/games/:gameId')
@UseGuards(AuthGuard, GameAccessGuard, GamePermissionGuard)
export class GameContentController {
  constructor(private readonly content: GameContentService) {}
  @Get('presentation') @RequirePermission({ code: 'game.presentation.manage', action: 'manage', subject: 'GamePresentation' }) presentation(@Param('gameId') id: string) { return this.content.presentation(id); }
  @Patch('presentation') @RequirePermission({ code: 'game.presentation.manage', action: 'manage', subject: 'GamePresentation' }) updatePresentation(@Param('gameId') id: string, @Body() dto: AdminContentGamePresentationUpdateDto, @Req() req: GameAdminRequest) { return this.content.updatePresentation(id, dto, req.user.sub); }
  @Get('articles') @RequirePermission({ code: 'game.content.manage', action: 'manage', subject: 'GameContent' }) articles(@Param('gameId') id: string, @Query() query: AdminContentArticlesQueryDto) { return this.content.listArticles(id, query); }
  @Get('articles/:articleId') @RequirePermission({ code: 'game.content.manage', action: 'manage', subject: 'GameContent' }) article(@Param('gameId') id: string, @Param('articleId') article: string) { return this.content.getArticle(id, article); }
  @Post('articles') @RequirePermission({ code: 'game.content.manage', action: 'manage', subject: 'GameContent' }) createArticle(@Param('gameId') id: string, @Body() dto: AdminContentArticleCreateDto, @Req() req: GameAdminRequest) { return this.content.createArticle(id, dto, req.user.sub); }
  @Patch('articles/:articleId') @RequirePermission({ code: 'game.content.manage', action: 'manage', subject: 'GameContent' }) updateArticle(@Param('gameId') id: string, @Param('articleId') article: string, @Body() dto: AdminContentArticleUpdateDto, @Req() req: GameAdminRequest) { return this.content.updateArticle(id, article, dto, req.user.sub); }
  @Delete('articles/:articleId') @RequirePermission({ code: 'game.content.manage', action: 'manage', subject: 'GameContent' }) deleteArticle(@Param('gameId') id: string, @Param('articleId') article: string, @Req() req: GameAdminRequest) { return this.content.deleteArticle(id, article, req.user.sub); }
  @Post('articles/:articleId/restore') @RequirePermission({ code: 'game.content.manage', action: 'manage', subject: 'GameContent' }) restoreArticle(@Param('gameId') id: string, @Param('articleId') article: string, @Req() req: GameAdminRequest) { return this.content.restoreArticle(id, article, req.user.sub); }
  @Get('events') @RequirePermission({ code: 'game.events.manage', action: 'manage', subject: 'GameEvent' }) events(@Param('gameId') id: string, @Query() query: AdminContentEventsQueryDto) { return this.content.listEvents(id, query); }
  @Get('events/:eventId') @RequirePermission({ code: 'game.events.manage', action: 'manage', subject: 'GameEvent' }) event(@Param('gameId') id: string, @Param('eventId') event: string) { return this.content.getEvent(id, event); }
  @Post('events') @RequirePermission({ code: 'game.events.manage', action: 'manage', subject: 'GameEvent' }) createEvent(@Param('gameId') id: string, @Body() dto: AdminContentEventCreateDto, @Req() req: GameAdminRequest) { return this.content.createEvent(id, dto, req.user.sub); }
  @Patch('events/:eventId') @RequirePermission({ code: 'game.events.manage', action: 'manage', subject: 'GameEvent' }) updateEvent(@Param('gameId') id: string, @Param('eventId') event: string, @Body() dto: AdminContentEventUpdateDto, @Req() req: GameAdminRequest) { return this.content.updateEvent(id, event, dto, req.user.sub); }
}
