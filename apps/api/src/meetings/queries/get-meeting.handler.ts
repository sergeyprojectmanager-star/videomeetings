import { NotFoundException } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { type Meeting, MeetingsService } from '../meetings.service.js';
import { GetMeetingQuery } from './get-meeting.query.js';

@QueryHandler(GetMeetingQuery)
export class GetMeetingHandler implements IQueryHandler<GetMeetingQuery> {
  constructor(private readonly meetings: MeetingsService) {}

  async execute({ ownerId, id }: GetMeetingQuery): Promise<Meeting> {
    const meeting = await this.meetings.findOwned(id, ownerId);
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }
    return meeting;
  }
}
