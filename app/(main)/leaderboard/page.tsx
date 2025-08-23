
'use client';

import React from 'react';
import LeaderboardContent from '@/components/leaderboard/LeaderboardContent';
import PageWrapper from '@/components/PageWrapper';

function LeaderboardPage() {
  return (
    <PageWrapper title="Hall of Fame">
      <LeaderboardContent />
    </PageWrapper>
  );
}

export default LeaderboardPage;
