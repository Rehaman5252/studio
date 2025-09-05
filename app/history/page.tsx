
'use client';

import React from 'react';
import { History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PageWrapper from '@/components/PageWrapper';
import AuthGuard from '@/app/components/auth/AuthGuard';
import HistoryContent from '@/components/history/HistoryContent';

const HistorySkeleton = ({ count = 3 }: { count?: number}) => (
    <div className="space-y-4 pt-4">
        {Array.from({ length: count }).map((_, i) => (
             <Skeleton key={i} className="h-24 w-full" />
        ))}
    </div>
);

export default function HistoryPage() {
  const loginPromptProps = {
      icon: History,
      title: "Check Your Match History",
      description: "Sign in to review your past performances, analyze your stats, and track your progress."
  };

  return (
    <PageWrapper title="My Innings" showBackButton>
        <AuthGuard loadingSkeleton={<HistorySkeleton />} loginPrompt={loginPromptProps}>
            <HistoryContent />
        </AuthGuard>
    </PageWrapper>
  );
}
