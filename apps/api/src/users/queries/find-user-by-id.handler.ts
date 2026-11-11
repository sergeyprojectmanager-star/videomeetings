import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { UserProfile } from '../users.types.js';
import { UsersService } from '../users.service.js';
import { FindUserByIdQuery } from './find-user-by-id.query.js';

@QueryHandler(FindUserByIdQuery)
export class FindUserByIdHandler implements IQueryHandler<FindUserByIdQuery> {
  constructor(private readonly users: UsersService) {}

  async execute({ id }: FindUserByIdQuery): Promise<UserProfile | undefined> {
    const user = await this.users.findById(id);
    return user ? { id: user.id, email: user.email } : undefined;
  }
}
