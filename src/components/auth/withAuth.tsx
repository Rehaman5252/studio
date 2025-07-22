
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';

interface WithAuthProps {
  // Add any additional props you might want to pass to the wrapped component
}

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P & WithAuthProps> => {
  const WithAuthComponent: React.FC<P & WithAuthProps> = (props) => {
    const { user, profile, loading, isOffline } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // Don't redirect while loading
      if (loading) return;

      if (!user) {
        router.replace('/auth/login');
      } else if (!profile?.profileCompleted) {
        // This ensures that even if a profile exists but is incomplete,
        // the user is forced to complete it.
        router.replace('/complete-profile');
      }
    }, [user, profile, loading, router]);
    
    if (isOffline) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background p-4">
                <Alert variant="destructive" className="max-w-md">
                    <WifiOff className="h-4 w-4" />
                    <AlertTitle>You Are Offline</AlertTitle>
                    <AlertDescription>
                        Please check your internet connection to access this page.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Show a loader while we determine auth state and profile completion.
    if (loading || !user || !profile?.profileCompleted) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
};

export default withAuth;
