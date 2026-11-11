# video-meetings

Monorepo on npm workspaces (Node >= 22, version in `.nvmrc`).

| Project               | Stack           | Path       |
| --------------------- | --------------- | ---------- |
| `@video-meetings/web` | Next.js, HeroUI | `apps/web` |
| `@video-meetings/api` | NestJS          | `apps/api` |

Each app has its own `CLAUDE.md` with app-specific rules. Read it before working in that app.

## Commands (from the root)

- `npm install` — install dependencies for all workspaces
- `npm run dev` — web and api in parallel (`dev:web`, `dev:api` — individually)
- `npm run build` / `lint` / `lint:fix` / `typecheck` / `test` — run in all workspaces (`test` is the unit tests; only the api has any)
- `npm run test:e2e -w @video-meetings/api` — api end-to-end tests; they need the database running and migrated (see "Database" below and `apps/api/CLAUDE.md`)
- `npm run format` / `format:check` — Prettier for the whole repository
- Single app: `npm run <script> -w @video-meetings/web` (or `api`)

## Database

- PostgreSQL 17 runs via `docker-compose.yml` at the root (service `postgres`, container `video-meetings-postgres`, volume `postgres_data`).
- Start/stop: `docker compose up -d` / `docker compose down` (`down -v` deletes the data).
- Configuration comes from `.env` (not committed); `.env.example` lists the variables and the `DATABASE_URL` used by the api app. Never commit `.env`.
- `JWT_SECRET` (signs access tokens) is also required in `.env`; the api app fails fast without it. Apply migrations with `npm run db:migrate -w @video-meetings/api` before running the api or its e2e tests.
- The api app uses Drizzle ORM (schema in `apps/api/src/db/schema.ts`, migrations in `apps/api/drizzle/`); details are in `apps/api/CLAUDE.md`.

## Web and api

- Ports: web on 3000, api on 3001 (`PORT` in the root `.env`; the api defaults to 3000 otherwise and would clash with web).
- `web` calls the api only on the server (server actions) via `API_URL` (default `http://localhost:3001`, override in `apps/web/.env.local`), so there is no CORS setup. The access token returned by the api is stored in an httpOnly `access_token` cookie; the signed-in home page (`/`) is protected by a proxy check and by asking the api (`GET /auth/me`, `GET /meetings`) on each render. Details are in `apps/web/CLAUDE.md`.

## Rules

- Language: all documentation and repository content (docs, code comments, commit messages, PR descriptions, identifiers, UI strings unless a product requirement says otherwise) is in English. Replies to the user in chat are in Russian.
- Install dependencies through npm workspaces (`npm install <pkg> -w @video-meetings/<app>`), not by `cd`-ing into an app.
- Style: Prettier (`singleQuote`, `trailingComma: all`) configured in `.prettierrc`; indentation and line endings in `.editorconfig`.
- Auto-formatting: a `PostToolUse` hook (`.claude/settings.json`, script `.claude/hooks/format.mjs`) runs Prettier on every file after Edit/Write; there is no need to format changed files manually.
- Screenshots (for example from the Playwright UI checks) go to the `screenshot/` folder at the repo root and nowhere else: pass `--filename=screenshot/<name>.png` to `playwright-cli screenshot` (or `path: 'screenshot/<name>.png'` in `page.screenshot`). The folder is git-ignored, along with `.playwright-cli/` where `playwright-cli` keeps its snapshots and logs; create it with `mkdir -p screenshot` if it is missing, and never commit a screenshot or leave one elsewhere in the project. Give files descriptive names (`register-duplicate-email-mobile.png`), not `page-2026-...png`.
- A Husky `pre-commit` hook (`.husky/pre-commit`, installed by the root `prepare` script on `npm install`) runs `lint-staged` and then `npm run test` before every commit and aborts the commit if either fails. lint-staged lints only the staged files, with the linter of their app (`oxlint` for `apps/api`, `eslint` for `apps/web`; the per-app configs are `apps/*/.lintstagedrc.json`); the unit tests run in full. Fix the cause and commit again; never bypass it with `--no-verify`. The hook does not lint unstaged files, run `typecheck` or `build`, or run the api e2e tests, so running the full `lint` and those checks stays your responsibility.
- After changes, run `lint`, `typecheck` and `test` for the affected app. For api changes that touch the database, auth, guards or routes, also run `test:e2e`. The web app has no automated tests: its checks are `lint`, `typecheck`, `build` and the visual Playwright test required for UI changes (`apps/web/CLAUDE.md`).
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
