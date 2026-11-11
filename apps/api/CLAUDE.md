@AGENTS.md

# api (`@video-meetings/api`)

Backend: NestJS 12, TypeScript, ESM (`"type": "module"`).

## Structure

- `src/` — application code: `main.ts` (bootstrap), `app.module.ts` (the root module: configuration, database, CQRS, the validation pipe and the feature modules; it has no controller or service of its own, so `GET /` is a 404) and one folder per feature module below, with `*.spec.ts` next to the code
- `test/` — e2e tests (`*.e2e-spec.ts`)
- `src/auth/` — authentication: registration and login (`POST /auth/register`, `POST /auth/login`, `GET /auth/me`), password hashing, JWT issuing and checking (`JwtAuthGuard`); built on CQRS (`commands/`, `queries/`). It has no table and no access to the users data
- `src/users/` — the users module: owns the `users` table, creates and finds users. Its public API is `src/users/index.ts` (messages `CreateUserCommand`, `FindUserByEmailQuery`, `FindUserByIdQuery` and the `UserProfile` / `UserCredentials` types); `UsersService` and the handlers are internal
- `src/meetings/` — meetings (`POST /meetings`, `GET /meetings`, `GET /meetings/:id`), also CQRS; protected by `JwtAuthGuard`
- `docs/cqrs.md` — how CQRS is used (flow, layer responsibilities, anatomy of a use case, how to add one, testing); update it when a command/query is added or the approach changes
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
- The HTTP port comes from `PORT` (`main.ts`, default 3000). `.env.example` sets it to 3001 so the api does not clash with the web dev server on 3000 when both run with `npm run dev`.
- Inject the database with `@InjectDrizzle() private readonly db: NodePgDatabase`; import tables from `src/db/schema.ts`.
- Change the schema in `src/db/schema.ts`, then run `db:generate` and `db:migrate`. Never edit generated migrations by hand.
- The database must be running (`docker compose up -d` at the root) for `start:dev`, `db:migrate` and e2e tests. e2e tests also need the migrations applied (`npm run db:migrate`).

## Auth and users modules

- The two modules are separate and talk **only through the CQRS buses**. `auth` decides who someone is (hashes and verifies passwords, issues and checks tokens); `users` stores people. `auth` never imports `UsersService` or `UsersModule`: its handlers dispatch `CreateUserCommand`, `FindUserByEmailQuery` and `FindUserByIdQuery` from `src/users/index.ts`. `AppModule` imports both modules; `AuthModule` does not import `UsersModule`.
- A rule in `.oxlintrc.json` (`no-restricted-imports`) fails the lint when code outside `src/users` imports anything from it except `index.ts`.
- The password hash is created in `auth` and handed to `users` as an opaque string (`CreateUserCommand(email, passwordHash)`); `users` never sees a plain password. Only `FindUserByEmailQuery` returns the hash (for `LoginHandler`); `FindUserByIdQuery` and `CreateUserCommand` return a `UserProfile` (`{ id, email }`).
- `users` owns the data rules: it normalizes e-mails itself (`normalizeEmail`: trim and lower-case, so it does not trust its callers) and answers 409 for a taken e-mail (`CreateUserHandler`). `auth` owns the authentication rules: 401 for bad credentials or for a token whose user is gone.
- To give another module access to user data, add a command or query in `src/users/`, export it from `index.ts` and dispatch it; do not export the service.

## Authentication

- `AuthModule` (`src/auth/`; it reaches users through the buses, see above): `POST /auth/register` (201) and `POST /auth/login` (200) take `{ email, password }` and return `{ accessToken }`. Errors: 400 invalid body, 409 e-mail taken, 401 bad credentials (identical for an unknown e-mail and a wrong password).
- `GET /auth/me` (behind `JwtAuthGuard`) returns `{ id, email }` of the token's user so a client can show who is signed in (the token itself only carries `sub`). It is a query (`GetCurrentUserQuery`); 401 when the token is bad or the user no longer exists. It never returns the password hash.
- The module follows CQRS (see [docs/cqrs.md](docs/cqrs.md)): registration is a command (`RegisterUserCommand` → `RegisterUserHandler`), login is a query (`LoginQuery` → `LoginHandler`) because it changes no state.
- `AccessTokenService` is the single place that builds the token payload; both handlers use it.
- The token is a JWT from `@nestjs/jwt`: HS256, secret from the required `JWT_SECRET`, `sub` = user id, expires in 1 hour.
- Passwords are hashed by `PasswordHasher` (scrypt) from `@nestjs/authentication`, used standalone without `AuthenticationModule`, so there is no global guard or session machinery. If protected routes are added later, decide how to guard them (e.g. a JWT guard) before registering `AuthenticationModule`.
- E-mails are trimmed and lower-cased by the Zod schemas in `src/auth/auth.schemas.ts` before validation, and again by the users module before it stores or looks one up; `users.email` is unique. Registration relies on that constraint (`onConflictDoNothing` in `UsersService.create`) rather than a prior lookup.
- Request bodies are validated by `StandardSchemaValidationPipe` (bound as `APP_PIPE` in `AppModule`), so e2e tests that boot `AppModule` get validation without `main.ts`.
- Unit tests (`*.spec.ts` next to the code) cover handlers, `AccessTokenService`, the controller and the Zod schemas with `vi.fn()` mocks; handlers are built with `new`, no Nest testing module. Auth handlers are tested with a mocked `CommandBus` / `QueryBus` and assert which users message they dispatch; the users handlers are tested with a mocked `UsersService`. `UsersService` itself has no unit test: it is a thin Drizzle wrapper, covered by the e2e tests.
- `JwtAuthGuard` (`src/auth/jwt-auth.guard.ts`) protects routes: `@UseGuards(JwtAuthGuard)` checks `Authorization: Bearer <token>` (HS256 only, signature and expiry) and answers 401 otherwise; it sets `request.user = { id }`, read with the `@CurrentUser()` decorator. `AuthModule` exports the guard and `JwtModule`, so a feature module imports `AuthModule` to use it.
- e2e tests (`test/auth.e2e-spec.ts`) use the real database, unique `e2e-*@example.test` e-mails that they delete afterwards, a cheap `PasswordHasher` override, and a test `JWT_SECRET` from `vitest.config.e2e.ts`.

## Meetings

- `MeetingsModule` (`src/meetings/`): all routes are behind `JwtAuthGuard` and scoped to the token's user. `POST /meetings` `{ title, date, participants }` (201), `GET /meetings`, `GET /meetings/:id`. Responses are `{ id, title, date, participants }` (the owner is not exposed).
- Same CQRS shape as auth ([docs/cqrs.md](docs/cqrs.md)): `CreateMeetingCommand`, `ListMeetingsQuery`, `GetMeetingQuery` with handlers in `commands/` / `queries/`; `MeetingsService` is the Drizzle wrapper. Validation is in `meetings.schemas.ts`: non-blank trimmed `title`, ISO 8601 `date` (parsed into a `Date`), `participants` an array of e-mails (may be empty).
- The `meetings` table (`owner_id` → `users.id`, `ON DELETE CASCADE`; `participants` is `text[]`). Another user's meeting, an unknown id and a non-UUID id are all 404. The list is ordered by `date`. Being listed as a participant gives no access.
- e2e tests (`test/meetings.e2e-spec.ts`) follow the auth ones. e2e files run one at a time (`fileParallelism: false`) because they share the database and clean up by e-mail pattern.

## Rules

- The project is ESM: relative imports end in `.js`; use `import.meta.dirname` instead of `__dirname`.
- Tests run on Vitest: mock with `vi.fn()`, not `jest.fn()`.
- Before adding a third-party package, check the first-party `@nestjs/*` packages listed in `AGENTS.md`.
- Validate with Standard Schema (`StandardSchemaValidationPipe`) rather than classes, unless there is a reason not to.
- Keep logic in services and controllers thin.
- All code, comments and documentation are in English.
- When the structure, stack, commands or interaction with other apps change, update this file and the root `CLAUDE.md` / `README.md` (see "Keeping documentation up to date" in the root `CLAUDE.md`).
