import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { z } from 'zod';
import { meetings } from '../db/schema.js';

/** A meeting as the API exposes it (the owner is implied by the token). */
export interface Meeting {
  id: string;
  title: string;
  date: Date;
  participants: string[];
}

export interface NewMeeting {
  title: string;
  date: Date;
  participants: string[];
}

const meetingColumns = {
  id: meetings.id,
  title: meetings.title,
  date: meetings.date,
  participants: meetings.participants,
};

@Injectable()
export class MeetingsService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  async create(ownerId: string, meeting: NewMeeting): Promise<Meeting> {
    const [created] = await this.db
      .insert(meetings)
      .values({ ownerId, ...meeting })
      .returning(meetingColumns);
    return created;
  }

  listByOwner(ownerId: string): Promise<Meeting[]> {
    return this.db
      .select(meetingColumns)
      .from(meetings)
      .where(eq(meetings.ownerId, ownerId))
      .orderBy(meetings.date);
  }

  /**
   * Finds a meeting of the given owner. A meeting of someone else, an unknown id
   * and an id that is not a UUID all give `undefined`.
   */
  async findOwned(id: string, ownerId: string): Promise<Meeting | undefined> {
    // Postgres rejects a malformed uuid with an error, so it is filtered out here.
    if (!z.uuid().safeParse(id).success) {
      return undefined;
    }
    const [meeting] = await this.db
      .select(meetingColumns)
      .from(meetings)
      .where(and(eq(meetings.id, id), eq(meetings.ownerId, ownerId)))
      .limit(1);
    return meeting;
  }
}
