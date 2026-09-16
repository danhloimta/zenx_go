import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { ActivityLogsQueryDto } from './activity.dto';
import { ActivityService } from './activity.service';

@Controller('account/activity-logs')
@UseGuards(AuthGuard)
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}
  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query() query: ActivityLogsQueryDto, @Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    return this.activity.list(request.user.sub, query);
  }
}
