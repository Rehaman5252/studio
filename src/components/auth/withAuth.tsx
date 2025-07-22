
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
 */
import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> => {
  const WithAuthComponent: React.FC<P> = (props) => {
    const { user, isProfileComplete, loading } = useAuth();
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

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
};

export default withAuth;
