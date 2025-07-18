
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import useRequireAuth from '@/hooks/useRequireAuth';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function CertificatesPage() {
  const { loading } = useRequireAuth();
  
  if (loading) {
      return (
        <div className="flex flex-col h-screen bg-background items-center justify-center">
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
