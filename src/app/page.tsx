'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CricketLoading from '@/components/CricketLoading';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return <CricketLoading message="Loading CricBlitz..." />;
}
