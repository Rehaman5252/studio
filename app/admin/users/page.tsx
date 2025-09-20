'use client';
import React from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import UserManagement from '@/components/admin/UserManagement';

export default function UsersPage() {
  return (
    <AuthGuard>
      <UserManagement />
    </AuthGuard>
  );
}
