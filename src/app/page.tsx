
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { CricketLoading } from '@/components/CricketLoading';

// This page acts as a gatekeeper, redirecting users based on their auth status.
export default function GatekeeperPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Wait until the authentication status is determined
    if (loading) return;

    if (user) {
      // If the user is authenticated, send them to the home page.
      // The home page will handle further logic like profile completion or walkthroughs.
      router.replace('/home');
    } else {
      // If the user is not authenticated, send them to the login page.
      router.replace('/auth/login');
    }
  }, [user, loading, router]);

  // Display a loading indicator while checking authentication.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <CricketLoading />
      <p className="mt-4 text-muted-foreground animate-pulse">
        Checking credentials...
      </p>
    </div>
  );
}
