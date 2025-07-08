'use client';

import React from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import ProfileContent from '@/components/profile/ProfileContent';
import { useAuth } from '@/context/AuthProvider';

// This is a client component that renders the main content of the profile page.
// It's intended to be rendered *inside* AuthGuard.
function ProfilePageContentWrapper() {
  const { userData, isUserDataLoading } = useAuth();

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b flex items-center justify-between">
        <h1 className="text-2xl font-bold text-center text-foreground">My Profile</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        <ProfileContent userProfile={userData} isLoading={isUserDataLoading} />
      </main>
    </div>
  );
}


// The main page export. It uses AuthGuard to protect the content.
export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfilePageContentWrapper />
    </AuthGuard>
  );
}
