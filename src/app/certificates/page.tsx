
'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const CertificatesContent = dynamic(() => import('@/components/certificates/CertificatesContent'), {
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-[125px] w-full" />
      <Skeleton className="h-[125px] w-full" />
      <Skeleton className="h-[125px] w-full" />
    </div>
  ),
  ssr: false,
});

function CertificatesPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user === null) {
        router.replace('/auth/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">My Certificates</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        <CertificatesContent />
      </main>
    </div>
  );
}

export default function CertificatesPage() {
  return <CertificatesPageContent />;
}
