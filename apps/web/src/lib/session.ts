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
