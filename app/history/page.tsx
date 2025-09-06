'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import PageWrapper from '@/components/PageWrapper';
import AuthGuard from '@/components/auth/AuthGuard';
import HistoryContent from '@/components/history/HistoryContent';

const HistorySkeleton = ({ count = 3 }: { count?: number}) => (
    <div className="space-y-4 pt-4">
        {Array.from({ length: count }).map((_, i) => (
             <Skeleton key={i} className="h-24 w-full" />
        ))}
    </div>
);

export default function HistoryPage() {
  return (
    <PageWrapper title="My Innings" showBackButton>
        <AuthGuard>
            <HistoryContent />
        </AuthGuard>
    </PageWrapper>
  );
}
