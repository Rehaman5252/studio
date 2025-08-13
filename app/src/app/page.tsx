
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { CricketLoading } from '@/components/CricketLoading';

// The root page now redirects to /home, which is the main entry point.
// The middleware will handle auth checks.
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <CricketLoading />
      <p className="mt-4 text-muted-foreground animate-pulse">
        Loading CricBlitz...
      </p>
    </div>
  );
}
