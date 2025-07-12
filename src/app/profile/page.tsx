
'use client';

import React from 'react';
import ProfileContent from '@/components/profile/ProfileContent';
import { useAuth } from '@/context/AuthProvider';
import AuthGuard from '@/components/auth/AuthGuard';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';

// This is a client component that renders the main content of the profile page.
function ProfilePageContentWrapper() {
  const { user, userData, loading: isAuthLoading } = useAuth();
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b flex items-center justify-between">
        <h1 className="text-2xl font-bold text-center text-foreground">My Profile</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {isAuthLoading ? (
            <ProfileSkeleton />
        ) : (
            <ProfileContent userProfile={userData} isLoading={isAuthLoading} />
        )}
      </main>
    </div>
  );
}


// The main page export.
export default function ProfilePage() {
    return (
      <AuthGuard>
        <ProfilePageContentWrapper />
      </AuthGuard>
    );
}
