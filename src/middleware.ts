
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is a placeholder for the actual logic that would verify a real session token.
// In a production app, this would involve decoding and verifying a JWT.
const checkUserSession = (request: NextRequest): boolean => {
    // For this app, we'll check for the presence of a simple cookie.
    // NOTE: This is NOT a secure way to check authentication in a real app.
    return request.cookies.has('firebaseIdToken');
};


export function middleware(request: NextRequest) {
  // Let Next.js internals and API routes pass through without checks.
  if (request.nextUrl.pathname.startsWith('/_next') || request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  
  const isAuthenticated = checkUserSession(request);
  const isPublicRoute = ['/auth/login', '/auth/signup'].includes(request.nextUrl.pathname);
  
  // If the user is authenticated and tries to access a public-only route like login,
  // redirect them to the home page.
  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL('/home', request.url));
  }
  
  // If the user is not authenticated and is trying to access a protected route,
  // redirect them to the login page.
  if (!isAuthenticated && !isPublicRoute) {
    const from = request.nextUrl.pathname;
    const loginUrl = new URL('/auth/login', request.url);
    if(from && from !== '/') {
        loginUrl.searchParams.set('from', from);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Otherwise, allow the request to proceed.
  return NextResponse.next();
}

export const config = {
  // This matcher ensures the middleware runs on all routes except for static assets
  // and other special Next.js paths.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
