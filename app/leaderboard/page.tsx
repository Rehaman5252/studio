
'use client';

import React from 'react';
import PageWrapper from '@/components/PageWrapper';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const LeaderboardContent = dynamic(
    async () => {
        try {
            return await import('@/components/leaderboard/LeaderboardContent');
        } catch(e) {
            console.error("Failed to load LeaderboardContent chunk", e);
            return () => (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Failed to load leaderboards. Please refresh the page.</AlertDescription>
                </Alert>
            )
        }
    },
    {
        loading: () => <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></div>,
        ssr: false,
    }
);


export default function LeaderboardPage() {
  return (
    <PageWrapper title="Hall of Fame">
        <LeaderboardContent />
    </PageWrapper>
  );
}
