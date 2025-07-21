
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import { Award } from 'lucide-react';
import LoginPrompt from '@/components/auth/LoginPrompt';
import withAuth from '@/components/auth/withAuth';

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

const CertificatesPageContainer = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
             <div className="flex flex-col h-screen bg-background">
                <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
                    <h1 className="text-2xl font-bold text-center text-foreground">My Certificates</h1>
                </header>
                <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
                    <CertificatesSkeleton />
                </main>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex flex-col h-screen bg-background">
                <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
                    <h1 className="text-2xl font-bold text-center text-foreground">My Certificates</h1>
                </header>
                <main className="flex-1 flex items-center justify-center p-4 pb-20">
                    <LoginPrompt 
                        icon={Award}
                        title="Claim Your Certificates"
                        description="Log in to view and download certificates for your perfect quiz scores."
                    />
                </main>
            </div>
        )
    }

    // Since this page is wrapped with `withAuth`, we can safely render it
    // without the need for an additional component. `withAuth` handles the redirect.
    return <CertificatesPage />;
};


export default withAuth(CertificatesPageContainer);
