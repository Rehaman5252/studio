'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { CricketLoading } from '@/components/CricketLoading';

/**
 * This component acts as a gatekeeper for the application.
 * It is the very first page a user lands on. Its sole purpose is to check
 * the user's authentication and profile status and redirect them to the
 * appropriate page. This prevents rendering issues and 404 errors by
 * ensuring users are always on a valid route.
 */
export default function GatekeeperPage() {
  const router = useRouter();
  const { user, loading, isProfileComplete, profile } = useAuth();

  useEffect(() => {
    // We wait until the authentication status is fully loaded before redirecting.
    if (loading) {
      return;
    }

    if (user) {
      // User is authenticated, now check their profile status.
      if (isProfileComplete) {
        // Profile is complete, send to the main home screen.
        router.replace('/home');
      } else if (profile && !profile.guidedTourCompleted) {
        // User needs to see the walkthrough first.
        router.replace('/walkthrough');
      } else {
        // User needs to complete their profile.
        router.replace('/complete-profile');
      }
    } else {
      // No user is authenticated, send to the login page.
      router.replace('/auth/login');
    }
  }, [user, loading, isProfileComplete, profile, router]);

  // While the logic runs, display a full-page loading indicator
  // to provide feedback to the user.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <CricketLoading />
        <p className="mt-4 text-muted-foreground animate-pulse">Checking your credentials...</p>
    </div>
  );
}
