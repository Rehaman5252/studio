
'use client';
/**
 * @fileOverview withAuth Higher-Order Component (HOC)
 *
 * This HOC protects routes that require a fully authenticated and validated user.
 * It checks for:
 * 1. A valid, authenticated user session.
 * 2. A completed user profile.
 *
 * - If the user is not logged in, it redirects to the login page.
 * - If the user is logged in but their profile is incomplete, it redirects to the profile completion page.
 * - It shows a loading spinner while checking auth/profile state.
 * - It shows an offline message if the connection to Firebase is lost.
 */
import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Loader2, WifiOff } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> => {
  const WithAuthComponent: React.FC<P> = (props) => {
    const { user, isProfileComplete, loading, isOffline } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      if (loading) {
        return; // Wait for auth and profile state to be resolved
      }
      
      if (!user) {
        router.replace(`/auth/login?from=${encodeURIComponent(pathname)}`);
      } else if (!isProfileComplete) {
        router.replace('/complete-profile');
      }

    }, [user, isProfileComplete, loading, router, pathname]);

    if (loading || !user || !isProfileComplete) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }
    
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

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
};

export default withAuth;
