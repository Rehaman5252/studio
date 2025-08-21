
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { CricketLoading } from '@/components/CricketLoading';

// This page acts as a gatekeeper, redirecting users based on their auth status.
export default function GatekeeperPage() {
  const router = useRouter();
  const { user, loading, profile } = useAuth();

  useEffect(() => {
    // Wait until the authentication status is determined
    if (loading) return;

    if (user) {
      // If the user is authenticated, direct to home.
      // Home page will handle profile completion or tour logic.
      router.replace('/home');
    } else {
      // If the user is not authenticated, send them to the login page.
      router.replace('/auth/login');
    }
  }, [user, loading, router]);

  // Display a loading indicator while checking authentication.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <CricketLoading />
      <p className="mt-4 text-muted-foreground animate-pulse">
        Checking credentials...
      </p>
    </div>
  );
}
