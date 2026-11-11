import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/api';
import { isTokenExpired } from '@/lib/jwt';

/**
 * Optimistic check before the home page renders: no token, or an expired one,
 * goes to /login. The page itself still asks the api who the user is (see
 * `lib/dal.ts`), which is the real check.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (isTokenExpired(token)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

// Only the pages that need a signed-in user. /login and /register stay open
// even with a cookie: a token the api no longer accepts must not trap the user.
export const config = {
  matcher: ['/'],
};
