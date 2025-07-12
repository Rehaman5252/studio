
'use client';

import React from 'react';
import ProfileContent from '@/components/profile/ProfileContent';
import { useAuth } from '@/context/AuthProvider';
import AuthGuard from '@/components/auth/AuthGuard';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';
import { motion } from 'framer-motion';

function ProfilePageContentWrapper() {
  const { userData, isUserDataLoading } = useAuth();
  
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
        {isUserDataLoading ? (
            <ProfileSkeleton />
        ) : (
            <ProfileContent userProfile={userData} />
        )}
      </main>
    </motion.div>
  );
}

export default function ProfilePage() {
    return (
      <AuthGuard>
        <ProfilePageContentWrapper />
      </AuthGuard>
    );
}
