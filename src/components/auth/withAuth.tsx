
'use client';
/**
 * @fileOverview withAuth Higher-Order Component (HOC)
 *
 * This HOC protects routes that require authentication.
 * It checks the authentication state from the `useAuth` hook and handles redirects.
 *
 * - If the user is not logged in, it redirects to the `/auth/login` page.
 * - It shows a loading spinner while checking the auth state.
 * - It shows an offline message if the connection to Firebase is lost.
 * - It passes the original destination URL in a 'from' query parameter so the
 *   user can be redirected back after successfully logging in.
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
    const { user, loading, isOffline } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      // Don't perform any redirects until the initial auth check is complete.
      if (loading) {
        return;
      }
      // If not logged in, redirect to the login page, passing the current path as 'from'.
      if (!user) {
        router.replace(`/auth/login?from=${encodeURIComponent(pathname)}`);
      }
    }, [user, loading, router, pathname]);

    // Show a global loading spinner while waiting for auth state or during redirects.
    if (loading || !user) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }
    
    // Show an offline message if connection is lost.
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

    // If all checks pass, render the wrapped component.
    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
};

export default withAuth;
