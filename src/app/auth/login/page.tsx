
'use client';

import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if auth is not loading and user exists
    if (!loading && user) {
       const checkProfileAndRedirect = async () => {
         let isProfileComplete = false;
         if (db) {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            isProfileComplete = docSnap.exists() && docSnap.data().profileCompleted;
         }
         router.replace(isProfileComplete ? '/home' : '/walkthrough');
       };
       checkProfileAndRedirect();
    }
  }, [user, loading, router]);

  // Show a loader ONLY if we are in the process of redirecting
  if (loading || user) {
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
