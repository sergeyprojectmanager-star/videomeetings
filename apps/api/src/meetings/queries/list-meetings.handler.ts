import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { type Meeting, MeetingsService } from '../meetings.service.js';
import { ListMeetingsQuery } from './list-meetings.query.js';

@QueryHandler(ListMeetingsQuery)
export class ListMeetingsHandler implements IQueryHandler<ListMeetingsQuery> {
  constructor(private readonly meetings: MeetingsService) {}

  execute({ ownerId }: ListMeetingsQuery): Promise<Meeting[]> {
    return this.meetings.listByOwner(ownerId);
  }
}
