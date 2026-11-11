import { UnauthorizedException } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UsersService } from '../../users/users.service.js';
import {
  GetCurrentUserQuery,
  type UserProfile,
} from './get-current-user.query.js';

@QueryHandler(GetCurrentUserQuery)
export class GetCurrentUserHandler implements IQueryHandler<GetCurrentUserQuery> {
  constructor(private readonly users: UsersService) {}

  async execute({ userId }: GetCurrentUserQuery): Promise<UserProfile> {
    const user = await this.users.findById(userId);
    if (!user) {
      // The token is valid but its user is gone: treat it as not signed in.
      throw new UnauthorizedException();
    }
    return { id: user.id, email: user.email };
  }
}
