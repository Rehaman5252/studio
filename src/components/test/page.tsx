
'use client';

import { useAuth } from '@/context/AuthProvider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { isFirebaseConfigured, isFirebaseOnline, firestore } from '@/lib/firebaseClient';
import { useEffect, useState } from 'react';

export default function FirebaseTestPage() {
  const { user, profile, loading: isAuthLoading } = useAuth();
  const [dbStatus, setDbStatus] = useState<boolean | null>(null);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    isFirebaseOnline().then(setIsOnline);
    try {
        setDbStatus(!!firestore);
    } catch (e) {
        setDbStatus(false);
    }
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

        {isOnline === null ? (
            <div className="flex items-center justify-center rounded-lg border bg-card p-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Checking online status...</p>
            </div>
        ) : (
            <Alert variant={isOnline ? 'default' : 'destructive'} className={isOnline ? 'border-green-500/50 bg-green-500/10' : ''}>
                {isOnline ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4" />}
                <AlertTitle>Firebase Online Status</AlertTitle>
                <AlertDescription>
                {isOnline ? `Firebase client is online and connected.` : 'Firebase client is OFFLINE. Data operations will fail.'}
                </AlertDescription>
            </Alert>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">Checking connection...</p>
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
                <AlertTitle>Firestore Status</AlertTitle>
                <AlertDescription>
                    {user && profile && `User document found for ${profile.name}. Firestore is connected.`}
                    {user && !profile && 'Auth is working, but no Firestore document was found for this user. (This is normal for a new user).'}
                    {!user && 'Waiting for an authenticated user to check Firestore.'}
                    {!dbStatus && 'Firestore DB instance is not available.'}
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
