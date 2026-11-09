import { Command } from '@nestjs/cqrs';
import type { Meeting } from '../meetings.service.js';

/** Creates a meeting owned by the given user. */
export class CreateMeetingCommand extends Command<Meeting> {
  constructor(
    public readonly ownerId: string,
    public readonly title: string,
    public readonly date: Date,
    public readonly participants: string[],
  ) {
    super();
  }
}
