
'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import CricketLoading from '../CricketLoading';

const AUTH_PAGES = ['/auth/login', '/auth/signup'];

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
      // If user is not logged in and not on an auth page, redirect to login
      router.replace('/auth/login');
    }
  }, [user, loading, isAuthPage, router, pathname]);

  if (loading) {
    return <CricketLoading message="Authenticating..." />;
  }

  // If user is logged in, but we are on an auth page, we are redirecting, so don't show children
  if (user && isAuthPage) {
    return <CricketLoading message="Redirecting..." />;
  }

  // If user is not logged in, and we are on a protected page, we are redirecting, so don't show children
  if (!user && !isAuthPage) {
    return <CricketLoading message="Redirecting..." />;
  }

  return <>{children}</>;
}
