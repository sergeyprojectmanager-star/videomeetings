import { UnauthorizedException } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { UsersService } from '../../users/users.service.js';
import {
  AccessTokenService,
  type AuthResult,
} from '../access-token.service.js';
import { LoginQuery } from './login.query.js';

@QueryHandler(LoginQuery)
export class LoginHandler implements IQueryHandler<LoginQuery> {
  constructor(
    private readonly users: UsersService,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokens: AccessTokenService,
  ) {}

  async execute({ email, password }: LoginQuery): Promise<AuthResult> {
    const user = await this.users.findByEmail(email);
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
