
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
  const { user, loading, isUserDataLoading, isProfileComplete } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = AUTH_PAGES.some(route => pathname.startsWith(route));
  const isCompleteProfilePage = pathname === '/complete-profile';
  
  const isLoading = loading || isUserDataLoading;

  useEffect(() => {
    if (isLoading) {
      return; // Wait until all authentication and user data is loaded
    }

    if (user) {
        if (isAuthPage) {
            router.replace('/home');
            return;
        }
        if (!isProfileComplete && !isCompleteProfilePage) {
            router.replace('/complete-profile');
            return;
        }
        if (isProfileComplete && isCompleteProfilePage) {
            router.replace('/profile');
            return;
        }
    } else {
      if (requireAuth) {
        router.replace(`/auth/login?from=${encodeURIComponent(pathname)}`);
      }
    }

  }, [user, isLoading, isProfileComplete, router, pathname, isAuthPage, isCompleteProfilePage, requireAuth]);

  // This is the key change: only show the full-page loader if auth is required and we are loading.
  // For public pages (like Home), this condition will be false, preventing the "Initializing..." screen.
  if (isLoading && requireAuth) {
    return <CricketLoading message="Authenticating..." />;
  }

  // These conditions prevent a "flash of unauthenticated content" while redirects are being processed.
  if (user) {
    if (isAuthPage) return null; // Don't show login/signup page to a logged-in user
    if (!isProfileComplete && !isCompleteProfilePage) return null; // Don't show other pages if profile is incomplete
    if (isProfileComplete && isCompleteProfilePage) return null; // Don't show complete-profile page if already complete
  } else {
    if (requireAuth) return null; // Don't show a protected page to a logged-out user
  }
  
  return <>{children}</>;
}
