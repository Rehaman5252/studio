
'use client';

import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/context/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, memo } from 'react';
import { Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  useEffect(() => {
    // Only redirect if auth is not loading and user exists
    if (!loading && user) {
       const checkProfileAndRedirect = async () => {
         let isProfileComplete = false;
         if (db && user) {
            try {
              const docRef = doc(db, 'users', user.uid);
              const docSnap = await getDoc(docRef);
              isProfileComplete = docSnap.exists() && docSnap.data().profileCompleted;
            } catch (e) {
                console.error("Failed to check profile completeness", e);
            }
         }
         router.replace(isProfileComplete ? '/home' : '/walkthrough');
       };
       checkProfileAndRedirect();
    }
  }, [user, loading, router]);

  // Show a loader while checking auth state or if user is found (and we are about to redirect)
  // This prevents the login form from flashing on the screen for logged-in users.
  if (loading || user) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Checking your credentials...</p>
      </div>
    );
  }

  // If not loading and no user, show the form
  return <LoginForm from={from} />;
}

export default memo(LoginPage);
