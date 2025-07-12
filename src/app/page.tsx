
'use client';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import CricketLoading from '@/components/CricketLoading';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/home');
      } else {
        router.replace('/auth/login');
      }
    }
  }, [user, loading, router]);

  return <CricketLoading message="Initializing..." />;
}
