
'use client';

import { Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PageWrapper from '@/components/PageWrapper';
import dynamic from 'next/dynamic';
import AuthGuard from '@/components/auth/AuthGuard';

const CertificatesContent = dynamic(() => import('@/components/certificates/CertificatesContent'), {
    loading: () => <CertificatesSkeleton />,
    ssr: false,
});

const CertificatesSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
    </div>
);

export default function CertificatesPage() {
  const loginPromptProps = {
      icon: Award,
      title: "View Your Achievements",
      description: "Sign in to view and download your perfect score certificates."
  }
  
  return (
    <PageWrapper title="My Certificates" showBackButton>
        <AuthGuard loadingSkeleton={<CertificatesSkeleton />} loginPrompt={loginPromptProps}>
            <CertificatesContent />
        </AuthGuard>
    </PageWrapper>
  );
}
