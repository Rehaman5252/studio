'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode; }) {
  const { user, loading, isProfileComplete, isUserDataLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait until Firebase auth and user data have been checked
    if (loading || isUserDataLoading) {
      return;
    }
    
    // Auth check: if not logged in, redirect to login page
    if (!user) {
      // Allow access only to auth pages
      if (!pathname.startsWith('/auth')) {
        const targetPath = `/auth/login?from=${encodeURIComponent(pathname)}`;
        router.replace(targetPath);
      }
      return;
    }

    // Profile completion check: if logged in but profile is incomplete
    if (user && !isProfileComplete) {
      // Redirect to completion page if not already there
      if (pathname !== '/complete-profile') {
        router.replace('/complete-profile');
      }
      return;
    }
    
    // If logged in AND profile is complete
    if (user && isProfileComplete) {
      // Redirect away from auth pages and completion page to home
      if (pathname.startsWith('/auth') || pathname === '/complete-profile') {
        router.replace('/home');
      }
    }
    
  }, [user, loading, isProfileComplete, isUserDataLoading, router, pathname]);

  // While loading, or if conditions for rendering haven't been met, show a loader.
  // This prevents content flashing.
  if (loading || isUserDataLoading) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Initializing...</p>
      </div>
    );
  }
  
  // Specific rendering conditions to avoid showing content incorrectly during redirects
  if (!user && !pathname.startsWith('/auth')) return null; // Don't render protected page if no user
  if (user && !isProfileComplete && pathname !== '/complete-profile') return null; // Don't render page if profile incomplete and not on correct page
  if (user && isProfileComplete && (pathname.startsWith('/auth') || pathname === '/complete-profile')) return null; // Don't render auth pages if logged in and complete

  // If all checks pass, render the children
  return <>{children}</>;
}
