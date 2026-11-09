import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CreateMeetingHandler } from './commands/create-meeting.handler.js';
import { MeetingsController } from './meetings.controller.js';
import { MeetingsService } from './meetings.service.js';
import { GetMeetingHandler } from './queries/get-meeting.handler.js';
import { ListMeetingsHandler } from './queries/list-meetings.handler.js';

@Module({
  // AuthModule provides JwtAuthGuard (and the JwtService it needs).
  imports: [AuthModule],
  controllers: [MeetingsController],
  providers: [
    MeetingsService,
    CreateMeetingHandler,
    ListMeetingsHandler,
    GetMeetingHandler,
  ],
})
export class MeetingsModule {}
