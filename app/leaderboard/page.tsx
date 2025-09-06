
'use client';

import React from 'react';
import LeaderboardContent from '@/app/components/leaderboard/LeaderboardContent';
import PageWrapper from '@/app/components/PageWrapper';
import AuthGuard from '@/app/components/auth/AuthGuard';

export default function LeaderboardPage() {
  return (
    <PageWrapper title="Hall of Fame">
        <AuthGuard>
            <LeaderboardContent />
        </AuthGuard>
    </PageWrapper>
  );
}
