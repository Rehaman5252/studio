
'use client';

import React from 'react';
import PageWrapper from '@/app/components/PageWrapper';
import AuthGuard from '@/app/components/auth/AuthGuard';
import HistoryContent from '@/app/components/history/HistoryContent';

export default function HistoryPage() {
  return (
    <PageWrapper title="My Innings" showBackButton>
        <AuthGuard>
            <HistoryContent />
        </AuthGuard>
    </PageWrapper>
  );
}
