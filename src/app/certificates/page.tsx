
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import { Award } from 'lucide-react';
import LoginPrompt from '@/components/auth/LoginPrompt';

const CertificatesContent = dynamic(() => import('@/components/certificates/CertificatesContent'), {
  loading: () => <CertificatesSkeleton />,
  ssr: false,
});

const CertificatesSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-[125px] w-full rounded-lg" />
      <Skeleton className="h-[125px] w-full rounded-lg" />
      <Skeleton className="h-[125px] w-full rounded-lg" />
    </div>
);

function CertificatesPage() {
  const { user, loading } = useAuth();

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">My Certificates</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {loading ? (
          <CertificatesSkeleton />
        ) : user ? (
          <CertificatesContent />
        ) : (
          <div className="flex items-center justify-center h-full">
            <LoginPrompt
              icon={Award}
              title="Claim Your Certificates"
              description="Log in to view and download certificates for your perfect quiz scores."
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default CertificatesPage;
