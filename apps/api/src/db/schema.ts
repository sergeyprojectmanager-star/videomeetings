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
