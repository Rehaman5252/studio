
'use client';

import { useAuth } from '@/context/AuthProvider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { getDoc, doc } from 'firebase/firestore';

export default function FirebaseTestPage() {
  const { user, profile, loading: isAuthLoading } = useAuth();
  const [dbStatus, setDbStatus] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkFirestore() {
      // db will be null on SSR, so this check runs client-side.
      if (!isFirebaseConfigured || !db) {
        setDbStatus(false);
        return;
      }
      try {
        // Attempt a read to a document that may or may not exist.
        // We're just checking for connectivity.
        await getDoc(doc(db, 'health-check/status'));
        setDbStatus(true);
      } catch (e: any) {
        // Permission denied is okay, it means the service is reachable.
        if (e.code === 'permission-denied' || e.code === 'unauthenticated') {
            setDbStatus(true);
        } else {
            console.error("Firestore health check failed:", e);
            setDbStatus(false);
        }
      }
    }
    checkFirestore();
  }, []);

  const isLoading = isAuthLoading;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight">Firebase Connection Test</h1>
          <p className="text-muted-foreground mt-2">
            This page checks the status of your Firebase configuration, Authentication, and Firestore.
          </p>
        </div>

        <Alert variant={isFirebaseConfigured ? 'default' : 'destructive'} className={isFirebaseConfigured ? 'border-green-500/50 bg-green-500/10' : ''}>
            {isFirebaseConfigured ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4" />}
            <AlertTitle>Firebase Configuration</AlertTitle>
            <AlertDescription>
            {isFirebaseConfigured ? `Firebase config loaded successfully.` : 'Firebase config is missing or incomplete. Please check your environment variables.'}
            </AlertDescription>
        </Alert>
        
        {dbStatus === null ? (
            <div className="flex items-center justify-center rounded-lg border bg-card p-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Checking Firestore connection...</p>
            </div>
        ) : (
            <Alert variant={dbStatus ? 'default' : 'destructive'} className={dbStatus ? 'border-green-500/50 bg-green-500/10' : ''}>
                {dbStatus ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4" />}
                <AlertTitle>Firestore Status</AlertTitle>
                <AlertDescription>
                {dbStatus ? `Firestore is online and reachable.` : 'Firestore connection FAILED. This is likely due to incorrect configuration, network issues, or restrictive Firestore rules.'}
                </AlertDescription>
            </Alert>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">Checking auth state...</p>
          </div>
        ) : (
          <>
            <Alert variant={user ? 'default' : 'destructive'} className={user ? 'border-green-500/50 bg-green-500/10' : ''}>
              {user ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4" />}
              <AlertTitle>Authentication Status</AlertTitle>
              <AlertDescription>
                {user ? `Signed in as: ${user.email}` : 'Not signed in.'}
              </AlertDescription>
            </Alert>

            <Alert variant={profile ? 'default' : 'destructive'} className={profile ? 'border-green-500/50 bg-green-500/10' : ''}>
                 {profile ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4" />}
                <AlertTitle>Profile Data</AlertTitle>
                <AlertDescription>
                    {user && profile && `User document found for ${profile.name}.`}
                    {user && !profile && 'Auth is working, but no Firestore document was found for this user.'}
                    {!user && 'Waiting for an authenticated user to check for a profile.'}
                </AlertDescription>
            </Alert>
          </>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <p>Check the browser's developer console (F12) for more detailed logs and errors.</p>
        </div>
      </div>
    </div>
  );
}
