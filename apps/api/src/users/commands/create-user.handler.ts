import { ConflictException } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { normalizeEmail } from '../email.js';
import type { UserProfile } from '../users.types.js';
import { UsersService } from '../users.service.js';
import { CreateUserCommand } from './create-user.command.js';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(private readonly users: UsersService) {}

  async execute({
    email,
    passwordHash,
  }: CreateUserCommand): Promise<UserProfile> {
    const user = await this.users.create(normalizeEmail(email), passwordHash);
    if (!user) {
      throw new ConflictException('Email already registered');
    }
    return { id: user.id, email: user.email };
  }
}
