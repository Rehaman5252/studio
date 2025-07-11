
'use client';

import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import CricketLoading from '../CricketLoading';

const AUTH_PAGES = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/verify-email'];

export default function AuthGuard({ 
    children, 
    requireAuth = true
}: { 
    children: React.ReactNode; 
    requireAuth?: boolean;
}) {
  const { user, loading: isAuthLoading, isUserDataLoading, isProfileComplete } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isAuthPage = AUTH_PAGES.some(route => pathname.startsWith(route));
  const isCompleteProfilePage = pathname === '/complete-profile';
  
  const isLoading = isAuthLoading || isUserDataLoading;

  React.useEffect(() => {
    // Wait until all authentication and user data is loaded before making decisions.
    if (isLoading) {
      return; 
    }

    if (user) {
        // User is logged in
        if (isAuthPage) {
            // If the user is on an auth page, send them away.
            const from = searchParams.get('from');
            router.replace(from || '/home');
            return;
        }
        if (!isProfileComplete && !isCompleteProfilePage) {
            // Profile is not complete, force them to the form.
            router.replace('/complete-profile');
            return;
        }
        if (isProfileComplete && isCompleteProfilePage) {
            // Profile is complete, don't let them see the form again.
            router.replace('/profile');
            return;
        }
    } else {
      // User is not logged in
      if (requireAuth) {
        // This is a protected page, redirect to login and remember where they were coming from.
        router.replace(`/auth/login?from=${encodeURIComponent(pathname)}`);
      }
    }

  }, [user, isLoading, isProfileComplete, router, pathname, isAuthPage, isCompleteProfilePage, requireAuth, searchParams]);

  // Render a loading screen ONLY under specific conditions to avoid "flash of loader" on public pages.
  // This shows a loader if we are on a page that requires auth, but we are still checking who the user is.
  if (isLoading && requireAuth) {
    return <CricketLoading message="Authenticating..." />;
  }
  
  // This section prevents "flash of unauthenticated content" while redirects are being processed.
  // If a redirect is about to happen, we render `null` or a loader instead of the page content.
  if (user) {
    // If user is logged in, but we're on an auth page, we're about to redirect, so render nothing.
    if (isAuthPage) return null; 
    // If profile isn't complete and we're not on the completion page, we're redirecting. Show a loader.
    if (!isProfileComplete && !isCompleteProfilePage) return <CricketLoading message="Finalizing your setup..." />;
    // If profile is complete but we're on the completion page, we're redirecting. Render nothing.
    if (isProfileComplete && isCompleteProfilePage) return null; 
  } else {
    // If we require auth and there's no user, we will be redirecting away from this page, so render nothing.
    if (requireAuth) return null; 
  }
  
  // If none of the redirect conditions are met, it's safe to render the children.
  return <>{children}</>;
}
