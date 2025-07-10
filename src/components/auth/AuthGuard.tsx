
'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
            router.replace('/home'); // User is on /login or /signup, send them home
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

  }, [user, isLoading, isProfileComplete, router, pathname, isAuthPage, isCompleteProfilePage, requireAuth]);

  // Show a loader only under specific conditions to avoid "flash of loader" on public pages
  if (isLoading && requireAuth) {
    return <CricketLoading message="Authenticating..." />;
  }
  
  // Prevent "flash of unauthenticated content" while redirects are processed.
  if (user) {
    if (isAuthPage) return null; 
    if (!isProfileComplete && !isCompleteProfilePage) return <CricketLoading message="Finalizing your setup..." />;
    if (isProfileComplete && isCompleteProfilePage) return null; 
  } else {
    // If we require auth, we will be redirecting, so don't render children.
    if (requireAuth) return null; 
  }
  
  return <>{children}</>;
}
