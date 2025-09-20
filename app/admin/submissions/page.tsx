'use client';
import React from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import SubmissionsList from '@/components/admin/SubmissionsList';

export default function SubmissionsPage() {
  return (
    <AuthGuard>
      <SubmissionsList />
    </AuthGuard>
  );
}
