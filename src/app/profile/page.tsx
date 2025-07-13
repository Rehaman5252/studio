
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import withAuth from '@/components/auth/withAuth';
import { useAuth } from '@/context/AuthProvider';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';
import ProfileContent from '@/components/profile/ProfileContent';

function ProfilePage() {
  const { userData, isProfileComplete, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        <ProfileSkeleton />
      </main>
    );
  }

  // With `withAuth`, we know `user` exists. We now check if the profile is complete.
  if (!isProfileComplete) {
    return (
      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20 text-center">
          <div className="bg-destructive/10 border border-destructive/50 text-destructive p-4 rounded-lg">
              <h3 className="font-bold">Profile Incomplete</h3>
              <p>Please complete your profile to view your stats and rewards.</p>
              <button
                  onClick={() => router.push('/complete-profile')}
                  className="mt-2 bg-destructive text-destructive-foreground font-bold py-2 px-4 rounded hover:bg-destructive/90"
              >
                  Complete Profile
              </button>
          </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
      <ProfileContent userProfile={userData} />
    </main>
  );
}


function ProfilePageWrapper() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-screen bg-background"
    >
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b flex items-center justify-between">
        <h1 className="text-2xl font-bold text-center text-foreground">My Profile</h1>
      </header>
      <ProfilePage />
    </motion.div>
  );
}

export default withAuth(ProfilePageWrapper);
