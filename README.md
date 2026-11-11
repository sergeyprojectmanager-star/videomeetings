# video-meetings

Monorepo (npm workspaces).

| Project | Stack           | Path       |
| ------- | --------------- | ---------- |
| `web`   | Next.js, HeroUI | `apps/web` |
| `api`   | NestJS          | `apps/api` |

## Getting started

```sh
npm install
npm run dev        # web + api in parallel
```

Web runs on http://localhost:3000 and the api on http://localhost:3001 (`PORT` in `.env`, see `.env.example`).

## Web

The web app calls the api only from the server (server actions), so the browser needs no CORS setup. The api base URL is `API_URL` (default `http://localhost:3001`); override it in `apps/web/.env.local`. After a successful sign-up or sign-in the access token is kept in an httpOnly `access_token` cookie and the user is sent to the home page.

- `/` — home page, signed-in users only (others are redirected to `/login`): the signed-in e-mail, a **Sign out** button, the three latest meetings and the list of all meetings (`GET /auth/me`, `GET /meetings`).
- `/register` — sign-up form (email and password) backed by `POST /auth/register`.
- `/login` — sign-in form backed by `POST /auth/login`, with a link to sign-up.

## Database

PostgreSQL 17 runs in Docker (`docker-compose.yml`). The api app talks to it through Drizzle ORM and needs `DATABASE_URL` from `.env`:

```sh
cp .env.example .env
```

```sh
docker compose up -d       # start Postgres on localhost:5432
docker compose down        # stop (data is kept in the postgres_data volume)
docker compose down -v     # stop and delete all data
```

Default connection string: `postgresql://video_meetings:video_meetings@localhost:5432/video_meetings`

Migrations (run from the root):

```sh
npm run db:generate -w @video-meetings/api   # create a migration from src/db/schema.ts
npm run db:migrate -w @video-meetings/api    # apply migrations
```

## Authentication

The api app issues JWT access tokens (HS256, signed with `JWT_SECRET` from `.env`, valid for 1 hour). Register and login take `{ "email": "...", "password": "..." }` and return `{ "accessToken": "..." }`:

- `POST /auth/register` — creates a user (201); 409 if the e-mail is taken, 400 for an invalid body (password: 8-128 characters).
- `POST /auth/login` — looks the user up (200); 401 for a wrong password or unknown e-mail.
- `GET /auth/me` — `{ id, email }` of the token's user (200); needs `Authorization: Bearer <accessToken>`, 401 for a bad token or a deleted user.

Users are stored in the `users` table; passwords are hashed with scrypt. Run `db:migrate` before starting the api or its e2e tests.

## Meetings

All meeting routes require `Authorization: Bearer <accessToken>` (401 otherwise) and only ever see the caller's own meetings:

- `POST /meetings` — `{ "title": "...", "date": "<ISO 8601 date-time>", "participants": ["<e-mail>", ...] }`; creates a meeting (201) and returns `{ id, title, date, participants }`; 400 for an invalid body.
- `GET /meetings` — the caller's meetings (200), `[]` if none.
- `GET /meetings/:id` — one meeting (200); 404 if it does not exist, belongs to someone else, or `id` is not a UUID.

Meetings are stored in the `meetings` table (deleted together with their owner).

## Tests

| What                    | Command                                                                                                    | Needs                                                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| api unit tests (Vitest) | `npm run test`                                                                                             | nothing: no database, no `.env`                                                                                                         |
| api end-to-end tests    | `npm run test:e2e -w @video-meetings/api`                                                                  | PostgreSQL running (`docker compose up -d`), migrations applied (`npm run db:migrate -w @video-meetings/api`), `DATABASE_URL` in `.env` |
| web                     | no automated tests yet; use `npm run lint`, `npm run typecheck` and `npm run build -w @video-meetings/web` |                                                                                                                                         |

- One test file: `npx vitest run <file>` from `apps/api` (add `--config ./vitest.config.e2e.ts` for an e2e file); one test by name: `npx vitest run -t "<part of the name>"`; watch mode and coverage: `npm run test:watch` / `npm run test:cov -w @video-meetings/api`.
- The e2e tests use the real database and delete every user with an e-mail like `e2e-%@example.test` afterwards, so do not use that pattern for data you want to keep, and do not register accounts while they run.
- UI changes in `apps/web` are also checked visually in a browser with Playwright (see [apps/web/CLAUDE.md](apps/web/CLAUDE.md)).

## Architecture notes

- The api app separates commands (state changes) from queries (reads) with `@nestjs/cqrs`: see [apps/api/docs/cqrs.md](apps/api/docs/cqrs.md).
- The api's `auth` module (passwords, tokens) and `users` module (the `users` table) are separate and talk only through CQRS messages; the lint enforces that `auth` never imports the users module's internals.

## Scripts (from the root)

- `npm run dev` / `dev:web` / `dev:api`
- `npm run build`
- `npm run lint` / `lint:fix`
- `npm run typecheck`
- `npm run test` (unit tests; e2e: `npm run test:e2e -w @video-meetings/api`)
- `npm run format` / `format:check`
