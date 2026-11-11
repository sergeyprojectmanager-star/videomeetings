'use server';

import { API_URL } from '@/lib/api';
import { setAccessTokenCookie } from '@/lib/session';

export type RegisterState =
  | { status: 'idle' }
  | { status: 'success'; email: string }
  | {
      status: 'error';
      email: string;
      message?: string;
      fieldErrors?: { email?: string; password?: string };
    };

// Mirrors the api rules (`registerSchema`): the api stays the source of truth,
// this only avoids a round trip for the obvious mistakes.
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

export async function register(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return {
      status: 'error',
      email,
      fieldErrors: {
        password: `Password must be ${PASSWORD_MIN}–${PASSWORD_MAX} characters long`,
      },
    };
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/register`, {
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

  if (response.status === 409) {
    return {
      status: 'error',
      email,
      fieldErrors: { email: 'An account with this email already exists' },
    };
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

  // The api stores e-mails lower-cased; show the address the way it is stored.
  return { status: 'success', email: email.toLowerCase() };
}
