
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define which routes are public and do not require authentication.
const publicRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/verify-email',
  '/policies',
  '/', // The root is the gatekeeper page, it handles its own redirection.
];

// Define auth routes, which authenticated users should not access.
const authRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/verify-email',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for the Firebase auth cookie. The name can vary, but it often includes 'session'.
  // A more robust solution might use a dedicated session cookie set upon login.
  // For this project, we assume a cookie named 'firebase-auth-token' or similar exists.
  // Note: Firebase client-side SDK manages tokens in IndexedDB, but for server-side
  // protection, a cookie is the standard. We'll check for any cookie that implies auth.
  // A common pattern is to set a custom cookie upon successful sign-in.
  // Since we are using client-side auth state, the gatekeeper page on '/' is the primary guard.
  // This middleware adds an extra layer of server-side protection.
  const isAuthenticated = request.cookies.has('firebaseIdToken'); // A conventional name for the token cookie.

  // --- Route Protection Logic ---

  // 1. If the user is authenticated and tries to access an auth page (like login),
  //    redirect them to the home page.
  if (isAuthenticated && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // 2. If the user is NOT authenticated and tries to access a private route,
  //    redirect them to the login page.
  if (!isAuthenticated && !publicRoutes.includes(pathname)) {
    // To prevent redirect loops for API routes or static files, we add a check.
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
        return NextResponse.next();
    }
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname); // Pass the original destination for redirection after login.
    return NextResponse.redirect(loginUrl);
  }
  
  // 3. If none of the above conditions are met, allow the request to proceed.
  return NextResponse.next();
}

// Use the matcher to specify which routes the middleware should run on.
// This is more efficient than running it on every single request.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
