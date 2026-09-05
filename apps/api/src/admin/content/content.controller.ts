import {
  Body,
  Controller,
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
  AdminContentGameCreateDto,
  AdminContentGamePresentationUpdateDto,
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

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadAsset(
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size?: number } | undefined,
  ) {
    return this.content.uploadAsset(file);
  }

  @Get('games')
  games(@Query() query: AdminContentGamesQueryDto) {
    return this.content.listGames(query);
  }

  @Get('game-templates')
  gameTemplates() {
    return this.content.listGameTemplates();
  }

  @Post('games')
  createGame(@Body() dto: AdminContentGameCreateDto) {
    return this.content.createGame(dto);
  }

  @Get('games/:gameId')
  game(@Param('gameId') gameId: string) {
    return this.content.getGame(gameId);
  }

  @Get('games/:gameId/readiness')
  gameReadiness(@Param('gameId') gameId: string) {
    return this.content.gameReadiness(gameId);
  }

  @Get('games/:gameId/preview')
  previewGame(@Param('gameId') gameId: string) {
    return this.content.previewGame(gameId);
  }

  @Post('games/:gameId/publish')
  publishGame(@Param('gameId') gameId: string) {
    return this.content.publishGame(gameId);
  }

  @Post('games/:gameId/unpublish')
  unpublishGame(@Param('gameId') gameId: string) {
    return this.content.unpublishGame(gameId);
  }

  @Get('game-options')
  gameOptions() {
    return this.content.gameOptions();
  }

  @Patch('games/:gameId')
  updateGame(
    @Param('gameId') gameId: string,
    @Body() dto: AdminContentGameUpdateDto,
  ) {
    return this.content.updateGame(gameId, dto);
  }

  @Patch('games/:gameId/presentation')
  updateGamePresentation(
    @Param('gameId') gameId: string,
    @Body() dto: AdminContentGamePresentationUpdateDto,
  ) {
    return this.content.updateGamePresentation(gameId, dto);
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
  createArticle(@Body() dto: AdminContentArticleCreateDto) {
    return this.content.createArticle(dto);
  }

  @Patch('articles/:articleId')
  updateArticle(
    @Param('articleId') articleId: string,
    @Body() dto: AdminContentArticleUpdateDto,
  ) {
    return this.content.updateArticle(articleId, dto);
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
  createEvent(@Body() dto: AdminContentEventCreateDto) {
    return this.content.createEvent(dto);
  }

  @Patch('events/:eventId')
  updateEvent(
    @Param('eventId') eventId: string,
    @Body() dto: AdminContentEventUpdateDto,
  ) {
    return this.content.updateEvent(eventId, dto);
  }

  @Get('announcements')
  announcements(@Query() query: AdminContentAnnouncementsQueryDto) {
    return this.content.listAnnouncements(query);
  }

  @Post('announcements')
  createAnnouncement(
    @Body() dto: AdminContentAnnouncementCreateDto,
  ) {
    return this.content.createAnnouncement(dto);
  }

  @Patch('announcements/:announcementId')
  updateAnnouncement(
    @Param('announcementId') announcementId: string,
    @Body() dto: AdminContentAnnouncementUpdateDto,
  ) {
    return this.content.updateAnnouncement(announcementId, dto);
  }
}
