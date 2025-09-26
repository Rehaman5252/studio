
'use client';

import PageWrapper from '@/components/PageWrapper';
import dynamic from 'next/dynamic';
import AuthGuard from '@/components/auth/AuthGuard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClientOnly from '@/components/ClientOnly';

const ChunkLoadError = () => (
    <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Content</AlertTitle>
        <AlertDescription>
            There was a problem loading the certificates. Please check your connection and try again.
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()} className="mt-2">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
            </Button>
        </AlertDescription>
    </Alert>
);

const CertificatesContent = dynamic(
    () => import('@/components/certificates/CertificatesContent').catch(e => {
        console.error("Failed to load CertificatesContent", e);
        return () => <ChunkLoadError />;
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
            <ClientOnly>
                <CertificatesContent />
            </ClientOnly>
        </AuthGuard>
    </PageWrapper>
  );
}
