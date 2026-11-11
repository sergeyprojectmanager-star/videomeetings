import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_MAX_AGE_SECONDS } from './api';

/** Stores the access token in an httpOnly cookie (server actions only). */
export async function setAccessTokenCookie(accessToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });
}

/** Removes the access token cookie, i.e. signs the user out (server actions only). */
export async function clearAccessTokenCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
}

/**
 * The access token of the current request, if any. Reads request data, so it
 * can only be called behind a `<Suspense>` boundary (Cache Components).
 */
export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
}
