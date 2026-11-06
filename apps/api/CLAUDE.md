@AGENTS.md

# api (`@video-meetings/api`)

Backend: NestJS 12, TypeScript, ESM (`"type": "module"`).

## Structure

- `src/` — application code (`main.ts`, `app.module.ts`, controllers, services, `*.spec.ts` next to the code)
- `test/` — e2e tests (`*.e2e-spec.ts`)
- `nest-cli.json`, `tsconfig*.json`, `.oxlintrc.json`, `vitest.config*.ts` — configs

## Commands (from `apps/api`, or with `-w @video-meetings/api` from the root)

- `npm run start:dev` — dev server with watch
- `npm run build` / `npm run start:prod` — build and run `dist/main`
- `npm run lint` / `npm run lint:fix` — oxlint with type checking
- `npm run typecheck` — `tsc --noEmit`
- `npm run test` — unit tests (Vitest); `test:watch`, `test:cov`
- `npm run test:e2e` — e2e tests

## Rules

- The project is ESM: relative imports end in `.js`; use `import.meta.dirname` instead of `__dirname`.
- Tests run on Vitest: mock with `vi.fn()`, not `jest.fn()`.
- Before adding a third-party package, check the first-party `@nestjs/*` packages listed in `AGENTS.md`.
- Validate with Standard Schema (`StandardSchemaValidationPipe`) rather than classes, unless there is a reason not to.
- Keep logic in services and controllers thin.
- All code, comments and documentation are in English.
- When the structure, stack, commands or interaction with other apps change, update this file and the root `CLAUDE.md` / `README.md` (see "Keeping documentation up to date" in the root `CLAUDE.md`).
