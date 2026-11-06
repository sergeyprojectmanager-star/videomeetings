@AGENTS.md

# web (`@video-meetings/web`)

Frontend: Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript.

## Structure

- `src/app/` — App Router routes (`layout.tsx`, `page.tsx`, `globals.css`)
- `public/` — static assets
- `next.config.ts`, `eslint.config.mjs`, `tsconfig.json` — configs

## Commands (from `apps/web`, or with `-w @video-meetings/web` from the root)

- `npm run dev` — dev server
- `npm run build` / `npm run start` — production build and start
- `npm run lint` / `npm run lint:fix` — ESLint
- `npm run typecheck` — `next typegen && tsc --noEmit`

## Rules

- Before writing code, read the relevant section in `node_modules/next/dist/docs/` (see `AGENTS.md`).
- Components are server components by default; add `'use client'` only where state, effects or browser APIs are needed.
- UI library is HeroUI v3: use the `heroui-react` skill.
- Styling with Tailwind v4; global styles live in `src/app/globals.css`.
- All code, comments and documentation are in English.
- When the structure, stack, commands or interaction with other apps change, update this file and the root `CLAUDE.md` / `README.md` (see "Keeping documentation up to date" in the root `CLAUDE.md`).
