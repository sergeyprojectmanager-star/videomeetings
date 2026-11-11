import { Query } from '@nestjs/cqrs';
import type { UserProfile } from '../../users/index.js';

/**
 * Looks up the user a token belongs to (through the users module). A query: it
 * changes no state. Fails with 401 when the user no longer exists (e.g. the
 * account was deleted after the token was issued).
 */
export class GetCurrentUserQuery extends Query<UserProfile> {
  constructor(public readonly userId: string) {
    super();
  }
}
