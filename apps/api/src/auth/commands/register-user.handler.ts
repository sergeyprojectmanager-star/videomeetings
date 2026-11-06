import { ConflictException } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { UsersService } from '../../users/users.service.js';
import {
  AccessTokenService,
  type AuthResult,
} from '../access-token.service.js';
import { RegisterUserCommand } from './register-user.command.js';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    private readonly users: UsersService,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokens: AccessTokenService,
  ) {}

  async execute({ email, password }: RegisterUserCommand): Promise<AuthResult> {
    const passwordHash = await this.passwordHasher.hash(password);
    const user = await this.users.create(email, passwordHash);
    if (!user) {
      throw new ConflictException('Email already registered');
    }
    return this.tokens.issueFor(user.id);
  }
}
