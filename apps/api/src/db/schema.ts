// Drizzle schema. Declare tables here (or re-export them from per-feature files).
// drizzle-kit reads this file to generate migrations.
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  // Stored trimmed and lower-cased, so plain uniqueness is case-insensitive.
  email: text().notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const meetings = pgTable('meetings', {
  id: uuid().primaryKey().defaultRandom(),
  // Deleting a user deletes their meetings.
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text().notNull(),
  date: timestamp({ withTimezone: true }).notNull(),
  // E-mail addresses of the invited people (the owner is not listed).
  participants: text().array().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
