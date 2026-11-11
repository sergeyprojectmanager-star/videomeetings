import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { AuthResult } from './access-token.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { type AuthenticatedUser, JwtAuthGuard } from './jwt-auth.guard.js';
import {
  GetCurrentUserQuery,
  type UserProfile,
} from './queries/get-current-user.query.js';
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

  /** Who the access token belongs to, so a client can show the signed-in user. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserProfile> {
    return this.queryBus.execute(new GetCurrentUserQuery(user.id));
  }
}
