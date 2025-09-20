'use client';

import React from 'react';
import AdminLogin from '@/components/admin/AdminLogin';

export default function AdminLoginPage() {
  // This page should have a simpler layout than the main admin area.
  return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full bg-gradient-to-br from-background to-secondary/30">
          <main className="w-full max-w-md">
              <AdminLogin />
          </main>
      </div>
  );
}
