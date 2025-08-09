
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// --- MIDDLEWARE TEMPORARILY DISABLED FOR DEBUGGING ---

export function middleware(request: NextRequest) {
  // Pass all requests through without any checks for now.
  return NextResponse.next();
}

export const config = {
  // By returning an empty matcher, the middleware will not run on any path.
  matcher: [],
};
