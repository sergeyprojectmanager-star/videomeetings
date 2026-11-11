import { Command } from '@nestjs/cqrs';
import type { AuthResult } from '../access-token.service.js';

/**
 * Registers a user: hashes the password, asks the users module to create the
 * user (`CreateUserCommand`) and returns an access token for them. Fails with
 * 409 if the e-mail is taken.
 */
export class RegisterUserCommand extends Command<AuthResult> {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {
    super();
  }
}
