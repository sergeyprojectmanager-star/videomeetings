import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DrizzleModule } from '@nestjs/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { AuthModule } from './auth/auth.module.js';
import { MeetingsModule } from './meetings/meetings.module.js';
import { UsersModule } from './users/index.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    DrizzleModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        drizzle,
        connection: config.getOrThrow<string>('DATABASE_URL'),
      }),
    }),
    CqrsModule.forRoot(),
    UsersModule,
    AuthModule,
    MeetingsModule,
  ],
  providers: [
    // Validates parameters that declare a `schema`, e.g. `@Body({ schema })`.
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
  ],
})
export class AppModule {}
