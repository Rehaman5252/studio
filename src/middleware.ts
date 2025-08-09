import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = [
  '/', // The root is now the public home page
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/verify-email',
  '/policies',
  '/leaderboard', // Allow guests to see the leaderboard
  '/test', // a test route
];

const authRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/verify-email',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.has('firebaseIdToken');

  // Redirect to root if an authenticated user tries to access auth pages
  if (isAuthenticated && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect to login if an unauthenticated user tries to access a protected page
  if (!isAuthenticated && !publicRoutes.some(p => pathname.startsWith(p) && (pathname.length === p.length || pathname[p.length] === '/'))) {
     // Allow Next.js specific paths and files with extensions to pass through
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
      return NextResponse.next();
    }
    
    // For protected routes, redirect to login and preserve the intended destination
    const loginUrl = new URL('/auth/login', request.url);
    if (pathname !== '/') {
        loginUrl.searchParams.set('from', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Allow the request to proceed if none of the above conditions are met
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
