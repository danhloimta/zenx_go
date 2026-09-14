import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../auth/auth.guard';
import { AdminGuard } from '../admin.guard';
import { PermissionGuard } from '../permission.guard';
import { RequirePermission } from '../permission.decorator';
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
  AdminContentGenreCreateDto,
  AdminContentGenreUpdateDto,
  AdminContentGenresQueryDto,
} from './content.dto';
import { ContentAdminService } from './content.service';

@Controller('admin/content')
@UseGuards(AuthGuard, AdminGuard, PermissionGuard)
export class ContentAdminController {
  constructor(private readonly content: ContentAdminService) {}

  @Get('dashboard')
  @RequirePermission({ code: 'content.dashboard.view', action: 'read', subject: 'ContentDashboard' })
  dashboard() {
    return this.content.dashboard();
  }

  @Post('upload')
  @RequirePermission({ code: 'content.assets.upload', action: 'upload', subject: 'Asset' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadAsset(
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size?: number } | undefined,
  ) {
    return this.content.uploadAsset(file);
  }

  @Get('games')
  @RequirePermission({ code: 'games.view', action: 'read', subject: 'Game' })
  games(@Query() query: AdminContentGamesQueryDto) {
    return this.content.listGames(query);
  }

  @Get('game-templates')
  @RequirePermission({ code: 'games.view', action: 'read', subject: 'Game' })
  gameTemplates() {
    return this.content.listGameTemplates();
  }

  @Post('games')
  @RequirePermission({ code: 'games.manage', action: 'manage', subject: 'Game' })
  createGame(@Body() dto: AdminContentGameCreateDto) {
    return this.content.createGame(dto);
  }

  @Get('games/:gameId')
  @RequirePermission({ code: 'games.view', action: 'read', subject: 'Game' })
  game(@Param('gameId') gameId: string) {
    return this.content.getGame(gameId);
  }

  @Get('games/:gameId/readiness')
  @RequirePermission({ code: 'games.view', action: 'read', subject: 'Game' })
  gameReadiness(@Param('gameId') gameId: string) {
    return this.content.gameReadiness(gameId);
  }

  @Get('games/:gameId/preview')
  @RequirePermission({ code: 'games.view', action: 'read', subject: 'Game' })
  previewGame(@Param('gameId') gameId: string) {
    return this.content.previewGame(gameId);
  }

  @Post('games/:gameId/publish')
  @RequirePermission({ code: 'games.publish', action: 'publish', subject: 'Game' })
  publishGame(@Param('gameId') gameId: string) {
    return this.content.publishGame(gameId);
  }

  @Post('games/:gameId/unpublish')
  @RequirePermission({ code: 'games.publish', action: 'publish', subject: 'Game' })
  unpublishGame(@Param('gameId') gameId: string) {
    return this.content.unpublishGame(gameId);
  }

  @Get('game-options')
  @RequirePermission({ code: 'games.view', action: 'read', subject: 'Game' })
  gameOptions() {
    return this.content.gameOptions();
  }

  @Get('genres')
  @RequirePermission({ code: 'genres.manage', action: 'manage', subject: 'Genre' })
  genres(@Query() query: AdminContentGenresQueryDto) {
    return this.content.listGenres(query);
  }

  @Post('genres')
  @RequirePermission({ code: 'genres.manage', action: 'manage', subject: 'Genre' })
  createGenre(@Body() dto: AdminContentGenreCreateDto) {
    return this.content.createGenre(dto);
  }

  @Patch('genres/:genreId')
  @RequirePermission({ code: 'genres.manage', action: 'manage', subject: 'Genre' })
  updateGenre(@Param('genreId') genreId: string, @Body() dto: AdminContentGenreUpdateDto) {
    return this.content.updateGenre(genreId, dto);
  }

  @Delete('genres/:genreId')
  @RequirePermission({ code: 'genres.manage', action: 'manage', subject: 'Genre' })
  deleteGenre(@Param('genreId') genreId: string) {
    return this.content.deleteGenre(genreId);
  }

  @Patch('games/:gameId')
  @RequirePermission({ code: 'games.manage', action: 'manage', subject: 'Game' })
  updateGame(
    @Param('gameId') gameId: string,
    @Body() dto: AdminContentGameUpdateDto,
  ) {
    return this.content.updateGame(gameId, dto);
  }

  @Patch('games/:gameId/presentation')
  @RequirePermission({ code: 'games.manage', action: 'manage', subject: 'Game' })
  updateGamePresentation(
    @Param('gameId') gameId: string,
    @Body() dto: AdminContentGamePresentationUpdateDto,
  ) {
    return this.content.updateGamePresentation(gameId, dto);
  }

  @Get('articles')
  @RequirePermission({ code: 'articles.manage', action: 'manage', subject: 'Article' })
  articles(@Query() query: AdminContentArticlesQueryDto) {
    return this.content.listArticles(query);
  }

  @Get('articles/:articleId')
  @RequirePermission({ code: 'articles.manage', action: 'manage', subject: 'Article' })
  article(@Param('articleId') articleId: string) {
    return this.content.getArticle(articleId);
  }

  @Post('articles')
  @RequirePermission({ code: 'articles.manage', action: 'manage', subject: 'Article' })
  createArticle(@Body() dto: AdminContentArticleCreateDto) {
    return this.content.createArticle(dto);
  }

  @Patch('articles/:articleId')
  @RequirePermission({ code: 'articles.manage', action: 'manage', subject: 'Article' })
  updateArticle(
    @Param('articleId') articleId: string,
    @Body() dto: AdminContentArticleUpdateDto,
  ) {
    return this.content.updateArticle(articleId, dto);
  }

  @Delete('articles/:articleId')
  @RequirePermission({ code: 'articles.manage', action: 'manage', subject: 'Article' })
  deleteArticle(@Param('articleId') articleId: string) {
    return this.content.deleteArticle(articleId);
  }

  @Post('articles/:articleId/restore')
  @RequirePermission({ code: 'articles.manage', action: 'manage', subject: 'Article' })
  restoreArticle(@Param('articleId') articleId: string) {
    return this.content.restoreArticle(articleId);
  }

  @Get('events')
  @RequirePermission({ code: 'events.manage', action: 'manage', subject: 'Event' })
  events(@Query() query: AdminContentEventsQueryDto) {
    return this.content.listEvents(query);
  }

  @Get('events/:eventId')
  @RequirePermission({ code: 'events.manage', action: 'manage', subject: 'Event' })
  event(@Param('eventId') eventId: string) {
    return this.content.getEvent(eventId);
  }

  @Post('events')
  @RequirePermission({ code: 'events.manage', action: 'manage', subject: 'Event' })
  createEvent(@Body() dto: AdminContentEventCreateDto) {
    return this.content.createEvent(dto);
  }

  @Patch('events/:eventId')
  @RequirePermission({ code: 'events.manage', action: 'manage', subject: 'Event' })
  updateEvent(
    @Param('eventId') eventId: string,
    @Body() dto: AdminContentEventUpdateDto,
  ) {
    return this.content.updateEvent(eventId, dto);
  }

  @Get('announcements')
  @RequirePermission({ code: 'announcements.manage', action: 'manage', subject: 'Announcement' })
  announcements(@Query() query: AdminContentAnnouncementsQueryDto) {
    return this.content.listAnnouncements(query);
  }

  @Post('announcements')
  @RequirePermission({ code: 'announcements.manage', action: 'manage', subject: 'Announcement' })
  createAnnouncement(
    @Body() dto: AdminContentAnnouncementCreateDto,
  ) {
    return this.content.createAnnouncement(dto);
  }

  @Patch('announcements/:announcementId')
  @RequirePermission({ code: 'announcements.manage', action: 'manage', subject: 'Announcement' })
  updateAnnouncement(
    @Param('announcementId') announcementId: string,
    @Body() dto: AdminContentAnnouncementUpdateDto,
  ) {
    return this.content.updateAnnouncement(announcementId, dto);
  }
}
