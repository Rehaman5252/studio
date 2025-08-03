
// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';

// This component acts as a gatekeeper.
// It shows a loading state and then redirects based on auth status.
export default function GatekeeperPage() {
  const router = useRouter();
  const { user, loading, isProfileComplete } = useAuth();

  useEffect(() => {
    // Don't redirect while auth state is loading
    if (loading) {
      return;
    }

    if (user) {
        if (isProfileComplete) {
            router.replace('/home');
        } else {
            router.replace('/complete-profile');
        }
    } else {
      router.replace('/auth/login');
    }
  }, [user, loading, isProfileComplete, router]);

  // Render a full-page loading skeleton while figuring out where to go.
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-full max-w-md p-8 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <div className="pt-8 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    </div>
  );
}
