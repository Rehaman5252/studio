
'use client';

import React from 'react';
import PageWrapper from '@/components/PageWrapper';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClientOnly from '@/components/ClientOnly';

const ChunkLoadError = () => (
    <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading History</AlertTitle>
        <AlertDescription>
            There was a problem loading your history. Please check your connection and try again.
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()} className="mt-2">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
            </Button>
        </AlertDescription>
    </Alert>
);

const HistoryContent = dynamic(
    () => import('@/components/history/HistoryContent').catch(e => {
        console.error("Failed to load HistoryContent chunk", e);
        return () => <ChunkLoadError />;
    }),
    {
        loading: () => <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-48 w-full" /></div>,
        ssr: false,
    }
);

export default function HistoryPage() {
  return (
    <PageWrapper title="My Innings" showBackButton>
        <ClientOnly>
            <HistoryContent />
        </ClientOnly>
    </PageWrapper>
  );
}
