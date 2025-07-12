
'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';

const AUTH_PAGES = ['/auth/login', '/auth/signup'];

// A minimal, fast-rendering loading indicator for the guard.
const AuthGuardLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-background">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
  </div>
);

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = AUTH_PAGES.includes(pathname);

  useEffect(() => {
    if (loading) {
      return; // Wait for the auth state to load
    }

    if (user && isAuthPage) {
      // If user is logged in and on an auth page, redirect to home
      router.replace('/home');
    } else if (!user && !isAuthPage) {
      // If user is not logged in and not on a protected page, redirect to login
      router.replace('/auth/login');
    }
  }, [user, loading, isAuthPage, router, pathname]);

  if (loading) {
    return <AuthGuardLoader />;
  }

  // If we are redirecting, show the loader instead of the page content
  if ((user && isAuthPage) || (!user && !isAuthPage)) {
    return <AuthGuardLoader />;
  }

  return <>{children}</>;
}
