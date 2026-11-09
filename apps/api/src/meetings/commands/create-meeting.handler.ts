import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { type Meeting, MeetingsService } from '../meetings.service.js';
import { CreateMeetingCommand } from './create-meeting.command.js';

@CommandHandler(CreateMeetingCommand)
export class CreateMeetingHandler implements ICommandHandler<CreateMeetingCommand> {
  constructor(private readonly meetings: MeetingsService) {}

  execute({
    ownerId,
    title,
    date,
    participants,
  }: CreateMeetingCommand): Promise<Meeting> {
    return this.meetings.create(ownerId, { title, date, participants });
  }
}
