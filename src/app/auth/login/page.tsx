
'use client';

import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { user, loading, isProfileComplete } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if auth is not loading and user exists
    if (!loading && user) {
       // Once logged in, redirect to home. The logic there will handle if profile is incomplete.
       // It's better to centralize redirection logic on the target pages.
       router.replace(isProfileComplete ? '/home' : '/walkthrough');
    }
  }, [user, loading, router, isProfileComplete]);

  // Show a loader ONLY if we are in the process of redirecting
  if (loading || (!loading && user)) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Signing in...</p>
      </div>
    );
  }

  // If not loading and no user, show the form
  return <LoginForm />;
}
