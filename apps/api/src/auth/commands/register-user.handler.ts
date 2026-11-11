import { PasswordHasher } from '@nestjs/authentication';
import { CommandBus, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from '../../users/index.js';
import {
  AccessTokenService,
  type AuthResult,
} from '../access-token.service.js';
import { RegisterUserCommand } from './register-user.command.js';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    // The users module is reached through the bus, never through its service.
    private readonly commandBus: CommandBus,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokens: AccessTokenService,
  ) {}

  async execute({ email, password }: RegisterUserCommand): Promise<AuthResult> {
    const passwordHash = await this.passwordHasher.hash(password);
    // A taken e-mail makes the users module answer with a 409.
    const user = await this.commandBus.execute(
      new CreateUserCommand(email, passwordHash),
    );
    return this.tokens.issueFor(user.id);
  }
}
