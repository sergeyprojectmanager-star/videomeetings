@AGENTS.md

# web (`@video-meetings/web`)

Frontend: Next.js 16 (App Router), React 19, Tailwind CSS v4, HeroUI v3 (`@heroui/react`, `@heroui/styles`), TypeScript.

## Structure

- `src/app/` — App Router routes (`layout.tsx`, `globals.css`) and the signed-in home page: `page.tsx` renders `dashboard.tsx` behind `<Suspense>` with `dashboard-skeleton.tsx` as the fallback; `actions.ts` has the `logout` server action; `error.tsx` is the error boundary (note: this Next version passes `{ error, retry }`)
- `src/proxy.ts` — the proxy (Next 16's renamed middleware): an optimistic check that sends `/` to `/login` when the access token cookie is missing or expired
- `src/app/register/` — sign-up page: `page.tsx` (server layout), `register-form.tsx` (client form on HeroUI `Form`/`TextField`/`InputGroup`, `useActionState`), `actions.ts` (server action `register`; on success it sets the cookie and redirects to `/`)
- `src/app/login/` — sign-in page, same layout as `register/` (`page.tsx`, `login-form.tsx`, server action `login` in `actions.ts` → `POST /auth/login`, then the cookie is set and the user is redirected to `/`; a 401 is shown as a form-level "Invalid email or password", never tied to one field)
- `src/components/` — shared UI. Auth: `auth-shell.tsx` (background, logo, card, footer link), `email-field.tsx` and `password-field.tsx` (inputs whose validation is driven by the parent form; the password one has show/hide), `use-field-errors.ts` (our own validation on blur, while typing once an error shows, and on submit), `form-error-alert.tsx` (form-level `role="alert"`), `use-form-focus.ts` (after a failed submit moves focus to the first invalid field or the alert), `field-styles.ts` (shared `InputGroup` class). Signed-in pages: `app-header.tsx` (brand, the signed-in e-mail, the Sign out form), `brand.tsx`, `meetings.tsx` (`LatestMeetings` cards, `AllMeetings` list, `EmptyMeetings`), `meeting-date.tsx` (client; shows a date in the viewer's time zone)
- `src/lib/validation.ts` — client-side validators and their messages (mirror the api rules; the api stays the source of truth)
- `src/lib/api.ts` — api base URL (`API_URL`), access token cookie name and lifetime
- `src/lib/session.ts` — the only code that touches the token cookie: `setAccessTokenCookie()`, `clearAccessTokenCookie()`, `getAccessToken()`
- `src/lib/dal.ts` — Data Access Layer: `getCurrentUser()` (`GET /auth/me`) and `getMeetings()` (`GET /meetings`) with the Bearer token; a 401 redirects to `/login`, other failures throw (caught by `error.tsx`)
- `src/lib/dashboard-data.ts` — builds what the home page shows: meetings newest first by date, `isUpcoming`, and the latest three
- `src/lib/jwt.ts` — `isTokenExpired()`, an unverified `exp` check used only by the proxy
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
- The access token is stored in an httpOnly `access_token` cookie (set by `setAccessTokenCookie()` in the `register` and `login` actions, 1 hour like the token) and removed by the `logout` action. Never expose it to client code.
- Authorization is two layers. The proxy only does the cheap, optimistic check of the cookie (it matches `/` only: `/login` and `/register` must stay reachable, otherwise a token the api rejects would trap the user in a redirect loop). The real check is the api, called by `lib/dal.ts` on every render of a signed-in page. New protected pages add their path to the proxy matcher and fetch data only through `lib/dal.ts`.
- Cache Components is on: anything that reads the cookie (`getAccessToken()` and everything built on it) must render behind a `<Suspense>` boundary, as `page.tsx` does. Do not call `Date.now()` in a component (the `react-hooks/purity` lint rule); compute time-dependent values in `lib/dashboard-data.ts`.
- Successful sign-up and sign-in redirect to `/` from the server action; `redirect()` throws, so call it outside `try`/`catch`.
- The home page shows "Latest meetings" (the 3 with the most recent date) and "All meetings", both newest first; the api returns the oldest first and exposes no creation time. Dates are formatted in the viewer's time zone by `MeetingDate` (the server renders UTC with a label, the browser swaps in local time without a hydration mismatch).
- New auth-style pages reuse `AuthShell`, `EmailField`, `PasswordField` and `FormErrorAlert` instead of copying markup.
- Form UX rules (checked on `/register`): keep focus in place while a submit is pending (use `isReadOnly`, never `isDisabled`, on fields); after a failed submit call `useFormFocus` so focus lands on the first invalid field or the alert; one `h1` per page (`AuthShell` and the dashboard render it, then `h2`/`h3` in order); interactive controls are at least 40px (buttons 44px); text and controls keep AA contrast (4.5:1 for text, 3:1 for field borders), which is why `globals.css` overrides HeroUI's default `--accent` and `--field-border*`; use our own validation instead of the browser's bubbles: `<Form validationBehavior="aria">` plus `useFieldErrors` (check a non-empty field on blur, re-check on change once an error shows, check everything on submit and focus the first invalid field); the native mode keeps a stale browser message until the next commit. Error text is 14px and 4.5:1 or better, which is why `globals.css` also overrides `--danger`.
- Do not put `overflow-hidden` on a container that holds focusable fields and decorative overflow: `focus()` scrolls it and shifts the content. Clip the decoration in its own layer (see `AuthShell`).
- Icons come from `@gravity-ui/icons` (the set used in the HeroUI docs).
- Styling with Tailwind v4; global styles live in `src/app/globals.css`.
- All code, comments and documentation are in English.
- When the structure, stack, commands or interaction with other apps change, update this file and the root `CLAUDE.md` / `README.md` (see "Keeping documentation up to date" in the root `CLAUDE.md`).
