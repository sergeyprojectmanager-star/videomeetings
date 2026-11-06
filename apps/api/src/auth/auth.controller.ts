import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { AuthResult } from './access-token.service.js';
import {
  loginSchema,
  registerSchema,
  type LoginDto,
  type RegisterDto,
} from './auth.schemas.js';
import { RegisterUserCommand } from './commands/register-user.command.js';
import { LoginQuery } from './queries/login.query.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('register')
  register(
    @Body({ schema: registerSchema }) { email, password }: RegisterDto,
  ): Promise<AuthResult> {
    return this.commandBus.execute(new RegisterUserCommand(email, password));
  }

  @Post('login')
  @HttpCode(200)
  login(
    @Body({ schema: loginSchema }) { email, password }: LoginDto,
  ): Promise<AuthResult> {
    return this.queryBus.execute(new LoginQuery(email, password));
  }
}
