'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode; }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If auth is done loading and there's no user, redirect to login
    if (!loading && !user) {
      const targetPath = `/auth/login?from=${encodeURIComponent(pathname)}`;
      router.replace(targetPath);
    }
  }, [user, loading, router, pathname]);

  // While loading, or if there's no user yet (and we're about to redirect),
  // show a loading spinner.
  if (loading || !user) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  // If we have a user, render the children
  return <>{children}</>;
}
