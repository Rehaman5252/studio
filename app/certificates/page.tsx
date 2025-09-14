
'use client';

import PageWrapper from '@/components/PageWrapper';
import dynamic from 'next/dynamic';
import AuthGuard from '@/components/auth/AuthGuard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';


const CertificatesContent = dynamic(
    () => import('@/components/certificates/CertificatesContent').catch(e => {
        console.error("Failed to load CertificatesContent", e);
        return function ChunkLoadFallback() {
            return (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Failed to load certificates. Please refresh the page.</AlertDescription>
                </Alert>
            );
        }
    }),
    {
        loading: () => <CertificatesSkeleton />,
        ssr: false,
    }
);

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
