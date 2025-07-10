
'use client';

import { useAuth } from '@/context/AuthProvider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function FirebaseTestPage() {
  const { user, userData, loading: isAuthLoading, isUserDataLoading } = useAuth();

  const isLoading = isAuthLoading || isUserDataLoading;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight">Firebase Connection Test</h1>
          <p className="text-muted-foreground mt-2">
            This page checks the status of Firebase Authentication and Firestore.
          </p>
        </div>

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

            <Alert variant={userData ? 'default' : 'destructive'} className={userData ? 'border-green-500/50 bg-green-500/10' : ''}>
                 {userData ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4" />}
                <AlertTitle>Firestore Status</AlertTitle>
                <AlertDescription>
                    {user && userData && `User document found for ${userData.name}. Firestore is connected.`}
                    {user && !userData && 'Auth is working, but no Firestore document was found for this user. (This is normal for a user who hasn't completed their profile).'}
                    {!user && 'Waiting for an authenticated user to check Firestore.'}
                </AlertDescription>
            </Alert>
          </>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <p>Check the browser's developer console (F12) for more detailed logs.</p>
        </div>
      </div>
    </div>
  );
}
