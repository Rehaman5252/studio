'use client';
import React from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import PayoutManagement from '@/components/admin/PayoutManagement';

export default function PayoutsPage() {
  return (
    <AuthGuard>
      <PayoutManagement />
    </AuthGuard>
  );
}
