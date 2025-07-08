'use client';

import { useAuth } from '@/context/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If loading is finished and there's no user, redirect to login.
    // Also pass the current path as `from` so we can redirect back after login.
    if (!loading && !user) {
      router.replace(`/auth/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  // While checking for user, show a full-screen loader.
  // This prevents a flash of content before redirection.
  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If user is authenticated, render the protected content.
  return <>{children}</>;
}
