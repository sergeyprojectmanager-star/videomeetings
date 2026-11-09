import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PasswordHasher } from '@nestjs/authentication';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module.js';
import { AccessTokenService } from './access-token.service.js';
import { AuthController } from './auth.controller.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { RegisterUserHandler } from './commands/register-user.handler.js';
import { LoginHandler } from './queries/login.handler.js';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          algorithm: 'HS256',
          expiresIn: '1h',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  // JwtModule and JwtAuthGuard are exported so other modules can protect routes
  // with `@UseGuards(JwtAuthGuard)`.
  exports: [JwtModule, JwtAuthGuard],
  providers: [
    AccessTokenService,
    JwtAuthGuard,
    RegisterUserHandler,
    LoginHandler,
    // Used standalone: only the scrypt hasher is needed, not the package's
    // session machinery (AuthenticationModule).
    { provide: PasswordHasher, useFactory: () => new PasswordHasher() },
  ],
})
export class AuthModule {}
