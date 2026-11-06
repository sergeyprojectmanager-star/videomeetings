@AGENTS.md

# api (`@video-meetings/api`)

Backend: NestJS 12, TypeScript, ESM (`"type": "module"`).

## Structure

- `src/` — application code (`main.ts`, `app.module.ts`, controllers, services, `*.spec.ts` next to the code)
- `test/` — e2e tests (`*.e2e-spec.ts`)
- `src/auth/` — registration and login (`POST /auth/register`, `POST /auth/login`), JWT issuing, built on CQRS (`commands/`, `queries/`); `src/users/` — user persistence
- `src/db/schema.ts` — Drizzle schema (all tables are declared or re-exported here)
- `drizzle/` — generated SQL migrations (commit them)
- `nest-cli.json`, `tsconfig*.json`, `.oxlintrc.json`, `vitest.config*.ts`, `drizzle.config.ts` — configs

## Commands (from `apps/api`, or with `-w @video-meetings/api` from the root)

- `npm run start:dev` — dev server with watch
- `npm run build` / `npm run start:prod` — build and run `dist/main`
- `npm run lint` / `npm run lint:fix` — oxlint with type checking
- `npm run typecheck` — `tsc --noEmit`
- `npm run test` — unit tests (Vitest); `test:watch`, `test:cov`
- `npm run test:e2e` — e2e tests
- `npm run db:generate` — generate a migration from `src/db/schema.ts`; `db:migrate` — apply migrations; `db:studio` — Drizzle Studio

## Database

- PostgreSQL via Drizzle ORM (`@nestjs/drizzle`, `drizzle-orm` v1 rc, `pg` driver); `DrizzleModule` is registered in `src/app.module.ts`.
- Configuration: `ConfigModule` loads `.env` (this app's dir or the repo root); `DATABASE_URL` is required and the app fails fast without it. Copy `.env.example` to `.env` at the root.
- Inject the database with `@InjectDrizzle() private readonly db: NodePgDatabase`; import tables from `src/db/schema.ts`.
- Change the schema in `src/db/schema.ts`, then run `db:generate` and `db:migrate`. Never edit generated migrations by hand.
- The database must be running (`docker compose up -d` at the root) for `start:dev`, `db:migrate` and e2e tests. e2e tests also need the migrations applied (`npm run db:migrate`).

## Authentication

- `AuthModule` (`src/auth/`): `POST /auth/register` (201) and `POST /auth/login` (200) take `{ email, password }` and return `{ accessToken }`. Errors: 400 invalid body, 409 e-mail taken, 401 bad credentials (identical for an unknown e-mail and a wrong password).
- The module follows CQRS (`@nestjs/cqrs`, `CqrsModule.forRoot()` in `AppModule`). The controller stays thin and only dispatches to the buses: registration is a command (`RegisterUserCommand` → `RegisterUserHandler`, `CommandBus`), login is a query (`LoginQuery` → `LoginHandler`, `QueryBus`) because it changes no state. Each command/query and its handler live in `commands/` / `queries/`; handlers are registered as providers in `AuthModule`. New use cases follow the same shape; there are no events or sagas yet.
- `AccessTokenService` is the single place that builds the token payload; both handlers use it.
- The token is a JWT from `@nestjs/jwt`: HS256, secret from the required `JWT_SECRET`, `sub` = user id, expires in 1 hour.
- Passwords are hashed by `PasswordHasher` (scrypt) from `@nestjs/authentication`, used standalone without `AuthenticationModule`, so there is no global guard or session machinery. If protected routes are added later, decide how to guard them (e.g. a JWT guard) before registering `AuthenticationModule`.
- E-mails are trimmed and lower-cased by the Zod schemas in `src/auth/auth.schemas.ts` before they reach the database; `users.email` is unique. Registration relies on that constraint (`onConflictDoNothing`) rather than a prior lookup.
- Request bodies are validated by `StandardSchemaValidationPipe` (bound as `APP_PIPE` in `AppModule`), so e2e tests that boot `AppModule` get validation without `main.ts`.
- e2e tests (`test/auth.e2e-spec.ts`) use the real database, unique `e2e-*@example.test` e-mails that they delete afterwards, a cheap `PasswordHasher` override, and a test `JWT_SECRET` from `vitest.config.e2e.ts`.

## Rules

- The project is ESM: relative imports end in `.js`; use `import.meta.dirname` instead of `__dirname`.
- Tests run on Vitest: mock with `vi.fn()`, not `jest.fn()`.
- Before adding a third-party package, check the first-party `@nestjs/*` packages listed in `AGENTS.md`.
- Validate with Standard Schema (`StandardSchemaValidationPipe`) rather than classes, unless there is a reason not to.
- Keep logic in services and controllers thin.
- All code, comments and documentation are in English.
- When the structure, stack, commands or interaction with other apps change, update this file and the root `CLAUDE.md` / `README.md` (see "Keeping documentation up to date" in the root `CLAUDE.md`).
