'use server';

import { API_URL } from '@/lib/api';
import { setAccessTokenCookie } from '@/lib/session';

export type LoginState =
  | { status: 'idle' }
  | { status: 'success'; email: string }
  | {
      status: 'error';
      email: string;
      message?: string;
      fieldErrors?: { email?: string };
    };

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

  // The api compares e-mails lower-cased; show the address the way it is stored.
  return { status: 'success', email: email.toLowerCase() };
}
