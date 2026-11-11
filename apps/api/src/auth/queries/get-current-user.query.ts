import { Query } from '@nestjs/cqrs';

/** The public profile of a user: never the password hash. */
export interface UserProfile {
  id: string;
  email: string;
}

/**
 * Looks up the user a token belongs to. A query: it changes no state. Fails
 * with 401 when the user no longer exists (e.g. the account was deleted after
 * the token was issued).
 */
export class GetCurrentUserQuery extends Query<UserProfile> {
  constructor(public readonly userId: string) {
    super();
  }
}
