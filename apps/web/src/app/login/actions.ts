'use server';

import { redirect } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { setAccessTokenCookie } from '@/lib/session';

export type LoginState =
  | { status: 'idle' }
  | {
      status: 'error';
      email: string;
      message?: string;
      fieldErrors?: { email?: string };
    };

/**
 * Signs the user in through the api, keeps the access token in an httpOnly
 * cookie and sends them to the home page. It only returns on failure.
 */
export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });
  } catch {
    return {
      status: 'error',
      email,
      message: 'Could not reach the server. Please try again in a moment.',
    };
  }

  // The api answers identically for an unknown email and a wrong password, so
  // the message is deliberately not tied to a single field.
  if (response.status === 401) {
    return { status: 'error', email, message: 'Invalid email or password' };
  }

  if (response.status === 400) {
    return {
      status: 'error',
      email,
      fieldErrors: { email: 'Please enter a valid email address' },
    };
  }

  if (!response.ok) {
    return {
      status: 'error',
      email,
      message: 'Something went wrong on our side. Please try again later.',
    };
  }

  const { accessToken } = (await response.json()) as { accessToken: string };

  await setAccessTokenCookie(accessToken);

  // Outside the try block: redirect() works by throwing.
  redirect('/');
}
