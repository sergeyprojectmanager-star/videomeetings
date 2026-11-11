import { UnauthorizedException } from '@nestjs/common';
import { QueryBus, QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { FindUserByIdQuery, type UserProfile } from '../../users/index.js';
import { GetCurrentUserQuery } from './get-current-user.query.js';

@QueryHandler(GetCurrentUserQuery)
export class GetCurrentUserHandler implements IQueryHandler<GetCurrentUserQuery> {
  // The users module is reached through the bus, never through its service.
  constructor(private readonly queryBus: QueryBus) {}

  async execute({ userId }: GetCurrentUserQuery): Promise<UserProfile> {
    const user = await this.queryBus.execute(new FindUserByIdQuery(userId));
    if (!user) {
      // The token is valid but its user is gone: treat it as not signed in.
      throw new UnauthorizedException();
    }
    return user;
  }
}
