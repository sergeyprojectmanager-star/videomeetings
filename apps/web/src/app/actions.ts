'use server';

import { redirect } from 'next/navigation';
import { clearAccessTokenCookie } from '@/lib/session';

/** Signs the user out: drops the access token cookie and goes to /login. */
export async function logout() {
  await clearAccessTokenCookie();
  redirect('/login');
}
