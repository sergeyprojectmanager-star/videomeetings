/**
 * Whether a JWT is missing, malformed or past its `exp`. It does NOT verify the
 * signature (the web app does not know the secret): it is only an optimistic
 * check for the proxy. The api verifies the token on every request.
 */
export function isTokenExpired(token: string | undefined): boolean {
  if (!token) return true;
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json) as { exp?: unknown };
    return typeof exp !== 'number' || exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
