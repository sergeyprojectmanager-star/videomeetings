import { Module } from '@nestjs/common';
import { CreateUserHandler } from './commands/create-user.handler.js';
import { FindUserByEmailHandler } from './queries/find-user-by-email.handler.js';
import { FindUserByIdHandler } from './queries/find-user-by-id.handler.js';
import { UsersService } from './users.service.js';

/**
 * Owns the `users` table: creating and finding users. Other modules reach it
 * only through its commands and queries (see `index.ts`), so `UsersService` is
 * deliberately not exported.
 */
@Module({
  providers: [
    UsersService,
    CreateUserHandler,
    FindUserByEmailHandler,
    FindUserByIdHandler,
  ],
})
export class UsersModule {}
