'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';

const PROTECTED_ROUTES = ['/profile', '/quiz-history', '/certificates', '/rewards', '/complete-profile'];

export default function AuthGuard({ children }: { children: React.ReactNode; }) {
  const { user, loading, isUserDataLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || isUserDataLoading) return;

    if (!user && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
      router.replace(`/auth/login?from=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user && pathname.startsWith('/auth')) {
      router.replace('/home');
    }
  }, [user, loading, isUserDataLoading, router, pathname]);

  if (loading || isUserDataLoading) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Initializing...</p>
      </div>
    );
  }

  if (!user && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) return null;
  if (user && pathname.startsWith('/auth')) return null;

  return <>{children}</>;
}
