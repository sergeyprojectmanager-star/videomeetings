// Data Access Layer: the only place that talks to the api on behalf of the
// signed-in user. Every function reads the access token cookie, so it can only
// run behind a `<Suspense>` boundary (Cache Components).
import { redirect } from 'next/navigation';
import { API_URL } from './api';
import { getAccessToken } from './session';

export interface CurrentUser {
  id: string;
  email: string;
}

/** A meeting as the api returns it; `date` is an ISO 8601 string. */
export interface Meeting {
  id: string;
  title: string;
  date: string;
  participants: string[];
}

async function apiGet<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  // A token the api no longer accepts (expired, or its user was deleted).
  if (response.status === 401) redirect('/login');
  if (!response.ok) {
    throw new Error(`The api answered ${response.status} for GET ${path}`);
  }
  return (await response.json()) as T;
}

/** Who is signed in. Sends the user to /login when there is no valid session. */
export function getCurrentUser(): Promise<CurrentUser> {
  return apiGet<CurrentUser>('/auth/me');
}

/** The signed-in user's meetings, oldest first (the api orders them by date). */
export function getMeetings(): Promise<Meeting[]> {
  return apiGet<Meeting[]>('/meetings');
}
