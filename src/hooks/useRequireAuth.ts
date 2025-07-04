'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';

const useRequireAuth = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If loading is finished and there's no user, redirect to login
    if (!loading && !user && pathname !== '/auth/login') {
      router.replace('/auth/login');
    }
  }, [user, loading, router, pathname]);

  return { user, loading };
};

export default useRequireAuth;
