
'use client';

import React, { useEffect } from 'react';
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

  useEffect(() => {
    if (isLoading) {
      return; // Wait until all authentication and user data is loaded before making decisions
    }

    if (user) {
        // User is logged in
        if (isAuthPage) {
            const from = searchParams.get('from');
            router.replace(from || '/home'); // Redirect away from auth pages if logged in
            return;
        }
        if (!isProfileComplete && !isCompleteProfilePage) {
            router.replace('/complete-profile'); // Profile is not complete, force them to the form
            return;
        }
        if (isProfileComplete && isCompleteProfilePage) {
            router.replace('/profile'); // Profile is complete, don't let them see the form again
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

  // Show a loader only under specific conditions to avoid "flash of loader" on public pages
  if (isLoading && requireAuth) {
    return <CricketLoading message="Authenticating..." />;
  }
  
  // Prevent "flash of unauthenticated content" while redirects are processed.
  if (user) {
    // If user is logged in, but we're on an auth page, we're about to redirect, so render nothing.
    if (isAuthPage) return null; 
    // If profile isn't complete and we're not on the completion page, we're redirecting.
    if (!isProfileComplete && !isCompleteProfilePage) return <CricketLoading message="Finalizing your setup..." />;
    // If profile is complete but we're on the completion page, we're redirecting.
    if (isProfileComplete && isCompleteProfilePage) return null; 
  } else {
    // If we require auth, we will be redirecting away from this page, so render nothing.
    if (requireAuth) return null; 
  }
  
  // If none of the redirect conditions are met, render the children.
  return <>{children}</>;
}
