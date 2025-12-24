import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for auth token
  const authToken = request.cookies.get('auth_token');
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isPublicFile = request.nextUrl.pathname.includes('.'); // images, favicon, etc.

  // If trying to access login page while authenticated, redirect to home
  if (isLoginPage && authToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If trying to access protected pages (not login, not api, not public files) while NOT authenticated
  if (!authToken && !isLoginPage && !isApiRoute && !isPublicFile) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
