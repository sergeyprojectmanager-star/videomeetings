import { Command } from '@nestjs/cqrs';
import type { UserProfile } from '../users.types.js';

/**
 * Creates a user with an already hashed password (hashing belongs to `auth`;
 * the users module never sees a plain password). Fails with 409 if the e-mail
 * is taken.
 */
export class CreateUserCommand extends Command<UserProfile> {
  constructor(
    public readonly email: string,
    public readonly passwordHash: string,
  ) {
    super();
  }
}
