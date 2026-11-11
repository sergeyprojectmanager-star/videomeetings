import { Query } from '@nestjs/cqrs';
import type { UserProfile } from '../users.types.js';

/**
 * Finds a user by id. The result is `undefined` for an unknown id (or one that
 * is not a UUID) and never contains the password hash.
 */
export class FindUserByIdQuery extends Query<UserProfile | undefined> {
  constructor(public readonly id: string) {
    super();
  }
}
