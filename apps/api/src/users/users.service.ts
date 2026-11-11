import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { z } from 'zod';
import { users } from '../db/schema.js';

export type User = typeof users.$inferSelect;

@Injectable()
export class UsersService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user;
  }

  /** Finds a user by id; an unknown id and one that is not a UUID give `undefined`. */
  async findById(id: string): Promise<User | undefined> {
    // Postgres rejects a malformed uuid with an error, so it is filtered out here.
    if (!z.uuid().safeParse(id).success) {
      return undefined;
    }
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  }

  /**
   * Inserts a user. Returns `null` if the e-mail is already taken; the unique
   * constraint decides, so concurrent registrations cannot both succeed.
   */
  async create(email: string, passwordHash: string): Promise<User | null> {
    const [user] = await this.db
      .insert(users)
      .values({ email, passwordHash })
      .onConflictDoNothing({ target: users.email })
      .returning();
    return user ?? null;
  }
}
