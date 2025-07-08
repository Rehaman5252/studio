
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';

const useRequireAuth = () => {
  const { user, userData, loading, isUserDataLoading, quizHistory, isHistoryLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If loading is finished and there's no user, redirect to login.
    // This now works correctly whether Firebase is configured or not,
    // as the AuthProvider handles the logic of setting user to null.
    if (!loading && !user) {
      router.replace(`/auth/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  return { user, userData, loading, isUserDataLoading, quizHistory, isHistoryLoading };
};

export default useRequireAuth;
