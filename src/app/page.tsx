
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
        router.replace('/home');
      } else if (profile && !profile.guidedTourCompleted) {
        router.replace('/walkthrough');
      } else {
        router.replace('/complete-profile');
      }
    } else {
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
