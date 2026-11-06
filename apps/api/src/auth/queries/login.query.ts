import { Query } from '@nestjs/cqrs';
import type { AuthResult } from '../access-token.service.js';

/**
 * Looks a user up by credentials and returns an access token for them.
 * A query, not a command: it changes no application state. Fails with 401 on
 * an unknown e-mail or a wrong password.
 */
export class LoginQuery extends Query<AuthResult> {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {
    super();
  }
}
