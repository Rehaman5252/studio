
'use client';

import { useAuth } from '@/context/AuthProvider';

// With a mocked auth state, we no longer need to check for a user
// or redirect. This hook now simply passes through the auth context
// for consistency, but performs no actions.
const useRequireAuth = () => {
  const { user, loading } = useAuth();
  return { user, loading };
};

export default useRequireAuth;
