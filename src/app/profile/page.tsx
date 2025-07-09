'use client';

import React from 'react';
import ProfileContent from '@/components/profile/ProfileContent';
import { useAuth } from '@/context/AuthProvider';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { User } from 'lucide-react';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';

// This is a client component that renders the main content of the profile page.
function ProfilePageContentWrapper() {
  const { user, userData, isUserDataLoading, loading: isAuthLoading } = useAuth();
  
  const isLoading = isAuthLoading || isUserDataLoading;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b flex items-center justify-between">
        <h1 className="text-2xl font-bold text-center text-foreground">My Profile</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {isLoading ? (
            <ProfileSkeleton />
        ) : !user ? (
            <div className="flex items-center justify-center h-full">
                 <LoginPrompt
                    icon={User}
                    title="View Your Pavilion"
                    description="Before you check your stats and career highlights, you need to head to the dressing room. Please sign in or create an account."
                />
            </div>
        ) : (
            <ProfileContent userProfile={userData} isLoading={isLoading} />
        )}
      </main>
    </div>
  );
}


// The main page export. It no longer uses AuthGuard.
export default function ProfilePage() {
    return <ProfilePageContentWrapper />;
}
