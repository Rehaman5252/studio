
'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';
import CricketLoading from '../CricketLoading';

const AUTH_PAGES = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/verify-email'];
const PUBLIC_PAGES = ['/home']; // Add other public pages here if any

export default function AuthGuard({ 
    children, 
    requireAuth = true // Default to requiring authentication
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

    // --- User is LOGGED IN ---
    if (user) {
        // If user is on an auth page, redirect them away.
        if (isAuthPage) {
            router.replace('/home');
            return;
        }
        
        // If profile is incomplete, force them to the complete profile page.
        // But don't redirect if they are already on it.
        if (!isProfileComplete && !isCompleteProfilePage) {
            router.replace('/complete-profile');
            return;
        }
        
        // If profile is complete and they somehow land on complete-profile, send them away.
        if (isProfileComplete && isCompleteProfilePage) {
            router.replace('/profile');
            return;
        }
    }
    // --- User is NOT LOGGED IN ---
    else {
      // If the page requires auth and user is not logged in, redirect to login.
      if (requireAuth) {
        router.replace(`/auth/login?from=${encodeURIComponent(pathname)}`);
      }
    }

  }, [user, isLoading, isProfileComplete, router, pathname, isAuthPage, isCompleteProfilePage, requireAuth]);

  // Render a loading state while auth status is being determined
  if (isLoading && requireAuth) {
    return <CricketLoading message="Initializing..." />;
  }

  // Conditions to prevent flash of content during redirects
  if (user) {
    if (isAuthPage) return null;
    if (!isProfileComplete && !isCompleteProfilePage) return null;
    if (isProfileComplete && isCompleteProfilePage) return null;
  } else {
    if (requireAuth) return null;
  }
  
  // Render children if all checks pass
  return <>{children}</>;
}
