
'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';

const PROTECTED_ROUTES = ['/profile', '/quiz-history', '/certificates', '/rewards', '/settings', '/support'];
const AUTH_PAGES = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/verify-email'];

export default function AuthGuard({ children }: { children: React.ReactNode; }) {
  const { user, loading, isUserDataLoading, isProfileComplete } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || isUserDataLoading) {
      return; // Wait until authentication state is loaded
    }

    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    const isAuthPage = AUTH_PAGES.some(route => pathname.startsWith(route));
    const isCompleteProfilePage = pathname === '/complete-profile';

    if (!user) {
      // If user is not logged in and tries to access a protected page, redirect to login
      if (isProtectedRoute || isCompleteProfilePage) {
        router.replace(`/auth/login?from=${encodeURIComponent(pathname)}`);
      }
      return;
    }

    // User is logged in
    if (isAuthPage) {
      // If user is on an auth page, redirect them home
      router.replace('/home');
      return;
    }
    
    if (!isProfileComplete && !isCompleteProfilePage) {
      // If profile is incomplete, force them to the complete profile page
      router.replace('/complete-profile');
      return;
    }
    
    if (isProfileComplete && isCompleteProfilePage) {
      // If profile is complete and they land on complete-profile, send them home
      router.replace('/profile');
      return;
    }

  }, [user, loading, isUserDataLoading, isProfileComplete, router, pathname]);

  // Render a loading state while auth status is being determined
  if (loading || isUserDataLoading) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Initializing...</p>
      </div>
    );
  }

  // Prevent flash of content by returning null during redirect evaluation
  if (!user && (PROTECTED_ROUTES.some(r => pathname.startsWith(r)) || pathname === '/complete-profile')) return null;
  if (user && AUTH_PAGES.some(r => pathname.startsWith(r))) return null;
  if (user && !isProfileComplete && pathname !== '/complete-profile') return null;
  if (user && isProfileComplete && pathname === '/complete-profile') return null;

  return <>{children}</>;
}
