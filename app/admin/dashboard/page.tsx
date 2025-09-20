'use client';
import React from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <AdminDashboard />
    </AuthGuard>
  );
}
