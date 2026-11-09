import { z } from 'zod';
import { email } from '../auth/auth.schemas.js';

export const createMeetingSchema = z.object({
  title: z.string().trim().min(1),
  // ISO 8601 date-time, with a "Z" or an offset; stored as an instant.
  date: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
  participants: z.array(email),
});
export type CreateMeetingDto = z.infer<typeof createMeetingSchema>;
