
// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { CricketLoading } from '@/components/CricketLoading';

// This component acts as a gatekeeper.
// It shows a loading state and then redirects based on auth status.
export default function GatekeeperPage() {
  const router = useRouter();
  const { user, loading, isProfileComplete, profile } = useAuth();

  useEffect(() => {
    // Don't redirect while auth state is loading
    if (loading) {
      return;
    }

    if (user) {
        if (isProfileComplete) {
            router.replace('/home');
        } else if (profile && !profile.guidedTourCompleted) {
            router.replace('/walkthrough');
        }
         else {
            router.replace('/complete-profile');
        }
    } else {
      router.replace('/auth/login');
    }
  }, [user, loading, isProfileComplete, profile, router]);

  // Render a full-page loading animation while figuring out where to go.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <CricketLoading />
        <p className="mt-4 text-muted-foreground animate-pulse">Checking your credentials...</p>
    </div>
  );
}
