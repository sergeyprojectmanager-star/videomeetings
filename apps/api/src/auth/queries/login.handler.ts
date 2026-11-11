import { UnauthorizedException } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { QueryBus, QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { FindUserByEmailQuery } from '../../users/index.js';
import {
  AccessTokenService,
  type AuthResult,
} from '../access-token.service.js';
import { LoginQuery } from './login.query.js';

@QueryHandler(LoginQuery)
export class LoginHandler implements IQueryHandler<LoginQuery> {
  constructor(
    // The users module is reached through the bus, never through its service.
    private readonly queryBus: QueryBus,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokens: AccessTokenService,
  ) {}

  async execute({ email, password }: LoginQuery): Promise<AuthResult> {
    const user = await this.queryBus.execute(new FindUserByEmailQuery(email));
    // With no user, verify() checks a dummy hash: an unknown e-mail and a wrong
    // password take the same time and give the same answer.
    const valid = await this.passwordHasher.verify(
      password,
      user?.passwordHash,
    );
    if (!user || !valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.tokens.issueFor(user.id);
  }
}
