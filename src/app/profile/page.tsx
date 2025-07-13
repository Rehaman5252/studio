
'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';
import ProfileContent from '@/components/profile/ProfileContent';

function ProfilePage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // Redirect if auth is resolved and there's no user
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [user, loading, router]);

  // Show a skeleton if the initial app-wide load is happening or if there's no user data yet.
  if (loading || !userData) {
    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b flex items-center justify-between">
                <h1 className="text-2xl font-bold text-center text-foreground">My Profile</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
                <ProfileSkeleton />
            </main>
      </div>
    );
  }

  // If we have userData, render the full content.
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
      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        <ProfileContent userProfile={userData} />
      </main>
    </motion.div>
  );
}

export default ProfilePage;
