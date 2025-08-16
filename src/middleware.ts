
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define which routes are public and which are protected
const publicRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/verify-email',
  '/policies',
  '/api/quiz' // API routes used publicly should be listed
];

const authRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/verify-email',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = !!request.cookies.get('firebaseIdToken');

  // Allow Next.js specific paths and files with extensions to pass through
  if (pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // If the user is authenticated...
  if (isAuthenticated) {
    // ...and they are trying to access a login/signup page, redirect them to home.
    if (authRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL('/home', request.url));
    }
  } 
  // If the user is NOT authenticated...
  else {
    // ...and they are trying to access a protected page, redirect to login.
    if (!publicRoutes.includes(pathname) && pathname !== '/') {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('from', pathname); // Preserve intended destination
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow the request to proceed if none of the above conditions are met.
  return NextResponse.next();
}

// This config ensures the middleware runs on all paths except for static assets and API routes (unless specified).
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
