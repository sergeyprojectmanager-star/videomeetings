@AGENTS.md

# web (`@video-meetings/web`)

Frontend: Next.js 16 (App Router), React 19, Tailwind CSS v4, HeroUI v3 (`@heroui/react`, `@heroui/styles`), TypeScript.

## Structure

- `src/app/` — App Router routes (`layout.tsx`, `page.tsx`, `globals.css`)
- `src/app/register/` — sign-up page: `page.tsx` (server layout), `register-form.tsx` (client form on HeroUI `Form`/`TextField`/`InputGroup`, `useActionState`), `actions.ts` (server action `register`)
- `src/app/login/` — sign-in page, same layout as `register/` (`page.tsx`, `login-form.tsx`, server action `login` in `actions.ts` → `POST /auth/login`; a 401 is shown as a form-level "Invalid email or password", never tied to one field)
- `src/components/` — shared auth UI: `auth-shell.tsx` (background, logo, card, footer link), `password-field.tsx` (password input with show/hide), `form-error-alert.tsx` (form-level `role="alert"`), `use-form-focus.ts` (moves focus to the first invalid field, the alert or the success panel after a submit), `field-styles.ts` (shared `InputGroup` class)
- `src/lib/api.ts` — api base URL (`API_URL`), access token cookie name and lifetime
- `src/lib/session.ts` — `setAccessTokenCookie()`, the one place that writes the token cookie
- `public/` — static assets
- `next.config.ts`, `eslint.config.mjs`, `tsconfig.json` — configs

## Commands (from `apps/web`, or with `-w @video-meetings/web` from the root)

- `npm run dev` — dev server
- `npm run build` / `npm run start` — production build and start
- `npm run lint` / `npm run lint:fix` — ESLint
- `npm run typecheck` — `next typegen && tsc --noEmit`

## Definition of done for UI changes

Any change to the UI (pages, components, styles, copy, layout, form behavior) is not finished until both of these are done:

1. **Visual test with Playwright.** Run the app (`dev:web`, plus `dev:api` if the change talks to the api) and use the `playwright-cli` skill to open the affected pages and check the change as a user would: the default state, the error and success states, keyboard use (Tab, Enter) and a mobile width (375px). Take screenshots and look at them; do not rely on lint and typecheck alone.
2. **UI/UX review with the `ui-ux-pro-max` skill.** Load the skill and review the change against its guidelines (accessibility, touch targets, contrast, forms and feedback, layout and responsiveness), then fix what it finds.

Only after both are done may the task be reported as complete. Say in the final report what was checked and how; if something could not be checked, say that explicitly instead of calling the task done.

## Rules

- Before writing code, read the relevant section in `node_modules/next/dist/docs/` (see `AGENTS.md`).
- Components are server components by default; add `'use client'` only where state, effects or browser APIs are needed.
- UI library is HeroUI v3: use the `heroui-react` skill.
- HeroUI v3 has no provider: its styles are loaded by `@import '@heroui/styles';` in `src/app/globals.css`, right after `@import 'tailwindcss';` (the order matters). Theme colors come from HeroUI's CSS variables, so do not redefine `--background` / `--foreground` there.
- Talk to the api only from the server (server actions or route handlers) through `API_URL` from `src/lib/api.ts`; the api has no CORS. Map api errors (400, 409, ...) to field errors in the action and pass them to HeroUI `Form` via `validationErrors`.
- The access token is stored in an httpOnly `access_token` cookie (set by `setAccessTokenCookie()` in the `register` and `login` actions, 1 hour like the token). Never expose it to client code.
- New auth-style pages reuse `AuthShell`, `PasswordField` and `FormErrorAlert` instead of copying markup.
- Form UX rules (checked on `/register`): keep focus in place while a submit is pending (use `isReadOnly`, never `isDisabled`, on fields); after a submit call `useFormFocus` so focus lands on the first invalid field, the alert or the success panel; one `h1` per page (`AuthShell` renders it); interactive controls are at least 40px (buttons 44px); text and controls keep AA contrast (4.5:1 for text, 3:1 for field borders), which is why `globals.css` overrides HeroUI's default `--accent` and `--field-border*`; give password rules a plain-language message through `validate` instead of the browser's.
- Do not put `overflow-hidden` on a container that holds focusable fields and decorative overflow: `focus()` scrolls it and shifts the content. Clip the decoration in its own layer (see `AuthShell`).
- Icons come from `@gravity-ui/icons` (the set used in the HeroUI docs).
- Styling with Tailwind v4; global styles live in `src/app/globals.css`.
- All code, comments and documentation are in English.
- When the structure, stack, commands or interaction with other apps change, update this file and the root `CLAUDE.md` / `README.md` (see "Keeping documentation up to date" in the root `CLAUDE.md`).
