'use client';

import React from 'react';
import PageWrapper from '@/components/PageWrapper';
import AuthGuard from '@/components/auth/AuthGuard';
import HistoryContent from '@/components/history/HistoryContent';

export default function HistoryPage() {
  return (
    <PageWrapper title="My Innings" showBackButton>
        <AuthGuard>
            <HistoryContent />
        </AuthGuard>
    </PageWrapper>
  );
}
