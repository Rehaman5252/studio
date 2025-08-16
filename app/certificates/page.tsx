
'use client';

import CertificatesContent from '@/components/certificates/CertificatesContent';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { useAuth } from '@/context/AuthProvider';
import { Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const CertificatesSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
    </div>
);

export default function CertificatesPage() {
  const { user, loading } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">My Certificates</h1>
      </header>
       <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {loading ? <CertificatesSkeleton /> : user ? <CertificatesContent /> : (
            <div className="pt-8">
                <LoginPrompt 
                    icon={Award}
                    title="View Your Achievements"
                    description="Sign in to view and download your perfect score certificates."
                />
            </div>
        )}
      </main>
    </div>
  );
}
