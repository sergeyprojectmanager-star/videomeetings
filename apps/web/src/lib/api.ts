// Base URL of the api app. Only used on the server (server actions, route
// handlers), so the browser never talks to the api directly and CORS is not
// needed. Override it with `API_URL` in `apps/web/.env.local`.
export const API_URL = process.env.API_URL ?? 'http://localhost:3001';

/** Name of the httpOnly cookie that holds the access token. */
export const ACCESS_TOKEN_COOKIE = 'access_token';

/** Matches the 1 hour lifetime of the access token issued by the api. */
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60;
