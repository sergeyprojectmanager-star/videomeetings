import { Command } from '@nestjs/cqrs';
import type { AuthResult } from '../access-token.service.js';

/** Creates a user. Fails with 409 if the e-mail is taken. */
export class RegisterUserCommand extends Command<AuthResult> {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {
    super();
  }
}
