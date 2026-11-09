import { z } from 'zod';

// E-mails are compared case-insensitively and ignoring surrounding spaces, so
// they are normalized before validation and storage.
export const email = z.string().trim().toLowerCase().pipe(z.email());

export const registerSchema = z.object({
  email,
  password: z.string().min(8).max(128),
});
export type RegisterDto = z.infer<typeof registerSchema>;

// Login does not enforce the registration password rules, so that a password
// set under an older rule keeps working.
export const loginSchema = z.object({
  email,
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof loginSchema>;
