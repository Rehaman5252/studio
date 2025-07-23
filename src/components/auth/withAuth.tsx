'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';
import useFirebaseReady from '@/hooks/useFirebaseReady';

interface WithAuthProps {
  // Add any additional props you might want to pass to the wrapped component
}

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P & WithAuthProps> => {
  const WithAuthComponent: React.FC<P & WithAuthProps> = (props) => {
    const { user, loading } = useAuth();
    const firebaseReady = useFirebaseReady();
    const router = useRouter();

    useEffect(() => {
      if (!loading && firebaseReady && user === null) {
        router.replace('/auth/login');
      }
    }, [user, loading, firebaseReady, router]);

    if (loading || !firebaseReady) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    if (!user) {
      // Still show loader while redirect is happening
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
