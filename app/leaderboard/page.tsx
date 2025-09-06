'use client';

import React from 'react';
import LeaderboardContent from '@/components/leaderboard/LeaderboardContent';
import PageWrapper from '@/components/PageWrapper';
import AuthGuard from '@/components/auth/AuthGuard';

export default function LeaderboardPage() {
  return (
    <PageWrapper title="Hall of Fame">
        <AuthGuard>
            <LeaderboardContent />
        </AuthGuard>
    </PageWrapper>
  );
}
