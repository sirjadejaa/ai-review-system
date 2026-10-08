import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_SESSION_COOKIE = 'admin_session';

/**
 * Next.js Edge Middleware for early route interception
 * Protects all /admin/* routes and handles authenticated /admin/login redirection.
 *
 * NOTE: Server-side validation via `requireAdmin()` remains mandatory for complete security.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  // 1. If visiting /admin/login, allow the login page to handle rendering or server-side auth check.
  // Never blindly redirect back to /admin based on cookie presence alone, as stale/expired
  // cookies create an infinite redirect loop between /admin and /admin/login.
  if (pathname === '/admin/login') {
    if (request.nextUrl.searchParams.has('returnUrl') && sessionCookie) {
      // Clear stale/expired session cookie that caused the redirection
      const response = NextResponse.next();
      response.cookies.delete(ADMIN_SESSION_COOKIE);
      return response;
    }
    return NextResponse.next();
  }

  // 2. If visiting any protected /admin/* route without a session cookie, redirect to login
  if (pathname.startsWith('/admin')) {
    if (!sessionCookie) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
