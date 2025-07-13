
'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';
import ProfileContent from '@/components/profile/ProfileContent';

function ProfilePage() {
  const { user, userData, loading, isProfileComplete } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // Redirect if auth is resolved and there's no user
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [user, loading, router]);

  const renderContent = () => {
    if (loading) {
        return (
            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
                <ProfileSkeleton />
            </main>
        );
    }
  
    if (!user) {
      // This case can be hit if the user document doesn't exist or there was an error.
      // The useEffect will handle the redirect.
      return null;
    }
  
    if (!userData || !isProfileComplete) {
        return (
            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
                <p className="text-center text-muted-foreground">No profile data found. Please complete your profile.</p>
            </main>
        )
    }

    return (
      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        <ProfileContent userProfile={userData} />
      </main>
    );
  };


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
      {renderContent()}
    </motion.div>
  );
}

export default ProfilePage;
