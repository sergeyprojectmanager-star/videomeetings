# video-meetings

Monorepo on npm workspaces (Node >= 22, version in `.nvmrc`).

| Project               | Stack   | Path       |
| --------------------- | ------- | ---------- |
| `@video-meetings/web` | Next.js | `apps/web` |
| `@video-meetings/api` | NestJS  | `apps/api` |

Each app has its own `CLAUDE.md` with app-specific rules. Read it before working in that app.

## Commands (from the root)

- `npm install` — install dependencies for all workspaces
- `npm run dev` — web and api in parallel (`dev:web`, `dev:api` — individually)
- `npm run build` / `lint` / `lint:fix` / `typecheck` / `test` — run in all workspaces
- `npm run format` / `format:check` — Prettier for the whole repository
- Single app: `npm run <script> -w @video-meetings/web` (or `api`)

## Database

- PostgreSQL 17 runs via `docker-compose.yml` at the root (service `postgres`, container `video-meetings-postgres`, volume `postgres_data`).
- Start/stop: `docker compose up -d` / `docker compose down` (`down -v` deletes the data).
- Configuration comes from `.env` (not committed); `.env.example` lists the variables and the `DATABASE_URL` used by the api app. Never commit `.env`.
- `JWT_SECRET` (signs access tokens) is also required in `.env`; the api app fails fast without it. Apply migrations with `npm run db:migrate -w @video-meetings/api` before running the api or its e2e tests.
- The api app uses Drizzle ORM (schema in `apps/api/src/db/schema.ts`, migrations in `apps/api/drizzle/`); details are in `apps/api/CLAUDE.md`.

## Rules

- Language: all documentation and repository content (docs, code comments, commit messages, PR descriptions, identifiers, UI strings unless a product requirement says otherwise) is in English. Replies to the user in chat are in Russian.
- Install dependencies through npm workspaces (`npm install <pkg> -w @video-meetings/<app>`), not by `cd`-ing into an app.
- Style: Prettier (`singleQuote`, `trailingComma: all`) configured in `.prettierrc`; indentation and line endings in `.editorconfig`.
- Auto-formatting: a `PostToolUse` hook (`.claude/settings.json`, script `.claude/hooks/format.mjs`) runs Prettier on every file after Edit/Write; there is no need to format changed files manually.
- After changes, run `lint`, `typecheck` and `test` for the affected app.
- Next.js and NestJS versions are newer than the training data: follow the documentation referenced in each app's `AGENTS.md` rather than memory.
- Skills live in `.agents/skills/` (`.claude/skills/` holds links to them); the list is pinned in `skills-lock.json`. For HeroUI UI work use the `heroui-react` skill.

## Keeping documentation up to date

When the project architecture changes, update the documentation in the same change, not "later". Architectural changes include:

- adding, removing or renaming apps, packages and workspaces;
- changing the stack, key libraries or framework versions;
- changing the directory structure or how `web` and `api` interact (protocols, contracts, ports, environment variables);
- introducing new layers and modules (database, queues, auth, telemetry, etc.);
- changing scripts and the commands for running, building, linting and testing.

What to update:

- the root `README.md` — project table, getting started, script list;
- the root `CLAUDE.md` and the affected app's `CLAUDE.md` (`apps/*/CLAUDE.md`) — structure, commands, rules;
- the app's `README.md`, if it has one;
- do not hand-edit `AGENTS.md` blocks delimited by `BEGIN/END` markers: the tool that owns them rewrites them automatically.

Before finishing a task, compare what the documentation says with the actual state of the code (`package.json`, `src/` layout, configs) and remove outdated statements. If the documentation already diverges from the code, fix it or tell the user.
