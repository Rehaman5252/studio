'use client';

import React from 'react';
import UserManagement from '@/components/admin/UserManagement';
import AuthGuard from '@/components/auth/AuthGuard';

export default function UsersPage() {
  return (
    <AuthGuard>
      <UserManagement />
    </AuthGuard>
  );
}
