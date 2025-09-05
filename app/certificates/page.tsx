
'use client';

import { useAuth } from '@/context/AuthProvider';
import { Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PageWrapper from '@/components/PageWrapper';
import dynamic from 'next/dynamic';

const CertificatesContent = dynamic(() => import('@/components/certificates/CertificatesContent'), {
    loading: () => <CertificatesSkeleton />,
    ssr: false,
});
const LoginPrompt = dynamic(() => import('@/components/auth/LoginPrompt'), {
    loading: () => <Skeleton className="h-56 w-full" />,
    ssr: false,
});


const CertificatesSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
    </div>
);

export default function CertificatesPage() {
  const { user, loading } = useAuth();
  
  const renderContent = () => {
      if (loading) {
          return <CertificatesSkeleton />;
      }
      
      if (!user) {
          return (
             <div className="pt-8">
                <LoginPrompt 
                    icon={Award}
                    title="View Your Achievements"
                    description="Sign in to view and download your perfect score certificates."
                />
            </div>
          );
      }
      
      return <CertificatesContent />;
  }

  return (
    <PageWrapper title="My Certificates" showBackButton>
        {renderContent()}
    </PageWrapper>
  );
}
