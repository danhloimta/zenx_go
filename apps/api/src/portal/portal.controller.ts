import { Controller, Get, Param, Query } from '@nestjs/common';
import { PortalEventsQueryDto, PortalNewsQueryDto } from './portal.dto';
import { PortalService } from './portal.service';

@Controller('portal')
export class PortalController {
  constructor(private readonly portal: PortalService) {}

  @Get('home')
  home() {
    return this.portal.home();
  }

  @Get('news')
  news(@Query() query: PortalNewsQueryDto) {
    return this.portal.news(query);
  }

  @Get('events')
  events(@Query() query: PortalEventsQueryDto) {
    return this.portal.events(query);
  }

  @Get('events/:slug')
  event(@Param('slug') slug: string) {
    return this.portal.event(slug);
  }
}
