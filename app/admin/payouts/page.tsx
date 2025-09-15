'use client';

import React from 'react';
import PayoutManagement from '@/components/admin/PayoutManagement';
import AuthGuard from '@/components/auth/AuthGuard';

export default function PayoutsPage() {
  return (
    <AuthGuard>
        <PayoutManagement />
    </AuthGuard>
  );
}
