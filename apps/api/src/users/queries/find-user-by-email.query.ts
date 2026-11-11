import { Query } from '@nestjs/cqrs';
import type { UserCredentials } from '../users.types.js';

/**
 * Finds a user by e-mail, with the password hash, so that `auth` can verify a
 * login. The result is `undefined` for an unknown e-mail (not an error: the
 * caller decides how to answer without revealing whether the e-mail exists).
 */
export class FindUserByEmailQuery extends Query<UserCredentials | undefined> {
  constructor(public readonly email: string) {
    super();
  }
}
