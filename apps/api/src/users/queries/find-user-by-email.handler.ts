import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { normalizeEmail } from '../email.js';
import type { UserCredentials } from '../users.types.js';
import { UsersService } from '../users.service.js';
import { FindUserByEmailQuery } from './find-user-by-email.query.js';

@QueryHandler(FindUserByEmailQuery)
export class FindUserByEmailHandler implements IQueryHandler<FindUserByEmailQuery> {
  constructor(private readonly users: UsersService) {}

  async execute({
    email,
  }: FindUserByEmailQuery): Promise<UserCredentials | undefined> {
    const user = await this.users.findByEmail(normalizeEmail(email));
    if (!user) {
      return undefined;
    }
    return { id: user.id, email: user.email, passwordHash: user.passwordHash };
  }
}
