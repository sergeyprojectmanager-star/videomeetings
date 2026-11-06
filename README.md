# video-meetings

Monorepo (npm workspaces).

| Project | Stack   | Path       |
| ------- | ------- | ---------- |
| `web`   | Next.js | `apps/web` |
| `api`   | NestJS  | `apps/api` |

## Getting started

```sh
npm install
npm run dev        # web + api in parallel
```

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

The api app issues JWT access tokens (HS256, signed with `JWT_SECRET` from `.env`, valid for 1 hour). Both endpoints take `{ "email": "...", "password": "..." }` and return `{ "accessToken": "..." }`:

- `POST /auth/register` — creates a user (201); 409 if the e-mail is taken, 400 for an invalid body (password: 8-128 characters).
- `POST /auth/login` — looks the user up (200); 401 for a wrong password or unknown e-mail.

Users are stored in the `users` table; passwords are hashed with scrypt. Run `db:migrate` before starting the api or its e2e tests.

## Scripts (from the root)

- `npm run dev` / `dev:web` / `dev:api`
- `npm run build`
- `npm run lint` / `lint:fix`
- `npm run typecheck`
- `npm run test`
- `npm run format` / `format:check`
