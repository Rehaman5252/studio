
'use client';

import PageWrapper from '@/components/PageWrapper';
import dynamic from 'next/dynamic';
import AuthGuard from '@/components/auth/AuthGuard';
import { Skeleton } from '@/components/ui/skeleton';

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
  return (
    <PageWrapper title="My Certificates" showBackButton>
        <AuthGuard>
            <CertificatesContent />
        </AuthGuard>
    </PageWrapper>
  );
}
