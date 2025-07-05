'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { isFirebaseConfigured } from '@/lib/firebase';

const useRequireAuth = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect if Firebase is not configured (we're in demo mode)
    if (!loading && !user && isFirebaseConfigured) {
      router.replace('/auth/login');
    }
  }, [user, loading, router]);

  return { user, loading };
};

export default useRequireAuth;
