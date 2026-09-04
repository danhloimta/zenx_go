import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { AdminGuard, AdminRequest } from '../admin.guard';
import { RequireAdminRoles } from '../admin-roles.decorator';
import { AdminRole } from '../../common/domain';
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
  AdminContentGameUpdateDto,
  AdminContentGamesQueryDto,
} from './content.dto';
import { ContentAdminService } from './content.service';

@Controller('admin/content')
@UseGuards(AuthGuard, AdminGuard)
@RequireAdminRoles(AdminRole.SUPER_ADMIN)
export class ContentAdminController {
  constructor(private readonly content: ContentAdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.content.dashboard();
  }

  @Get('games')
  games(@Query() query: AdminContentGamesQueryDto) {
    return this.content.listGames(query);
  }

  @Get('games/:gameId')
  game(@Param('gameId') gameId: string) {
    return this.content.getGame(gameId);
  }

  @Patch('games/:gameId')
  updateGame(
    @Param('gameId') gameId: string,
    @Req() request: AdminRequest,
    @Body() dto: AdminContentGameUpdateDto,
  ) {
    return this.content.updateGame(gameId, dto, this.context(request));
  }

  @Get('articles')
  articles(@Query() query: AdminContentArticlesQueryDto) {
    return this.content.listArticles(query);
  }

  @Get('articles/:articleId')
  article(@Param('articleId') articleId: string) {
    return this.content.getArticle(articleId);
  }

  @Post('articles')
  createArticle(@Req() request: AdminRequest, @Body() dto: AdminContentArticleCreateDto) {
    return this.content.createArticle(dto, this.context(request));
  }

  @Patch('articles/:articleId')
  updateArticle(
    @Param('articleId') articleId: string,
    @Req() request: AdminRequest,
    @Body() dto: AdminContentArticleUpdateDto,
  ) {
    return this.content.updateArticle(articleId, dto, this.context(request));
  }

  @Get('events')
  events(@Query() query: AdminContentEventsQueryDto) {
    return this.content.listEvents(query);
  }

  @Get('events/:eventId')
  event(@Param('eventId') eventId: string) {
    return this.content.getEvent(eventId);
  }

  @Post('events')
  createEvent(@Req() request: AdminRequest, @Body() dto: AdminContentEventCreateDto) {
    return this.content.createEvent(dto, this.context(request));
  }

  @Patch('events/:eventId')
  updateEvent(
    @Param('eventId') eventId: string,
    @Req() request: AdminRequest,
    @Body() dto: AdminContentEventUpdateDto,
  ) {
    return this.content.updateEvent(eventId, dto, this.context(request));
  }

  @Get('announcements')
  announcements(@Query() query: AdminContentAnnouncementsQueryDto) {
    return this.content.listAnnouncements(query);
  }

  @Post('announcements')
  createAnnouncement(
    @Req() request: AdminRequest,
    @Body() dto: AdminContentAnnouncementCreateDto,
  ) {
    return this.content.createAnnouncement(dto, this.context(request));
  }

  @Patch('announcements/:announcementId')
  updateAnnouncement(
    @Param('announcementId') announcementId: string,
    @Req() request: AdminRequest,
    @Body() dto: AdminContentAnnouncementUpdateDto,
  ) {
    return this.content.updateAnnouncement(announcementId, dto, this.context(request));
  }

  private context(request: AdminRequest) {
    const userAgent = request.get('user-agent');
    return {
      actorUserId: request.user.sub,
      ipAddress: request.ip,
      ...(userAgent ? { userAgent } : {}),
    };
  }
}
