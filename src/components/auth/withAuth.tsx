
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';

interface WithAuthProps {}

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P & WithAuthProps> => {
  const WithAuthComponent: React.FC<P & WithAuthProps> = (props) => {
    const { user, profile, loading, isOffline } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (loading) return; // Wait until loading is complete before making decisions

      if (isOffline) {
          // If offline, we can't verify auth state, so we stay on the current page
          // but show an offline warning. The component itself should handle this.
          return;
      }

      if (!user) {
        router.replace('/auth/login');
      } else if (user && !profile?.profileCompleted) {
        // This check is important. It ensures that even if a user is logged in,
        // they are forced to complete their profile before accessing protected content.
        router.replace('/complete-profile');
      }
    }, [user, profile, loading, isOffline, router]);
    
    if (isOffline) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background p-4">
                <Alert variant="destructive" className="max-w-md">
                    <WifiOff className="h-4 w-4" />
                    <AlertTitle>You Are Offline</AlertTitle>
                    <AlertDescription>
                        Please check your internet connection to access this page. Some features may be unavailable.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (loading || !user || !profile?.profileCompleted) {
      // Show a loader while we're waiting for auth state or during the redirect.
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    // If all checks pass, render the wrapped component.
    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
};

export default withAuth;
