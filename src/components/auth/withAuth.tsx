
'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
    const pathname = usePathname();

    useEffect(() => {
      if (loading) return; // Wait until loading is complete before making decisions

      if (isOffline) {
          // If offline, we allow the component to render and show its own offline state.
          return;
      }

      if (!user) {
        // If user is not logged in, redirect to login page with a 'from' query param
        router.replace(`/auth/login?from=${encodeURIComponent(pathname)}`);
      } else if (user && !profile?.profileCompleted) {
        // If user is logged in but profile is incomplete, redirect to profile completion page
        router.replace('/complete-profile');
      }
    }, [user, profile, loading, isOffline, router, pathname]);
    
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

    // While loading or if user is not yet available for a redirect decision, show a loader.
    // Also show loader if profile is not complete, before the redirect kicks in.
    if (loading || !user || !profile?.profileCompleted) {
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
