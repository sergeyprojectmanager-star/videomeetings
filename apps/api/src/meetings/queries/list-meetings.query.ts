import { Query } from '@nestjs/cqrs';
import type { Meeting } from '../meetings.service.js';

/** Lists all meetings of the given user. */
export class ListMeetingsQuery extends Query<Meeting[]> {
  constructor(public readonly ownerId: string) {
    super();
  }
}
