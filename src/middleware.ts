
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that are accessible to everyone
const publicRoutes = [
  '/auth/login',
  '/auth/signup',
  '/policies',
  '/api/quiz',
  // The root is handled by page.tsx, so it's implicitly public
  '/', 
];

// Auth routes are only for unauthenticated users
const authRoutes = [
  '/auth/login',
  '/auth/signup',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.has('firebaseIdToken');

  // Allow Next.js specific paths and static files to pass through
  if (pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const isPublic = publicRoutes.some(p => pathname.startsWith(p));
  const isAuthRoute = authRoutes.includes(pathname);

  if (isAuthenticated) {
    // If authenticated, redirect from auth routes to home
    if (isAuthRoute) {
      return NextResponse.redirect(new URL('/home', request.url));
    }
  } else {
    // If not authenticated, redirect from protected routes to login
    if (!isPublic) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('from', pathname); // Preserve intended destination
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Config to ensure middleware runs on all relevant paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
