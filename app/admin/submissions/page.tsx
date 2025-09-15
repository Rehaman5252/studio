
'use client';

import React from 'react';
import SubmissionsList from '@/components/admin/SubmissionsList';
import PageWrapper from '@/components/PageWrapper';
import AuthGuard from '@/components/auth/AuthGuard';

export default function SubmissionsPage() {
  return (
    <PageWrapper title="User Submissions" showBackButton>
        <AuthGuard>
            <SubmissionsList />
        </AuthGuard>
    </PageWrapper>
  );
}
