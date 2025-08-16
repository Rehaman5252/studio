
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { CricketLoading } from '@/components/CricketLoading';

// Acts as a gatekeeper to redirect based on auth/profile state
export default function GatekeeperPage() {
  const router = useRouter();
  const { user, loading, isProfileComplete, profile } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user) {
      if (isProfileComplete) {
        // If profile is complete, send to home.
        router.replace('/home');
      } else if (profile && !profile.guidedTourCompleted) {
        // If the profile exists but the tour hasn't been done, start the walkthrough.
        router.replace('/walkthrough');
      } else {
        // Otherwise, they need to complete their profile.
        router.replace('/complete-profile');
      }
    } else {
      // If no user, send to the login page.
      router.replace('/auth/login');
    }
  }, [user, loading, isProfileComplete, profile, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <CricketLoading />
      <p className="mt-4 text-muted-foreground animate-pulse">
        Checking your credentials...
      </p>
    </div>
  );
}
