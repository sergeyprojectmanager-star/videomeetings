import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from '../auth/current-user.decorator.js';
import {
  type AuthenticatedUser,
  JwtAuthGuard,
} from '../auth/jwt-auth.guard.js';
import { CreateMeetingCommand } from './commands/create-meeting.command.js';
import {
  type CreateMeetingDto,
  createMeetingSchema,
} from './meetings.schemas.js';
import type { Meeting } from './meetings.service.js';
import { GetMeetingQuery } from './queries/get-meeting.query.js';
import { ListMeetingsQuery } from './queries/list-meetings.query.js';

@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body({ schema: createMeetingSchema })
    { title, date, participants }: CreateMeetingDto,
  ): Promise<Meeting> {
    return this.commandBus.execute(
      new CreateMeetingCommand(user.id, title, date, participants),
    );
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<Meeting[]> {
    return this.queryBus.execute(new ListMeetingsQuery(user.id));
  }

  @Get(':id')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<Meeting> {
    return this.queryBus.execute(new GetMeetingQuery(user.id, id));
  }
}
