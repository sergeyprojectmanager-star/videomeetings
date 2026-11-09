import { Query } from '@nestjs/cqrs';
import type { Meeting } from '../meetings.service.js';

/** Gets one meeting of the given user. Fails with 404 if there is none. */
export class GetMeetingQuery extends Query<Meeting> {
  constructor(
    public readonly ownerId: string,
    public readonly id: string,
  ) {
    super();
  }
}
